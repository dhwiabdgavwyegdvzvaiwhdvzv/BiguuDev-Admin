// ==========================
// BiguuDev Admin Panel
// Part 1
// ==========================

const adminKey =
new URLSearchParams(location.search).get("key");

const API = "https://admin.biguudev.workers.dev";

const app = document.getElementById("app");

const title = document.getElementById("pageTitle");

// ==========================
// Helpers
// ==========================

async function api(path){

const res = await fetch(
API + path + "?key=" + adminKey
);

if(!res.ok){

throw new Error(await res.text());

}

return await res.json();

}

function setActive(id){

document
.querySelectorAll(".menu button")
.forEach(btn=>btn.classList.remove("active"));

document
.getElementById(id)
.classList.add("active");

}

function formatDate(timestamp){

if(!timestamp) return "-";

return new Date(
timestamp*1000
).toLocaleString();

}

// ==========================
// Dashboard
// ==========================

function dashboardHTML(data){

return `

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

Active Users

</div>

<div class="card-value">

${data.activeUsers}

</div>

</div>

<div class="card">

<div class="card-title">

Disabled Users

</div>

<div class="card-value">

${data.disabledUsers}

</div>

</div>

<div class="card">

<div class="card-title">

Expired Users

</div>

<div class="card-value">

${data.expiredUsers}

</div>

</div>

</div>

`;

}

async function showDashboard(){

title.textContent="Dashboard";

setActive("btnDashboard");

app.innerHTML=`
<div class="loader"></div>
`;

try{

const data =
await api("/statistics");

app.innerHTML =
dashboardHTML(data);

}catch(e){

app.innerHTML=`
<div class="empty">
${e.message}
</div>
`;

}

}

// ==========================
// Navigation
// ==========================

document
.getElementById("btnDashboard")
.onclick=showDashboard;

document
.getElementById("btnUsers")
.onclick=showUsers;

document
.getElementById("btnAdd")
.onclick=showAddUser;

document
.getElementById("btnStatistics")
.onclick=showStatistics;

document
.getElementById("btnSettings")
.onclick=showSettings;

// ==========================
// Placeholder Pages
// ==========================

function showAddUser(){

title.textContent="Add User";

setActive("btnAdd");

app.innerHTML=`
<div class="empty">
Coming Soon...
</div>
`;

}

function showStatistics(){

title.textContent="Statistics";

setActive("btnStatistics");

app.innerHTML=`
<div class="empty">
Coming Soon...
</div>
`;

}

function showSettings(){

title.textContent="Settings";

setActive("btnSettings");

app.innerHTML=`
<div class="empty">
Coming Soon...
</div>
`;

}

// Auto Start

showDashboard();
// ==========================
// Users
// ==========================

function statusBadge(status){

if(status==="active"){

return `
<span class="badge active">
Active
</span>
`;

}

return `
<span class="badge disabled">
Disabled
</span>
`;

}

function userRow(user){

return `

<tr>

<td>${user.username}</td>

<td>${statusBadge(user.status)}</td>

<td>${formatDate(user.expire)}</td>

<td>${formatDate(user.lastSeen)}</td>

<td>

<div class="actions">

<button class="btn btn-blue"
onclick="viewUser('${user.key}')">
View
</button>

<button class="btn btn-green"
onclick="enableUser('${user.key}')">
Enable
</button>

<button class="btn btn-gray"
onclick="resetIP('${user.key}')">
Reset IP
</button>

<button class="btn btn-red"
onclick="deleteUser('${user.key}')">
Delete
</button>

</div>

</td>

</tr>

`;

}

async function showUsers(){

title.textContent="Users";

setActive("btnUsers");

app.innerHTML=`
<div class="loader"></div>
`;

try{

const users=
await api("/users");

let html=`

<div class="toolbar">

<input

id="search"

class="search-box"

placeholder="Search user...">

</div>

<div class="table-container">

<table>

<thead>

<tr>

<th>Username</th>

<th>Status</th>

<th>Expire</th>

<th>Last Seen</th>

<th>Actions</th>

</tr>

</thead>

<tbody id="usersBody">

`;

for(const user of users){

html+=userRow(user);

}

html+=`

</tbody>

</table>

</div>

`;

app.innerHTML=html;

const search=
document.getElementById("search");

search.oninput=function(){

const keyword=
this.value.toLowerCase();

const rows=
document.querySelectorAll("#usersBody tr");

rows.forEach(row=>{

row.style.display=

row.innerText
.toLowerCase()
.includes(keyword)

?

""

:

"none";

});

};

}catch(e){

app.innerHTML=`
<div class="empty">

${e.message}

</div>
`;

}

}
// ==========================
// User Actions
// ==========================

async function viewUser(id){

try{

const res = await fetch(
API + "/user?key=" + adminKey + "&id=" + encodeURIComponent(id)
);

const user = await res.json();

alert(JSON.stringify(user,null,2));

}catch(e){

alert(e.message);

}

}

async function enableUser(id){

if(!confirm("Enable this user?")) return;

try{

await fetch(
API + "/enable?key=" + adminKey + "&id=" + encodeURIComponent(id)
);

showUsers();

}catch(e){

alert(e.message);

}

}

async function disableUser(id){

if(!confirm("Disable this user?")) return;

try{

await fetch(
API + "/disable?key=" + adminKey + "&id=" + encodeURIComponent(id)
);

showUsers();

}catch(e){

alert(e.message);

}

}

async function deleteUser(id){

if(!confirm("Delete this user?")) return;

try{

await fetch(
API + "/delete?key=" + adminKey + "&id=" + encodeURIComponent(id)
);

showUsers();

}catch(e){

alert(e.message);

}

}

async function resetIP(id){

if(!confirm("Reset user IP?")) return;

try{

await fetch(
API + "/resetip?key=" + adminKey + "&id=" + encodeURIComponent(id)
);

alert("IP Reset Successfully");

}catch(e){

alert(e.message);

}

}
