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
document.getElementById("adminKeyInput").value = ADMIN_KEY;
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
const input = document.getElementById("adminKeyInput");
input.style.display = input.style.display === "none" ? "block" : "none";
}

function showPage(pageName) {
document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
document.getElementById(pageName).classList.add("active");
document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
event.target?.classList.add("active");
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
if (!data.success) throw new Error(data.message || "API Error");
return data;
} catch (err) {
showToast(err.message, "error");
throw err;
}
}

function showToast(msg, type = "success") {
const toast = document.createElement("div");
toast.style.cssText = `
position: fixed;
bottom: 20px;
right: 20px;
background: ${type === "error" ? "#ef4444" : "#4ade80"};
color: white;
padding: 12px 20px;
border-radius: 6px;
z-index: 9999;
animation: slideUp 0.3s ease;
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
document.getElementById("stat-total").textContent = stats.totalUsers;
document.getElementById("stat-active").textContent = stats.activeUsers;
document.getElementById("stat-risk").textContent = stats.riskUsers;

fetchScriptList().then(() => {
document.getElementById("stat-scripts").textContent = allScripts.length;
});

const feed = document.getElementById("activity-feed");
feed.innerHTML = `
<div class="activity-item">
<div class="activity-dot"></div>
<div class="activity-text">System last updated: ${new Date().toLocaleTimeString()}</div>
</div>
<div class="activity-item">
<div class="activity-dot"></div>
<div class="activity-text">Active users: ${stats.activeUsers} / ${stats.totalUsers}</div>
</div>
<div class="activity-item">
<div class="activity-dot"></div>
<div class="activity-text">Users at risk: ${stats.riskUsers}</div>
</div>
`;
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
const list = document.getElementById("usersList");
if (!allUsers.length) {
list.innerHTML = "<div class='loading'>No users yet</div>";
return;
}

list.innerHTML = allUsers.map(u => `
<div class="user-card" onclick="viewUserDetail('${u.key}')">
<div class="user-card-left">
<div class="user-name">${u.username}</div>
<div class="user-status ${u.status === "disabled" ? "disabled" : ""} ${u.lock ? "locked" : ""} ${u.risk ? "risk" : ""}">
${u.lock ? "🔒 Locked" : u.risk ? "⚠️ At Risk" : u.status === "active" ? "✓ Active" : "⊘ Disabled"}
</div>
<div class="user-meta">
<span>Key: <code class="mono">${u.key.substring(0, 8)}...</code></span>
<span>IP: ${u.ip1 || "—"}</span>
<span>Created: ${formatTime(u.created).split(" ")[0]}</span>
</div>
</div>
<div class="user-card-right">
${u.riskCount > 0 ? `<div class="user-badge">⚠️ ${u.riskCount} events</div>` : ""}
${u.lock ? `<div class="user-badge">🔒 Locked</div>` : ""}
</div>
</div>
`).join("");
}

function filterUsers() {
const search = document.getElementById("userSearch").value.toLowerCase();
const filtered = allUsers.filter(u => u.username.toLowerCase().includes(search) || u.key.includes(search));
const list = document.getElementById("usersList");
list.innerHTML = filtered.map(u => `
<div class="user-card" onclick="viewUserDetail('${u.key}')">
<div class="user-card-left">
<div class="user-name">${u.username}</div>
<div class="user-status ${u.status === "disabled" ? "disabled" : ""} ${u.lock ? "locked" : ""} ${u.risk ? "risk" : ""}">
${u.lock ? "🔒 Locked" : u.risk ? "⚠️ At Risk" : u.status === "active" ? "✓ Active" : "⊘ Disabled"}
</div>
<div class="user-meta">
<span>Key: <code class="mono">${u.key.substring(0, 8)}...</code></span>
<span>IP: ${u.ip1 || "—"}</span>
</div>
</div>
</div>
`).join("");
}

async function viewUserDetail(key) {
try {
const res = await api(`/user?id=${encodeURIComponent(key)}`);
currentUser = res;
const p = res.profile;
const s = res.security;

document.getElementById("detail-username").textContent = p.username;
document.getElementById("detail-status").textContent = p.status === "active" ? "✓ Active" : "⊘ Disabled";

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
document.getElementById("detail-sec-ip2asn").textContent = s.ip2Asn || "—";
document.getElementById("detail-sec-ip2country").textContent = s.ip2Country || "—";
document.getElementById("detail-sec-device").textContent = s.uaDevice || "—";

document.getElementById("detail-lock-badge").textContent = s.lock ? "🔒 LOCKED" : "No";
document.getElementById("detail-lock-badge").style.color = s.lock ? "#ef4444" : "#4ade80";
document.getElementById("detail-risk-badge").textContent = s.risk ? "⚠️ AT RISK" : "Clean";
document.getElementById("detail-risk-badge").style.color = s.risk ? "#ef4444" : "#4ade80";
document.getElementById("detail-risk-count").textContent = (s.riskEvents || []).length;

const scriptsList = (p.scripts || []).map(s => `<span>${s}</span>`).join("");
document.getElementById("detail-scripts").innerHTML = scriptsList || "<p class='text-muted'>No scripts assigned</p>";

const riskHtml = (s.riskEvents || []).map(ev => `
<div class="risk-event">
<div class="risk-event-time">${formatTime(ev.time)}</div>
<div class="risk-event-reason">${ev.reason}</div>
<div class="risk-event-details">${ev.ip || "?"} | ASN ${ev.asn || "?"} | ${ev.country || "?"}</div>
</div>
`).join("");
document.getElementById("detail-risk-events").innerHTML = riskHtml || "<p class='text-muted'>No risk events</p>";

showPage("user-detail");
} catch (err) {
console.error(err);
}
}

async function detailLockUser() {
if (!confirm("Lock this user? All script access will be blocked.")) return;
try {
await api(`/lockuser?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
showToast("User locked");
viewUserDetail(currentUser.key);
loadUsers();
} catch (err) {
console.error(err);
}
}

