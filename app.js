// =====================================
// BiguuDev Admin Panel v2
// app.js
// Part 1 - Core
// =====================================

const API = "https://biguudev-admin-v2.biguudev.workers.dev";

const ADMIN_KEY = new URLSearchParams(location.search).get("key");

const app = document.getElementById("app");
const pageTitle = document.getElementById("pageTitle");

const state = {

    users: [],

    statistics: {},

    settings: {},

    currentUser: null,

    loading: false

};

// =====================================
// API
// =====================================

async function api(path, options = {}) {

    const connector = path.includes("?") ? "&" : "?";

    const response = await fetch(

        API + path + connector + "key=" + encodeURIComponent(ADMIN_KEY),

        {
            headers: {

                "Content-Type": "application/json"

            },

            ...options

        }

    );

    let data;

    try {

        data = await response.json();

    } catch {

        throw new Error(await response.text());

    }

    if (!response.ok) {

        throw new Error(

            data.message ||

            "Server Error"

        );

    }

    return data;

}

// =====================================
// Helpers
// =====================================

function unixToDate(time){

    if(!time) return "-";

    return new Date(time*1000)

        .toLocaleString();

}

function showLoader(){

    app.innerHTML=`

<div class="loader"></div>

`;

}

function showError(text){

    app.innerHTML=`

<div class="empty">

${text}

</div>

`;

}

function setActive(id){

    document

    .querySelectorAll(".menu button")

    .forEach(btn=>{

        btn.classList.remove("active");

    });

    document

    .getElementById(id)

    .classList.add("active");

}

// =====================================
// Toast
// =====================================

let toast;

function createToast(){

    toast=document.createElement("div");

    toast.className="toast";

    document.body.appendChild(toast);

}

function showToast(message){

    if(!toast){

        createToast();

    }

    toast.textContent=message;

    toast.classList.add("show");

    clearTimeout(

        toast.timer

    );

    toast.timer=setTimeout(()=>{

        toast.classList.remove("show");

    },3000);

}

// =====================================
// Confirm Dialog
// =====================================

function confirmAction(message){

    return confirm(message);

}

// =====================================
// Dashboard
// =====================================

async function loadDashboard(){

    pageTitle.textContent="Dashboard";

    setActive("btnDashboard");

    showLoader();

    try{

        const data=

        await api("/statistics");

        state.statistics=data;

        app.innerHTML=`

<div class="cards">

<div class="card">

<div class="card-title">

Total Users

</div>

<div class="card-value">

${data.totalUsers}

</div>

</div>

<div class="card">

<div class="card-title">

Active

</div>

<div class="card-value">

${data.activeUsers}

</div>

</div>

<div class="card">

<div class="card-title">

Disabled

</div>

<div class="card-value">

${data.disabledUsers}

</div>

</div>

<div class="card">

<div class="card-title">

Expired

</div>

<div class="card-value">

${data.expiredUsers}

</div>

</div>

</div>

`;

    }

    catch(err){

        showError(err.message);

    }

}

// =====================================
// Navigation
// =====================================

document

.getElementById("btnDashboard")

.onclick=loadDashboard;

document

.getElementById("btnUsers")

.onclick=loadUsers;

document

.getElementById("btnAdd")

.onclick=loadAddUser;

document

.getElementById("btnStatistics")

.onclick=loadStatistics;

document

.getElementById("btnSettings")

.onclick=loadSettings;

// =====================================
// Start
// =====================================

createToast();

loadDashboard();
// =====================================
// BiguuDev Admin Panel v2
// app.js
// Part 2 - Users
// =====================================

// -------------------------------
// Status Badge
// -------------------------------

function statusBadge(status){

    if(status==="active"){

        return `<span class="badge active">Active</span>`;

    }

    if(status==="disabled"){

        return `<span class="badge disabled">Disabled</span>`;

    }

    return `<span class="badge expired">Expired</span>`;

}

// -------------------------------
// User Row
// -------------------------------

