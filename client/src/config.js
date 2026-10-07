const PRODUCTION_API = "https://chat-app-5suh.onrender.com";

/** Picks API URL at runtime so production never calls localhost. */
export function getBackendUrl() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return PRODUCTION_API;
    }
  }
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
}
