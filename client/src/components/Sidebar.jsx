import React, { useEffect, useState, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { ChatContext } from "../../context/ChatContext";
import CreateRoomModal from "./CreateRoomModal";
import JoinRoomModal from "./JoinRoomModal";

const Sidebar = () => {
  const {
    getUsers, users, selectedUser, setSelectedUser,
    unseenMessages, setUnseenMessages,
    rooms, selectedRoom, setSelectedRoom,
    getRooms, roomUnseenCounts,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const [tab, setTab] = useState("chats");
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
    getRooms();
  }, [onlineUsers]);

  const filteredUsers = input
    ? users.filter((u) => u.fullName.toLowerCase().includes(input.toLowerCase()))
    : users;

  const filteredRooms = input
    ? rooms.filter((r) => r.name.toLowerCase().includes(input.toLowerCase()))
    : rooms;

  return (
    <>
      <div
        className={`h-full p-5 overflow-y-scroll border-r border-[var(--border-subtle)] ${
          selectedUser || selectedRoom ? "max-md:hidden" : ""
        }`}
        style={{ background: "var(--bg-raised)" }}
      >
        {/* Header */}
        <div className="pb-5">
          <div className="flex justify-between items-center">
            <img src={assets.logo} alt="logo" className="max-w-[130px] opacity-90" />

            <div className="relative py-2 group">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <img
                  src={assets.menu_icon}
                  alt="menu"
                  className="max-h-5 cursor-pointer invert opacity-35 hover:opacity-70 transition-opacity"
                />
              </motion.div>

              <div className="glass-panel absolute right-0 top-full text-gray-100 hidden group-hover:block z-20 w-40 p-4 flex flex-col gap-3">
                <p
                  onClick={() => navigate("/profile")}
                  className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors font-medium"
                >
                  Edit Profile
                </p>
                <hr className="premium-divider" />
                <p
                  onClick={() => logout()}
                  className="cursor-pointer text-sm text-[var(--text-secondary)] hover:text-red-400 transition-colors font-medium"
                >
                  Logout
                </p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-5 p-1.5 neu-sunken-sm">
            <button
              onClick={() => setTab("chats")}
              className={`flex-1 py-2.5 text-xs tracking-wider cursor-pointer transition-all ${
                tab === "chats" ? "tab-active" : "tab-inactive"
              }`}
            >
              CHATS
            </button>
            <button
              onClick={() => setTab("rooms")}
              className={`flex-1 py-2.5 text-xs tracking-wider cursor-pointer transition-all ${
                tab === "rooms" ? "tab-active" : "tab-inactive"
              }`}
            >
              ROOMS
            </button>
          </div>

          {/* Search */}
          <div className="neu-sunken-sm flex items-center gap-3 py-3 px-4 mt-4">
            <svg className="w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder={tab === "chats" ? "Search contacts..." : "Search rooms..."}
              className="bg-transparent text-[var(--text-primary)] text-sm border-none outline-none placeholder-[var(--text-muted)] flex-1 font-medium"
            />
          </div>

          {/* Room buttons */}
          {tab === "rooms" && (
            <div className="flex gap-2 mt-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowCreateRoom(true)}
                className="neu-btn flex-1 py-2.5 text-xs cursor-pointer"
              >
                + Create
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowJoinRoom(true)}
                className="neu-btn-ghost flex-1 py-2.5 text-xs cursor-pointer"
              >
                Join
              </motion.button>
            </div>
          )}
        </div>

        {/* List */}
        <div className="flex flex-col gap-1.5">
          <AnimatePresence>
            {tab === "chats"
              ? filteredUsers.map((user, index) => (
                  <motion.div
                    key={user._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    onClick={() => {
                      setSelectedUser(user);
                      setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                    }}
                    className={`relative flex items-center gap-3 p-3.5 pl-4 cursor-pointer user-item ${
                      selectedUser?._id === user._id && "user-item-active"
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={user?.profilePic || assets.avatar_icon}
                        alt=""
                        className="w-[42px] h-[42px] rounded-full object-cover"
                        style={{ boxShadow: "var(--neu-shadow-outer-sm)" }}
                      />
                      {onlineUsers.includes(user._id) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--accent-green)] rounded-full border-2 border-[var(--bg-raised)]"
                          style={{ boxShadow: "0 0 8px rgba(52,211,153,0.5)" }}
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                        {onlineUsers.includes(user._id)
                          ? "Online"
                          : user.lastSeen
                          ? `Last seen ${new Date(user.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                          : "Offline"}
                      </p>
                    </div>
                    {unseenMessages[user._id] > 0 && (
                      <span className="unseen-badge">{unseenMessages[user._id]}</span>
                    )}
                  </motion.div>
                ))
              : filteredRooms.map((room, index) => (
                  <motion.div
                    key={room._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03, duration: 0.3 }}
                    onClick={() => setSelectedRoom(room)}
                    className={`relative flex items-center gap-3 p-3.5 pl-4 cursor-pointer user-item ${
                      selectedRoom?._id === room._id && "user-item-active"
                    }`}
                  >
                    <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-sm font-bold room-avatar">
                      {room.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                        {room.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] truncate">
                        {room.type === "private" ? "🔒 " : ""}
                        {room.memberIds?.length || 0} members
                      </p>
                    </div>
                    {roomUnseenCounts[room._id] > 0 && (
                      <span className="unseen-badge">{roomUnseenCounts[room._id]}</span>
                    )}
                  </motion.div>
                ))}
          </AnimatePresence>
        </div>
      </div>

      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} />}
      {showJoinRoom && <JoinRoomModal onClose={() => setShowJoinRoom(false)} />}
    </>
  );
};

export default Sidebar;
