import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { ChatContext } from "../../context/ChatContext";

const JoinRoomModal = ({ onClose }) => {
  const { getPublicRooms, joinRoom, joinByInvite } = useContext(ChatContext);
  const [publicRooms, setPublicRooms] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [tab, setTab] = useState("browse");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPublicRooms().then((r) => setPublicRooms(r));
  }, []);

  const handleJoinPublic = async (roomId) => {
    setLoading(true);
    await joinRoom(roomId);
    setLoading(false);
    onClose();
  };

  const handleJoinByInvite = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setLoading(true);
    const room = await joinByInvite(inviteCode.trim());
    setLoading(false);
    if (room) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="modal-content neu-card p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Join Room</h2>
        <p className="text-sm text-[var(--text-muted)] mb-5">Browse or use an invite link</p>

        <div className="flex gap-2 mb-5 p-1.5 neu-sunken-sm">
          <button onClick={() => setTab("browse")}
            className={`flex-1 py-2 text-xs tracking-wider cursor-pointer transition-all ${tab === "browse" ? "tab-active" : "tab-inactive"}`}>
            Browse
          </button>
          <button onClick={() => setTab("invite")}
            className={`flex-1 py-2 text-xs tracking-wider cursor-pointer transition-all ${tab === "invite" ? "tab-active" : "tab-inactive"}`}>
            Invite Link
          </button>
        </div>

        {tab === "browse" ? (
          <div className="max-h-[300px] overflow-y-auto flex flex-col gap-2">
            {publicRooms.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-8">No public rooms yet</p>
            ) : (
              publicRooms.map((room) => (
                <div key={room._id} className="flex items-center justify-between p-3 user-item">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{room.name}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {room.memberIds?.length || 0} members{room.description ? ` · ${room.description}` : ""}
                    </p>
                  </div>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => handleJoinPublic(room._id)} disabled={loading}
                    className="neu-btn py-1.5 px-4 text-xs cursor-pointer">
                    Join
                  </motion.button>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleJoinByInvite} className="flex flex-col gap-4">
            <input type="text" placeholder="Paste invite code" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)}
              className="neu-input" required />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading || !inviteCode.trim()}
              className="neu-btn py-3 cursor-pointer disabled:opacity-50">
              {loading ? "Joining..." : "Join Room"}
            </motion.button>
          </form>
        )}

        <button onClick={onClose} className="neu-btn-ghost w-full py-2.5 mt-4 cursor-pointer">Cancel</button>
      </motion.div>
    </div>
  );
};

export default JoinRoomModal;
