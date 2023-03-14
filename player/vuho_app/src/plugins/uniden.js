const fetch = require("node-fetch-commonjs");
const _ = require("lodash");
const { __DEV__ } = require("../constants");
let timeoutID = null;
const path = require("path");

const HOST = __DEV__ ? "192.168.1.134" : "127.0.0.1";
const frame = async (cb, uniden_port) => {
  try {
    const res = await fetch(`http://${HOST}:${uniden_port}/r_u-all`);
    const text = await res.text();
    const [
      date,
      a,
      b,
      scannerName,
      c,
      fq,
      // fq,
      // lvl1,
      // lvl2,
      // lvl3,
      // fqname,
    ] = text.split("\r\n");
    // console.log({
    //   date,
    //   a,
    //   b,
    //   scannerName,
    //   c,
    //   fq,
    // });

    const newValue = parseFloat(fq);
    let isRecording = null;
    if (c === "True") {
      isRecording = true;
    } else if (c === "False") {
      isRecording = false;
    }
    const valueValid =
      typeof newValue === "number" && !_.isNaN(newValue) && newValue > 0;
    if (valueValid) {
      cb(newValue, isRecording);
    } else {
      // console.log(
      //   newValue,
      //   {
      //     date,
      //     a,
      //     b,
      //     scannerName,
      //     c,
      //     fq,
      //   },
      //   text
      // );

      throw new Error(newValue + " is not fit ");
    }
    timeoutID = setTimeout(() => frame(cb, uniden_port), 1000 / 20);
  } catch (err) {
    // console.error("uniden/frame error", err);
    timeoutID = setTimeout(() => frame(cb, uniden_port), 1000 / 2);
  }
};

module.exports = async ({ WS, scanners }) => {
  scanners.forEach(({ path, uniden_port }, i) => {
    if (!uniden_port) return;

    let lastFq = null;
    let lastIsRecording = null;
    frame((fq, isRecording) => {
      if (fq === lastFq && lastIsRecording === isRecording) return;
      lastFq = fq;
      lastIsRecording = isRecording;
      WS.emit("UNIDEN_STATUS", { path, fq, isRecording });
    }, uniden_port);
  });

  // -------------------------------
  WS.on("connection", (socket) => {
    socket.on("UNIDEN_CONTROL", async (key, uniden_path) => {
      const { uniden_port, uniden_pasw } =
        scanners.find((item) => item.path === uniden_path) || {};
      if (typeof uniden_pasw === "undefined") return;

      console.log("REQUEST UNIDEN_CONTROL", key, uniden_path);

      if (!UNIDEN_KEYS[key]) {
        console.error("uniden/control key is not defined at server", key);
        return;
      }
      const cookie = await unidenLogin(uniden_port, uniden_pasw);
      for (const url of UNIDEN_KEYS[key]) {
        await fetch(path.join(`http://${HOST}:${uniden_port}/`, url), {
          headers: {
            Cookie: `${cookie.name}=${cookie.value}`,
          },
        });
      }
    });
  });
};

const UNIDEN_KEYS = {
  SCAN: [
    "/?control=ScannerButton18,mousedown&_=1672705571905",
    "/?control=ScannerButton18,mouseup&_=1672705571905",
  ],
  HOLD: [
    "/?control=ScannerButton19,mousedown&_=1672705571983",
    "/?control=ScannerButton19,mouseup&_=1672705571983",
  ],
  LO: [
    "/?control=ScannerButton5,mousedown&_=1672705572037",
    "/?control=ScannerButton5,mouseup&_=1672705572037",
  ],
  VOLUME_UP: ["/?control=Volume,increment&_=1672705572083"],
  VOLUME_DOWN: ["/?control=Volume,decrement&_=1672705572245"],
  SQUELCH_UP: ["/?control=Squelch,increment&_=1672705572352"],
  SQUELCH_DOWN: ["/?control=Squelch,decrement&_=1672705572403"],
};

var http = require("http");
var setCookie = require("set-cookie-parser");

const unidenLogin = (port, password) => {
  return new Promise((res, rej) => {
    const rec = http.request(
      {
        host: HOST,
        port: port,
        path: "/",
        method: "POST",
        headers: {
          "x-custom-header": "password=" + password + "&login=Log In",
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
      function (response) {
        var cookies = setCookie.parse(response, {
          decodeValues: true, // default: true
        });
        res(cookies.find(({ name }) => name === "ws5"));
      }
    );
    rec.write("");
    rec.end();
  });
};
