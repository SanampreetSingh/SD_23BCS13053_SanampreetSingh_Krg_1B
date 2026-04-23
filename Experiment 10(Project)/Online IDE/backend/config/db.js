const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
});
    console.log(`✅  MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌  Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

mongoose.connection.on('error', err => {
  console.error(`🔥 MongoDB connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB disconnected! Attempting to reconnect...');
});

module.exports = connectDB;