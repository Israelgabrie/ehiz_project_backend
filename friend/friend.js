const multer = require("multer");
const fs = require("fs");
const path = require("path");
const express = require("express");
const friendRouter = express.Router();
const { Post, User } = require("../schemas");

// ✅ Route to get up to 10 random users
friendRouter.get("/randomUsers", async (req, res) => {
  try {
    const users = await User.aggregate([
      { $sample: { size: 10 } },
      {
        $project: {
          name: 1,
          email: 1,
          profileImage: 1,
          department: 1,
          currentJob: 1,
          location: 1,
        },
      },
    ]);

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching random users:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// ✅ Route to search users by name (case-insensitive, partial match)
friendRouter.get("/searchByName", async (req, res) => {
  const { name } = req.query;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Name query is required." });
  }

  try {
    const users = await User.find({
      name: { $regex: name.trim(), $options: "i" },
    }).select("name email profileImage department currentJob location");

    res.status(200).json({ users });
  } catch (error) {
    console.error("Error searching users by name:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = friendRouter;
