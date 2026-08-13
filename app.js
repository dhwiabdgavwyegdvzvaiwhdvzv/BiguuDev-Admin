// ======================================================
// BiguuDev Admin Panel V4 Logic - Refactored UI & Control
// Dedicated Single-User Page & Dynamic Script Permissions
// ======================================================

const API = "https://biguudev-admin-v2.biguudev.workers.dev";
const WORKER_BASE_URL = "https://biguudev-admin-v2.biguudev.workers.dev";
let ADMIN_KEY = localStorage.getItem("adminKey") || "";
let currentUser = null;
let allUsers = [];
let allScripts = [];

function init() {
  ADMIN_KEY = new URLSearchParams(location.search).get("key") || ADMIN_KEY;
  if (!ADMIN_KEY) {
    promptForKey();
    return;
  }
  localStorage.setItem("adminKey", ADMIN_KEY);
  
  refreshDashboard();
  loadUsers();
  fetchScriptList();
}

function promptForKey() {
  const key = prompt("Enter Admin Key:");
  if (key) {
    ADMIN_KEY = key;
    localStorage.setItem("adminKey", ADMIN_KEY);
    window.location.href = `?key=${encodeURIComponent(ADMIN_KEY)}`;
  }
}

function logout() {
  localStorage.removeItem("adminKey");
  ADMIN_KEY = "";
  window.location.href = "/";
}

function toggleSettings() {
  const box = document.getElementById("adminKeyBox");
  if (box) box.style.display = box.style.display === "none" ? "flex" : "none";
}

function saveAdminKey() {
  const val = document.getElementById("adminKeyInput").value.trim();
  if (val) {
    ADMIN_KEY = val;
    localStorage.setItem("adminKey", val);
    showToast("Admin Key Saved!");
    refreshDashboard();
  }
}

