import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { getBulkUserStatus } from "../lib/redis.js";

// ─── Get all users except the logged in user ────────────
export const getUserForSideBar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    // Count unseen messages per user
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const count = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        status: { $ne: "read" },
        seen: false,
      });
      if (count > 0) {
        unseenMessages[user._id] = count;
      }
    });
    await Promise.all(promises);

    // Get Redis status for all users
    let statusMap = {};
    try {
      const userIds = filteredUsers.map((u) => u._id.toString());
      statusMap = await getBulkUserStatus(userIds);
    } catch (err) {
      console.log("Redis bulk status error:", err.message);
    }

    res.json({
      success: true,
      users: filteredUsers,
      unseenMessages,
      statusMap,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get all messages for selected user ─────────────────
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    // Fetch conversation between both users
    const messages = await Message.find({
      roomId: { $exists: false },
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    }).sort({ createdAt: 1 });

    // Batch mark received messages as read using bulkWrite
    const bulkOps = messages
      .filter(
        (m) =>
          m.senderId.toString() === selectedUserId &&
          m.receiverId.toString() === myId.toString() &&
          m.status !== "read"
      )
      .map((m) => ({
        updateOne: {
          filter: { _id: m._id },
          update: {
            $set: {
              seen: true,
              status: "read",
              readAt: new Date(),
            },
          },
        },
      }));

    if (bulkOps.length > 0) {
      await Message.bulkWrite(bulkOps);

      // Notify sender about read receipts
      const senderSocketId = userSocketMap[selectedUserId];
      if (senderSocketId) {
        const readMessageIds = bulkOps.map((op) => op.updateOne.filter._id);
        io.to(senderSocketId).emit("messages:read:batch", {
          messageIds: readMessageIds,
          readBy: myId,
          readAt: new Date(),
        });
      }
    }

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Mark message as read ───────────────────────────────
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const msg = await Message.findByIdAndUpdate(
      id,
      {
        seen: true,
        status: "read",
        readAt: new Date(),
      },
      { new: true }
    );

    // Notify sender
    if (msg) {
      const senderSocketId = userSocketMap[msg.senderId.toString()];
      if (senderSocketId) {
        io.to(senderSocketId).emit("message:read", {
          messageId: id,
          readBy: req.user._id,
          readAt: new Date(),
        });
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Send message to selected user ──────────────────────
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl = null;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    // Determine initial status — if receiver is online, mark as delivered
    const receiverSocketId = userSocketMap[receiverId];
    const initialStatus = receiverSocketId ? "delivered" : "sent";

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
      status: initialStatus,
      deliveredAt: receiverSocketId ? new Date() : undefined,
    });

    // Emit the new message to the receiver's socket
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.json({ success: true, newMessage });
  } catch (error) {
    console.log("Send Message Error:", error.message);
    return res.json({ success: false, message: error.message });
  }
};
