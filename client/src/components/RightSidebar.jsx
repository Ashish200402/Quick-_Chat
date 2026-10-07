import React, { useContext, useState, useEffect } from "react";
import { motion } from "framer-motion";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";

const RightSidebar = () => {
  const {
    selectedUser, messages, selectedRoom, roomMessages,
    leaveRoom, getRoomInfo, removeRoomMember, promoteToAdmin,
  } = useContext(ChatContext);

  const { logout, onlineUsers, authUser } = useContext(AuthContext);

  const [msgImages, setMsgImages] = useState([]);
  const [roomInfo, setRoomInfo] = useState(null);
  const [showMembers, setShowMembers] = useState(false);

  const isRoom = !!selectedRoom;

  useEffect(() => {
    const active = isRoom ? roomMessages : messages;
    setMsgImages(active.filter((m) => m.image).map((m) => m.image));
  }, [messages, roomMessages, isRoom]);

  useEffect(() => {
    if (isRoom) {
      getRoomInfo(selectedRoom._id).then((info) => setRoomInfo(info));
    } else {
      setRoomInfo(null);
      setShowMembers(false);
    }
  }, [selectedRoom]);

  if (!selectedUser && !selectedRoom) return null;

  const isAdmin = isRoom && roomInfo?.adminIds?.some(
    (a) => (a._id || a).toString() === authUser._id.toString()
  );

  const handleCopyInvite = () => {
    if (roomInfo?.inviteLink) {
      navigator.clipboard.writeText(roomInfo.inviteLink);
      toast.success("Invite link copied!");
    }
  };

  return (
    <div className="text-white w-full relative overflow-y-scroll max-md:hidden p-6" style={{ background: "var(--bg-raised)" }}>
      {/* Profile */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pt-8 flex flex-col items-center gap-4"
      >
        {isRoom ? (
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold room-avatar avatar-ring">
            {selectedRoom.name.charAt(0).toUpperCase()}
          </div>
        ) : (
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt=""
            className="w-20 h-20 rounded-full object-cover avatar-ring"
          />
        )}

        <div className="text-center">
          <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center justify-center gap-2">
            {isRoom ? selectedRoom.name : selectedUser.fullName}
            {!isRoom && onlineUsers.includes(selectedUser._id) && (
              <span className="online-dot" style={{ width: "8px", height: "8px" }}></span>
            )}
          </h1>
          <p className="text-[var(--text-muted)] text-xs mt-2 leading-relaxed px-2">
            {isRoom ? selectedRoom.description || "No description" : selectedUser.bio}
          </p>
          {isRoom && (
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {roomInfo?.memberIds?.length || selectedRoom.memberIds?.length || 0} members
              {selectedRoom.type === "private" ? " · 🔒" : " · 🌐"}
            </p>
          )}
          {!isRoom && !onlineUsers.includes(selectedUser._id) && selectedUser.lastSeen && (
            <p className="text-xs text-[var(--text-muted)] mt-1">
              Last seen {new Date(selectedUser.lastSeen).toLocaleString([], {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
      </motion.div>

      <hr className="premium-divider my-6" />

      {/* Invite Link */}
      {isRoom && roomInfo?.inviteLink && (
        <>
          <div className="mb-4">
            <p className="text-xs font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-2">Invite Link</p>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="flex items-center gap-2 neu-sunken-sm p-3 cursor-pointer"
              onClick={handleCopyInvite}
            >
              <p className="text-xs text-[var(--text-muted)] truncate flex-1 select-all">{roomInfo.inviteLink}</p>
              <span className="text-[var(--accent-blue)] text-xs font-semibold shrink-0">Copy</span>
            </motion.div>
          </div>
          <hr className="premium-divider my-4" />
        </>
      )}

      {/* Members */}
      {isRoom && roomInfo && (
        <>
          <div>
            <button onClick={() => setShowMembers(!showMembers)} className="flex items-center justify-between w-full cursor-pointer mb-3">
              <p className="text-xs font-bold text-[var(--text-secondary)] tracking-wider uppercase">
                Members ({roomInfo.memberIds?.length || 0})
              </p>
              <span className="text-[var(--text-muted)] text-xs">{showMembers ? "▲" : "▼"}</span>
            </button>
            {showMembers && (
              <div className="max-h-[200px] overflow-y-auto flex flex-col gap-1.5">
                {roomInfo.memberIds?.map((member) => {
                  const memberId = (member._id || member).toString();
                  const memberIsAdmin = roomInfo.adminIds?.some((a) => (a._id || a).toString() === memberId);
                  const isMe = memberId === authUser._id.toString();
                  return (
                    <div key={memberId} className="flex items-center gap-2 p-2 user-item">
                      <img src={member.profilePic || assets.avatar_icon} className="w-7 h-7 rounded-full object-cover" alt="" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">
                          {member.fullName || "User"}{isMe && " (You)"}
                        </p>
                        {memberIsAdmin && (
                          <span className="text-[0.6rem] text-[var(--accent-cyan)] font-bold">ADMIN</span>
                        )}
                      </div>
                      {isAdmin && !isMe && (
                        <div className="flex gap-1.5">
                          {!memberIsAdmin && (
                            <button
                              onClick={() => promoteToAdmin(selectedRoom._id, memberId)}
                              className="text-[0.6rem] text-[var(--accent-blue)] hover:underline cursor-pointer"
                              title="Promote"
                            >⬆</button>
                          )}
                          <button
                            onClick={() => removeRoomMember(selectedRoom._id, memberId)}
                            className="text-[0.6rem] text-red-400 hover:underline cursor-pointer"
                            title="Remove"
                          >✕</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <hr className="premium-divider my-4" />
        </>
      )}

      {/* Media */}
      <div>
        <p className="text-xs font-bold text-[var(--text-secondary)] tracking-wider uppercase mb-3">Shared Media</p>
        <div className="max-h-[200px] overflow-y-auto grid grid-cols-3 gap-2">
          {msgImages.map((url, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.04 }}
              onClick={() => window.open(url, "_blank")}
              className="cursor-pointer overflow-hidden"
              style={{
                borderRadius: "var(--radius-md)",
                boxShadow: "var(--neu-shadow-outer-sm)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <img src={url} alt="" className="w-full h-24 object-cover" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Action */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={isRoom ? () => leaveRoom(selectedRoom._id) : logout}
        className={`neu-btn-ghost w-full mt-6 py-2.5 text-sm cursor-pointer ${
          isRoom ? "border-red-400/30 text-red-400 hover:bg-red-400/08 hover:border-red-400" : ""
        }`}
      >
        {isRoom ? "Leave Room" : "Logout"}
      </motion.button>
    </div>
  );
};

export default RightSidebar;
