// server.js
require("dotenv").config(); // ✅ Make sure this is at the VERY top

const express = require("express");
const { connectDB } = require("./databaseConnection.js");
const cookieParser = require("cookie-parser");
const { userRouter } = require("./user/user.js");
const cors = require("cors");
const postRouter = require("./student/posts.js");
const path = require("path");
const friendRouter = require("./friend/friend.js");
const { profileRouter } = require("./profile/profle.js");

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Enable CORS for your frontend
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ✅ Middleware
app.use(express.json());
app.use(cookieParser());


// ✅ Routes
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/profile", profileRouter);
app.use("/friend", friendRouter);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));




// ✅ Start server after connecting to DB
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log("🚀 Server is running on port " + PORT);
  });
});
