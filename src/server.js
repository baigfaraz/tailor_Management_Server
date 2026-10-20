const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const port = process.env.PORT || 5000;

connectDB();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/customerDetail", require("./routes/customerDetailRoute"));

app.listen(port, () => console.log(`Server started at Port ${port}.`));

module.exports = app;
