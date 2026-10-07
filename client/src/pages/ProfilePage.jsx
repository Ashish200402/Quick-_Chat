import React, { useContext, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser.fullName);
  const [bio, setBio] = useState(authUser.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedImg) {
      await updateProfile({ fullName: name, bio });
      navigate('/');
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(selectedImg);
    reader.onload = async () => {
      await updateProfile({ profilePic: reader.result, fullName: name, bio });
      navigate('/');
    };
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        className="w-full max-w-2xl neu-card p-10 flex flex-col items-center gap-8"
      >
        <img
          className="w-32 h-32 rounded-full object-cover avatar-ring"
          src={selectedImg ? URL.createObjectURL(selectedImg) : authUser?.profilePic || assets.logo_icon}
          alt="profile"
        />

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <h3 className="text-2xl font-bold text-center text-[var(--text-primary)] tracking-tight">
            Profile Details
          </h3>

          <label htmlFor="avatar" className="flex items-center gap-4 cursor-pointer group p-3 rounded-xl hover:bg-[rgba(91,141,239,0.04)] transition-colors">
            <input type="file" id="avatar" accept=".png,.jpg,.jpeg" hidden onChange={(e) => setSelectedImg(e.target.files[0])} />
            <img
              src={selectedImg ? URL.createObjectURL(selectedImg) : assets.avatar_icon}
              alt=""
              className={`w-12 h-12 object-cover opacity-50 group-hover:opacity-100 transition-opacity ${selectedImg && "rounded-full avatar-ring"}`}
            />
            <span className="text-[var(--text-secondary)] group-hover:text-[var(--accent-blue)] transition-colors font-medium">
              Upload Profile Image
            </span>
          </label>

          <input onChange={(e) => setName(e.target.value)} value={name} type="text" required placeholder="Your name" className="neu-input" />
          <textarea onChange={(e) => setBio(e.target.value)} value={bio} rows={4} placeholder="Write profile bio" className="neu-input resize-none" required />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="neu-btn py-3.5 cursor-pointer text-center"
          >
            Save Profile
          </motion.button>
        </form>

        <img
          className="max-w-44 aspect-square rounded-full avatar-ring max-sm:mt-6"
          src={authUser?.profilePic || assets.logo_icon}
          alt=""
        />
      </motion.div>
    </div>
  );
};

export default ProfilePage;
