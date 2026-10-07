import React, { useState, useContext } from "react";
import { motion } from "framer-motion";
import { ChatContext } from "../../context/ChatContext";

const CreateRoomModal = ({ onClose }) => {
  const { createRoom } = useContext(ChatContext);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("public");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const room = await createRoom({ name, description, type });
    setLoading(false);
    if (room) onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ duration: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
        className="modal-content neu-card p-8 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create Room</h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">Start a new group conversation</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Room name" value={name} onChange={(e) => setName(e.target.value)}
            className="neu-input" required maxLength={50} />
          <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)}
            className="neu-input resize-none" rows={3} maxLength={200} />

          <div className="flex gap-3">
            <button type="button" onClick={() => setType("public")}
              className={`flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-all rounded-xl ${type === "public" ? "neu-btn" : "neu-btn-ghost"}`}>
              🌐 Public
            </button>
            <button type="button" onClick={() => setType("private")}
              className={`flex-1 py-2.5 text-sm font-semibold cursor-pointer transition-all rounded-xl ${type === "private" ? "neu-btn" : "neu-btn-ghost"}`}>
              🔒 Private
            </button>
          </div>

          <div className="flex gap-3 mt-2">
            <button type="button" onClick={onClose} className="neu-btn-ghost flex-1 py-3 cursor-pointer rounded-xl">Cancel</button>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              type="submit" disabled={loading || !name.trim()}
              className="neu-btn flex-1 py-3 cursor-pointer disabled:opacity-50 rounded-xl">
              {loading ? "Creating..." : "Create"}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateRoomModal;