function userRow(user){

return `

<tr>

<td>${user.username}</td>

<td>${statusBadge(user.status)}</td>

<td>${unixToDate(user.expire)}</td>

<td>${unixToDate(user.lastSeen)}</td>

<td>${user.ip||"-"}</td>

<td>

<div class="actions">

<button
class="btn btn-blue"
onclick="viewUser('${user.key}')">

View

</button>

<button
class="btn btn-green"
onclick="enableUser('${user.key}')">

Enable

</button>

<button
class="btn btn-gray"
onclick="disableUser('${user.key}')">

Disable

</button>

<button
class="btn btn-red"
onclick="deleteUser('${user.key}')">

Delete

</button>

</div>

</td>

</tr>

`;

}

// -------------------------------
// Users Page
// -------------------------------

async function loadUsers(){

pageTitle.textContent="Users";

setActive("btnUsers");

showLoader();

try{

const res=await api("/users");

state.users=res.users||[];

renderUsers(state.users);

}catch(err){

showError(err.message);

}

}

// -------------------------------
// Render Users
// -------------------------------

function renderUsers(users){

let html=`

<div class="toolbar">

<input

id="searchUser"

class="search-box"

placeholder="Search user...">

<button

class="btn btn-gold"

onclick="refreshUsers()">

Refresh

</button>

</div>

<div class="table-container">

<table>

<thead>

<tr>

<th>Username</th>

<th>Status</th>

<th>Expire</th>

<th>Last Seen</th>

<th>IP</th>

<th>Actions</th>

</tr>

</thead>

<tbody>

`;

users.forEach(user=>{

html+=userRow(user);

});

html+=`

</tbody>

</table>

</div>

`;

app.innerHTML=html;

// -------------------------------
// Search
// -------------------------------

document

.getElementById("searchUser")

.oninput=function(){

const keyword=

this.value

.toLowerCase()

.trim();

const filtered=

state.users.filter(user=>{

return(

user.username

.toLowerCase()

.includes(keyword)

||

(user.ip||"")

.toLowerCase()

.includes(keyword)

);

});

renderUsers(filtered);

};

}

// -------------------------------
// Refresh
// -------------------------------

async function refreshUsers(){

showToast("Refreshing...");

await loadUsers();

}

// -------------------------------
// View User
// -------------------------------

async function viewUser(id){

try{

const data=

await api(

"/user?id="+

encodeURIComponent(id)

);

state.currentUser=data;

alert(

JSON.stringify(

data,

null,

2

)

);

}catch(err){

alert(err.message);

}

}

// -------------------------------
// Auto Refresh
// -------------------------------

setInterval(()=>{

if(

pageTitle.textContent==="Users"

){

refreshUsers();

}

},30000);
// =====================================
// BiguuDev Admin Panel v2
// app.js
// Part 3 - User Management
// =====================================

// -------------------------------
// Add User Page
// -------------------------------

function loadAddUser(){

pageTitle.textContent="Add User";

setActive("btnAdd");

const expire=Math.floor(Date.now()/1000)+(30*24*60*60);

app.innerHTML=`

<div class="form-card">

<h2>Create User</h2>

<div class="form">

<div class="form-group">

<label>Username</label>

<input
id="username"
type="text"
placeholder="Username">

</div>

<div class="form-group">

<label>Token</label>

<input
id="token"
type="text"
placeholder="Unique Token">

</div>

<div class="form-group">

<label>Expire (Unix)</label>

<input
id="expire"
type="number"
value="${expire}">

</div>

<div class="form-group">

<label>&nbsp;</label>

<button
class="btn btn-gold"
onclick="createUser()">

Create User

</button>

</div>

</div>

<div id="createResult"></div>

</div>

`;

}

// -------------------------------
// Create User
// -------------------------------

