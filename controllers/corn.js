"use strict";

const constants = require("../common/constants");
const express = require("express");
const bodyParser = require("body-parser");
const corn = require("../models/corn-model");

const router = express.Router();
router.use(bodyParser.json());

// create some corn (what we're all here for TBH)
router.post("/", async (req, res) => {
    if (!constants.isJson(req)) {
        res.status(415).json(constants.jsonAccErr);
        return;
    }

    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const createdCorn = await corn.createCorn(req);
    if (createdCorn === undefined) {
        res.status(400).json(constants.bodyErr);
        return;
    }

    res.status(201).json(createdCorn);
});

module.exports = router;