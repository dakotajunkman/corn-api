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

// get some corn
router.get("/:cornId", async (req, res) => {
    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const cornField = await corn.getCornById(req);
    if(cornField === undefined) {
        res.status(404).json(constants.doesntExit);
        return;
    }

    res.status(200).json(cornField);
});

// get all the corn (everyone's dream)
router.get("/", async (req, res) => {
    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const allCorn = await corn.getAllCorn(req);

    res.status(200).json(allCorn);
});

// delete corn (Why though?)
router.delete("/:cornId", async (req, res) => {
    const success = await corn.deleteCorn(req);

    if (!success) {
        res.status(404).json(constants.doesntExit);
        return;
    }

    res.status(204).end();
});

// nobody will be allowed to delete all the corn
router.delete("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

router.put("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

router.patch("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

module.exports = router;