async function createUser(){

const username=

document

.getElementById("username")

.value.trim();

const token=

document

.getElementById("token")

.value.trim();

const expire=

Number(

document

.getElementById("expire")

.value

);

if(!username){

showToast("Username required");

return;

}

if(!token){

showToast("Token required");

return;

}

if(!expire){

showToast("Expire required");

return;

}

try{

showToast("Creating...");

const result=

await api(

"/adduser",

{

method:"POST",

body:JSON.stringify({

username,

token,

expire

})

}

);

showToast(result.message);

setTimeout(()=>{

loadUsers();

},500);

}catch(err){

showToast(err.message);

}

}

// -------------------------------
// Enable User
// -------------------------------

async function enableUser(id){

if(

!confirmAction(

"Enable this user?"

)

) return;

try{

const result=

await api(

"/enable?id="+

encodeURIComponent(id),

{

method:"POST"

}

);

showToast(result.message);

refreshUsers();

}catch(err){

showToast(err.message);

}

}

// -------------------------------
// Disable User
// -------------------------------

async function disableUser(id){

if(

!confirmAction(

"Disable this user?"

)

) return;

try{

const result=

await api(

"/disable?id="+

encodeURIComponent(id),

{

method:"POST"

}

);

showToast(result.message);

refreshUsers();

}catch(err){

showToast(err.message);

}

}

// -------------------------------
// Delete User
// -------------------------------

async function deleteUser(id){

if(

!confirmAction(

"Delete this user?"

)

) return;

try{

const result=

await api(

"/delete?id="+

encodeURIComponent(id),

{

method:"POST"

}

);

showToast(result.message);

refreshUsers();

}catch(err){

showToast(err.message);

}

}

// -------------------------------
// Reset IP
// -------------------------------

async function resetIP(id){

if(

!confirmAction(

"Reset IP?"

)

) return;

try{

const result=

await api(

"/resetip?id="+

encodeURIComponent(id),

{

method:"POST"

}

);

showToast(result.message);

}catch(err){

showToast(err.message);

}

}

// -------------------------------
// Edit User
// -------------------------------

async function editUser(id){

const data=

await api(

"/user?id="+

encodeURIComponent(id)

);

const user=data.profile;

const username=

prompt(

"Username",

user.username

);

if(username===null) return;

const expire=

prompt(

"Expire",

user.expire

);

if(expire===null) return;

try{

const result=

await api(

"/edituser",

{

method:"POST",

body:JSON.stringify({

token:id,

username,

expire:Number(expire)

})

}

);

showToast(result.message);

refreshUsers();

}catch(err){

showToast(err.message);

}

}
// =====================================
// BiguuDev Admin Panel v2
// app.js
// Part 4 - Statistics & Settings
// =====================================

// ---------------------------------
// Statistics
// ---------------------------------

async function loadStatistics(){

    pageTitle.textContent="Statistics";

    setActive("btnStatistics");

    showLoader();

    try{

        const stats=await api("/statistics");

        state.statistics=stats;

        app.innerHTML=`

<div class="cards">

<div class="card">

<div class="card-title">
Total Users
</div>

<div class="card-value">
${stats.totalUsers}
</div>

</div>

<div class="card">

<div class="card-title">
Active Users
</div>

<div class="card-value">
${stats.activeUsers}
</div>

</div>

<div class="card">

<div class="card-title">
Disabled Users
</div>

<div class="card-value">
${stats.disabledUsers}
</div>

</div>

<div class="card">

<div class="card-title">
Expired Users
</div>

<div class="card-value">
${stats.expiredUsers}
</div>

</div>

</div>

<br>

<div class="table-container">

<table>

<tr>

<th>Server Time</th>

<td>${unixToDate(stats.serverTime)}</td>

</tr>

<tr>

<th>Total Accounts</th>

<td>${stats.totalUsers}</td>

</tr>

<tr>

<th>Enabled</th>

<td>${stats.activeUsers}</td>

</tr>

<tr>

<th>Disabled</th>

<td>${stats.disabledUsers}</td>

</tr>

<tr>

<th>Expired</th>

<td>${stats.expiredUsers}</td>

</tr>

</table>

</div>

`;

    }

    catch(err){

        showError(err.message);

    }

}

