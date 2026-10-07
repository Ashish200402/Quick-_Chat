import React, { useContext, useState } from "react";
import { motion } from "framer-motion";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContext";

/* ── Floating particles data ────────────────── */
const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size: Math.random() * 4 + 2,
  x: Math.random() * 100,
  y: Math.random() * 100,
  duration: Math.random() * 4 + 4,
  delay: Math.random() * 3,
  opacity: Math.random() * 0.5 + 0.15,
}));

const LoginPage = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = (e) => {
    e.preventDefault();
    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }
    const data =
      currState === "Sign up"
        ? { fullName, email, password, bio }
        : { email, password };
    login(currState === "Sign up" ? "signup" : "login", data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center gap-10 sm:justify-evenly max-sm:flex-col relative z-10 px-4">
      {/* Left — Animated Hero Orb */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
        className="hero-orb-container"
      >
        {/* Floating particles */}
        <div className="hero-particles">
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="hero-particle"
              style={{
                width: p.size,
                height: p.size,
                left: `${p.x}%`,
                top: `${p.y}%`,
                opacity: p.opacity,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.sin(p.id) * 15, 0],
                opacity: [p.opacity, p.opacity + 0.3, p.opacity],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Orbital rings */}
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <div className="hero-ring hero-ring-3" />

        {/* Central glowing orb */}
        <motion.div
          className="hero-orb"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Chat bubble icon inside orb */}
          <motion.svg
            viewBox="0 0 64 64"
            className="hero-chat-icon"
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <defs>
              <linearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#a5c4ff" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            <path
              d="M32 8C18.745 8 8 17.297 8 28.8c0 6.482 3.632 12.266 9.33 16.12L14 52l10.02-5.01C26.546 47.66 29.21 48 32 48c13.255 0 24-9.297 24-20.8S45.255 8 32 8z"
              fill="url(#chatGrad)"
            />
            <circle cx="22" cy="28" r="2.5" fill="var(--bg-deep)" opacity="0.7" />
            <circle cx="32" cy="28" r="2.5" fill="var(--bg-deep)" opacity="0.7" />
            <circle cx="42" cy="28" r="2.5" fill="var(--bg-deep)" opacity="0.7" />
          </motion.svg>
        </motion.div>

        {/* Brand text */}
        <motion.div
          className="hero-brand"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <h1 className="hero-title">QuickChat</h1>
          <p className="hero-tagline">Connect. Converse. Create.</p>
        </motion.div>
      </motion.div>

      {/* Right — Form */}
      <motion.form
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
        onSubmit={onSubmitHandler}
        className="neu-card p-9 flex flex-col gap-5 w-full max-w-sm"
      >
        <div>
          <h2 className="font-bold text-2xl text-[var(--text-primary)] tracking-tight flex items-center gap-3">
            {currState}
            {isDataSubmitted && currState === "Sign up" && (
              <motion.img
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsDataSubmitted(false)}
                src={assets.arrow_icon}
                alt="Go back"
                className="w-5 cursor-pointer invert opacity-40 hover:opacity-100 transition-opacity"
              />
            )}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {currState === "Sign up"
              ? "Create your QuickChat account"
              : "Welcome back to QuickChat"}
          </p>
        </div>

        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className="neu-input"
            placeholder="Full Name"
            required
          />
        )}

        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          type="email"
          className="neu-input"
          placeholder="Email Address"
          required
        />
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          type="password"
          className="neu-input"
          placeholder="Password"
          required
        />

        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className="neu-input resize-none"
            placeholder="Provide a short bio about yourself"
          ></textarea>
        )}

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          type="submit"
          className="neu-btn py-3.5 cursor-pointer text-center w-full"
        >
          {currState === "Sign up"
            ? isDataSubmitted
              ? "Complete Sign Up"
              : "Continue"
            : "Sign In"}
        </motion.button>

        <div className="flex items-center gap-2.5 text-sm text-[var(--text-muted)]">
          <input
            type="checkbox"
            required
            className="w-4 h-4 accent-[var(--accent-blue)] rounded"
          />
          <p>Agree to the terms of use & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2">
          {currState === "Sign up" ? (
            <p className="text-sm text-[var(--text-secondary)]">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrState("Login");
                  setIsDataSubmitted(false);
                }}
                className="text-[var(--accent-blue)] cursor-pointer hover:underline font-semibold transition-colors"
              >
                Sign in
              </span>
            </p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              New to QuickChat?{" "}
              <span
                onClick={() => {
                  setCurrState("Sign up");
                  setIsDataSubmitted(false);
                }}
                className="text-[var(--accent-blue)] cursor-pointer hover:underline font-semibold transition-colors"
              >
                Create account
              </span>
            </p>
          )}
        </div>
      </motion.form>
    </div>
  );
};

export default LoginPage;
