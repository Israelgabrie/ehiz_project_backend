const multer = require("multer");
const fs = require("fs");
const path = require("path");
const express = require("express");
const postRouter = express.Router();
const { Post, User } = require("../schemas");

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/", "video/"];
    if (allowed.some((type) => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed!"));
    }
  },
});

// Route: /api/posts/addPost
postRouter.post(
  "/addPost",
  upload.fields([
    { name: "images", maxCount: 3 },
    { name: "videos", maxCount: 3 },
  ]),
  async (req, res) => {
    try {
      const { text, userId } = req.body;

      if (!text || !userId) {
        return res.status(400).json({ error: "Text and userId are required." });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found." });

      const uploadedImages = (req.files["images"] || []).map(
        (file) => file.filename
      );
      const uploadedVideos = (req.files["videos"] || []).map(
        (file) => file.filename
      );

      const post = new Post({
        author: user._id,
        content: text,
        images: uploadedImages, // ✅ full array of image filenames
        videos: uploadedVideos, // ✅ full array of video filenames
      });

      await post.save();

      return res
        .status(201)
        .json({ message: "Post created successfully.", post });
    } catch (error) {
      console.error("Error adding post:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }
);

// Route: /api/posts/feed
postRouter.post("/feed", async (req, res) => {
  try {
    const { userId } = req.body;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author", "-password") // exclude password
      .populate("comments.user", "name email profileImage");

    const enrichedPosts = posts.map((post) => ({
      ...post.toObject(),
      likedByUser: userId
        ? post.likes.some((id) => id.toString() === userId)
        : false,
    }));

    return res.status(200).json(enrichedPosts);
  } catch (err) {
    console.error("Error fetching feed:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Route: /api/posts/more?lastPostId=abc123
postRouter.post("/moreFeed", async (req, res) => {
  try {
    const { userId } = req.body;
    const { lastPostId } = req.query;

    if (!lastPostId) {
      return res.status(400).json({ error: "lastPostId is required." });
    }

    const lastPost = await Post.findById(lastPostId);
    if (!lastPost) {
      return res.status(404).json({ error: "Last post not found." });
    }

    const posts = await Post.find({ createdAt: { $lt: lastPost.createdAt } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("author", "-password")
      .populate("comments.user", "name email profileImage");

    const enrichedPosts = posts.map((post) => ({
      ...post.toObject(),
      likedByUser: userId
        ? post.likes.some((id) => id.toString() === userId)
        : false,
    }));

    return res.status(200).json(enrichedPosts);
  } catch (err) {
    console.error("Error fetching more posts:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Route: /api/posts/like
postRouter.post("/like", async (req, res) => {
  try {
    const { userId, postId, like } = req.body;

    if (!userId || !postId || typeof like !== "boolean") {
      return res
        .status(400)
        .json({ error: "userId, postId, and like are required." });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found." });
    }

    const hasLiked = post.likes.includes(userId);

    if (like && !hasLiked) {
      post.likes.push(userId);
    } else if (!like && hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    }

    await post.save();

    return res.status(200).json({
      message: like ? "Post liked." : "Post unliked.",
      likedByUser: post.likes.includes(userId),
      totalLikes: post.likes.length,
    });
  } catch (error) {
    console.error("Error updating like:", error);
    res.status(500).json({ error: "Internal server error." });
  }
});

// Route: /api/posts/addComment
postRouter.post("/addComment", async (req, res) => {
  try {
    const { userId, postId, comment } = req.body;

    if (!userId || !postId || !comment?.trim()) {
      return res
        .status(400)
        .json({ error: "userId, postId, and comment text are required." });
    }

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ error: "Post not found." });

    post.comments.push({
      user: userId,
      comment,
      createdAt: new Date(),
    });

    await post.save();

    // Repopulate updated comments
    const updatedPost = await Post.findById(postId).populate(
      "comments.user",
      "name email profileImage"
    );

    return res.status(200).json({
      message: "Comment added successfully.",
      comments: updatedPost.comments.reverse(), // latest first
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ error: "Internal server error." });
  }
});

module.exports = postRouter;
