const multer = require("multer");
const fs = require("fs");
const path = require("path");
const express = require("express");
const profileRouter = express.Router();
const { Post, User } = require("../schemas");

// ✅ Route: Get profile data and post count
profileRouter.post("/getProfileData", async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    // Find the user
    const user = await User.findById(userId).select(
      "-password"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Count number of posts
    const postCount = await Post.countDocuments({ author: userId });

    return res.status(200).json({
      success: true,
      user,
      postCount,
    });
  } catch (error) {
    console.error("Error fetching profile data:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});

profileRouter.post("/updateProfile", async (req, res) => {
  const {
    userId,
    bio,
    skills,
    currentJob,
    company,
    location,
    school,
    department,
    graduationYear,
    phone,
  } = req.body;
  console.log(req.body);

  if (!userId) {
    return res.status(400).json({ error: "userId is required." });
  }

  try {
    // Fetch the current user data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    // Build only fields that should be updated (i.e. are not empty or undefined)
    const updates = {};

    if (bio !== undefined && bio !== "") updates.bio = bio;
    if (skills !== undefined && Array.isArray(skills)) updates.skills = skills;
    if (currentJob !== undefined && currentJob !== "") updates.currentJob = currentJob;
    if (company !== undefined && company !== "") updates.company = company;
    if (location !== undefined && location !== "") updates.location = location;
    if (school !== undefined && school !== "") updates.school = school;
    if (department !== undefined && department !== "") updates.department = department;
    if (graduationYear !== undefined && graduationYear !== null) updates.graduationYear = graduationYear;
    if (phone !== undefined && phone !== "") updates.phone = phone;

    // Update user only with the filtered updates
    const updatedUser = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select(
      "name email profileImage bio skills currentJob company location school department graduationYear phone createdAt"
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
});


module.exports = { profileRouter };
