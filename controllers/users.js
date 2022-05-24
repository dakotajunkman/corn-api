"use strict";

const express = require("express");
const user = require("../models/user-model");
const bodyParser = require("body-parser");

const router = express.Router();
router.use(bodyParser.json());

router.post("/", async (req, res) => {
    const body = req.body;
    const createdUser = await user.createUser(body.jwt);

    res.status(201).json({user: createdUser});
});

module.exports = router;