// ---------------------------------
// Settings
// ---------------------------------

async function loadSettings(){

    pageTitle.textContent="Settings";

    setActive("btnSettings");

    showLoader();

    try{

        const res=await api("/settings");

        state.settings=res.settings;

        app.innerHTML=`

<div class="form-card">

<h2>Panel Settings</h2>

<div class="form">

<div class="form-group">

<label>Panel Name</label>

<input
id="panelName"
value="${res.settings.panelName}">

</div>

<div class="form-group">

<label>Default Expire Days</label>

<input
id="expireDays"
type="number"
value="${res.settings.defaultExpireDays}">

</div>

<div class="form-group">

<label>Maintenance</label>

<select id="maintenance">

<option value="false">
Disabled
</option>

<option value="true"
${res.settings.maintenance?"selected":""}>
Enabled
</option>

</select>

</div>

<div class="form-group">

<label>Allow Registration</label>

<select id="registration">

<option value="true"
${res.settings.allowRegistration?"selected":""}>
Yes
</option>

<option value="false"
${!res.settings.allowRegistration?"selected":""}>
No
</option>

</select>

</div>

<div class="form-full">

<button

class="btn btn-gold"

onclick="saveSettings()">

Save Settings

</button>

</div>

</div>

</div>

`;

    }

    catch(err){

        showError(err.message);

    }

}

// ---------------------------------
// Save Settings
// ---------------------------------

async function saveSettings(){

try{

const body={

panelName:

document

.getElementById("panelName")

.value,

maintenance:

document

.getElementById("maintenance")

.value==="true",

allowRegistration:

document

.getElementById("registration")

.value==="true",

defaultExpireDays:

Number(

document

.getElementById("expireDays")

.value

),

version:"2.0"

};

const result=

await api(

"/settings",

{

method:"POST",

body:JSON.stringify(body)

}

);

showToast(result.message);

}

catch(err){

showToast(err.message);

}

}

// ---------------------------------
// Backup
// ---------------------------------

async function downloadBackup(){

try{

const backup=

await api("/backup");

const blob=new Blob(

[

JSON.stringify(

backup,

null,

2

)

],

{

type:"application/json"

}

);

const a=document.createElement("a");

a.href=URL.createObjectURL(blob);

a.download="BiguuDevBackup.json";

a.click();

URL.revokeObjectURL(a.href);

showToast("Backup Downloaded");

}

catch(err){

showToast(err.message);

}

}

// ---------------------------------
// Server Info
// ---------------------------------

async function serverInfo(){

try{

const info=

await api("/server");

alert(

JSON.stringify(

info,

null,

2

)

);

}

catch(err){

showToast(err.message);

}

}

// ---------------------------------
// Keyboard Shortcuts
// ---------------------------------

document.addEventListener(

"keydown",

e=>{

if(e.ctrlKey && e.key==="r"){

e.preventDefault();

refreshUsers();

}

if(e.ctrlKey && e.key==="d"){

e.preventDefault();

loadDashboard();

}

if(e.ctrlKey && e.key==="u"){

e.preventDefault();

loadUsers();

}

}

);

// ---------------------------------
// Auto Dashboard Refresh
// ---------------------------------

setInterval(()=>{

if(pageTitle.textContent==="Dashboard"){

loadDashboard();

}

},60000);

// =====================================
// End of app.js
// =====================================

console.log(
"%cBiguuDev Admin Panel v2",
"color:#D4AF37;font-size:18px;font-weight:bold;"
);

console.log("App Loaded Successfully.");
// =====================================
// BiguuDev Admin Panel v2
// Part 5 - Premium Features
// =====================================

// -------------------------------------
// Generate Token
// -------------------------------------

function generateToken(length = 32){

    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    let token = "";

    for(let i=0;i<length;i++){

        token += chars.charAt(
            Math.floor(Math.random()*chars.length)
        );

    }

    return token;

}

window.generateToken = generateToken;

// -------------------------------------
// Fill Token Button
// -------------------------------------

