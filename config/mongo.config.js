const MongoClient = require("mongodb").MongoClient;

const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 27017;
const DB_NAME = process.env.DB_NAME || "jwtTutorial";
const URL = `mongodb://${DB_HOST}:${DB_PORT}`;

let client;

async function connectDb() {
  if (!client)
    client = await MongoClient.connect(URL, { useUnifiedTopology: true });
  return {
    db: client.db(DB_NAME),
    client: client
  };
}

async function close() {
  if (client) client.close();
  client = undefined;
}

module.exports = { connectDb, close };
