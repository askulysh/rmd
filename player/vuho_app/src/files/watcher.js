const {
  REC_PATH,
  APP_NAME,
  allowedFilesExt,
  latestTime,
  __WIN__,
  CONFIG,
  __LINUX__,
} = require("../constants");
const { getDB } = require("../db");
const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const { getTimeFromStat } = require("../helpers");
const getInitialPathes = require("./getInitialPathes");

const isAllowed = (filePath) => {
  if (!allowedFilesExt.some((ext) => filePath.endsWith("." + ext))) {
    console.log(`${filePath} is not targeted for processing`);
    return false;
  }

  return true;
};

const isProcessed = (filePath) => _.has(getDB(), filePath);

const _pendingWrites = new Map();

const _awaitWriteFinish = (path, add, threshold = 2000, pollInterval = 100) => {
  //}, event, awfEmit) {
  let timeoutHandler;
  let fullPath = path;
  const now = new Date();
  const awaitWriteFinish = (prevStat) => {
    fs.lstat(fullPath, (err, curStat) => {
      if (err || !_pendingWrites.has(path)) {
        console.error("Watcher awaitWriteFinish() error", err);
        // if (err && err.code !== 'ENOENT') awfEmit(err);
        return;
      }

      const fileTime = getTimeFromStat(curStat);
      if (fileTime && fileTime < latestTime) return;

      const now = Date.now();

      if (prevStat && curStat.size !== prevStat.size) {
        _pendingWrites.get(path).lastChange = now;
      }
      const pw = _pendingWrites.get(path);
      const df = now - pw.lastChange;

      if (df >= threshold) {
        _pendingWrites.delete(path);
        add(path, curStat);
      } else {
        timeoutHandler = setTimeout(awaitWriteFinish, pollInterval, curStat);
      }
    });
  };

  if (!_pendingWrites.has(path)) {
    _pendingWrites.set(path, {
      lastChange: now,
      cancelWait: () => {
        _pendingWrites.delete(path);
        clearTimeout(timeoutHandler);
        return event;
      },
    });
    timeoutHandler = setTimeout(awaitWriteFinish, pollInterval);
  }
};

// NOTE: Prerequisite is to have the inotifywait command in the current PATH.
//       On debian/ubuntu, you have to sudo apt-get install inotify-tools
const startWatchingOnLinuxByInotify = (
  { add, remove, notifyCreation },
  { root }
) => {
  const INotifyWait = require("inotifywait");
  const watcher = new INotifyWait(root, { recursive: true })
    .on("ready", (context) => {
      console.log("Recursive files watcher based on inotifywait is ready!");
    })

    .on("add", async (filePath, stats) => {
      // console.log('ADD', filePath, getTimeFromStat(stats), stats)
      if (!isAllowed(filePath) || isProcessed(filePath)) return;

      _awaitWriteFinish(filePath, add, CONFIG.wait_file);
    })

    .on("unlink", async (filePath, stats) => {
      // console.log('UnLINK', filePath)
      if (!isAllowed(filePath) || !isProcessed(filePath)) return;

      remove(filePath, stats);
    })
    // .on('unknown', async (filePath, rawEvent, stats) => {
    //   console.log('UnKnOwN', rawEvent, filePath, stats)
    // })
    .on("error", async (error) => {
      console.error("WATCHER ERROR", error);
    });

  return () => watcher.close();
};

const absolutePath = (root, filePath) =>
  path.isAbsolute(filePath) ? filePath : path.join(root, filePath);

// todo: delete handler!
const startWatching = async ({ add, remove, notifyCreation }, { root }) => {
  const LAST_SIZE = {};
  const DEBOUNCERS = {};
  const pathToDbFormat = (p) => absolutePath(root, p);

  // Since Linux does not support recursive fs.watch(),
  // a watcher for all existing subdirectories need to put manually
  if (__LINUX__) {
    const { directories } = await getInitialPathes(root, 0, { dirsOnly: true });

    directories.forEach((dir) => {
      startWatching({ add, remove, notifyCreation }, { root: dir });
    });
  }

  const watcher = fs.watch(
    root,
    { recursive: !__LINUX__, persistent: true },
    async (evType, p) => {
      try {
        const stat = await fs.promises.lstat(absolutePath(root, p));

        // Since Linux does not support recursive fs.watch(),
        // a watcher for a new nested directory need to put manually
        if (__LINUX__ && stat.isDirectory()) {
          console.log(`Start new files watcher for ${absolutePath(root, p)}`);
          startWatching(
            { add, remove, notifyCreation },
            { root: absolutePath(root, p) }
          );
          return;
        }

        if (
          p.indexOf(`${APP_NAME}`) !== -1 ||
          p.indexOf(`${APP_NAME}.json`) !== -1 ||
          p.indexOf(`REC_DB.json`) !== -1 ||
          !allowedFilesExt.some((ext) => p.endsWith("." + ext)) ||
          _.has(getDB(), pathToDbFormat(p))
        ) {
          return;
        }

        // belka's player settings 'append TO' rename file after finish and not firing 'change'
        if (__WIN__ && evType === "rename" && p.indexOf("TO ") !== -1) {
          add(pathToDbFormat(p), stat);
        } else if (
          (__WIN__ && evType === "change") ||
          (!__WIN__ && evType === "rename")
        ) {
          const time = getTimeFromStat(stat);

          if (time < latestTime) return;

          LAST_SIZE[p] = stat.size;
          if (DEBOUNCERS[p]) {
            DEBOUNCERS[p]();
          } else {
            DEBOUNCERS[p] = _.debounce(async () => {
              let stat;
              try {
                stat = await fs.promises.lstat(absolutePath(root, p));
              } catch (err) {
                delete DEBOUNCERS[p];
                delete LAST_SIZE[p];
                // file renamed and removed between debouncers
                return;
              }

              // console.log('in debounce', p, '|||', stat.size, LAST_SIZE[p])
              if (stat.size !== LAST_SIZE[p]) {
                LAST_SIZE[p] = stat.size;
                DEBOUNCERS[p]();
                return;
              }
              delete DEBOUNCERS[p];
              delete LAST_SIZE[p];

              // file already added after rename
              if (_.has(getDB(), pathToDbFormat(p))) return;

              add(pathToDbFormat(p), stat);
            }, CONFIG.wait_file);
            DEBOUNCERS[p]();
          }
        }
      } catch (err) {
        console.error("WATCHER ERROR", err);
      }
    }
  );

  return () => watcher.close();
};

module.exports = {
  startWatchingFiles:
    __LINUX__ && CONFIG.use_inotify
      ? startWatchingOnLinuxByInotify
      : startWatching,
};
