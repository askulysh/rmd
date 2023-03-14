const { addFiles, getDB, removeFile, startDb } = require("./db");
const { CONFIG, __DEV__ } = require("./constants");
const { calcMeta } = require("./files/index");
const getInitialPathes = require("./files/getInitialPathes");
const _ = require("lodash");
const Queue = require("queue-promise/dist/index");
const { startWatchingFiles } = require("./files/watcher");
const { getFileWatchers } = require("./files/index");
const { updateSystrayStatus } = require("./electron/tray");

const asyncQueue = require("async/queue");
const fs = require("fs");
const { getRightTime } = require("./helpers");

// const q = queue(async ({ pathToFile, notNeccessaryStat }) => {
//   // console.log("in queue", pathToFile);
//   await addFileHandler(pathToFile, notNeccessaryStat);
// }, 1);
// q.push({ pathToFile, notNeccessaryStat });

const initial = ({ WS }) =>
  (async () => {
    const { scanners } = CONFIG;

    try {
      if (!CONFIG.headless) {
        await require("electron").app.whenReady();
      }

      updateSystrayStatus(`Запускаємося`);
      await startDb();
      const db = getDB();
      const freshStart = _.isEmpty(db);

      let files = [];

      const watchDirectory = (dir) => {
        const fileWatcher = getFileWatchers({ WS, root: dir });
        const watcher = startWatchingFiles(fileWatcher, { root: dir });
        // TODO: call watcher() to close watcher gracefuly on app termination
      };

      for (const scanner of scanners) {
        updateSystrayStatus(`Скануємо ${scanner.path}`);
        const { audioFiles } = await getInitialPathes(scanner.path);
        files = [...files, ...audioFiles];
      }
      console.log("Found total " + files.length);
      // --------------------------------------------------------------
      // remove files from db
      const foundPathes = _.map(files, "path");
      const removedPathes = _(getDB())
        .filter((existingInDb) => !foundPathes.includes(existingInDb.path))
        .value();

      removedPathes.length &&
        console.log(`Found ${removedPathes.length} removed files`);
      removedPathes.forEach(removeFile);
      // --------------------------------------------------------------

      let addedFiles = files.filter(({ path }) => !db[path]);
      if (addedFiles.length) {
        console.log("Found added " + addedFiles.length);
        updateSystrayStatus(
          `Знайденно ${addedFiles.length} нових файлів, може зайняти час їх прочитати`
        );

        const addedFilesMeta = {};
        const q = asyncQueue(
          async ({ file, i }) => {
            const { duration, hash } = await calcMeta(file.path);
            if (typeof file.size === "undefined") {
              // added during process
              const stat = await fs.promises.lstat(file.path);
              file.size = stat.size;
              file.time = getRightTime(stat, duration);
            }
            const textMessage = `Обробленно ${(
              (i / addedFiles.length) *
              100
            ).toFixed(0)}% файлів`;
            updateSystrayStatus(textMessage);
            addedFilesMeta[file.path] = { duration, hash };
          },
          __DEV__ ? 1 : 12
        );
        // adding during initial scan
        const tempWatchers = scanners.map((scanner) => {
          return startWatchingFiles(
            {
              add: (path) => {
                // task to meta
                const length = addedFiles.push({ path });
                q.push({ path, i: length - 1 });
              },
              remove: () => null,
              notifyCreation: () => null,
            },
            {
              root: scanner.path,
            }
          );
        });
        q.push(addedFiles.map((file, i) => ({ file, i })));

        await q.drain();
        (await Promise.all(tempWatchers)).forEach((unwatch) => unwatch());

        addedFiles = addedFiles.map((file) => ({
          ...file,
          ...addedFilesMeta[file.path],
        }));
      }
      // --------------------------------------------------------------
      if (freshStart) {
        addedFiles = addedFiles.map((file) => ({ ...file, listened: true }));
      }

      // add in time order
      addFiles(_.sortBy(addedFiles, "time"));
      // --------------------------------------------------------------

      scanners.forEach(({ path }) => watchDirectory(path));

      // --------------------------------------------------------------
      updateSystrayStatus(`Все готово, можемо працювати!`);
    } catch (err) {
      console.error("ERROR DURING INITIALIZATION", err);
    }
  })();

module.exports = initial;
