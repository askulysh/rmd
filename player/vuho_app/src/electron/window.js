const windowStateKeeper = require("electron-window-state");
const { BrowserWindow } = require("electron");
const { __DEV__, CONFIG } = require("../constants");

function createWindow() {
  let mainWindowState = windowStateKeeper({
    defaultWidth: __DEV__ ? 800 : 340,
    defaultHeight: 600,
  });
  const mainWindow = new BrowserWindow({
    icon: "./logo192.png",
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      // allowDisplayingInsecureContent: true,
      // allowRunningInsecureContent: true,
      // InsecurePrivateNetworkRequestsAllowed: true,
      // webSecurity: false,
    },
  });

  mainWindowState.manage(mainWindow);

  const url =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "http://localhost:" + CONFIG.port;

  mainWindow.loadURL(url);

  // session.defaultSession.enableNetworkEmulation({
  //     offline: true,
  // });

  // const url = 'https://vuho-client.vercel.app/'
  // and load the index.html of the app.
  // mainWindow.loadURL(
  //     url.format({
  //         pathname: `${process.resourcesPath}/../front/index.html`,    /* Attention here: origin is path.join(__dirname, 'index.html') */
  //         protocol: 'file',
  //         slashes: true
  //     })
  // )
  // console.log(899, process.resourcesPath)
  //
  // mainWindow.loadFile(
  //     `${process.resourcesPath}/../front/index.html`
  // )

  // mainWindow.loadURL(url.format({
  //     pathname: process.env.NODE_ENV === 'development'
  //         ? path.join(__dirname, '/front/index.html')
  //         : path.join(__dirname, "../../front/index.html"),
  //     protocol: "file:",
  //     slashes: true
  // }));
  if (__DEV__) mainWindow.webContents.openDevTools();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools()
}

module.exports = {
  createWindow,
};
