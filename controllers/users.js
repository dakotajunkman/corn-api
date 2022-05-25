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

router.get("/", async (req, res) => {
    const userArr = await user.getAllUsers();
    const returnJson = {
        count: userArr.length,
        users: userArr
    };

    res.status(200).json(returnJson);
});

module.exports = router;