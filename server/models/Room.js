import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
    type: {
      type: String,
      enum: ["public", "private"],
      default: "public",
    },
    inviteLink: {
      type: String,
      unique: true,
      sparse: true, // allows multiple nulls
    },
    avatar: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    adminIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    memberIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lastActivity: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for fetching user's rooms
roomSchema.index({ memberIds: 1 });

const Room = mongoose.model("Room", roomSchema);

export default Room;
