const expressPackage = require("express");
const express = expressPackage();
const http = require("http");
const server = http.createServer(express);
const { Server } = require("socket.io");
const _ = require("lodash");
const sleep = require("sleep-promise");
const { __DEV__, CONFIG } = require("./constants");
const path = require("path");
const { SOCKET_WATCHERS } = require("./socket");
const fs = require("fs");
const fetch = require("node-fetch-commonjs");

const WS = new Server(server, {
  pingTimeout: 60000 + 10000,
  credentials: true,
  cors: {
    // origin: "vuho-client.vercel.app",
    // origin: "http://localhost:3000",
    origin: __DEV__ ? "*" : "http://localhost:3000",
    methods: ["GET", "POST"],
  },
  headers: {
    "Access-Control-Allow-Private-Network": true,
    "Access-Control-Allow-Credentials": true,
  },
  allowRequest: (req, callback) => {
    // console.log(123, req.headers);
    // const noOriginHeader = req.headers.origin === undefined;
    callback(null, true);
  },
});

// --------------------------------------------------------------

// --------------------------------------------------------------
// https://gist.github.com/DingGGu/8144a2b96075deaf1bac
express.get("/audio/:path", function (req, res) {
  var { path } = req.params;

  const scanner = CONFIG.scanners.find((s) => path.indexOf(s.path) === 0);

  if (!scanner || CONFIG.scanners.length === 0) {
    // prevent accessing fs from browser // todo: check me
    return res.end();
  }

  const stat = fs.statSync(path);
  const range = req.headers.range;
  let readStream;

  if (range !== undefined) {
    const parts = range.replace(/bytes=/, "").split("-");

    const partial_start = parts[0];
    const partial_end = parts[1];

    if (
      (isNaN(partial_start) && partial_start.length > 1) ||
      (isNaN(partial_end) && partial_end.length > 1)
    ) {
      return res.sendStatus(500); //ERR_INCOMPLETE_CHUNKED_ENCODING
    }

    const start = parseInt(partial_start, 10);
    const end = partial_end ? parseInt(partial_end, 10) : stat.size - 1;
    const content_length = end - start + 1;

    res.status(206).header({
      "Content-Type": "audio/mpeg",
      "Content-Length": content_length,
      "Content-Range": "bytes " + start + "-" + end + "/" + stat.size,
    });

    readStream = fs.createReadStream(path, { start: start, end: end });
  } else {
    res.header({
      "Content-Type": "audio/mpeg",
      "Content-Length": stat.size,
    });
    readStream = fs.createReadStream(path);
  }
  readStream.pipe(res);
});

if (CONFIG.belkaToken) {
  express.get("/belka", async (req, res) => {
    const response = await fetch(
      "https://staging-api.qwertyui.xyz/api/v1/files/predictions?hashes=" +
        req.query.hashes,
      {
        headers: { Authorization: `Bearer ${CONFIG.belkaToken}` },
      }
    ).then((r) => r.json());
    res.json(response);
  });
}

// --------------------------------------------------------------
if (!__DEV__) {
  const frontEndPath = path.join(process.cwd(), "front");
  express.use(
    "/",
    expressPackage.static(frontEndPath, {
      maxAge: 31536000,
    })
  );
  const rootRouter = expressPackage.Router();
  rootRouter.get("(/*)?", async (req, res, next) => {
    res.sendFile(path.join(frontEndPath, "index.html"));
  });
  express.use(rootRouter);
} else {
  // express.use(
  //   cors({
  //     origin: "http://localhost:3000",
  //   })
  // );
}

server.listen(CONFIG.port, "0.0.0.0", () => {
  console.log("listening on", "http://127.0.0.1:" + CONFIG.port + "/");
});

// --------------------------------------------------------------
WS.on("connection", (socket) => {
  console.log("[io] socket connected");

  SOCKET_WATCHERS["connection"](socket);
  _.forEach(SOCKET_WATCHERS, (handler, name) => {
    socket.on(name, async (...args) => {
      await readiness;

      // slow down a bit, for imitating network delay
      if (__DEV__) await sleep(500);
      console.log("[io] event:" + name, ...args);

      if (typeof args[args.length - 1] === "function") {
        const ret = await handler(socket, ...args);
        // console.log("[io] event:" + name, "RETURN:", ret);
        args[args.length - 1](ret);
      } else {
        handler(socket, ...args);
      }
    });
  });
});
// --------------------------------------------------------------
const readiness = require("./initial")({ WS });

if (_.isArray(CONFIG.scanners) && CONFIG.scanners.length > 0) {
  require("./plugins/uniden")({ WS, scanners: CONFIG.scanners });
}

if (CONFIG.debug) {
  ["log", "error", "warn"].forEach((method) => {
    const originalMethod = console[method];
    console[method] = (...args) => {
      WS.emit("DAEMON", ...args);
      originalMethod.apply(console, args);
    };
  });
}
