const path = require("path");
const _ = require("lodash");
const { readFile, lstat } = require("fs/promises");
const crypto = require("crypto");
const { addFile, removeFile } = require("../db");
const asyncQueue = require("async/queue");
const { getRightTime } = require("../helpers");

// 'music-metadata' module does not support require(), this is a trick to import its method
const parseBuffer = (...args) => import('music-metadata')
  .then((mmetadata) => mmetadata.parseBuffer(...args));

const getFileWatchers = ({ WS, root }) => ({
  add: ((lastHash) => {
    const q = asyncQueue(async ({ pathToFile, notNeccessaryStat }) => {
      // console.log("in queue", pathToFile);
      await addFileHandler(pathToFile, notNeccessaryStat);
    }, 1);

    const addFileHandler = async (pathToFile, notNeccessaryStat) => {
      // pathToFile = minimizePath(pathToFile);
      // console.log("addFileHandler", {
      //   pathToFile,
      //   typeof: typeof pathToFile,
      //   notNeccessaryStat,
      //   REC_PATH,
      //   joined: path.join(REC_PATH, pathToFile),
      // });
      console.log("[added]:", pathToFile);
      const stat =
        notNeccessaryStat || (await lstat(path.join(root, pathToFile)));

      if (stat.size === 0) return;

      const { duration, hash } = await calcMeta(pathToFile);

      const file = addFile({
        path: pathToFile,
        size: stat.size,
        time: getRightTime(stat, duration),
        listened: false,
        duration,
        hash,
      });

      // console.log("WS FILE_ADDED:", pathToFile, lastHash);

      WS.emit("FILE_ADDED", file, lastHash);
      lastHash = file.hash;
    };

    return (pathToFile, notNeccessaryStat) => {
      q.push({ pathToFile, notNeccessaryStat });
    };
  })(null),
  // change: (path) =>
  remove: (pathToFile) => {
    console.log("WS REMOVED:", pathToFile);
    // pathToFile = minimizePath(pathToFile);
    removeFile({ path: pathToFile });

    WS.emit("FILE_REMOVED", pathToFile);
  },
  // now we have uniden fq
  notifyCreation: (pathToFile) => {
    // WS.emit("FILE_CREATED", pathToFile);
  },
});

// --------------------------------------------------------

const calcMeta = async (fullPath) => {
  try {
    // console.log("calcMeta", fullPath);
    const buffer = await readFile(fullPath);
    const hash = crypto.createHash("md5").update(buffer).digest("hex");
    const { format: { duration } } = await parseBuffer(buffer, { path: fullPath }, { duration: true });

    // __DEV__ &&
    //   console.log(fullPath, {
    //     duration: duration * 1000,
    //     hash,
    //   });

    return {
      duration: duration * 1000,  // ms
      hash,
    };
  } catch (err) {
    console.error("calcMeta", fullPath, err);
  }
};

module.exports = {
  calcMeta,
  getFileWatchers,
};
