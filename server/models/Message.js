import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    // Legacy field — kept for backward compat
    seen: {
      type: Boolean,
      default: false,
    },
    // New status lifecycle: sent → delivered → read
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    // For room messages: track who has read it
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Index for fast DM lookups
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: 1 });
// Index for room message lookups
messageSchema.index({ roomId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
