// ======================================================
// BiguuDev Admin Panel V4 Logic - Refactored UI & Control
// Dedicated Single-User Page & Dynamic Script Permissions
// ======================================================

const API = "https://biguudev-admin-v2.biguudev.workers.dev";
const WORKER_BASE_URL = "https://scriptserver.biguudev.store";
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

function showPage(pageName) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const targetPage = document.getElementById(pageName);
  if (targetPage) targetPage.classList.add("active");

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  if (window.event && window.event.currentTarget) {
    window.event.currentTarget.classList.add("active");
  }

  const pageTitle = document.getElementById("pageTitle");
  if (pageName === "dashboard") pageTitle.textContent = "Overview Dashboard";
  if (pageName === "users") pageTitle.textContent = "User Directory & Management";
  if (pageName === "user-detail") pageTitle.textContent = "Individual User Control";
  if (pageName === "scripts") pageTitle.textContent = "KV Script Storage";
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
    position: fixed; bottom: 20px; right: 20px;
    background: ${type === "error" ? "#ff3b5c" : "#0d3b2a"};
    color: ${type === "error" ? "#fff" : "#00FF88"};
    border: 1px solid ${type === "error" ? "rgba(255,255,255,0.2)" : "rgba(0,255,136,0.3)"};
    padding: 12px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;
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
        <div class="info-row"><span>System Synced:</span> <strong>${new Date().toLocaleTimeString()}</strong></div>
        <div class="info-row"><span>Active Accounts Ratio:</span> <strong>${stats.activeUsers} / ${stats.totalUsers}</strong></div>
        <div class="info-row"><span>Security Alerts Logged:</span> <strong>${stats.riskUsers}</strong></div>
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
  const tbody = document.getElementById("usersList");
  if (!tbody) return;

  if (!allUsers.length) {
    tbody.innerHTML = "<tr><td colspan='6' style='text-align:center;'>No users created yet</td></tr>";
    return;
  }

  tbody.innerHTML = allUsers.map(u => `
    <tr>
      <td><strong>${u.username}</strong></td>
      <td><code class="mono">${u.key}</code></td>
      <td>${u.ip1 || "—"}</td>
      <td>
        <span class="badge ${u.lock ? "danger" : u.status === "active" ? "active" : "disabled"}">
          ${u.lock ? "Locked" : u.status === "active" ? "Active" : "Disabled"}
        </span>
      </td>
      <td>${u.riskCount > 0 ? `<span class="badge danger">${u.riskCount} Risk</span>` : "<span class='badge active'>Clean</span>"}</td>
      <td>
        <button class="btn btn-blue" onclick="viewUserDetail('${u.key}')">Manage User</button>
      </td>
    </tr>
  `).join("");
}

function filterUsers() {
  const search = document.getElementById("userSearch").value.toLowerCase();
  const filtered = allUsers.filter(u => u.username.toLowerCase().includes(search) || u.key.toLowerCase().includes(search));
  const tbody = document.getElementById("usersList");
  
  tbody.innerHTML = filtered.map(u => `
    <tr>
      <td><strong>${u.username}</strong></td>
      <td><code class="mono">${u.key}</code></td>
      <td>${u.ip1 || "—"}</td>
      <td><span class="badge ${u.status === "active" ? "active" : "disabled"}">${u.status}</span></td>
      <td>${u.riskCount || 0}</td>
      <td><button class="btn btn-blue" onclick="viewUserDetail('${u.key}')">Manage User</button></td>
    </tr>
  `).join("");
}