async function detailUnlockUser() {
if (!confirm("Unlock this user?")) return;
try {
await api(`/unlockuser?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
showToast("User unlocked");
viewUserDetail(currentUser.key);
loadUsers();
} catch (err) {
console.error(err);
}
}

async function detailChangeKey() {
const newKey = prompt("Enter new key:");
if (!newKey) return;
if (!confirm(`Change key to "${newKey}"?`)) return;
try {
await api("/changekey", {
method: "POST",
body: { oldToken: currentUser.key, newToken: newKey }
});
showToast("Key changed");
loadUsers();
showPage("users");
} catch (err) {
console.error(err);
}
}

async function detailResetSecurity() {
if (!confirm("Reset all security bindings (IPs, ASN, Country, Device)?")) return;
try {
await api(`/resetsecurity?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
showToast("Security reset");
viewUserDetail(currentUser.key);
} catch (err) {
console.error(err);
}
}

async function detailToggleStatus() {
const newStatus = currentUser.profile.status === "active" ? "disabled" : "active";
if (!confirm(`Set status to ${newStatus}?`)) return;
try {
await api("/edituser", {
method: "POST",
body: { token: currentUser.key, status: newStatus }
});
showToast(`User ${newStatus}`);
viewUserDetail(currentUser.key);
loadUsers();
} catch (err) {
console.error(err);
}
}

async function detailDelete() {
if (!confirm("Delete this user permanently?")) return;
try {
await api(`/delete?id=${encodeURIComponent(currentUser.key)}`, { method: "POST" });
showToast("User deleted");
loadUsers();
showPage("users");
} catch (err) {
console.error(err);
}
}

async function fetchScriptList() {
try {
const res = await api("/scripts");
allScripts = res.scripts || [];
renderScriptsList();
} catch (err) {
console.error(err);
}
}

function renderScriptsList() {
const grid = document.getElementById("scriptsList");
if (!allScripts.length) {
grid.innerHTML = "<div class='loading' style='grid-column:1/-1;'>No scripts yet</div>";
return;
}

grid.innerHTML = allScripts.map(s => `
<div class="script-card">
<div class="script-icon">📄</div>
<div class="script-name">${s}</div>
<div class="script-size">Script</div>
<div style="margin-top:12px;display:flex;gap:8px;">
<button class="btn-action" style="font-size:11px;padding:6px 10px;" onclick="copyScriptUrl('${s}')">Copy URL</button>
<button class="btn-action" style="font-size:11px;padding:6px 10px;" onclick="deleteScript('${s}')">Delete</button>
</div>
</div>
`).join("");
}

function copyScriptUrl(script) {
const url = WORKER_BASE_URL + "/" + encodeURIComponent(script);
navigator.clipboard.writeText(url).then(() => {
showToast(`Copied: ${script}`);
});
}

function openScriptUpload() {
document.getElementById("uploadModal").style.display = "flex";
}

function closeModal() {
document.getElementById("uploadModal").style.display = "none";
document.getElementById("scriptName").value = "";
document.getElementById("scriptContent").value = "";
}

async function uploadScript() {
const name = document.getElementById("scriptName").value.trim();
const content = document.getElementById("scriptContent").value.trim();

if (!name || !content) {
showToast("Name and content required", "error");
return;
}

if (!name.toLowerCase().endsWith(".js")) {
showToast("Filename must end with .js", "error");
return;
}

try {
await fetch(
API + `/script/upload?id=${encodeURIComponent(name)}&key=${encodeURIComponent(ADMIN_KEY)}`,
{
method: "POST",
body: content
}
);
showToast("Script uploaded");
closeModal();
fetchScriptList();
} catch (err) {
showToast(err.message, "error");
}
}

async function deleteScript(script) {
if (!confirm(`Delete ${script}?`)) return;
try {
await api(`/script/delete?id=${encodeURIComponent(script)}`, { method: "POST" });
showToast("Script deleted");
fetchScriptList();
} catch (err) {
console.error(err);
}
}

document.addEventListener("DOMContentLoaded", init);
