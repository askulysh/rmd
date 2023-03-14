// Modules to control application life and create native browser window
const { app, BrowserWindow, session, protocol } = require("electron");
const fs = require("fs");

require("./src/index.js");
const { __DEV__ } = require("./src/constants");
const { createWindow } = require("./src/electron/window");

//handle crashes and kill events
process.on("uncaughtException", function (err) {
  //log the message and stack trace
  fs.writeFileSync("../vuho49-crash.log", err + "\n" + err.stack);

  //do any cleanup like shutting down servers, etc

  //relaunch the app (if you want)
  app.relaunch({ args: [] });
  app.exit(0);
});
process.on("SIGTERM", function () {
  fs.writeFileSync("../vuho49-shutdown.log", "Received SIGTERM signal");

  //do any cleanup like shutting down servers, etc

  //relaunch the app (if you want)
  app.relaunch({ args: [] });
  app.exit(0);
});
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // app.commandLine.appendSwitch('allow-insecure-localhost', true);
  // app.commandLine.appendSwitch('disable-features', 'BlockInsecurePrivateNetworkRequests')

  // protocol.interceptFileProtocol('file', (request, callback) => {
  //     let url = request.url
  //     if (request.url.indexOf('file://') === 0) {
  //         url = request.url.slice('file://'.length)
  //     }
  //     if (url.indexOf(process.cwd()) === 0) {
  //         url = url.slice(process.cwd().length);
  //     }
  //     // file:///build/
  //     const normalizedPath = path.normalize(`${__dirname}/${url}`)
  //
  //     console.log({
  //         original: request.url,
  //         normalized: normalizedPath,
  //     });
  //
  //     callback({path: normalizedPath})
  // }, (err) => {
  //     if (err) console.error('Failed to register protocol')
  // })

  app.on("activate", function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", function () {
  // if (process.platform !== "darwin") app.quit();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
