import { createContext, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { getBackendUrl } from "../src/config.js";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  // Check authentication only when token exists
  const checkAuth = async () => {
    try {
      const { data } = await axios.get("/api/auth/check");
      if (data.success) {
        setAuthUser(data.user);
        connectSocket(data.user);
      }
    } catch (error) {
      console.log("Auth check failed:", error.message);
    }
  };

  // Login / Signup
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);
      if (data.success) {
        setAuthUser(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        connectSocket(data.userData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    setTypingUsers({});
    axios.defaults.headers.common["token"] = null;
    if (socket) socket.disconnect();
    toast.success("Logged out successfully");
  };

  // Update profile
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // Socket connect
  const connectSocket = (userData) => {
    if (!userData || socket?.connected) return;

    const newSocket = io(getBackendUrl(), {
      query: { userId: userData._id },
    });

    newSocket.connect();
    setSocket(newSocket);

    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });

    // ── Typing listeners ──────────────────────
    newSocket.on("typing:start", ({ userId, roomId, receiverId }) => {
      const key = roomId || receiverId || userId;
      setTypingUsers((prev) => ({ ...prev, [key]: userId }));
    });

    newSocket.on("typing:stop", ({ userId, roomId, receiverId }) => {
      const key = roomId || receiverId || userId;
      setTypingUsers((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    });
  };

  useEffect(() => {
    const apiUrl = getBackendUrl();
    axios.defaults.baseURL = apiUrl;
    console.info("[QuickChat] API URL:", apiUrl);
  }, []);

  useEffect(() => {
    if (!token) return;
    axios.defaults.headers.common["token"] = token;
    checkAuth();
  }, [token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    typingUsers,
    setTypingUsers,
    login,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
