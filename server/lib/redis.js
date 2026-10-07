import Redis from "ioredis";

let redis = null;

/**
 * Connect to Redis (Upstash or local).
 * Falls back to in-memory map if REDIS_URL is not set.
 */
export const connectRedis = () => {
  if (redis) return redis;

  const url = process.env.REDIS_URL;

  if (!url) {
    console.log("⚠️  REDIS_URL not set — using in-memory fallback for presence");
    // Lightweight in-memory fallback so the app works without Redis
    const store = new Map();
    redis = {
      set: async (k, v) => store.set(k, { v, exp: null }),
      get: async (k) => {
        const entry = store.get(k);
        if (!entry) return null;
        if (entry.exp && Date.now() > entry.exp) { store.delete(k); return null; }
        return entry.v;
      },
      setex: async (k, ttl, v) => store.set(k, { v, exp: Date.now() + ttl * 1000 }),
      del: async (k) => store.delete(k),
      pipeline: () => {
        const ops = [];
        const p = {
          get: (k) => { ops.push({ cmd: "get", k }); return p; },
          exec: async () => ops.map((op) => {
            const entry = store.get(op.k);
            if (!entry) return [null, null];
            if (entry.exp && Date.now() > entry.exp) { store.delete(op.k); return [null, null]; }
            return [null, entry.v];
          }),
        };
        return p;
      },
      _isMemory: true,
    };
    return redis;
  }

  try {
    redis = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      tls: url.startsWith("rediss://") ? {} : undefined,
    });

    redis.on("connect", () => console.log("✅ Redis connected"));
    redis.on("error", (err) => console.log("Redis error:", err.message));

    redis.connect().catch((err) => {
      console.log("Redis connect failed:", err.message, "— falling back to in-memory");
      redis = null;
      return connectRedis(); // retry with in-memory
    });

    return redis;
  } catch (err) {
    console.log("Redis init error:", err.message);
    redis = null;
    return connectRedis();
  }
};

// ─── Presence Helpers ────────────────────────────────────

export const setUserOnline = async (userId) => {
  const r = connectRedis();
  await r.set(`user:status:${userId}`, "online");
};

export const setUserOffline = async (userId, ttlSeconds = 60) => {
  const r = connectRedis();
  await r.setex(`user:status:${userId}`, ttlSeconds, "offline");
};

export const getUserStatus = async (userId) => {
  const r = connectRedis();
  const status = await r.get(`user:status:${userId}`);
  return status || "offline";
};

export const getBulkUserStatus = async (userIds) => {
  const r = connectRedis();
  if (!userIds.length) return {};

  const pipeline = r.pipeline();
  userIds.forEach((id) => pipeline.get(`user:status:${id}`));
  const results = await pipeline.exec();

  const statusMap = {};
  userIds.forEach((id, i) => {
    statusMap[id] = results[i]?.[1] || "offline";
  });
  return statusMap;
};

export default redis;
