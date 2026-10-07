import Room from "../models/Room.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";
import { v4 as uuidv4 } from "uuid";
import { io, userSocketMap } from "../server.js";

// ─── Create a new room ──────────────────────────────────
export const createRoom = async (req, res) => {
  try {
    const { name, description, type, avatar } = req.body;
    const userId = req.user._id;

    if (!name || !name.trim()) {
      return res.json({ success: false, message: "Room name is required" });
    }

    let avatarUrl = "";
    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar);
      avatarUrl = upload.secure_url;
    }

    const room = await Room.create({
      name: name.trim(),
      description: description || "",
      type: type || "public",
      inviteLink: uuidv4(),
      avatar: avatarUrl,
      createdBy: userId,
      adminIds: [userId],
      memberIds: [userId],
      lastActivity: new Date(),
    });

    // Add room to user's joinedRooms
    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedRooms: room._id },
    });

    // Join the socket room if user is connected
    const socketId = userSocketMap[userId.toString()];
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.join(room._id.toString());
    }

    res.json({ success: true, room });
  } catch (error) {
    console.log("createRoom error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get all rooms user has joined ──────────────────────
export const getRooms = async (req, res) => {
  try {
    const userId = req.user._id;
    const rooms = await Room.find({ memberIds: userId })
      .populate("adminIds", "fullName profilePic")
      .sort({ lastActivity: -1 });

    // Count unseen messages per room
    const unseenCounts = {};
    for (const room of rooms) {
      const count = await Message.countDocuments({
        roomId: room._id,
        senderId: { $ne: userId },
        "readBy.userId": { $ne: userId },
      });
      if (count > 0) unseenCounts[room._id] = count;
    }

    res.json({ success: true, rooms, unseenCounts });
  } catch (error) {
    console.log("getRooms error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Browse public rooms ────────────────────────────────
export const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ type: "public" })
      .select("name description avatar memberIds lastActivity")
      .sort({ lastActivity: -1 })
      .limit(50);

    res.json({ success: true, rooms });
  } catch (error) {
    console.log("getPublicRooms error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get single room by ID ─────────────────────────────
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate("memberIds", "fullName profilePic email")
      .populate("adminIds", "fullName profilePic email");

    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    res.json({ success: true, room });
  } catch (error) {
    console.log("getRoomById error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Get room messages ──────────────────────────────────
export const getRoomMessages = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({ roomId })
      .populate("senderId", "fullName profilePic")
      .sort({ createdAt: 1 });

    // Batch mark messages as read
    const unreadMsgIds = messages
      .filter(
        (m) =>
          m.senderId._id.toString() !== userId.toString() &&
          !m.readBy.some((r) => r.userId.toString() === userId.toString())
      )
      .map((m) => m._id);

    if (unreadMsgIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMsgIds } },
        {
          $addToSet: { readBy: { userId, readAt: new Date() } },
        }
      );
    }

    // Update room last activity
    await Room.findByIdAndUpdate(roomId, { lastActivity: new Date() });

    res.json({ success: true, messages });
  } catch (error) {
    console.log("getRoomMessages error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Send message to a room ─────────────────────────────
export const sendRoomMessage = async (req, res) => {
  try {
    const { id: roomId } = req.params;
    const { text, image } = req.body;
    const senderId = req.user._id;

    let imageUrl = null;
    if (image) {
      const upload = await cloudinary.uploader.upload(image);
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      roomId,
      text,
      image: imageUrl,
      status: "sent",
      readBy: [{ userId: senderId, readAt: new Date() }],
    });

    // Populate sender info for the response
    await newMessage.populate("senderId", "fullName profilePic");

    // Update room last activity
    await Room.findByIdAndUpdate(roomId, { lastActivity: new Date() });

    // Broadcast to room via Socket.io
    io.to(roomId).emit("newRoomMessage", {
      ...newMessage.toObject(),
      roomId,
    });

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log("sendRoomMessage error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Join a public room ─────────────────────────────────
export const joinRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    if (room.type === "private") {
      return res.json({ success: false, message: "This room is private. Use an invite link." });
    }

    const userId = req.user._id;
    const alreadyMember = room.memberIds.some((id) => id.toString() === userId.toString());
    if (alreadyMember) {
      return res.json({ success: false, message: "Already a member" });
    }

    room.memberIds.push(userId);
    await room.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedRooms: room._id },
    });

    // Join socket room
    const socketId = userSocketMap[userId.toString()];
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.join(room._id.toString());
    }

    res.json({ success: true, room });
  } catch (error) {
    console.log("joinRoom error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Join via invite link ───────────────────────────────
export const joinByInvite = async (req, res) => {
  try {
    const { invite } = req.params;
    const room = await Room.findOne({ inviteLink: invite });

    if (!room) {
      return res.status(404).json({ success: false, message: "Invalid invite link" });
    }

    const userId = req.user._id;
    const alreadyMember = room.memberIds.some((id) => id.toString() === userId.toString());
    if (alreadyMember) {
      return res.json({ success: true, room, message: "Already a member" });
    }

    room.memberIds.push(userId);
    await room.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedRooms: room._id },
    });

    // Join socket room
    const socketId = userSocketMap[userId.toString()];
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.join(room._id.toString());
    }

    res.json({ success: true, room });
  } catch (error) {
    console.log("joinByInvite error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Leave a room ───────────────────────────────────────
export const leaveRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const userId = req.user._id.toString();

    room.memberIds = room.memberIds.filter((id) => id.toString() !== userId);
    room.adminIds = room.adminIds.filter((id) => id.toString() !== userId);

    // If no admins left, promote first remaining member
    if (room.adminIds.length === 0 && room.memberIds.length > 0) {
      room.adminIds.push(room.memberIds[0]);
    }

    await room.save();

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { joinedRooms: room._id },
    });

    // Leave socket room
    const socketId = userSocketMap[userId];
    if (socketId) {
      const socket = io.sockets.sockets.get(socketId);
      if (socket) socket.leave(room._id.toString());
    }

    res.json({ success: true, message: "Left room successfully" });
  } catch (error) {
    console.log("leaveRoom error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Admin: Add member ──────────────────────────────────
export const addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = req.room;

    const already = room.memberIds.some((id) => id.toString() === userId);
    if (already) {
      return res.json({ success: false, message: "User is already a member" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    room.memberIds.push(userId);
    await room.save();

    await User.findByIdAndUpdate(userId, {
      $addToSet: { joinedRooms: room._id },
    });

    res.json({ success: true, room });
  } catch (error) {
    console.log("addMember error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Admin: Remove member ───────────────────────────────
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;
    const room = req.room;

    // Can't remove yourself via this endpoint
    if (userId === req.user._id.toString()) {
      return res.json({ success: false, message: "Use leave endpoint instead" });
    }

    room.memberIds = room.memberIds.filter((id) => id.toString() !== userId);
    room.adminIds = room.adminIds.filter((id) => id.toString() !== userId);
    await room.save();

    await User.findByIdAndUpdate(userId, {
      $pull: { joinedRooms: room._id },
    });

    res.json({ success: true, room });
  } catch (error) {
    console.log("removeMember error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Admin: Promote member to admin ─────────────────────
export const promoteMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = req.room;

    const isMember = room.memberIds.some((id) => id.toString() === userId);
    if (!isMember) {
      return res.json({ success: false, message: "User is not a member" });
    }

    const isAlreadyAdmin = room.adminIds.some((id) => id.toString() === userId);
    if (isAlreadyAdmin) {
      return res.json({ success: false, message: "User is already an admin" });
    }

    room.adminIds.push(userId);
    await room.save();

    res.json({ success: true, room });
  } catch (error) {
    console.log("promoteMember error:", error.message);
    res.json({ success: false, message: error.message });
  }
};

// ─── Admin: Update room ─────────────────────────────────
export const updateRoom = async (req, res) => {
  try {
    const { name, description, avatar } = req.body;
    const room = req.room;

    if (name) room.name = name.trim();
    if (description !== undefined) room.description = description;

    if (avatar) {
      const upload = await cloudinary.uploader.upload(avatar);
      room.avatar = upload.secure_url;
    }

    await room.save();
    res.json({ success: true, room });
  } catch (error) {
    console.log("updateRoom error:", error.message);
    res.json({ success: false, message: error.message });
  }
};
