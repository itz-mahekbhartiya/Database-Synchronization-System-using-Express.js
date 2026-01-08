const cron = require('node-cron');
require("dotenv").config();
const localPool = require("../db/localDb.js");
const centralPool = require("../db/centralDb.js");

// Runs every 2 minutes
cron.schedule('*/2 * * * *', async () => {
    console.log(`[${new Date().toISOString()}] Cron Job Triggered`);

    // check the user is online of offline, from .env file
    if (process.env.IS_ONLINE !== 'true') {
        console.log("System is OFFLINE. Skipping sync.");
        return;
    }

    console.log("System is ONLINE. Starting synchronization...");

    let connection; 
    try {
        connection = await localPool.getConnection();

        const [pendingRecords] = await connection.query(
            "SELECT * FROM sync_queue WHERE sync_status = 'PENDING' ORDER BY id ASC"
        );

        if (pendingRecords.length === 0) {
            console.log("No pending records to sync.");
            connection.release();
            return;
        }

        console.log(`Found ${pendingRecords.length} pending records.`);

        
        for (const task of pendingRecords) {
            try {
                // process each record one by one
                await processSyncTask(task);
            } catch (err) {
                console.error(`Failed to sync queue_id ${task.id}:`, err.message);
                
                // on failure the retry count increments
                await connection.query(
                    "UPDATE sync_queue SET retry_count = retry_count + 1 WHERE id = ?",
                    [task.id]
                );
            }
        }

    } catch (error) {
        console.error("Critical Cron Job Error:", error);
    } finally {
        // connection is released
        if (connection) connection.release();
    }
});


async function processSyncTask(task) {
    const { table_name, record_id, operation, id: queue_id } = task;

    // console.log(`Processing: ${operation} on ${table_name} (ID: ${record_id})`);

    // DELETE operation
    if (operation === 'DELETE') {
        await centralPool.query(`DELETE FROM ${table_name} WHERE id = ?`, [record_id]);
    } 
    
    // INSERT or UPDATE operations
    else {
        const [rows] = await localPool.query(`SELECT * FROM ${table_name} WHERE id = ?`, [record_id]);
        
        if (rows.length === 0) {
            // record not found in local db so marked as failed.
            console.warn(`Record ${record_id} not found in local ${table_name}. Marking queue item as FAILED.`);
            await localPool.query("UPDATE sync_queue SET sync_status = 'FAILED' WHERE id = ?", [queue_id]);
            return;
        }

        const data = rows[0];

        if (operation === 'INSERT') {
            // inserting the record
            if (table_name === 'users') {
                await centralPool.query(
                    "INSERT INTO users (id, name, email, updated_at) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE name=?, email=?, updated_at=?",
                    [data.id, data.name, data.email, data.updated_at, data.name, data.email, data.updated_at]
                );
            } else if (table_name === 'orders') {
                await centralPool.query(
                    "INSERT INTO orders (id, user_id, amount, status, updated_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE user_id=?, amount=?, status=?, updated_at=?",
                    [data.id, data.user_id, data.amount, data.status, data.updated_at, data.user_id, data.amount, data.status, data.updated_at]
                );
            }
        } 
        else if (operation === 'UPDATE') {
             // updating the record
             if (table_name === 'users') {
                await centralPool.query(
                    "UPDATE users SET name = ?, email = ?, updated_at = ? WHERE id = ?",
                    [data.name, data.email, data.updated_at, data.id]
                );
            } else if (table_name === 'orders') {
                await centralPool.query(
                    "UPDATE orders SET user_id = ?, amount = ?, status = ?, updated_at = ? WHERE id = ?",
                    [data.user_id, data.amount, data.status, data.updated_at, data.id]
                );
            }
        }
    }

    // updating the pending to synced in sync_queue
    await localPool.query(
        "UPDATE sync_queue SET sync_status = 'SYNCED', last_updated_at = NOW() WHERE id = ?",
        [queue_id]
    );

    // console.log(`Successfully synced queue_id ${queue_id}`);
}