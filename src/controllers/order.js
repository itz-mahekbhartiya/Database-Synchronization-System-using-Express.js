const pool = require("../db/localDb.js");

async function createOrder(req, res) {
  try {
    const { user_id, amount } = req.body;

    console.log("data : ", user_id, amount);

    if (!user_id || !amount) {
      return res.status(400).json({ message: "Incomplete Data !!!" });
    }

    const [insertResult] = await pool.query(
      "INSERT INTO orders (user_id, amount) VALUES (?,?)",
      [user_id, amount]
    );

    await pool.query(
      "INSERT INTO sync_queue (table_name, record_id, operation, sync_status) VALUES (?,?,?,?)",
      ["orders", insertResult.insertId, "INSERT", "PENDING"]
    );

    return res
      .status(200)
      .json({ message: "Order is added to the databases." });
  } catch (err) {
    console.error("Error in createUser:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

async function updateOrder(req, res) {
  try {
    const { user_id, amount } = req.body;
    const id = req.params.id;
    if (!user_id || !amount) {
      return res.status(400).json({ message: "Incomplete Data !!!" });
    }

    const [existingOrder] = await pool.query(
      "SELECT * FROM orders WHERE id = ?",
      [id]
    );

    await pool.query("UPDATE orders set user_id = ?, amount = ? WHERE id = ?", [
      user_id,
      amount,
      id,
    ]);

    await pool.query(
      "INSERT INTO sync_queue (table_name, record_id, operation, sync_status) VALUES (?,?,?,?)",
      ["orders", id, "UPDATE", "PENDING"]
    );

    return res.status(200).json({ message: "Order is updated successfully." });
  } catch (err) {
    console.error("Error in createUser:", err);
    return res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
  }
}

module.exports = { createOrder, updateOrder };
