const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const cors = require("cors");

// webDist: path to the built frontend (e.g. ../frontend/build). When set, the
// app also serves the web UI from the same origin; unknown non-API paths get
// index.html so client-side routes work on reload.
function createApp({ webDist } = {}) {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  app.use("/api/customerDetail", require("./routes/customerDetailRoute"));

  const dist = webDist && path.resolve(webDist);
  if (dist && fs.existsSync(path.join(dist, "index.html"))) {
    app.use(express.static(dist));
    app.get(/^\/(?!api\/).*/, (req, res) => {
      res.sendFile(path.join(dist, "index.html"));
    });
  }

  return app;
}

module.exports = { createApp };
