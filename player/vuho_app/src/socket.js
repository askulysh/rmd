const { endOfDay, parse, startOfDay } = require("date-fns");
const _ = require("lodash");
const { getDB, updateFile } = require("./db");
const { CONFIG } = require("./constants");

const getAllRecsByDate = (date) => {
  date = parse(date, "dd.MM.yyyy", new Date());
  const end = endOfDay(date).valueOf();
  const start = startOfDay(date).valueOf();
  const filteredByDates = _.pickBy(
    getDB(),
    ({ time }) => start <= time && time <= end
  );
  return _(filteredByDates).values().sortBy("time").value();
};

const SOCKET_WATCHERS = {
  connection: () => {},
  disconnect: () => {},
  FETCH_CONFIG: () => {
    return CONFIG;
  },
  SYNC: (socket, { date, all, unlistened, min }) => {
    const allRecs = getAllRecsByDate(date).filter(({ size }) => size > min);
    // console.log("allRecs.length", allRecs.length);
    if (all === 0 || all !== allRecs.length) return allRecs;
    const unlistenedRecs = allRecs.filter(({ listened }) => listened !== true);
    // console.log("unlistenedRecs", unlistenedRecs.length);
    if (unlistened !== unlistenedRecs.length) return allRecs;
    return null;
  },

  FETCH_DATE: (socket, date) => {
    return getAllRecsByDate(date);
  },
  MARK_LISTENED: (socket, path) => {
    const saved = getDB()[path];
    if (saved.listened) return path;

    updateFile({
      path,
      listened: true,
    });
    socket.broadcast.emit("MARK_LISTENED", path);
    return path;
  },
  MARK_UNLISTENED: (socket, path) => {
    updateFile({
      path,
      listened: false,
    });
    socket.broadcast.emit("MARK_UNLISTENED", path);
  },
};
// ----------------------------------

module.exports = {
  SOCKET_WATCHERS,
};
