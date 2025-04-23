import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import AWS from "aws-sdk";
import { createServer } from "http";
import { Server } from "socket.io";
import config from "../config.js";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose
  .connect(config.mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// AWS Configuration
AWS.config.update({
  region: config.awsRegion,
  accessKeyId: config.awsAccessKeyId,
  secretAccessKey: config.awsSecretAccessKey,
});

const s3 = new AWS.S3();

// Define MongoDB Schema
const VideoSchema = new mongoose.Schema({
  videoId: String,
  title: String,
  platform: String,
  currentTime: Number,
  duration: Number,
  comments: [
    {
      text: String,
      timestamp: Number,
      userId: String,
      username: String,
      createdAt: { type: Date, default: Date.now },
    },
  ],
  viewers: [
    {
      userId: String,
      username: String,
      lastActive: Date,
    },
  ],
});

const Video = mongoose.model("Video", VideoSchema);

// Socket.IO Connection Handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-video", async ({ videoId, userId, username }) => {
    socket.join(videoId);

    // Update viewers in database
    await Video.findOneAndUpdate(
      { videoId },
      {
        $addToSet: {
          viewers: {
            userId,
            username,
            lastActive: new Date(),
          },
        },
      },
      { upsert: true }
    );

    // Notify others in the room
    socket.to(videoId).emit("user-joined", { userId, username });

    // Send current viewers to the new user
    const video = await Video.findOne({ videoId });
    if (video) {
      socket.emit("current-viewers", video.viewers);
    }
  });

  socket.on("leave-video", async ({ videoId, userId }) => {
    socket.leave(videoId);

    // Remove viewer from database
    await Video.findOneAndUpdate(
      { videoId },
      {
        $pull: {
          viewers: { userId },
        },
      }
    );

    socket.to(videoId).emit("user-left", { userId });
  });

  socket.on(
    "chat-message",
    async ({ videoId, userId, username, text, timestamp }) => {
      const message = {
        text,
        timestamp,
        userId,
        username,
        createdAt: new Date(),
      };

      // Save message to database
      await Video.findOneAndUpdate(
        { videoId },
        {
          $push: { comments: message },
        },
        { upsert: true }
      );

      // Broadcast message to all users in the room
      io.to(videoId).emit("new-message", message);
    }
  );

  socket.on("video-time-update", async ({ videoId, userId, currentTime }) => {
    await Video.findOneAndUpdate(
      { videoId },
      {
        $set: { currentTime },
        $set: { "viewers.$.lastActive": new Date() },
      },
      {
        "viewers.userId": userId,
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// API Routes
app.get("/api/videos/:videoId", async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    res.json(
      video || { videoId: req.params.videoId, comments: [], viewers: [] }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/videos/:videoId/comments", async (req, res) => {
  try {
    const video = await Video.findOne({ videoId: req.params.videoId });
    res.json(video?.comments || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = config.port;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
