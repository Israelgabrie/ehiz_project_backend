const mongoose = require("mongoose");

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  graduationYear: { type: Number },
  department: { type: String },
  currentJob: { type: String },
  location: { type: String },
  profileImage: { type: String },
  bio: { type: String, maxlength: 500 },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  skills: [String],
  company: { type: String },
  school: { type: String },
  phone: { type: String }, // ✅ Added phone number field
});

// Post Schema
const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true, maxlength: 1000 },
  images: [String],
  videos: [String],
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      comment: { type: String },
      createdAt: { type: Date, default: Date.now },
    },
  ],

  createdAt: { type: Date, default: Date.now },
});

// Create models
const User = mongoose.model("User", UserSchema);
const Post = mongoose.model("Post", PostSchema);

// Export models
module.exports = { User, Post };
