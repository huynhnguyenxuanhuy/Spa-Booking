const app = document.querySelector("#app");
const template = document.querySelector("#videoTileTemplate");

const state = {
  roomId: getRoomFromPath(),
  name: localStorage.getItem("huydebug:name") || "",
  avatar: localStorage.getItem("huydebug:avatar") || "",
  peerId: localStorage.getItem("huydebug:peerId") || crypto.randomUUID(),
  localStream: null,
  screenStream: null,
  lastEventId: 0,
  peers: new Map(),
  peerConnections: new Map(),
  pendingIce: new Map(),
  chatMessages: [],
  pendingRequests: new Map(),
  isHost: false,
  hostId: "",
  roomLocked: false,
  admissionPending: false,
  polling: false,
  cameraEnabled: true,
  micEnabled: true,
  sharingScreen: false
};

localStorage.setItem("huydebug:peerId", state.peerId);

let iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" }
];

function getRoomFromPath() {
  const match = window.location.pathname.match(/^\/r\/([A-Za-z0-9-]+)/);
  return match?.[1]?.toUpperCase() || "";
}

function initials(name) {
  return (name || "HD")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function icon(path) {
  return `<svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

const icons = {
  camera: icon('<path d="m23 7-7 5 7 5V7Z"/><rect x="1" y="5" width="15" height="14" rx="2"/>'),
  cameraOff: icon('<path d="m2 2 20 20"/><path d="M10.66 5H14a2 2 0 0 1 2 2v3.34l1 .71 6-4.05v10"/><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"/>'),
  mic: icon('<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/>'),
  micOff: icon('<path d="m2 2 20 20"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2"/><path d="M19 10v2a6.98 6.98 0 0 1-1 3.61"/><path d="M12 19v3"/>'),
  phone: icon('<path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.8 19.8 0 0 1 3.08 5.18 2 2 0 0 1 5.06 3h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L9 10.91a16 16 0 0 0 4.09 4.09l1.3-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z"/>'),
  copy: icon('<rect width="14" height="14" x="8" y="8" rx="2"/><rect width="14" height="14" x="2" y="2" rx="2"/>'),
  screen: icon('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8"/><path d="M12 16v4"/>'),
  spark: icon('<path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7L12 3Z"/><path d="M19 3v4"/><path d="M21 5h-4"/>'),
  users: icon('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  clock: icon('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  shield: icon('<path d="M20 13c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V5l8-3 8 3v8Z"/><path d="m9 12 2 2 4-5"/>'),
  lock: icon('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  unlock: icon('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>'),
  check: icon('<path d="m20 6-11 11-5-5"/>'),
  x: icon('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>')
};

function toast(message) {
  const el = document.querySelector(".toast") || document.createElement("div");
  el.className = "toast show";
  el.textContent = message;
  document.body.append(el);
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => el.classList.remove("show"), 2600);
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { "content-type": "application/json", ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function renderHome() {
  app.innerHTML = `
    <section class="home">
      <div class="home-copyblock">
        <div class="brand-lockup">
          <div class="brand-mark">HD</div>
          <span>HuyDebug</span>
        </div>
        <p class="eyebrow">Private WebRTC Room</p>
        <h1>Phòng gọi dành cho team debug tốc độ cao.</h1>
        <div class="trust-row" aria-label="HuyDebug status">
          <span>${icons.shield} Peer-to-peer</span>
          <span>${icons.clock} Instant room</span>
          <span>${icons.users} Live grid</span>
        </div>
      </div>
      <form class="join-card" id="joinForm">
        <div class="preview-shell" aria-hidden="true">
          <div class="preview-top">
            <span></span><span></span><span></span>
          </div>
          <div class="preview-grid">
            <div class="preview-tile main"><strong>HD</strong><small>Ready</small></div>
            <div class="preview-tile accent"></div>
            <div class="preview-tile warm"></div>
          </div>
          <div class="preview-controls">
            <span>${icons.mic}</span>
            <span>${icons.camera}</span>
            <span>${icons.screen}</span>
          </div>
        </div>
        <h2>Vào phòng</h2>
        <div class="avatar-picker">
          <div class="avatar-choice" id="avatarPreview">${avatarMarkup(state.name || "HD", state.avatar)}</div>
          <div class="avatar-choice-info">
            <label class="avatar-upload" for="avatarInput">Tải ảnh đại diện</label>
            <input id="avatarInput" type="file" accept="image/*" />
            <small>Ảnh được lưu trong trình duyệt của bạn và gửi kèm khi vào phòng.</small>
          </div>
        </div>
        <div class="field">
          <label for="name">Tên hiển thị</label>
          <input id="name" autocomplete="name" maxlength="48" placeholder="Ví dụ: Huy" value="${escapeHtml(state.name)}" required />
        </div>
        <div class="field">
          <label for="room">Mã phòng</label>
          <input id="room" autocomplete="off" maxlength="24" placeholder="Để trống nếu muốn tạo phòng mới" />
        </div>
        <div class="button-row">
          <button class="btn primary" type="submit" data-mode="create">${icons.spark} Tạo phòng</button>
          <button class="btn" type="submit" data-mode="join">Vào phòng</button>
        </div>
      </form>
    </section>
  `;

  const form = document.querySelector("#joinForm");
  let mode = "create";
  form.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => {
      mode = button.dataset.mode;
    });
  });
  form.querySelector("#name").addEventListener("input", (event) => {
    setAvatarNode(document.querySelector("#avatarPreview"), event.target.value || "HD", state.avatar);
  });
  form.querySelector("#avatarInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      state.avatar = await readAvatarFile(file);
      localStorage.setItem("huydebug:avatar", state.avatar);
      setAvatarNode(document.querySelector("#avatarPreview"), form.querySelector("#name").value || "HD", state.avatar);
      toast("Đã cập nhật ảnh đại diện.");
    } catch (error) {
      toast(error.message);
    }
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = form.querySelector("#name").value.trim() || "HuyDebugger";
    const roomInput = form.querySelector("#room").value.trim().toUpperCase();
    state.name = name;
    localStorage.setItem("huydebug:name", name);

    try {
      let roomId = roomInput;
      if (mode === "create" || !roomId) {
        const created = await request("/api/rooms", { method: "POST", body: "{}" });
        roomId = created.roomId;
      }
      window.location.href = `/r/${encodeURIComponent(roomId)}`;
    } catch (error) {
      toast(error.message);
    }
  });
}

function readAvatarFile(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Chọn file ảnh thôi ní."));
      return;
    }
    if (file.size > 1_500_000) {
      reject(new Error("Ảnh nên nhỏ hơn 1.5MB để gửi phòng nhanh hơn."));
      return;
    }
    const image = new Image();
    const reader = new FileReader();
    reader.addEventListener("error", () => reject(new Error("Không đọc được ảnh.")));
    reader.addEventListener("load", () => {
      image.addEventListener("load", () => {
        const canvas = document.createElement("canvas");
        const size = 240;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d");
        const scale = Math.max(size / image.width, size / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        ctx.drawImage(image, (size - width) / 2, (size - height) / 2, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      });
      image.addEventListener("error", () => reject(new Error("Ảnh không hợp lệ.")));
      image.src = reader.result;
    });
    reader.readAsDataURL(file);
  });
}

function avatarMarkup(name, avatar) {
  if (avatar) return `<img src="${escapeHtml(avatar)}" alt="" />`;
  return escapeHtml(initials(name));
}

function setAvatarNode(node, name, avatar) {
  if (!node) return;
  node.innerHTML = avatarMarkup(name, avatar);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function renderRoom() {
  app.innerHTML = `
    <section class="room">
      <header class="room-topbar">
        <div class="room-title">
          <div class="brand-mark">HD</div>
          <div>
            <h1>HuyDebug</h1>
            <p>Phòng ${escapeHtml(state.roomId)} · <span id="memberCount">1 người</span></p>
          </div>
        </div>
        <div class="top-actions">
          <div class="status-pill"><span id="statusDot" class="status-dot"></span><span id="statusText">Đang chuẩn bị</span></div>
          <div class="status-pill">${icons.clock}<span id="roomClock">--:--</span></div>
        </div>
      </header>
      <div class="meeting-layout">
        <section class="stage">
          <div id="videoGrid" class="video-grid"></div>
        </section>
        <aside class="people-panel">
          <div class="panel-head">
            <div>
              <span class="panel-kicker">Participants</span>
              <h2>Trong phòng</h2>
            </div>
            <span class="panel-count" id="panelCount">1</span>
          </div>
          <div class="invite-box">
            <span>${icons.copy}</span>
            <strong>${escapeHtml(state.roomId)}</strong>
          </div>
          <section class="host-panel" id="hostPanel"></section>
          <div class="people-list" id="peopleList"></div>
          <section class="chat-panel" aria-label="Chat trong phòng">
            <div class="chat-head">
              <span class="panel-kicker">Room chat</span>
              <strong>Nhắn tin</strong>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <form class="chat-form" id="chatForm">
              <input id="chatInput" maxlength="900" autocomplete="off" placeholder="Nhập tin nhắn..." />
              <button class="btn primary" type="submit">Gửi</button>
            </form>
          </section>
        </aside>
      </div>
      <footer class="controls">
        <div class="control-group">
          <button class="btn icon active" id="micBtn" title="Bật/tắt mic">${icons.mic}</button>
          <button class="btn icon active" id="cameraBtn" title="Bật/tắt camera">${icons.camera}</button>
          <button class="btn icon" id="screenBtn" title="Chia sẻ màn hình">${icons.screen}</button>
        </div>
        <div class="control-group">
          <button class="btn" id="copyBtn">${icons.copy} Copy link</button>
          <button class="btn danger" id="leaveBtn">${icons.phone} Rời phòng</button>
        </div>
      </footer>
    </section>
  `;
}

function makeTile(id, name, stream, isLocal = false, avatarImage = "") {
  let tile = document.querySelector(`[data-peer="${CSS.escape(id)}"]`);
  if (!tile) {
    tile = template.content.firstElementChild.cloneNode(true);
    tile.dataset.peer = id;
    tile.classList.toggle("local", isLocal);
    document.querySelector("#videoGrid").append(tile);
  }

  const video = tile.querySelector("video");
  const avatar = tile.querySelector(".avatar");
  const tileName = tile.querySelector(".tile-name");
  const badge = tile.querySelector(".tile-badge");
  video.srcObject = stream || null;
  setAvatarNode(avatar, name, avatarImage);
  tileName.textContent = `${name}${isLocal ? " (Bạn)" : ""}`;
  badge.textContent = isLocal ? "Local" : "Live";
  tile.classList.toggle("no-video", !stream || !stream.getVideoTracks().some((track) => track.enabled));
  return tile;
}

function updateStatus(text, live = false) {
  document.querySelector("#statusText").textContent = text;
  document.querySelector("#statusDot").classList.toggle("live", live);
}

function updateMemberCount() {
  const count = 1 + state.peers.size;
  document.querySelector("#memberCount").textContent = `${count} người`;
  const panelCount = document.querySelector("#panelCount");
  if (panelCount) panelCount.textContent = count;
  renderParticipants();
  renderHostPanel();
}

function renderParticipants() {
  const list = document.querySelector("#peopleList");
  if (!list) return;
  const people = [
    { id: state.peerId, name: `${state.name || "Bạn"} (Bạn)`, avatar: state.avatar, self: true },
    ...[...state.peers.values()].map((peer) => ({ ...peer, self: false }))
  ];
  list.innerHTML = people.map((person) => `
    <div class="person-row">
      <span class="person-avatar">${avatarMarkup(person.name, person.avatar)}</span>
      <span class="person-name">${escapeHtml(person.name)}</span>
      <span class="person-live">${person.id === state.hostId ? "Host" : "Live"}</span>
      ${state.isHost && !person.self ? `
        <div class="person-actions">
          <button type="button" data-control="mute-audio" data-peer="${escapeHtml(person.id)}" title="Yêu cầu tắt mic">${icons.micOff}</button>
          <button type="button" data-control="mute-video" data-peer="${escapeHtml(person.id)}" title="Yêu cầu tắt camera">${icons.cameraOff}</button>
          <button type="button" data-control="kick" data-peer="${escapeHtml(person.id)}" title="Kick khỏi phòng">${icons.x}</button>
        </div>
      ` : ""}
    </div>
  `).join("");
}

function renderHostPanel() {
  const panel = document.querySelector("#hostPanel");
  if (!panel) return;
  if (!state.isHost) {
    panel.innerHTML = `
      <div class="host-status">
        <span>${state.roomLocked ? icons.lock : icons.unlock}</span>
        <strong>${state.roomLocked ? "Phòng đang khóa" : "Phòng đang mở"}</strong>
      </div>
    `;
    return;
  }

  const pending = [...state.pendingRequests.values()];
  panel.innerHTML = `
    <div class="host-status">
      <span>${state.roomLocked ? icons.lock : icons.unlock}</span>
      <strong>${state.roomLocked ? "Phòng đang khóa" : "Phòng đang mở"}</strong>
      <button type="button" class="btn host-lock-btn" id="lockRoomBtn">
        ${state.roomLocked ? icons.unlock : icons.lock}
        ${state.roomLocked ? "Mở phòng" : "Khóa phòng"}
      </button>
    </div>
    ${pending.length ? `
      <div class="pending-list">
        <span class="panel-kicker">Waiting room</span>
        ${pending.map((peer) => `
          <div class="pending-row">
            <span class="person-avatar">${avatarMarkup(peer.name, peer.avatar)}</span>
            <span class="person-name">${escapeHtml(peer.name)}</span>
            <div class="pending-actions">
              <button type="button" data-control="approve" data-peer="${escapeHtml(peer.id)}" title="Duyệt vào phòng">${icons.check}</button>
              <button type="button" data-control="deny" data-peer="${escapeHtml(peer.id)}" title="Từ chối">${icons.x}</button>
            </div>
          </div>
        `).join("")}
      </div>
    ` : ""}
  `;
}

async function startRoom() {
  renderRoom();
  wireControls();
  updateMeetingClock();
  window.setInterval(updateMeetingClock, 20_000);
  await loadConfig();
  try {
    state.localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
    });
    makeTile(state.peerId, state.name || "Bạn", state.localStream, true, state.avatar);
  } catch (error) {
    state.cameraEnabled = false;
    state.micEnabled = false;
    makeTile(state.peerId, state.name || "Bạn", null, true, state.avatar);
    toast("Không mở được camera/mic. Bạn vẫn có thể vào phòng và cấp quyền lại trên trình duyệt.");
  }

  try {
    const joined = await request(`/api/rooms/${state.roomId}/join`, {
      method: "POST",
      body: JSON.stringify({ peerId: state.peerId, name: state.name || "HuyDebugger", avatar: state.avatar })
    });
    state.hostId = joined.room?.hostId || "";
    state.isHost = state.hostId === state.peerId;
    state.roomLocked = Boolean(joined.room?.locked);
    state.admissionPending = Boolean(joined.pending);
    if (state.admissionPending) {
      updateMemberCount();
      updateStatus("Đang chờ host duyệt");
      toast("Phòng đang khóa. Bạn đang chờ host duyệt vào.");
      startPolling();
      startHeartbeat();
      return;
    }
    joined.peers.forEach((peer) => {
      state.peers.set(peer.id, peer);
      createPeerConnection(peer.id, true);
    });
    updateMemberCount();
    updateStatus("Đang online", true);
    startPolling();
    startHeartbeat();
  } catch (error) {
    updateStatus("Không vào được phòng");
    toast(error.message);
  }
}

function updateMeetingClock() {
  const clock = document.querySelector("#roomClock");
  if (!clock) return;
  clock.textContent = new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date());
}

async function loadConfig() {
  try {
    const config = await request("/api/config");
    if (Array.isArray(config.iceServers) && config.iceServers.length) {
      iceServers = config.iceServers;
    }
  } catch {
    iceServers = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" }
    ];
  }
}

function wireControls() {
  document.querySelector("#copyBtn").addEventListener("click", async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Đã copy link mời phòng HuyDebug.");
  });

  document.querySelector(".invite-box")?.addEventListener("click", async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast("Đã copy link mời phòng HuyDebug.");
  });

  document.querySelector("#chatForm")?.addEventListener("submit", sendChatMessage);
  document.querySelector(".people-panel")?.addEventListener("click", handleHostPanelClick);

  document.querySelector("#leaveBtn").addEventListener("click", async () => {
    await leaveRoom();
    window.location.href = "/";
  });

  document.querySelector("#micBtn").addEventListener("click", () => {
    state.micEnabled = !state.micEnabled;
    state.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = state.micEnabled;
    });
    const button = document.querySelector("#micBtn");
    button.classList.toggle("active", state.micEnabled);
    button.innerHTML = state.micEnabled ? icons.mic : icons.micOff;
  });

  document.querySelector("#cameraBtn").addEventListener("click", () => {
    state.cameraEnabled = !state.cameraEnabled;
    state.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = state.cameraEnabled;
    });
    const button = document.querySelector("#cameraBtn");
    button.classList.toggle("active", state.cameraEnabled);
    button.innerHTML = state.cameraEnabled ? icons.camera : icons.cameraOff;
    makeTile(state.peerId, state.name || "Bạn", state.localStream, true, state.avatar);
  });

  document.querySelector("#screenBtn").addEventListener("click", toggleScreenShare);
  window.addEventListener("beforeunload", () => {
    navigator.sendBeacon?.(`/api/rooms/${state.roomId}/leave`, JSON.stringify({ peerId: state.peerId }));
  });
}

async function handleHostPanelClick(event) {
  const controlButton = event.target.closest("[data-control]");
  if (controlButton) {
    await sendHostControl(controlButton.dataset.control, controlButton.dataset.peer);
    return;
  }
  if (event.target.closest("#lockRoomBtn")) {
    await sendHostControl(state.roomLocked ? "unlock" : "lock");
  }
}

async function sendHostControl(action, target = "") {
  if (!state.isHost) return;
  try {
    const result = await request(`/api/rooms/${state.roomId}/control`, {
      method: "POST",
      body: JSON.stringify({ from: state.peerId, action, target })
    });
    if (result.room) {
      state.hostId = result.room.hostId;
      state.isHost = state.hostId === state.peerId;
      state.roomLocked = Boolean(result.room.locked);
      renderHostPanel();
    }
    if (["approve", "deny"].includes(action) && target) {
      state.pendingRequests.delete(target);
      renderHostPanel();
    }
  } catch (error) {
    toast(error.message);
  }
}

async function toggleScreenShare() {
  if (state.sharingScreen) {
    stopScreenShare();
    return;
  }
  try {
    state.screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    const screenTrack = state.screenStream.getVideoTracks()[0];
    replaceVideoTrack(screenTrack);
    makeTile(state.peerId, state.name || "Bạn", state.screenStream, true, state.avatar);
    state.sharingScreen = true;
    document.querySelector("#screenBtn").classList.add("active");
    screenTrack.addEventListener("ended", stopScreenShare, { once: true });
  } catch {
    toast("Bạn đã hủy chia sẻ màn hình.");
  }
}

function stopScreenShare() {
  state.screenStream?.getTracks().forEach((track) => track.stop());
  state.screenStream = null;
  const cameraTrack = state.localStream?.getVideoTracks()[0];
  if (cameraTrack) replaceVideoTrack(cameraTrack);
  makeTile(state.peerId, state.name || "Bạn", state.localStream, true, state.avatar);
  state.sharingScreen = false;
  document.querySelector("#screenBtn").classList.remove("active");
}

function replaceVideoTrack(track) {
  for (const pc of state.peerConnections.values()) {
    const sender = pc.getSenders().find((item) => item.track?.kind === "video");
    if (sender) sender.replaceTrack(track);
  }
}

function createPeerConnection(peerId, initiator = false) {
  if (state.peerConnections.has(peerId)) return state.peerConnections.get(peerId);
  const pc = new RTCPeerConnection({ iceServers });
  state.peerConnections.set(peerId, pc);

  state.localStream?.getTracks().forEach((track) => pc.addTrack(track, state.localStream));

  pc.addEventListener("track", (event) => {
    const peer = state.peers.get(peerId) || { name: "Khach moi" };
    makeTile(peerId, peer.name, event.streams[0], false, peer.avatar);
  });

  pc.addEventListener("icecandidate", (event) => {
    if (event.candidate) {
      sendSignal(peerId, { type: "ice", candidate: event.candidate });
    }
  });

  pc.addEventListener("connectionstatechange", () => {
    if (["failed", "closed", "disconnected"].includes(pc.connectionState)) {
      const tile = document.querySelector(`[data-peer="${CSS.escape(peerId)}"]`);
      tile?.querySelector(".tile-badge")?.replaceChildren(document.createTextNode("Offline"));
    }
  });

  if (initiator) {
    negotiateOffer(peerId, pc);
  }
  return pc;
}

async function negotiateOffer(peerId, pc) {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  await sendSignal(peerId, { type: "offer", description: pc.localDescription });
}

async function sendSignal(to, signal) {
  await request(`/api/rooms/${state.roomId}/signal`, {
    method: "POST",
    body: JSON.stringify({ from: state.peerId, to, signal })
  });
}

async function handleSignal(event) {
  const peerId = event.from;
  const pc = createPeerConnection(peerId, false);

  if (event.signal.type === "offer") {
    await pc.setRemoteDescription(event.signal.description);
    await flushPendingIce(peerId, pc);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendSignal(peerId, { type: "answer", description: pc.localDescription });
  }

  if (event.signal.type === "answer") {
    await pc.setRemoteDescription(event.signal.description);
    await flushPendingIce(peerId, pc);
  }

  if (event.signal.type === "ice" && event.signal.candidate) {
    if (pc.remoteDescription) {
      await pc.addIceCandidate(event.signal.candidate);
    } else {
      const queue = state.pendingIce.get(peerId) || [];
      queue.push(event.signal.candidate);
      state.pendingIce.set(peerId, queue);
    }
  }
}

async function flushPendingIce(peerId, pc) {
  const queue = state.pendingIce.get(peerId) || [];
  state.pendingIce.delete(peerId);
  for (const candidate of queue) {
    await pc.addIceCandidate(candidate);
  }
}

function startPolling() {
  if (state.polling) return;
  state.polling = true;
  const poll = async () => {
    if (!state.polling) return;
    try {
      const data = await request(`/api/rooms/${state.roomId}/events?peerId=${encodeURIComponent(state.peerId)}&after=${state.lastEventId}`);
      state.lastEventId = data.lastEventId;
      for (const event of data.events) {
        if (event.type === "peer-joined") {
          state.pendingRequests.delete(event.peer.id);
          state.peers.set(event.peer.id, event.peer);
          updateMemberCount();
          toast(`${event.peer.name} đã vào phòng.`);
        }
        if (event.type === "join-request") {
          state.pendingRequests.set(event.peer.id, event.peer);
          renderHostPanel();
          toast(`${event.peer.name} đang chờ duyệt.`);
        }
        if (event.type === "join-approved") {
          state.admissionPending = false;
          state.hostId = event.room?.hostId || state.hostId;
          state.roomLocked = Boolean(event.room?.locked);
          state.isHost = state.hostId === state.peerId;
          state.peers.clear();
          (event.peers || []).forEach((peer) => {
            state.peers.set(peer.id, peer);
            createPeerConnection(peer.id, true);
          });
          updateMemberCount();
          updateStatus("Đang online", true);
          toast("Host đã duyệt bạn vào phòng.");
        }
        if (event.type === "join-denied") {
          toast("Host đã từ chối yêu cầu vào phòng.");
          await leaveRoom();
          window.location.href = "/";
          return;
        }
        if (event.type === "room-updated") {
          state.hostId = event.room?.hostId || state.hostId;
          state.isHost = state.hostId === state.peerId;
          state.roomLocked = Boolean(event.room?.locked);
          renderHostPanel();
          toast(state.roomLocked ? "Host đã khóa phòng." : "Host đã mở phòng.");
        }
        if (event.type === "host-changed") {
          state.hostId = event.hostId || "";
          state.isHost = state.hostId === state.peerId;
          state.roomLocked = Boolean(event.room?.locked);
          updateMemberCount();
          toast(state.isHost ? "Bạn hiện là host của phòng." : "Host của phòng đã thay đổi.");
        }
        if (event.type === "peer-updated") {
          state.peers.set(event.peer.id, event.peer);
          updateMemberCount();
        }
        if (event.type === "peer-left") {
          state.pendingRequests.delete(event.from);
          removePeer(event.from);
          toast(`${event.peer?.name || "Một người"} đã rời phòng.`);
        }
        if (event.type === "host-control") {
          await handleHostControl(event.action);
        }
        if (event.type === "chat") appendChatMessage(event.message);
        if (event.type === "signal") await handleSignal(event);
      }
    } catch (error) {
      updateStatus("Mất kết nối signaling");
    } finally {
      window.setTimeout(poll, 900);
    }
  };
  poll();
}

async function handleHostControl(action) {
  if (action === "kick") {
    toast("Bạn đã bị host mời ra khỏi phòng.");
    state.polling = false;
    state.localStream?.getTracks().forEach((track) => track.stop());
    state.screenStream?.getTracks().forEach((track) => track.stop());
    state.peerConnections.forEach((pc) => pc.close());
    window.setTimeout(() => {
      window.location.href = "/";
    }, 900);
    return;
  }

  if (action === "mute-audio") {
    state.micEnabled = false;
    state.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = false;
    });
    const button = document.querySelector("#micBtn");
    if (button) {
      button.classList.remove("active");
      button.innerHTML = icons.micOff;
    }
    toast("Host đã yêu cầu tắt mic của bạn.");
  }

  if (action === "mute-video") {
    state.cameraEnabled = false;
    state.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = false;
    });
    const button = document.querySelector("#cameraBtn");
    if (button) {
      button.classList.remove("active");
      button.innerHTML = icons.cameraOff;
    }
    makeTile(state.peerId, state.name || "Bạn", state.localStream, true, state.avatar);
    toast("Host đã yêu cầu tắt camera của bạn.");
  }
}

function startHeartbeat() {
  window.setInterval(() => {
    request(`/api/rooms/${state.roomId}/heartbeat`, {
      method: "POST",
      body: JSON.stringify({ peerId: state.peerId, name: state.name || "HuyDebugger", avatar: state.avatar })
    }).catch(() => {});
  }, 10_000);
}

async function sendChatMessage(event) {
  event.preventDefault();
  const input = document.querySelector("#chatInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  const localMessage = {
    id: crypto.randomUUID(),
    text,
    sender: {
      id: state.peerId,
      name: state.name || "Bạn",
      avatar: state.avatar
    },
    local: true
  };
  appendChatMessage(localMessage);
  try {
    await request(`/api/rooms/${state.roomId}/chat`, {
      method: "POST",
      body: JSON.stringify({ from: state.peerId, text })
    });
  } catch (error) {
    toast("Không gửi được tin nhắn.");
  }
}

function appendChatMessage(message) {
  const panel = document.querySelector("#chatMessages");
  if (!panel || !message?.text) return;
  state.chatMessages.push(message);
  if (state.chatMessages.length > 80) state.chatMessages.shift();
  panel.innerHTML = state.chatMessages.map((item) => {
    const isMine = item.local || item.sender?.id === state.peerId;
    return `
      <div class="chat-message ${isMine ? "mine" : ""}">
        <span class="chat-avatar">${avatarMarkup(item.sender?.name || "HD", item.sender?.avatar || "")}</span>
        <div>
          <div class="chat-author">${escapeHtml(isMine ? "Bạn" : item.sender?.name || "Khach moi")}</div>
          <div class="chat-bubble">${escapeHtml(item.text)}</div>
        </div>
      </div>
    `;
  }).join("");
  panel.scrollTop = panel.scrollHeight;
}

function removePeer(peerId) {
  state.peers.delete(peerId);
  const pc = state.peerConnections.get(peerId);
  pc?.close();
  state.peerConnections.delete(peerId);
  document.querySelector(`[data-peer="${CSS.escape(peerId)}"]`)?.remove();
  updateMemberCount();
}

async function leaveRoom() {
  state.polling = false;
  state.localStream?.getTracks().forEach((track) => track.stop());
  state.screenStream?.getTracks().forEach((track) => track.stop());
  state.peerConnections.forEach((pc) => pc.close());
  await request(`/api/rooms/${state.roomId}/leave`, {
    method: "POST",
    body: JSON.stringify({ peerId: state.peerId })
  }).catch(() => {});
}

if (!state.roomId) {
  renderHome();
} else {
  if (!state.name) state.name = `HuyDebugger-${state.peerId.slice(0, 4)}`;
  startRoom();
}
