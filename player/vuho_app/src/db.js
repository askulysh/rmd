const { __DEV__ } = require("./constants");
const path = require("path");
const fs = require("fs");
const _ = require("lodash");
const { minimizePath } = require("./helpers");

let CACHE = null;
const PATH = path.join(process.cwd(), "../REC_DB.json");

const startDb = _.once(async () => {
  try {
    try {
      await fs.promises.access(PATH, fs.constants.R_OK | fs.constants.W_OK);
      CACHE = JSON.parse(await fs.promises.readFile(PATH, "utf8"));
    } catch (err) {
      CACHE = {};
    }
  } catch (err) {
    console.error("Error reading from db", err);
  }
});

const saveDb = _.debounce(
  async () => {
    try {
      const str = JSON.stringify(CACHE, null, __DEV__ ? 2 : undefined);
      await fs.promises.writeFile(PATH, str);
    } catch (err) {
      console.error("Error writing to db", err);
    }
  },
  process.env.NODE_ENV === "development" ? 1000 : 1000 * 10
);

// --------------------------------------------------------------
// todo: move to files

// --------------------------------------------------------------

const updateFile = (file) => {
  let { path } = file;
  if (!path) throw new Error("updateFile require .path");

  const newFields = _.pickBy(file, (v) => v !== undefined);

  if (CACHE[path]) {
    CACHE[path] = {
      ...CACHE[path],
      ...newFields,
      path,
    };
    // todo: if no new addition, than return;
  } else {
    CACHE[path] = newFields;
  }
  saveDb();
  return CACHE[path];
};

const addFile = (file) => {
  if (!_.isPlainObject(file) || !file.path) {
    throw new Error("wrong file format", file);
  }
  CACHE[file.path] = file;
  saveDb();
  return CACHE[file.path];
};
const addFiles = (files) => {
  CACHE = {
    ...CACHE,
    ...files.reduce((acc, file) => {
      if (_.isPlainObject(file) && file.path) {
        acc[file.path] = file;
      }
      return acc;
    }, {}),
  };
  saveDb();
};
const removeFile = ({ path }) => {
  delete CACHE[path];
  saveDb();
};

module.exports = {
  updateFile,
  removeFile,
  addFiles,
  addFile,
  minimizePath,
  startDb,
  getDB: () => CACHE,
};

// [
//   `exit`,
//   `SIGINT`,
//   `SIGUSR1`,
//   `SIGUSR2`,
//   // `uncaughtException`,
//   `SIGTERM`,
// ].forEach((eventType) =>
//   process.on(eventType, () => {
//     console.log("process event:", eventType, CACHE);
//     if (CACHE === null) return;
//     fs.writeFile(PATH, JSON.stringify(CACHE, null), (err) => {
//       console.error("Error saving before exit", err);
//     });
//   })
// );
