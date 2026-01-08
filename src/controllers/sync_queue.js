const pool = require("../db/localDb.js");

async function fetchSyncQueue(req, res) {
  try {
    const [existingUser] = await pool.query("SELECT * FROM sync_queue");

    console.log(existingUser);

    return res.status(202).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sync Records</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f8;
          padding: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }
        th, td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          text-align: left;
        }
        th {
          background: #2c3e50;
          color: #fff;
        }
        .pending {
          color: #e67e22;
          font-weight: bold;
        }
      </style>
    </head>
    <body>

      <h2>Sync Records</h2>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Table</th>
            <th>Record ID</th>
            <th>Operation</th>
            <th>Last Updated</th>
            <th>Status</th>
            <th>Retry</th>
          </tr>
        </thead>
        <tbody>
          ${existingUser
            .map(
              (row) => `
            <tr>
              <td>${row.id}</td>
              <td>${row.table_name}</td>
              <td>${row.record_id}</td>
              <td>${row.operation}</td>
              <td>${new Date(row.last_updated_at).toLocaleString()}</td>
              <td class="pending">${row.sync_status}</td>
              <td>${row.retry_count}</td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>

    </body>
    </html>
  `);
  } catch (err) {
    console.log("Error occurred while updating user : " + err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

module.exports = { fetchSyncQueue };
