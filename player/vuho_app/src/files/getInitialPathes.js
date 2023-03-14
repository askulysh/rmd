const path = require("path");
const {
  SCAN_DEPTH,
  APP_NAME,
  allowedFilesExt,
  latestTime,
} = require("../constants");
const fs = require("fs");
const { minimizePath } = require("../db");
const _ = require("lodash");
const { getTimeFromStat } = require("../helpers");

// --------------------------------------------------------------

async function getInitialPathes(folderPath = "/", depth = 0, options = {}) {
  console.log("getInitialPathes", folderPath);
  try {
    const rootPath = folderPath;
    let audioFiles = [];
    let directories = [];
    const { dirsOnly } = options;

    const list = await fs.promises.readdir(rootPath, { withFileTypes: true });

    for (let i = 0; i < list.length; i++) {
      const filename = list[i].name;
      if (depth === 0 && filename === APP_NAME) continue;
      const pathToFile = path.join(rootPath, filename);

      if (list[i].isDirectory() && depth < SCAN_DEPTH) {
        const { audioFiles: nestedFiles, directories: nestedDirs } =
          await getInitialPathes(pathToFile, depth + 1, options);

        audioFiles = [...audioFiles, ...nestedFiles];
        directories = [...directories, pathToFile, ...nestedDirs];
      } else if (!dirsOnly && list[i].isFile()) {
        const stat = await fs.promises.lstat(pathToFile);
        const time = getTimeFromStat(stat);

        if (allowedFilesExt.some((ext) => filename.endsWith("." + ext)) && stat.size !== 0 && time > latestTime) {
          audioFiles.push({
            // filename,
            path: pathToFile,
            size: stat.size,
            time,
          });
        }
      }
    }
    return { audioFiles, directories };
  } catch (err) {
    console.error("Error reading file structure", err);
    return [];
  }
}

module.exports = getInitialPathes;
