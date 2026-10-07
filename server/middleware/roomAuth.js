import Room from "../models/Room.js";

/**
 * Middleware: verify the current user is a member of the room.
 * Expects `req.params.id` to be the room ID.
 */
export const isRoomMember = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const userId = req.user._id.toString();
    const isMember = room.memberIds.some((id) => id.toString() === userId);

    if (!isMember) {
      return res.status(403).json({ success: false, message: "You are not a member of this room" });
    }

    req.room = room;
    next();
  } catch (error) {
    console.log("isRoomMember error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Middleware: verify the current user is an admin of the room.
 * Expects `req.params.id` to be the room ID.
 */
export const isRoomAdmin = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const userId = req.user._id.toString();
    const isAdmin = room.adminIds.some((id) => id.toString() === userId);

    if (!isAdmin) {
      return res.status(403).json({ success: false, message: "Admin access required" });
    }

    req.room = room;
    next();
  } catch (error) {
    console.log("isRoomAdmin error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
