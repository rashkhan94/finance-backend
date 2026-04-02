const mongoose = require('mongoose');
const config = require('./index');

let mongoServer = null;

const connectDB = async () => {
  try {
    // try connecting to the configured MongoDB URI first
    if (!config.useMemoryDB) {
      try {
        const conn = await mongoose.connect(config.mongo.uri, {
          serverSelectionTimeoutMS: 5000, // fail fast if not available
        });
        console.log(`  MongoDB connected: ${conn.connection.host}`);
        return;
      } catch (err) {
        console.log('  External MongoDB not available, falling back to in-memory database...');
      }
    }

    // fallback: use in-memory MongoDB (great for dev/demo without installing Mongo)
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create({
      binary: {
        version: '7.0.4', // Debian 12 on Render requires >= 7.0.3
      },
    });
    const memoryUri = mongoServer.getUri();

    const conn = await mongoose.connect(memoryUri);
    console.log(`  MongoDB connected (in-memory): ${conn.connection.host}`);
    console.log('  Note: Data will not persist after server restart.');
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

