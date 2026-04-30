import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicDir = join(__dirname, "public");
const rooms = new Map();
let sequence = 1;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function makeRoomId() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
}

function getRoom(roomId) {
  const cleanRoomId = String(roomId || "").trim().toUpperCase();
  if (!rooms.has(cleanRoomId)) {
    rooms.set(cleanRoomId, {
      id: cleanRoomId,
      createdAt: Date.now(),
      hostId: "",
      locked: false,
      peers: new Map(),
      pending: new Map(),
      events: []
    });
  }
  return rooms.get(cleanRoomId);
}

function publish(room, event) {
  const entry = {
    id: sequence++,
    at: Date.now(),
    ...event
  };
  room.events.push(entry);
  if (room.events.length > 800) room.events.splice(0, room.events.length - 800);
  return entry;
}

function json(response, status, payload) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

function notFound(response) {
  json(response, 404, { error: "Not found" });
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1_000_000) throw new Error("Body too large");
  }
  return body ? JSON.parse(body) : {};
}

function sanitizePeer(peer) {
  return {
    id: peer.id,
    name: peer.name || "Khach moi",
    avatar: peer.avatar || "",
    joinedAt: peer.joinedAt,
    lastSeen: peer.lastSeen
  };
}

function sanitizeRoom(room) {
  return {
    hostId: room.hostId,
    locked: room.locked
  };
}

function sanitizeAvatar(value) {
  const avatar = String(value || "");
  if (!avatar.startsWith("data:image/") || avatar.length > 180_000) return "";
  return avatar;
}

function getIceServers() {
  const servers = [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" }
  ];

  if (process.env.TURN_URL) {
    servers.push({
      urls: process.env.TURN_URL,
      username: process.env.TURN_USERNAME || "",
      credential: process.env.TURN_CREDENTIAL || ""
    });
  }

  return servers;
}

function touchPeer(room, peerId, name, avatar) {
  const existing = room.peers.get(peerId);
  const peer = {
    id: peerId,
    name: String(name || existing?.name || "Khach moi").slice(0, 48),
    avatar: sanitizeAvatar(avatar) || existing?.avatar || "",
    joinedAt: existing?.joinedAt || Date.now(),
    lastSeen: Date.now()
  };
  room.peers.set(peerId, peer);
  if (!room.hostId) room.hostId = peerId;
  return peer;
}

function touchPending(room, peerId, name, avatar) {
  const existing = room.pending.get(peerId);
  const peer = {
    id: peerId,
    name: String(name || existing?.name || "Khach moi").slice(0, 48),
    avatar: sanitizeAvatar(avatar) || existing?.avatar || "",
    joinedAt: existing?.joinedAt || Date.now(),
    lastSeen: Date.now()
  };
  room.pending.set(peerId, peer);
  return peer;
}

function assignNextHost(room) {
  if (room.hostId && room.peers.has(room.hostId)) return;
  room.hostId = room.peers.keys().next().value || "";
  publish(room, { type: "host-changed", from: "system", hostId: room.hostId, room: sanitizeRoom(room) });
}

function requireHost(room, peerId, response) {
  if (!peerId || room.hostId !== peerId || !room.peers.has(peerId)) {
    json(response, 403, { error: "Only host can do this" });
    return false;
  }
  return true;
}

function cleanStalePeers() {
  const cutoff = Date.now() - 45_000;
  for (const room of rooms.values()) {
    for (const peer of room.peers.values()) {
      if (peer.lastSeen < cutoff) {
        room.peers.delete(peer.id);
        publish(room, { type: "peer-left", from: peer.id, peer: sanitizePeer(peer) });
        assignNextHost(room);
      }
    }
    for (const peer of room.pending.values()) {
      if (peer.lastSeen < cutoff) room.pending.delete(peer.id);
    }
    if (!room.peers.size && Date.now() - room.createdAt > 2 * 60 * 60 * 1000) {
      rooms.delete(room.id);
    }
  }
}

