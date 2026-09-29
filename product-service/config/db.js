const mongoose = require("mongoose");

async function connectDB(uri) {
  const connectionUri = uri || process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!connectionUri) {
    throw new Error(
      "MONGO_URI or MONGODB_URI is not set. Copy .env.example to .env and paste your MongoDB connection string."
    );
  }
  await mongoose.connect(connectionUri);
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
}

module.exports = { connectDB, disconnectDB };
