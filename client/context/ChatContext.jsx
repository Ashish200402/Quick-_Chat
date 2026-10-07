import { createContext, useState, useEffect, useContext, useRef, useCallback } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  // ── DM State ──────────────────────────────────
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  // ── Room State ────────────────────────────────
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [roomMessages, setRoomMessages] = useState([]);
  const [roomUnseenCounts, setRoomUnseenCounts] = useState({});

  // ── Typing State ──────────────────────────────
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const { socket, axios } = useContext(AuthContext);

  // ══════════════════════════════════════════════
  // DM Functions
  // ══════════════════════════════════════════════

  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
        setUnseenMessages((prev) => ({ ...prev, [userId]: 0 }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async (messageData) => {
    try {
      if (!selectedUser) return;
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ══════════════════════════════════════════════
  // Room Functions
  // ══════════════════════════════════════════════

  const getRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms");
      if (data.success) {
        setRooms(data.rooms);
        setRoomUnseenCounts(data.unseenCounts || {});
      }
    } catch (error) {
      console.log("getRooms error:", error.message);
    }
  };

  const getPublicRooms = async () => {
    try {
      const { data } = await axios.get("/api/rooms/public");
      return data.success ? data.rooms : [];
    } catch (error) {
      toast.error(error.message);
      return [];
    }
  };

  const createRoom = async (roomData) => {
    try {
      const { data } = await axios.post("/api/rooms", roomData);
      if (data.success) {
        setRooms((prev) => [data.room, ...prev]);
        toast.success("Room created!");
        return data.room;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const joinRoom = async (roomId) => {
    try {
      const { data } = await axios.post(`/api/rooms/${roomId}/join`);
      if (data.success) {
        setRooms((prev) => {
          const exists = prev.some((r) => r._id === data.room._id);
          return exists ? prev : [data.room, ...prev];
        });
        if (socket) socket.emit("room:join", data.room._id);
        toast.success("Joined room!");
        return data.room;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const joinByInvite = async (inviteCode) => {
    try {
      const { data } = await axios.post(`/api/rooms/join/${inviteCode}`);
      if (data.success) {
        setRooms((prev) => {
          const exists = prev.some((r) => r._id === data.room._id);
          return exists ? prev : [data.room, ...prev];
        });
        if (socket) socket.emit("room:join", data.room._id);
        toast.success("Joined room!");
        return data.room;
      } else {
        toast.error(data.message);
        return null;
      }
    } catch (error) {
      toast.error(error.message);
      return null;
    }
  };

  const leaveRoom = async (roomId) => {
    try {
      const { data } = await axios.post(`/api/rooms/${roomId}/leave`);
      if (data.success) {
        setRooms((prev) => prev.filter((r) => r._id !== roomId));
        if (selectedRoom?._id === roomId) {
          setSelectedRoom(null);
          setRoomMessages([]);
        }
        if (socket) socket.emit("room:leave", roomId);
        toast.success("Left room");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoomMessages = async (roomId) => {
    try {
      const { data } = await axios.get(`/api/rooms/${roomId}/messages`);
      if (data.success) {
        setRoomMessages(data.messages);
        setRoomUnseenCounts((prev) => ({ ...prev, [roomId]: 0 }));
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendRoomMessage = async (roomId, messageData) => {
    try {
      const { data } = await axios.post(
        `/api/rooms/${roomId}/messages`,
        messageData
      );
      if (data.success) {
        // Message will arrive via socket — don't double add
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getRoomInfo = async (roomId) => {
    try {
      const { data } = await axios.get(`/api/rooms/${roomId}`);
      return data.success ? data.room : null;
    } catch (error) {
      console.log("getRoomInfo error:", error.message);
      return null;
    }
  };

  // ── Admin actions ─────────────────────────────
  const addRoomMember = async (roomId, userId) => {
    try {
      const { data } = await axios.post(`/api/rooms/${roomId}/members`, { userId });
      if (data.success) toast.success("Member added");
      else toast.error(data.message);
      return data.success;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const removeRoomMember = async (roomId, userId) => {
    try {
      const { data } = await axios.delete(`/api/rooms/${roomId}/members/${userId}`);
      if (data.success) toast.success("Member removed");
      else toast.error(data.message);
      return data.success;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  const promoteToAdmin = async (roomId, userId) => {
    try {
      const { data } = await axios.put(`/api/rooms/${roomId}/promote`, { userId });
      if (data.success) toast.success("Promoted to admin");
      else toast.error(data.message);
      return data.success;
    } catch (error) {
      toast.error(error.message);
      return false;
    }
  };

  // ══════════════════════════════════════════════
  // Typing Indicator (Debounced)
  // ══════════════════════════════════════════════

  const emitTypingStart = useCallback(() => {
    if (!socket) return;
    if (isTypingRef.current) return;

    isTypingRef.current = true;

    if (selectedRoom) {
      socket.emit("typing:start", { roomId: selectedRoom._id });
    } else if (selectedUser) {
      socket.emit("typing:start", { receiverId: selectedUser._id });
    }
  }, [socket, selectedRoom, selectedUser]);

  const emitTypingStop = useCallback(() => {
    if (!socket) return;
    isTypingRef.current = false;

    if (selectedRoom) {
      socket.emit("typing:stop", { roomId: selectedRoom._id });
    } else if (selectedUser) {
      socket.emit("typing:stop", { receiverId: selectedUser._id });
    }
  }, [socket, selectedRoom, selectedUser]);

  const handleTyping = useCallback(() => {
    emitTypingStart();

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto-stop after 800ms of no typing
    typingTimeoutRef.current = setTimeout(() => {
      emitTypingStop();
    }, 800);
  }, [emitTypingStart, emitTypingStop]);

  // ══════════════════════════════════════════════
  // Socket subscriptions
  // ══════════════════════════════════════════════

  const subscribeToMessages = () => {
    if (!socket) return;

    // DM messages
    socket.on("newMessage", (newMessage) => {
      if (selectedUser && selectedUser._id === newMessage.senderId) {
        newMessage.seen = true;
        newMessage.status = "read";
        setMessages((prev) => [...prev, newMessage]);

        // Tell server this message has been read
        axios.put(`/api/messages/mark/${newMessage._id}`);
        setUnseenMessages((prev) => ({ ...prev, [selectedUser._id]: 0 }));
      } else {
        setUnseenMessages((prev) => ({
          ...prev,
          [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1,
        }));

        // Send delivery acknowledgment
        socket.emit("message:delivered", {
          messageId: newMessage._id,
          senderId: newMessage.senderId,
        });
      }
    });

    // Room messages
    socket.on("newRoomMessage", (newMessage) => {
      if (selectedRoom && selectedRoom._id === newMessage.roomId) {
        setRoomMessages((prev) => {
          const exists = prev.some((m) => m._id === newMessage._id);
          return exists ? prev : [...prev, newMessage];
        });
      } else {
        setRoomUnseenCounts((prev) => ({
          ...prev,
          [newMessage.roomId]: (prev[newMessage.roomId] || 0) + 1,
        }));
      }
    });

    // Read receipt updates (DM)
    socket.on("message:read", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId ? { ...m, status: "read", readAt: new Date() } : m
        )
      );
    });

    socket.on("message:delivered", ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, status: "delivered", deliveredAt: new Date() }
            : m
        )
      );
    });

    socket.on("messages:read:batch", ({ messageIds }) => {
      setMessages((prev) =>
        prev.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, status: "read", readAt: new Date() }
            : m
        )
      );
    });
  };

  const unsubscribeFromMessages = () => {
    if (!socket) return;
    socket.off("newMessage");
    socket.off("newRoomMessage");
    socket.off("message:read");
    socket.off("message:delivered");
    socket.off("messages:read:batch");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser, selectedRoom]);

  // Clear room messages when switching rooms
  useEffect(() => {
    if (selectedRoom) {
      setSelectedUser(null);
      getRoomMessages(selectedRoom._id);
    }
  }, [selectedRoom]);

  // Clear room selection when switching to DM
  useEffect(() => {
    if (selectedUser) {
      setSelectedRoom(null);
      setRoomMessages([]);
    }
  }, [selectedUser]);

  const value = {
    // DM
    users,
    messages,
    selectedUser,
    unseenMessages,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setMessages,
    setUnseenMessages,
    // Rooms
    rooms,
    selectedRoom,
    roomMessages,
    roomUnseenCounts,
    setSelectedRoom,
    getRooms,
    getPublicRooms,
    createRoom,
    joinRoom,
    joinByInvite,
    leaveRoom,
    getRoomMessages,
    sendRoomMessage,
    getRoomInfo,
    addRoomMember,
    removeRoomMember,
    promoteToAdmin,
    setRoomMessages,
    // Typing
    handleTyping,
    emitTypingStop,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};
