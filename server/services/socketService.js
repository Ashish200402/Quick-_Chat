import User from "../models/User.js";
import Message from "../models/Message.js";
import Room from "../models/Room.js";
import {
  setUserOnline,
  setUserOffline,
  getBulkUserStatus,
} from "../lib/redis.js";

// ─── User ↔ Socket mapping ────────────────────────────
export const userSocketMap = {};

/**
 * Initialize Socket.io with all event handlers.
 * @param {import("socket.io").Server} io
 */
export const initializeSocket = (io) => {
  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.userId;
    if (!userId || userId === "undefined") {
      socket.disconnect();
      return;
    }

    console.log("User connected:", userId);

    // ── Register user ────────────────────────────
    userSocketMap[userId] = socket.id;

    // Set online in Redis
    try {
      await setUserOnline(userId);
    } catch (err) {
      console.log("Redis setOnline error:", err.message);
    }

    // ── Auto-join user's rooms ───────────────────
    try {
      const user = await User.findById(userId).select("joinedRooms");
      if (user?.joinedRooms?.length) {
        user.joinedRooms.forEach((roomId) => {
          socket.join(roomId.toString());
        });
        console.log(`User ${userId} joined ${user.joinedRooms.length} room(s)`);
      }
    } catch (err) {
      console.log("Auto-join rooms error:", err.message);
    }

    // ── Broadcast online users ───────────────────
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // ── Typing indicators ────────────────────────
    socket.on("typing:start", (data) => {
      // data = { receiverId, roomId }
      if (data.roomId) {
        // Room typing — broadcast to room excluding sender
        socket.to(data.roomId).emit("typing:start", {
          userId,
          roomId: data.roomId,
        });
      } else if (data.receiverId) {
        // DM typing — send to specific user
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:start", {
            userId,
            receiverId: data.receiverId,
          });
        }
      }
    });

    socket.on("typing:stop", (data) => {
      if (data.roomId) {
        socket.to(data.roomId).emit("typing:stop", {
          userId,
          roomId: data.roomId,
        });
      } else if (data.receiverId) {
        const receiverSocketId = userSocketMap[data.receiverId];
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("typing:stop", {
            userId,
            receiverId: data.receiverId,
          });
        }
      }
    });

    // ── Read receipts ────────────────────────────
    socket.on("message:read", async (data) => {
      // data = { messageId, senderId } for DMs
      // data = { messageIds[], roomId } for room messages
      try {
        if (data.roomId && data.messageIds) {
          // Room read receipt — batch update
          await Message.updateMany(
            {
              _id: { $in: data.messageIds },
              "readBy.userId": { $ne: userId },
            },
            {
              $addToSet: { readBy: { userId, readAt: new Date() } },
            }
          );
        } else if (data.messageId) {
          // DM read receipt
          await Message.findByIdAndUpdate(data.messageId, {
            status: "read",
            seen: true,
            readAt: new Date(),
          });

          // Notify sender their message was read
          if (data.senderId) {
            const senderSocketId = userSocketMap[data.senderId];
            if (senderSocketId) {
              io.to(senderSocketId).emit("message:read", {
                messageId: data.messageId,
                readBy: userId,
                readAt: new Date(),
              });
            }
          }
        }
      } catch (err) {
        console.log("message:read error:", err.message);
      }
    });

    // ── Message delivered acknowledgment ─────────
    socket.on("message:delivered", async (data) => {
      // data = { messageId, senderId }
      try {
        await Message.findByIdAndUpdate(data.messageId, {
          status: "delivered",
          deliveredAt: new Date(),
        });

        if (data.senderId) {
          const senderSocketId = userSocketMap[data.senderId];
          if (senderSocketId) {
            io.to(senderSocketId).emit("message:delivered", {
              messageId: data.messageId,
              deliveredAt: new Date(),
            });
          }
        }
      } catch (err) {
        console.log("message:delivered error:", err.message);
      }
    });

    // ── Dynamic room join/leave ──────────────────
    socket.on("room:join", (roomId) => {
      socket.join(roomId);
    });

    socket.on("room:leave", (roomId) => {
      socket.leave(roomId);
    });

    // ── Disconnect ───────────────────────────────
    socket.on("disconnect", async () => {
      console.log("User disconnected:", userId);
      delete userSocketMap[userId];

      // Set offline in Redis with 60s TTL
      try {
        await setUserOffline(userId, 60);
      } catch (err) {
        console.log("Redis setOffline error:", err.message);
      }

      // Update lastSeen in DB
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {
        console.log("lastSeen update error:", err.message);
      }

      // Broadcast updated online users
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
};
