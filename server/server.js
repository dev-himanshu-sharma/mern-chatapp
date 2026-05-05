import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/database.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

/* ================= SOCKET.IO SETUP ================= */

export const userSocketMap = {}; // { userId: socketId }

// Receiver socket id finder
export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

export const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;

  // Safe validation
  if (typeof userId === "string" && userId.trim()) {
    userSocketMap[userId] = socket.id;
    console.log("User Connected:", userId);
  }

  // Send online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    if (userId && userSocketMap[userId]) {
      console.log("User Disconnected:", userId);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    }
  });
});

/* ================= MIDDLEWARE ================= */

app.use(express.json({ limit: "4mb" }));
app.use(cors());

/* ================= ROUTES ================= */

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

/* ================= SERVER START ================= */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () =>
      console.log(` Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("Server error:", error);
  }
};

startServer();
