"use strict";

const express = require("express");
const path = require("path");
const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use("/auth", require("./controllers/auth.js"));

app.get("/", (req, res) => {
    res.render("welcome");
})

const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => {
    console.log(`Listening for corn on port ${PORT}`);
});

module.exports = app;