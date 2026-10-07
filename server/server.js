import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import mongoose from "mongoose";
import { connectDB } from "./lib/db.js";
import { connectRedis } from "./lib/redis.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import { initializeSocket, userSocketMap } from "./services/socketService.js";

// ── Allowed origins ──────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://chat-app-client-wheat-three.vercel.app",
  process.env.CLIENT_URL,
].filter(Boolean);

// ── Create Express app and HTTP server ──────────────────
const app = express();
const server = http.createServer(app);

// ── Initialize Socket.io ────────────────────────────────
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Re-export userSocketMap so controllers can import from server.js
export { userSocketMap };

// Initialize all socket event handlers
initializeSocket(io);

// ── Middleware ───────────────────────────────────────────
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);
app.use(express.json({ limit: "4mb" }));

// ── Routes ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send(
    "QuickChat API is running. Use the app at https://chat-app-client-wheat-three.vercel.app — health: /api/health"
  );
});

const healthCheck = (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.json({
    status: "Server is running",
    ok: connected,
    db: connected ? "connected" : "disconnected",
  });
};
app.get("/api/status", healthCheck);
app.get("/api/health", healthCheck);
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/rooms", roomRouter);

// ── Connect to Database & Redis ─────────────────────────
await connectDB();

// Initialize Redis (non-blocking — falls back to in-memory)
connectRedis();

// ── Start server (always bind — required for Render) ────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`✅ Server running on PORT ${PORT}`));

export default server;