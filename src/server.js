const connectDB = require("./config/db");
const { createApp } = require("./app");

const port = process.env.PORT || 5000;

connectDB();

const app = createApp({ webDist: process.env.WEB_DIST });

app.listen(port, () => console.log(`Server started at Port ${port}.`));

module.exports = app;
