// db.js
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/gradLink", {});
    console.log("✅ MongoDB connection successful.");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1); // Exit the app if the DB fails to connect
  }
};

module.exports = { connectDB };
