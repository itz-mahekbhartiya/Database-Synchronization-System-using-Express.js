const express = require("express");
const app = express();
require("dotenv").config();
const Router = require("./src/routes/Router.js");
require('./src/cron/syncCron'); 

app.use(express.json());

app.use('/',Router);

app.listen(process.env.PORT,() => {
    console.log("Server started at port " + process.env.PORT)
});