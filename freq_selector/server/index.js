const express = require("express");
const fs = require("fs");
const path = require("path");
const expressPackage = require("express");
const app = express();

const CONFIG = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../dmr40.config.json"))
);

// get img list
// put to bookmarks.csv в кінець
// serve img

app.get("/api/images", async (req, res) => {
  const files = await fs.promises.readdir(CONFIG.imgPath);
  const imgs = files.filter((file) => file.endsWith(".jpg"));
  res.json(imgs);
});
app.get("/api/image/:imgname", (req, res) => {
  res.sendFile(path.join(CONFIG.imgPath, req.params.imgname));
});

app.get("/api/addToCsv/:fq", async (req, res) => {
  await fs.promises.appendFile(
    CONFIG.csvPath,
    `\n   ${req.params.fq}; unk                      ; Narrow FM           ;      12500; dmr`
  );
  res.json({
    success: true,
  });
});

// --------------------------------------------------------------
const frontEndPath = path.join(process.cwd(), "build");
app.use(
  "/",
  express.static(frontEndPath, {
    maxAge: 31536000,
  })
);
const rootRouter = express.Router();
rootRouter.get("(/*)?", async (req, res, next) => {
  res.sendFile(path.join(frontEndPath, "index.html"));
});
app.use(rootRouter);
// --------------------------------------------------------------

app.listen(CONFIG.port, "0.0.0.0", () =>
  console.log("Started on http://localhost:" + CONFIG.port)
);
