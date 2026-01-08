const express = require("express");
const Router = express.Router();
const {createUser,updateUser} = require("../controllers/user.js");
const {createOrder, updateOrder} = require("../controllers/order.js");
const {fetchSyncQueue} = require("../controllers/sync_queue.js");

Router.post("/users",createUser);
Router.put("/users/:email",updateUser);


Router.post("/orders",createOrder);
Router.put("/orders/:id",updateOrder);


Router.get("/sync/status",fetchSyncQueue);


module.exports = Router;