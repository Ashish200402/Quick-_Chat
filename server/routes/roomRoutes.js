import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { isRoomMember, isRoomAdmin } from "../middleware/roomAuth.js";
import {
  createRoom,
  getRooms,
  getPublicRooms,
  getRoomById,
  getRoomMessages,
  sendRoomMessage,
  joinRoom,
  joinByInvite,
  leaveRoom,
  addMember,
  removeMember,
  promoteMember,
  updateRoom,
} from "../controllers/roomController.js";

const roomRouter = express.Router();

// All routes require authentication
roomRouter.use(protectRoute);

// Room CRUD
roomRouter.post("/", createRoom);
roomRouter.get("/", getRooms);
roomRouter.get("/public", getPublicRooms);
roomRouter.get("/:id", isRoomMember, getRoomById);

// Messages
roomRouter.get("/:id/messages", isRoomMember, getRoomMessages);
roomRouter.post("/:id/messages", isRoomMember, sendRoomMessage);

// Joining / Leaving
roomRouter.post("/join/:invite", joinByInvite);
roomRouter.post("/:id/join", joinRoom);
roomRouter.post("/:id/leave", isRoomMember, leaveRoom);

// Admin actions
roomRouter.post("/:id/members", isRoomAdmin, addMember);
roomRouter.delete("/:id/members/:userId", isRoomAdmin, removeMember);
roomRouter.put("/:id/promote", isRoomAdmin, promoteMember);
roomRouter.put("/:id", isRoomAdmin, updateRoom);

export default roomRouter;