// DEDICATED INDIVIDUAL USER CONTROL PAGE LOADER
async function viewUserDetail(key) {
  try {
    const res = await api(`/user?id=${encodeURIComponent(key)}`);
    currentUser = res;
    const p = res.profile;
    const s = res.security;

    document.getElementById("detail-username").textContent = `Control Panel: ${p.username}`;
    document.getElementById("detail-profile-username").textContent = p.username;
    document.getElementById("detail-profile-key").textContent = key;
    document.getElementById("detail-profile-status").textContent = p.status;
    document.getElementById("detail-profile-expire").textContent = formatTime(p.expire);
    document.getElementById("detail-profile-created").textContent = formatTime(p.created);
    document.getElementById("detail-profile-lastseen").textContent = formatTime(p.lastSeen);

    document.getElementById("detail-sec-ip1").textContent = s.ip1 || "—";
    document.getElementById("detail-sec-ip1asn").textContent = s.ip1Asn || "—";
    document.getElementById("detail-sec-ip1country").textContent = s.ip1Country || "—";
    document.getElementById("detail-sec-ip2").textContent = s.ip2 || "—";
    document.getElementById("detail-sec-device").textContent = s.uaDevice || "—";

    const lockBadge = document.getElementById("detail-lock-badge");
    lockBadge.textContent = s.lock ? "Locked" : "No";
    lockBadge.className = `badge ${s.lock ? "danger" : "active"}`;

    const riskBadge = document.getElementById("detail-risk-badge");
    riskBadge.textContent = s.risk ? "At Risk" : "Clean";
    riskBadge.className = `badge ${s.risk ? "danger" : "active"}`;

    // RENDER SCRIPT ACCESS CHECKBOXES
    renderScriptAccessCheckboxes(p.scripts || []);

    // RENDER RISK LOGS
    const riskHtml = (s.riskEvents || []).map(ev => `
      <div class="info-row" style="color:#ff3b5c;">
        <span>${formatTime(ev.time)}</span>
        <span>${ev.reason} (${ev.ip || "?"})</span>
      </div>
    `).join("");
    document.getElementById("detail-risk-events").innerHTML = riskHtml || "<p class='text-muted'>No risk events logged.</p>";

    showPage("user-detail");
  } catch (err) {
    console.error(err);
  }
}

// RENDER DYNAMIC SCRIPT CHECKBOXES FOR PERMISSION CONTROL
function renderScriptAccessCheckboxes(allowedScripts) {
  const container = document.getElementById("scriptAccessCheckboxGrid");
  if (!container) return;

  if (!allScripts.length) {
    container.innerHTML = "<p class='text-muted'>No scripts found in KV store.</p>";
    return;
  }

  container.innerHTML = allScripts.map(script => {
    const isChecked = allowedScripts.includes(script) ? "checked" : "";
    return `
      <label class="script-checkbox-item">
        <input type="checkbox" value="${script}" ${isChecked} class="user-script-checkbox">
        <span>${script}</span>
      </label>
    `;
  }).join("");
}

// SAVE SCRIPT PERMISSIONS BACK TO KV
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

// USER MANAGEMENT ACTIONS
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

async function detailResetSecurity() {
  if (!confirm("Reset IP, ASN, and Device ID bindings for this user?")) return;
  try {
    await api(`/resetsecurity?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
    showToast("Security bindings reset!");
    viewUserDetail(currentUser.key);
  } catch (err) { console.error(err); }
}

async function detailLockUser() {
  if (!confirm("Hard lock access for this user?")) return;
  try {
    await api(`/lockuser?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
    showToast("User locked!");
    viewUserDetail(currentUser.key);
    loadUsers();
  } catch (err) { console.error(err); }
}

async function detailUnlockUser() {
  try {
    await api(`/unlockuser?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
    showToast("User unlocked!");
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

// SCRIPTS VAULT FUNCTIONS
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

  grid.innerHTML = allScripts.map(s => `
    <div class="card">
      <div class="card-title">${s}</div>
      <div style="display:flex; gap:8px; margin-top:10px;">
        <button class="btn btn-blue" onclick="copyScriptUrl('${s}')">Copy URL</button>
        <button class="btn btn-red" onclick="deleteScript('${s}')">Delete</button>
      </div>
    </div>
  `).join("");
}

function copyScriptUrl(script) {
  navigator.clipboard.writeText(`${WORKER_BASE_URL}/${encodeURIComponent(script)}`);
  showToast(`Copied URL: ${script}`);
}

function openScriptUpload() { document.getElementById("uploadModal").style.display = "flex"; }
function closeModal() { document.getElementById("uploadModal").style.display = "none"; }
function openAddUserModal() { document.getElementById("addUserModal").style.display = "flex"; }
function closeAddUserModal() { document.getElementById("addUserModal").style.display = "none"; }

async function submitCreateUser() {
  const username = document.getElementById("addUsername").value.trim();
  const customKey = document.getElementById("addCustomKey").value.trim();
  const expireDays = parseInt(document.getElementById("addExpireDays").value) || 30;

  if (!username) { showToast("Username is required", "error"); return; }

  try {
    await api("/adduser", {
      method: "POST",
      body: { username, key: customKey || undefined, expireDays }
    });
    showToast("User successfully created!");
    closeAddUserModal();
    loadUsers();
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

function toggleMobileSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebarOverlay").classList.toggle("show");
}

document.addEventListener("DOMContentLoaded", init);
