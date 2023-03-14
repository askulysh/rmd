const path = require("path");
const fs = require("fs");
const _ = require("lodash");

const __DEV__ = process.env.NODE_ENV === "development";

const REC_PATH = __DEV__
  ? path.join(process.cwd(), "../REC/")
  : path.join(process.cwd(), "../");

const __WIN__ = process.platform === "win32";
const __LINUX__ = process.platform === "linux";
// const __LINUX__ = __DEV__;

const APP_NAME = "vuho49";

const SCAN_DEPTH = 3;
const allowedFilesExt = ["mp3", "wav", "ogg"];

// --------------------------------------------------------------

const CONFIG = ((basicParams) => {
  let configJSON = {};
  try {
    configJSON = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), `../${APP_NAME}.config.json`))
    );
    // console.log({ configJSON });
  } catch (err) {}
  return _.defaults({}, configJSON, basicParams);
})({
  port: 4242,
  net_url: "https://radio.sapiense.com",
  scanners: [],
  days: 7,
  debug: false,
  wait_file: 300,
  headless: false,
});

CONFIG.use_inotify =
  CONFIG.use_inotify && !__LINUX__ ? false : CONFIG.use_inotify;

CONFIG.use_inotify = CONFIG.use_inotify && __LINUX__;

console.log(JSON.stringify({ CONFIG }, null, 2));

const latestTime = Date.now() - 1000 * 60 * 60 * 24 * CONFIG.days;

// --------------------------------------------------------------
module.exports = {
  CONFIG,
  REC_PATH,
  __DEV__,
  __WIN__,
  __LINUX__,
  APP_NAME,
  allowedFilesExt,
  SCAN_DEPTH,
  latestTime,
};
