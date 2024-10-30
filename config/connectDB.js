const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();

const app = require("../src/app");

// Server Connection
const server = http.createServer(app);

//MongoDB Connection
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("Database connected");
    server.listen(process.env.PORT, () => console.log("server started"));
  })
  .catch((err) => {
    console.error(err);
  });