async function api(path, options = {}) {
  const url = API + path + (path.includes("?") ? "&" : "?") + "key=" + encodeURIComponent(ADMIN_KEY);
  try {
    const res = await fetch(url, {
      method: options.method || "GET",
      headers: { "Content-Type": "application/json" },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "API Request Failed");
    return data;
  } catch (err) {
    showToast(err.message, "error");
    throw err;
  }
}

function showToast(msg, type = "success") {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    background: ${type === "error" ? "#ff3b5c" : "#101a24"};
    color: ${type === "error" ? "#fff" : "#00e5ff"};
    border: 1px solid ${type === "error" ? "rgba(255,255,255,0.2)" : "rgba(0,229,255,0.5)"};
    padding: 10px 15px; border-radius: 10px; font-size: 10px; font-weight: 600;
    z-index: 9999; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function formatTime(unix) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString();
}

async function refreshDashboard() {
  try {
    const stats = await api("/statistics");
    document.getElementById("stat-total").textContent = stats.totalUsers || 0;
    document.getElementById("stat-active").textContent = stats.activeUsers || 0;
    document.getElementById("stat-risk").textContent = stats.riskUsers || 0;

    await fetchScriptList();
    document.getElementById("stat-scripts").textContent = allScripts.length;

    const feed = document.getElementById("activity-feed");
    if (feed) {
      feed.innerHTML = `
        <div class="activity"><div><b>System Synced Successfully</b><small>${new Date().toLocaleTimeString()}</small></div></div>
        <div class="activity"><div><b>Active Accounts Ratio</b><small>${stats.activeUsers} active / ${stats.totalUsers} total</small></div></div>
      `;
    }
  } catch (err) {
    console.error(err);
  }
}

async function loadUsers() {
  try {
    const res = await api("/users");
    allUsers = res.users || [];
    renderUsersList();
  } catch (err) {
    console.error(err);
  }
}

function renderUsersList() {
  const container = document.getElementById("usersList");
  if (!container) return;

  if (!allUsers.length) {
    container.innerHTML = "<p style='text-align:center; color:var(--muted); font-size:11px;'>No users created yet</p>";
    return;
  }

  container.innerHTML = allUsers.map(u => `
    <article class="user-card" onclick="viewUserDetail('${u.key}')" style="cursor:pointer;">
      <div class="avatar cyan-avatar">U</div>
      <div class="user-main"><b>${u.username}</b><small class="mono">${u.key}</small><small>${u.ip1 || "No IP logged"}</small></div>
      <div class="user-meta">
        <span class="badge ${u.status === "active" ? "active" : "inactive"}">${u.status}</span>
        <span class="badge ${u.risk ? "high" : "low"}">${u.risk ? "Risk" : "Clean"}</span>
      </div>
      <button class="more">›</button>
    </article>
  `).join("");
}

function filterUsers() {
  const search = document.getElementById("userSearch").value.toLowerCase();
  const filtered = allUsers.filter(u => u.username.toLowerCase().includes(search) || u.key.toLowerCase().includes(search));
  const container = document.getElementById("usersList");
  
  container.innerHTML = filtered.map(u => `
    <article class="user-card" onclick="viewUserDetail('${u.key}')" style="cursor:pointer;">
      <div class="avatar cyan-avatar">U</div>
      <div class="user-main"><b>${u.username}</b><small class="mono">${u.key}</small><small>${u.ip1 || "No IP logged"}</small></div>
      <div class="user-meta">
        <span class="badge ${u.status === "active" ? "active" : "inactive"}">${u.status}</span>
        <span class="badge ${u.risk ? "high" : "low"}">${u.risk ? "Risk" : "Clean"}</span>
      </div>
      <button class="more">›</button>
    </article>
  `).join("");
}

async function viewUserDetail(key) {
  try {
    const res = await api(`/user?id=${encodeURIComponent(key)}`);
    currentUser = res;
    const p = res.profile;
    const s = res.security;

    document.getElementById("detail-username").textContent = `Control: ${p.username}`;
    document.getElementById("detail-profile-username").textContent = p.username;
    document.getElementById("detail-profile-key").textContent = key;
    document.getElementById("detail-profile-key-val").textContent = key;
    document.getElementById("detail-profile-status").textContent = p.status;
    document.getElementById("detail-profile-status").className = `badge ${p.status === "active" ? "active" : "inactive"}`;
    document.getElementById("detail-profile-expire").textContent = formatTime(p.expire);
    document.getElementById("detail-profile-created").textContent = formatTime(p.created);
    document.getElementById("detail-profile-lastseen").textContent = formatTime(p.lastSeen);

    document.getElementById("detail-sec-ip1").textContent = s.ip1 || "—";
    document.getElementById("detail-sec-ip1asn").textContent = s.ip1Asn || "—";
    document.getElementById("detail-sec-ip1country").textContent = s.ip1Country || "—";
    document.getElementById("detail-sec-ip2").textContent = s.ip2 || "—";
    document.getElementById("detail-sec-device").textContent = s.uaDevice || "—";

    const lockBadge = document.getElementById("detail-lock-badge");
    lockBadge.textContent = s.lock ? "Yes" : "No";
    lockBadge.className = `badge ${s.lock ? "high" : "active"}`;

    const riskBadge = document.getElementById("detail-risk-badge");
    riskBadge.textContent = s.risk ? "At Risk" : "Clean";
    riskBadge.className = `badge ${s.risk ? "high" : "low"}`;

    renderScriptAccessCheckboxes(p.scripts || []);

    const riskHtml = (s.riskEvents || []).map(ev => `
      <div class="info" style="color:var(--red);">
        <span>${formatTime(ev.time)}</span>
        <b>${ev.reason} (${ev.ip || "?"})</b>
      </div>
    `).join("");
    document.getElementById("detail-risk-events").innerHTML = riskHtml || "<p style='font-size:10px; color:var(--muted);'>No risk events logged.</p>";

    showPage("detail");
  } catch (err) {
    console.error(err);
  }
}

function renderScriptAccessCheckboxes(allowedScripts) {
  const container = document.getElementById("scriptAccessCheckboxGrid");
  if (!container) return;

  if (!allScripts.length) {
    container.innerHTML = "<p style='font-size:10px; color:var(--muted);'>No scripts found in KV store.</p>";
    return;
  }

  container.innerHTML = allScripts.map(script => {
    const isChecked = Array.isArray(allowedScripts) && allowedScripts.includes(script) ? "checked" : "";
    return `
      <label style="display:flex; align-items:center; gap:8px; font-size:10px; background:rgba(255,255,255,0.02); padding:8px; border-radius:8px; border:1px solid var(--line);">
        <input type="checkbox" value="${script}" ${isChecked} class="user-script-checkbox">
        <span style="color:var(--text);">${script}</span>
      </label>
    `;
  }).join("");
}

async function saveUserScriptAccess() {
  const selectedScripts = [];
  document.querySelectorAll(".user-script-checkbox:checked").forEach(cb => {
    selectedScripts.push(cb.value);
  });

  try {
    await api("/edituser", {
      method: "POST",
      body: {
        token: currentUser.key,
        scripts: selectedScripts
      }
    });
    showToast("Script Access Permissions Saved!");
    viewUserDetail(currentUser.key);
  } catch (err) {
    console.error(err);
  }
}

async function detailToggleStatus() {
  const newStatus = currentUser.profile.status === "active" ? "disabled" : "active";
  try {
    await api("/edituser", { method: "POST", body: { token: currentUser.key, status: newStatus } });
    showToast(`Status updated to ${newStatus}`);
    viewUserDetail(currentUser.key);
    loadUsers();
  } catch (err) { console.error(err); }
}

async function detailChangeKey() {
  const newKey = prompt("Enter new Key:", currentUser.key);
  if (!newKey || newKey === currentUser.key) return;
  try {
    await api("/changekey", { method: "POST", body: { oldToken: currentUser.key, newToken: newKey } });
    showToast("Key successfully changed!");
    viewUserDetail(newKey);
    loadUsers();
  } catch (err) { console.error(err); }
}

async function detailUnlockUser() {
  try {
    await api(`/resetsecurity?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
    await api(`/edituser`, { method: "POST", body: { token: currentUser.key, status: "active" } });
    showToast("User unlocked & bindings reset!");
    viewUserDetail(currentUser.key);
    loadUsers();
  } catch (err) { console.error(err); }
}

async function detailLockUser() {
  if (!confirm("Hard lock access for this user?")) return;
  try {
    await api(`/edituser`, { method: "POST", body: { token: currentUser.key, status: "disabled" } });
    showToast("User locked!");
    viewUserDetail(currentUser.key);
    loadUsers();
  } catch (err) { console.error(err); }
}

async function detailDelete() {
  if (!confirm("Permanently delete this user?")) return;
  try {
    await api(`/delete?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
    showToast("User deleted!");
    loadUsers();
    showPage("users");
  } catch (err) { console.error(err); }
}

async function fetchScriptList() {
  try {
    const res = await api("/scripts");
    allScripts = res.scripts || [];
    renderScriptsList();
  } catch (err) { console.error(err); }
}

function renderScriptsList() {
  const grid = document.getElementById("scriptsList");
  if (!grid) return;

  if (!allScripts.length) {
    grid.innerHTML = "<p style='text-align:center; color:var(--muted); font-size:11px;'>No scripts in KV</p>";
    return;
  }

  grid.innerHTML = allScripts.map(s => `
    <article class="script-card" style="display:flex; align-items:center; justify-content:space-between;">
      <div style="display:flex; align-items:center; gap:10px;">
        <div class="script-icon cyan-avatar">◇</div>
        <div><b>${s}</b><small>KV Script Vault File</small></div>
      </div>
      <div style="display:flex; gap:6px;">
        <button class="outline cyan-action" onclick="copyScriptUrl('${s}')" style="padding:6px 10px;">Copy URL</button>
        <button class="outline red-action" onclick="deleteScript('${s}')" style="padding:6px 10px;">Delete</button>
      </div>
    </article>
  `).join("");
}

function copyScriptUrl(script) {
  navigator.clipboard.writeText(`${WORKER_BASE_URL}/${encodeURIComponent(script)}`);
  showToast(`Copied URL for: ${script}`);
}

function openScriptUpload() { document.getElementById("uploadModal").style.display = "block"; }
function closeModal() { document.getElementById("uploadModal").style.display = "none"; }
function openAddUserModal() { document.getElementById("addUserModal").style.display = "block"; }
function closeAddUserModal() { document.getElementById("addUserModal").style.display = "none"; }

async function submitCreateUser() {
  const username = document.getElementById("addUsername").value.trim();
  const customKey = document.getElementById("addCustomKey").value.trim();
  const expireDays = parseInt(document.getElementById("addExpireDays").value) || 30;

  if (!username) { showToast("Username is required", "error"); return; }

  const token = customKey || ("key_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36));
  const expire = Math.floor(Date.now() / 1000) + (expireDays * 86400);

  try {
    await api("/adduser", {
      method: "POST",
      body: { username, token, expire }
    });
    showToast("User successfully created!");
    closeAddUserModal();
    loadUsers();
    refreshDashboard();
  } catch (err) { console.error(err); }
}

async function uploadScript() {
  const name = document.getElementById("scriptName").value.trim();
  const content = document.getElementById("scriptContent").value.trim();

  if (!name || !content) { showToast("Name and code required", "error"); return; }

  try {
    await fetch(`${API}/script/upload?id=${encodeURIComponent(name)}&key=${encodeURIComponent(ADMIN_KEY)}`, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: content
    });
    showToast("Script uploaded to KV Storage!");
    closeModal();
    fetchScriptList();
  } catch (err) { showToast(err.message, "error"); }
}

async function deleteScript(script) {
  if (!confirm(`Delete ${script}?`)) return;
  try {
    await api(`/script/delete?id=${encodeURIComponent(script)}`, { method: "POST" });
    showToast("Script deleted!");
    fetchScriptList();
  } catch (err) { console.error(err); }
}

// Drag & Drop Handlers Integration
document.addEventListener("DOMContentLoaded", () => {
  init();

  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const scriptContent = document.getElementById("scriptContent");
  const scriptName = document.getElementById("scriptName");

  if (dropZone && fileInput) {
    dropZone.addEventListener("click", () => fileInput.click());

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--cyan)";
      dropZone.style.background = "rgba(0,229,255,0.08)";
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.style.borderColor = "var(--line-cyan)";
      dropZone.style.background = "rgba(0,229,255,0.02)";
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.style.borderColor = "var(--line-cyan)";
      dropZone.style.background = "rgba(0,229,255,0.02)";

      const file = e.dataTransfer.files[0];
      if (file) {
        if (scriptName && !scriptName.value) {
          scriptName.value = file.name;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          scriptContent.value = evt.target.result;
          showToast(`Loaded file: ${file.name}`);
        };
        reader.readAsText(file);
      }
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        if (scriptName && !scriptName.value) {
          scriptName.value = file.name;
        }
        const reader = new FileReader();
        reader.onload = function(evt) {
          scriptContent.value = evt.target.result;
          showToast(`Loaded file: ${file.name}`);
        };
        reader.readAsText(file);
      }
    });
  }
});
