import React, { useContext, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import TypingIndicator from "./TypingIndicator";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages, selectedUser, setSelectedUser, sendMessage, getMessages,
    selectedRoom, setSelectedRoom, roomMessages, sendRoomMessage,
    handleTyping, emitTypingStop,
  } = useContext(ChatContext);

  const { authUser, onlineUsers, typingUsers } = useContext(AuthContext);

  const scrollEnd = useRef(null);
  const [input, setInput] = useState("");

  const isRoom = !!selectedRoom;
  const activeMessages = isRoom ? roomMessages : messages;

  // Typing detection
  const isTyping = isRoom
    ? typingUsers[selectedRoom?._id]
    : typingUsers[selectedUser?._id];

  const typingUserName = (() => {
    if (!isTyping) return null;
    if (isRoom) {
      const msg = roomMessages.find((m) => (m.senderId?._id || m.senderId) === isTyping);
      return msg?.senderId?.fullName || "Someone";
    }
    return selectedUser?.fullName;
  })();

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    if (isRoom) await sendRoomMessage(selectedRoom._id, { text: input.trim() });
    else await sendMessage({ text: input.trim() });
    setInput("");
    emitTypingStop();
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Select a valid image file!");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      if (isRoom) await sendRoomMessage(selectedRoom._id, { image: reader.result });
      else await sendMessage({ image: reader.result });
      e.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    handleTyping();
  };

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current) scrollEnd.current.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages, isTyping]);

  const StatusIcon = ({ status }) => {
    if (status === "read") return <span className="status-read" title="Read">✓✓</span>;
    if (status === "delivered") return <span className="status-delivered" title="Delivered">✓✓</span>;
    return <span className="status-sent" title="Sent">✓</span>;
  };

  const handleBack = () => {
    if (isRoom) setSelectedRoom(null);
    else setSelectedUser(null);
  };

  // No selection
  if (!selectedUser && !selectedRoom) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 border-r border-[var(--border-void)]" style={{ background: "var(--bg-void)" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center neu-sunken">
            <img src={assets.logo_icon} className="w-10 opacity-50" alt="" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-[var(--text-primary)]">Chat anytime, anywhere</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">Select a conversation or room</p>
          </div>
        </motion.div>
      </div>
    );
  }

  const headerName = isRoom ? selectedRoom.name : selectedUser.fullName;
  const headerAvatar = isRoom ? null : selectedUser.profilePic;
  const headerOnline = isRoom ? null : onlineUsers.includes(selectedUser._id);

  return (
    <div className="h-full overflow-hidden relative flex flex-col border-r border-[var(--border-void)]" style={{ background: "var(--bg-void)" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 py-4 px-5 border-b border-[var(--border-void)]"
        style={{ background: "var(--bg-base)" }}
      >
        {isRoom ? (
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold room-avatar shrink-0">
            {selectedRoom.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <div className="relative">
            <img
              src={headerAvatar || assets.avatar_icon}
              className="w-10 h-10 rounded-full object-cover"
              style={{ boxShadow: "var(--shadow-3d-sm)" }}
              alt=""
            />
            {headerOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--neon-green)] rounded-full border-2 border-[var(--bg-base)]"
                style={{ boxShadow: "0 0 12px rgba(34,211,167,0.6)" }}
              />
            )}
          </div>
        )}

        <div className="flex-1">
          <p className="text-sm font-semibold text-[var(--text-primary)]">{headerName}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {isRoom
              ? `${selectedRoom.memberIds?.length || 0} members${selectedRoom.type === "private" ? " · 🔒" : ""}`
              : headerOnline
              ? "Online"
              : selectedUser.lastSeen
              ? `Last seen ${new Date(selectedUser.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "Offline"}
          </p>
        </div>

        <motion.img
          whileTap={{ scale: 0.8 }}
          onClick={handleBack}
          src={assets.arrow_icon}
          className="md:hidden max-w-7 cursor-pointer invert opacity-30"
          alt=""
        />
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-scroll p-5 pb-6">
        <AnimatePresence>
          {activeMessages.map((msg, index) => {
            const senderId = msg.senderId?._id || msg.senderId;
            const isSent = senderId === authUser._id;
            return (
              <motion.div
                key={msg._id || index}
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className={`flex items-end gap-2.5 mb-5 ${isSent ? "justify-end" : "flex-row-reverse"}`}
              >
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt=""
                    className="max-w-[230px] rounded-2xl"
                    style={{ boxShadow: "var(--shadow-3d-sm)", border: "1px solid var(--border-void)" }}
                  />
                ) : (
                  <div className={`py-3 px-4 max-w-[280px] text-sm font-normal break-all ${isSent ? "msg-sent" : "msg-received"}`}>
                    {isRoom && !isSent && msg.senderId?.fullName && (
                      <span className="block text-[0.7rem] text-[var(--neon-cyan)] font-semibold mb-1">
                        {msg.senderId.fullName}
                      </span>
                    )}
                    {msg.text}
                  </div>
                )}

                <div className="text-center text-xs flex flex-col items-center gap-1">
                  <img
                    src={
                      isSent
                        ? authUser?.profilePic || assets.avatar_icon
                        : isRoom
                        ? msg.senderId?.profilePic || assets.avatar_icon
                        : selectedUser?.profilePic || assets.avatar_icon
                    }
                    className="w-6 h-6 rounded-full object-cover"
                    style={{ boxShadow: "var(--shadow-3d-sm)" }}
                    alt=""
                  />
                  <div className="flex items-center gap-1">
                    <p className="text-[var(--text-muted)] text-[0.6rem] font-medium">
                      {formatMessageTime(msg.createdAt)}
                    </p>
                    {isSent && !isRoom && (
                      <StatusIcon status={msg.status || (msg.seen ? "read" : "sent")} />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {isTyping && <TypingIndicator userName={typingUserName} />}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 p-4" style={{ background: "var(--bg-base)" }}>
        <div className="flex-1 flex items-center neu-sunken-sm px-4 gap-2">
          {/* Emoji placeholder */}
          <button className="text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors cursor-pointer text-lg">
            😊
          </button>

          <input
            onChange={handleInputChange}
            value={input}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(e)}
            type="text"
            placeholder="Type a message..."
            className="bg-transparent py-3 flex-1 outline-none text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm font-medium"
          />

          <input onChange={handleSendImage} type="file" id="image" accept="image/*" hidden />
          <label htmlFor="image" className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </label>

          {/* Mic button */}
          <button className="text-[var(--text-muted)] hover:text-[var(--neon-cyan)] transition-colors cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={handleSendMessage}
          className="send-btn w-12 h-12 flex items-center justify-center cursor-pointer rounded-full"
        >
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
};

export default ChatContainer;
