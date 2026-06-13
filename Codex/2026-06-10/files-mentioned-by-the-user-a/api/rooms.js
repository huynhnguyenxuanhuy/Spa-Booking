const { Redis } = require("@upstash/redis");

const ROOM_TTL_SECONDS = 60 * 60 * 2;
const ROOM_PREFIX = "memory3d:room:";

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function normalizeCode(value) {
  return String(value || "").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

function roomKey(code) {
  return `${ROOM_PREFIX}${normalizeCode(code)}`;
}

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error("Missing Redis environment variables");
  }
  return new Redis({ url, token });
}

function parseRoom(value) {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return value;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  let redis;
  try {
    redis = getRedis();
  } catch (error) {
    send(res, 500, { error: error.message });
    return;
  }

  if (req.method === "GET") {
    const code = normalizeCode(req.query.code);
    if (!code) {
      send(res, 200, { room: null });
      return;
    }

    try {
      const room = parseRoom(await redis.get(roomKey(code)));
      send(res, 200, { room });
    } catch {
      send(res, 500, { error: "Could not load room" });
    }
    return;
  }

  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const action = body?.action;
  if (action === "delete") {
    const code = normalizeCode(body.code);
    if (code) {
      try {
        await redis.del(roomKey(code));
      } catch {
        send(res, 500, { error: "Could not delete room" });
        return;
      }
    }
    send(res, 200, { ok: true });
    return;
  }

  if (action === "save" && body?.room?.code) {
    const code = normalizeCode(body.room.code);
    const room = { ...body.room, code, updatedAt: Date.now() };

    try {
      await redis.set(roomKey(code), JSON.stringify(room), { ex: ROOM_TTL_SECONDS });
      send(res, 200, { ok: true, room });
    } catch {
      send(res, 500, { error: "Could not save room" });
    }
    return;
  }

  send(res, 400, { error: "Bad request" });
};
