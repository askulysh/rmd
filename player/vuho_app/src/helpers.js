const { REC_PATH, __WIN__ } = require("./constants");
const path = require("path");

function slash(path) {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  if (isExtendedLengthPath) {
    return path;
  }
  return path.replace(/\\/g, "/");
}

// remove both
const slashedRecPath = slash(REC_PATH);
const minimizePath = (p) => {
  if (__WIN__) {
    p = slash(path.normalize(p));
  }
  if (p.indexOf(slashedRecPath) === 0) {
    return p.slice(slashedRecPath.length - 1);
  }
  return p;
};

const getTimeFromStat = ({ mtimeMs, ctimeMs }) =>
  ctimeMs > mtimeMs ? mtimeMs : ctimeMs;

const getRightTime = (stat, duration) => getTimeFromStat(stat) - duration;

module.exports = {
  slash,
  minimizePath,
  getTimeFromStat,
  getRightTime,
};