function randomToken(){

    const input =
        document.getElementById("token");

    if(!input) return;

    input.value = generateToken();

}

// -------------------------------------
// Copy Text
// -------------------------------------

async function copyText(text){

    try{

        await navigator.clipboard.writeText(text);

        showToast("Copied");

    }

    catch{

        showToast("Copy Failed");

    }

}

// -------------------------------------
// Export CSV
// -------------------------------------

function exportCSV(){

    if(!state.users.length){

        showToast("No Users");

        return;

    }

    const rows = [

        [
            "Username",
            "Status",
            "Expire",
            "Last Seen",
            "IP"
        ]

    ];

    state.users.forEach(user=>{

        rows.push([

            user.username,

            user.status,

            unixToDate(user.expire),

            unixToDate(user.lastSeen),

            user.ip

        ]);

    });

    const csv = rows
        .map(r=>r.join(","))
        .join("\n");

    const blob = new Blob(

        [csv],

        {

            type:"text/csv"

        }

    );

    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);

    a.download = "users.csv";

    a.click();

}

// -------------------------------------
// Dashboard Cards Animation
// -------------------------------------

function animateCards(){

    document

    .querySelectorAll(".card")

    .forEach((card,index)=>{

        card.style.opacity="0";

        card.style.transform="translateY(15px)";

        setTimeout(()=>{

            card.style.transition=".3s";

            card.style.opacity="1";

            card.style.transform="translateY(0px)";

        },index*80);

    });

}

// -------------------------------------
// Theme
// -------------------------------------

function toggleTheme(){

    document.body.classList.toggle(

        "light"

    );

    showToast("Theme Changed");

}

// -------------------------------------
// Live Clock
// -------------------------------------

function startClock(){

    const topbar =

        document.querySelector(

            ".topbar"

        );

    if(!topbar) return;

    let clock =

        document.getElementById(

            "liveClock"

        );

    if(!clock){

        clock=document.createElement("div");

        clock.id="liveClock";

        topbar.appendChild(clock);

    }

    setInterval(()=>{

        clock.textContent=

            new Date()

            .toLocaleTimeString();

    },1000);

}

// -------------------------------------
// Refresh Statistics
// -------------------------------------

async function refreshStatistics(){

    if(pageTitle.textContent!=="Statistics"){

        return;

    }

    await loadStatistics();

}

// -------------------------------------
// Refresh Dashboard
// -------------------------------------

async function refreshDashboard(){

    if(pageTitle.textContent!=="Dashboard"){

        return;

    }

    await loadDashboard();

}

// -------------------------------------
// Startup
// -------------------------------------

document.addEventListener(

    "DOMContentLoaded",

    ()=>{

        startClock();

    }

);

// -------------------------------------
// Timers
// -------------------------------------

setInterval(

    refreshDashboard,

    60000

);

setInterval(

    refreshStatistics,

    120000

);

console.log("Premium Module Loaded");
// =====================================
// BiguuDev Admin Panel v2
// Part 6 - Premium UI
// =====================================

// -------------------------------------
// Modal
// -------------------------------------

let modal=null;

function createModal(){

    if(modal) return;

    modal=document.createElement("div");

    modal.className="modal";

    modal.innerHTML=`

<div class="modal-box">

<div id="modalContent"></div>

<br>

<div style="display:flex;justify-content:flex-end;gap:10px;">

<button

class="btn btn-gray"

onclick="closeModal()">

Close

</button>

</div>

</div>

`;

    document.body.appendChild(modal);

}

function openModal(html){

    createModal();

    document

    .getElementById("modalContent")

    .innerHTML=html;

    modal.classList.add("show");

}

function closeModal(){

    if(modal){

        modal.classList.remove("show");

    }

}

// -------------------------------------
// User Details Modal
// -------------------------------------

