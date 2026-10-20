const connectDB = require("./config/db");
const app = require("./app");

const port = process.env.PORT || 5000;

connectDB();

app.listen(port, () => console.log(`Server started at Port ${port}.`));

module.exports = app;