setInterval(cleanStalePeers, 15_000).unref();

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  let pathname = decodeURIComponent(requestUrl.pathname);
  if (pathname === "/" || pathname.startsWith("/r/")) pathname = "/index.html";

  const normalizedPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicDir, normalizedPath);
  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  const ext = extname(filePath);
  const content = await readFile(filePath);
  response.writeHead(200, {
    "content-type": MIME_TYPES[ext] || "application/octet-stream",
    "cache-control": "no-store"
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  try {
    const requestUrl = new URL(request.url, `http://${request.headers.host}`);
    const parts = requestUrl.pathname.split("/").filter(Boolean);

    if (parts[0] !== "api") {
      await serveStatic(request, response);
      return;
    }

    if (request.method === "GET" && parts[1] === "health") {
      json(response, 200, { ok: true, name: "HuyDebug" });
      return;
    }

    if (request.method === "POST" && parts[1] === "rooms" && parts.length === 2) {
      let roomId = makeRoomId();
      while (rooms.has(roomId)) roomId = makeRoomId();
      getRoom(roomId);
      json(response, 201, { roomId });
      return;
    }

    if (request.method === "GET" && parts[1] === "config") {
      json(response, 200, { iceServers: getIceServers() });
      return;
    }

    if (parts[1] !== "rooms" || !parts[2]) {
      notFound(response);
      return;
    }

    const room = getRoom(parts[2]);
    const action = parts[3];

    if (request.method === "POST" && action === "join") {
      const body = await readJson(request);
      const peerId = String(body.peerId || "").trim();
      if (!peerId) {
        json(response, 400, { error: "peerId is required" });
        return;
      }
      const wasKnown = room.peers.has(peerId);
      const isFirstPeer = !room.peers.size;
      if (room.locked && !wasKnown && !isFirstPeer) {
        const pendingPeer = touchPending(room, peerId, body.name, body.avatar);
        publish(room, { type: "join-request", from: peerId, to: room.hostId, peer: sanitizePeer(pendingPeer) });
        json(response, 202, {
          roomId: room.id,
          pending: true,
          self: sanitizePeer(pendingPeer),
          room: sanitizeRoom(room),
          peers: []
        });
        return;
      }
      const peer = touchPeer(room, peerId, body.name, body.avatar);
      room.pending.delete(peerId);
      if (!wasKnown) publish(room, { type: "peer-joined", from: peerId, peer: sanitizePeer(peer) });
      if (wasKnown) publish(room, { type: "peer-updated", from: peerId, peer: sanitizePeer(peer) });
      json(response, 200, {
        roomId: room.id,
        pending: false,
        room: sanitizeRoom(room),
        self: sanitizePeer(peer),
        peers: [...room.peers.values()].filter((item) => item.id !== peerId).map(sanitizePeer)
      });
      return;
    }

    if (request.method === "POST" && action === "leave") {
      const body = await readJson(request);
      const peerId = String(body.peerId || "").trim();
      const peer = room.peers.get(peerId);
      if (peer) {
        room.peers.delete(peerId);
        publish(room, { type: "peer-left", from: peerId, peer: sanitizePeer(peer) });
        assignNextHost(room);
      }
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && action === "heartbeat") {
      const body = await readJson(request);
      const peerId = String(body.peerId || "").trim();
      if (peerId && room.peers.has(peerId)) touchPeer(room, peerId, body.name, body.avatar);
      if (peerId && room.pending.has(peerId)) room.pending.get(peerId).lastSeen = Date.now();
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "POST" && action === "control") {
      const body = await readJson(request);
      const from = String(body.from || "").trim();
      const target = String(body.target || "").trim();
      const control = String(body.action || "").trim();
      if (!requireHost(room, from, response)) return;

      if (control === "lock" || control === "unlock") {
        room.locked = control === "lock";
        publish(room, { type: "room-updated", from, room: sanitizeRoom(room) });
        json(response, 200, { ok: true, room: sanitizeRoom(room) });
        return;
      }

      if (control === "approve") {
        const pendingPeer = room.pending.get(target);
        if (!pendingPeer) {
          json(response, 404, { error: "Pending peer not found" });
          return;
        }
        room.pending.delete(target);
        const peer = touchPeer(room, target, pendingPeer.name, pendingPeer.avatar);
        publish(room, {
          type: "join-approved",
          from,
          to: target,
          peer: sanitizePeer(peer),
          room: sanitizeRoom(room),
          peers: [...room.peers.values()].filter((item) => item.id !== target).map(sanitizePeer)
        });
        publish(room, { type: "peer-joined", from: target, peer: sanitizePeer(peer) });
        json(response, 200, { ok: true, peer: sanitizePeer(peer) });
        return;
      }

      if (control === "deny") {
        const pendingPeer = room.pending.get(target);
        if (pendingPeer) room.pending.delete(target);
        publish(room, { type: "join-denied", from, to: target });
        json(response, 200, { ok: true });
        return;
      }

      if (control === "kick") {
        if (target === room.hostId) {
          json(response, 400, { error: "Host cannot kick self" });
          return;
        }
        const peer = room.peers.get(target);
        if (!peer) {
          json(response, 404, { error: "Peer not found" });
          return;
        }
        room.peers.delete(target);
        publish(room, { type: "host-control", from, to: target, action: "kick" });
        publish(room, { type: "peer-left", from: target, peer: sanitizePeer(peer) });
        json(response, 200, { ok: true });
        return;
      }

      if (control === "mute-audio" || control === "mute-video") {
        if (!room.peers.has(target)) {
          json(response, 404, { error: "Peer not found" });
          return;
        }
        publish(room, { type: "host-control", from, to: target, action: control });
        json(response, 200, { ok: true });
        return;
      }

      json(response, 400, { error: "Unknown control action" });
      return;
    }

    if (request.method === "POST" && action === "chat") {
      const body = await readJson(request);
      const from = String(body.from || "").trim();
      const text = String(body.text || "").trim().slice(0, 900);
      const peer = room.peers.get(from);
      if (!from || !peer || !text) {
        json(response, 400, { error: "from and text are required" });
        return;
      }
      peer.lastSeen = Date.now();
      const message = {
        id: crypto.randomUUID(),
        text,
        sender: sanitizePeer(peer)
      };
      publish(room, { type: "chat", from, message });
      json(response, 200, { message });
      return;
    }

    if (request.method === "POST" && action === "signal") {
      const body = await readJson(request);
      const from = String(body.from || "").trim();
      const to = String(body.to || "").trim();
      if (!from || !to || !body.signal?.type) {
        json(response, 400, { error: "from, to and signal.type are required" });
        return;
      }
      if (room.peers.has(from)) room.peers.get(from).lastSeen = Date.now();
      publish(room, { type: "signal", from, to, signal: body.signal });
      json(response, 200, { ok: true });
      return;
    }

    if (request.method === "GET" && action === "events") {
      const peerId = String(requestUrl.searchParams.get("peerId") || "").trim();
      const after = Number(requestUrl.searchParams.get("after") || 0);
      if (peerId && room.peers.has(peerId)) room.peers.get(peerId).lastSeen = Date.now();
      if (peerId && room.pending.has(peerId)) room.pending.get(peerId).lastSeen = Date.now();
      const events = room.events.filter((event) => {
        if (event.id <= after || event.from === peerId) return false;
        return !event.to || event.to === peerId;
      });
      json(response, 200, { events, lastEventId: events.at(-1)?.id || after });
      return;
    }

    notFound(response);
  } catch (error) {
    console.error(error);
    json(response, 500, { error: "Server error" });
  }
});

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`HuyDebug is running at http://localhost:${port}`);
});
