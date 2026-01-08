const pool = require("../db/localDb.js");

async function createUser(req, res) {
  try {
    const { name, email } = req.body;
    // console.log("Data received:", name, email);

    if (!name || !email) {
      return res.status(400).json({ message: "Incomplete data!" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
    return res.status(400).json({ message: "Invalid email format" });
    }

    const [existingUser] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({ message: "User with this email already exists." });
    }

    const [insertResult] = await pool.query(
      "INSERT INTO users (name, email) VALUES (?, ?)",
      [name, email]
    );

    await pool.query("INSERT INTO sync_queue (table_name, record_id, operation, sync_status) VALUES (?,?,?,?)",
        ["users", insertResult.insertId, 'INSERT', "PENDING"]
    )

    return res.status(201).json({ message: "User created"});

  } catch (err) {
    console.error("Error in createUser:", err);
    return res.status(500).json({ message: "Internal Server Error", error: err.message });
  }
}


async function updateUser(req, res) {
    try{

        const email = req.params.email;
        const {name, newEmail} = req.body;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(newEmail) && !emailRegex.test(email)) {
            return res.status(400).json({ message: "Invalid email format" });
        }

        console.log("user data is : " + [name, newEmail])

        if (!name || !email) {
        return res.status(400).json({ message: "Incomplete data!" });
        }

        const [existingUser] = await pool.query(
        "SELECT * FROM users WHERE email = ?",
        [email]
        );

        // console.log(existingUser)

        if (existingUser.length <= 0) {
        return res.status(409).json({ message: "User with this email doesn't exists." });
        }

        await pool.query(`UPDATE users SET name = ?, email = ? WHERE email = ?`,
            [name, newEmail, email]
        )


        await pool.query("INSERT INTO sync_queue (table_name, record_id, operation, sync_status) VALUES (?,?,?,?)",
        ["users", existingUser[0].id, 'UPDATE', "PENDING"])

        return res.status(202).json({message: "User updated"}); 

    }catch(err){
        console.log("Error occurred while updating user : " +err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
 
    }
    
}


module.exports = { createUser,updateUser };