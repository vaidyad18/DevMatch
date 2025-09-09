// src/config/database.js
const mongoose = require("mongoose");

let cached = global._mongooseCached;
if (!cached) {
  cached = global._mongooseCached = { conn: null, promise: null };
}

mongoose.set("strictQuery", true);

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    if (!process.env.DB_CONNECTION_STRING) {
      throw new Error("DB_CONNECTION_STRING is not defined in env vars");
    }

    cached.promise = mongoose
      .connect(process.env.DB_CONNECTION_STRING, {
        maxPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      })
      .then((m) => m.connection)
      .catch((err) => {
        cached.promise = null; // reset so it can retry later
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