async function viewUser(id){

    try{

        const res=await api(

            "/user?id="+

            encodeURIComponent(id)

        );

        const p=res.profile;

        const s=res.security;

        openModal(`

<h2>${p.username}</h2>

<table style="width:100%;">

<tr>

<td>Status</td>

<td>${p.status}</td>

</tr>

<tr>

<td>Expire</td>

<td>${unixToDate(p.expire)}</td>

</tr>

<tr>

<td>Created</td>

<td>${unixToDate(p.created)}</td>

</tr>

<tr>

<td>Last Seen</td>

<td>${unixToDate(p.lastSeen)}</td>

</tr>

<tr>

<td>IP</td>

<td>${s.ip||"-"}</td>

</tr>

<tr>

<td>Device</td>

<td>${s.device||"-"}</td>

</tr>

<tr>

<td>Failed</td>

<td>${s.failed}</td>

</tr>

<tr>

<td>Locked</td>

<td>${s.lock?"Yes":"No"}</td>

</tr>

</table>

<br>

<div class="actions">

<button

class="btn btn-blue"

onclick="copyText('${id}')">

Copy Token

</button>

<button

class="btn btn-green"

onclick="resetIP('${id}')">

Reset IP

</button>

</div>

`);

    }

    catch(err){

        showToast(err.message);

    }

}

// -------------------------------------
// Sort Users
// -------------------------------------

let sortDirection=true;

function sortUsers(field){

    state.users.sort((a,b)=>{

        let x=a[field];

        let y=b[field];

        if(typeof x==="string"){

            x=x.toLowerCase();

            y=y.toLowerCase();

        }

        if(x<y) return sortDirection?-1:1;

        if(x>y) return sortDirection?1:-1;

        return 0;

    });

    sortDirection=!sortDirection;

    renderUsers(state.users);

}

// -------------------------------------
// Pagination
// -------------------------------------

let currentPage=1;

const rowsPerPage=10;

function renderPagedUsers(){

    const start=

        (currentPage-1)

        *rowsPerPage;

    const end=

        start+rowsPerPage;

    renderUsers(

        state.users.slice(start,end)

    );

}

function nextPage(){

    if(

        currentPage*

        rowsPerPage

        <

        state.users.length

    ){

        currentPage++;

        renderPagedUsers();

    }

}

function prevPage(){

    if(currentPage>1){

        currentPage--;

        renderPagedUsers();

    }

}

// -------------------------------------
// Quick Search
// -------------------------------------

function quickSearch(keyword){

    keyword=

    keyword

    .toLowerCase()

    .trim();

    const filtered=

    state.users.filter(u=>{

        return(

            u.username

            .toLowerCase()

            .includes(keyword)

            ||

            (u.ip||"")

            .toLowerCase()

            .includes(keyword)

            ||

            u.status

            .toLowerCase()

            .includes(keyword)

        );

    });

    renderUsers(filtered);

}

// -------------------------------------
// Reload Current Page
// -------------------------------------

function reloadCurrentPage(){

    switch(

        pageTitle.textContent

    ){

        case"Dashboard":

            loadDashboard();

            break;

        case"Users":

            loadUsers();

            break;

        case"Statistics":

            loadStatistics();

            break;

        case"Settings":

            loadSettings();

            break;

    }

}

// -------------------------------------
// Window Focus Refresh
// -------------------------------------

window.addEventListener(

    "focus",

    ()=>{

        reloadCurrentPage();

    }

);

// -------------------------------------
// Escape Key
// -------------------------------------

window.addEventListener(

    "keydown",

    e=>{

        if(

            e.key==="Escape"

        ){

            closeModal();

        }

    }

);

console.log(

"Premium UI Loaded"

);
// =====================================
// BiguuDev Admin Panel v2
// Part 7 - Production Edition
// =====================================

// -------------------------------------
// Notification Center
// -------------------------------------

const notifications=[];

function notify(title,message,type="info"){

    notifications.unshift({

        title,

        message,

        type,

        time:new Date().toLocaleTimeString()

    });

    if(notifications.length>50){

        notifications.pop();

    }

    showToast(title);

}

