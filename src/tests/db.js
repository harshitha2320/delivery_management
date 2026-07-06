// Spins up an in-memory MongoDB for tests: real Mongoose queries,
// no external database, wiped between suites.
const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;

const connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
};

const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

const close = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

module.exports = { connect, clear, close };
