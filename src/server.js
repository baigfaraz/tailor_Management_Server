require("dotenv").config();
const { readEnv } = require("./config/env");
const connectDB = require("./config/db");
const { createApp } = require("./app");

let config;
try {
  config = readEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

connectDB();

const app = createApp(config);

app.listen(config.port, () =>
  console.log(`Server started at Port ${config.port}.`),
);

module.exports = app;