function showNotifications(){

    let html="<h2>Notifications</h2>";

    if(!notifications.length){

        html+="<p>No notifications.</p>";

    }else{

        html+="<div>";

        notifications.forEach(item=>{

            html+=`

<div class="card" style="margin-bottom:10px;">

<b>${item.title}</b>

<br>

${item.message}

<br>

<small>${item.time}</small>

</div>

`;

        });

        html+="</div>";

    }

    openModal(html);

}

// -------------------------------------
// Activity Log
// -------------------------------------

const activityLog=[];

function logActivity(action,user="System"){

    activityLog.unshift({

        action,

        user,

        time:new Date().toLocaleString()

    });

    if(activityLog.length>200){

        activityLog.pop();

    }

}

function showLogs(){

    let html="<h2>Activity Log</h2>";

    html+="<table style='width:100%;'>";

    html+="<tr><th>Time</th><th>User</th><th>Action</th></tr>";

    activityLog.forEach(log=>{

        html+=`

<tr>

<td>${log.time}</td>

<td>${log.user}</td>

<td>${log.action}</td>

</tr>

`;

    });

    html+="</table>";

    openModal(html);

}

// -------------------------------------
// Dashboard Chart
// -------------------------------------

function drawDashboardChart(){

    const canvas=document.getElementById("statsChart");

    if(!canvas) return;

    const ctx=canvas.getContext("2d");

    const stats=state.statistics;

    const values=[

        stats.activeUsers||0,

        stats.disabledUsers||0,

        stats.expiredUsers||0

    ];

    const colors=[

        "#22c55e",

        "#ef4444",

        "#f59e0b"

    ];

    ctx.clearRect(0,0,canvas.width,canvas.height);

    const max=Math.max(...values,1);

    values.forEach((v,i)=>{

        const h=(v/max)*180;

        ctx.fillStyle=colors[i];

        ctx.fillRect(

            50+(i*90),

            220-h,

            55,

            h

        );

    });

}

// -------------------------------------
// Session
// -------------------------------------

const session={

    login:new Date(),

    actions:0

};

function sessionAction(){

    session.actions++;

}

// -------------------------------------
// Performance
// -------------------------------------

function debounce(fn,delay){

    let timer;

    return(...args)=>{

        clearTimeout(timer);

        timer=setTimeout(()=>{

            fn(...args);

        },delay);

    };

}

// -------------------------------------
// Search Upgrade
// -------------------------------------

const smartSearch=debounce(function(value){

    quickSearch(value);

},250);

// -------------------------------------
// Health Monitor
// -------------------------------------

async function checkServer(){

    try{

        await api("/");

    }

    catch{

        notify(

            "Server",

            "Connection Lost",

            "error"

        );

    }

}

setInterval(

    checkServer,

    120000

);

// -------------------------------------
// Memory
// -------------------------------------

window.addEventListener(

    "beforeunload",

    ()=>{

        localStorage.setItem(

            "lastPage",

            pageTitle.textContent

        );

    }

);

// -------------------------------------
// Restore
// -------------------------------------

window.addEventListener(

    "load",

    ()=>{

        const last=

        localStorage.getItem(

            "lastPage"

        );

        switch(last){

            case"Users":

                loadUsers();

                break;

            case"Statistics":

                loadStatistics();

                break;

            case"Settings":

                loadSettings();

                break;

        }

    }

);

// -------------------------------------
// Welcome
// -------------------------------------

notify(

    "BiguuDev",

    "Admin Panel Ready"

);

logActivity(

    "Application Started"

);

// -------------------------------------
// Console Banner
// -------------------------------------

console.clear();

console.log(

"%cBIGUUDEV ADMIN PANEL",

"font-size:28px;font-weight:bold;color:#D4AF37;"

);

console.log(

"%cProduction Build v2.0",

"font-size:14px;color:#999;"

);

console.log(

"Worker Connected ✔"

);

console.log(

"KV Ready ✔"

);

console.log(

"UI Ready ✔"

);

console.log(

"Loaded Successfully."

);

// =====================================
// END OF APP.JS
// =====================================
