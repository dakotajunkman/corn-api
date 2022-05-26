"use strict";

const constants = require("../common/constants");
const express = require("express");
const bodyParser = require("body-parser");
const { expressjwt: jwt } = require("express-jwt");
const jwk = require("jwks-rsa");
const farms = require("../models/farm-model");

const checkJwt = jwt({
    issuer: "https://accounts.google.com",
    algorithms: ["RS256"],
    secret: jwk.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: "https://www.googleapis.com/oauth2/v3/certs"
    })
});

const router = express.Router();
router.use(bodyParser.json());

// create a farm
router.post("/", checkJwt, async (req, res) => {
    if (!constants.isJson(req)) {
        res.status(415).json(constants.jsonAccErr);
        return;
    }

    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const created = await farms.createFarm(req);
    if (created === undefined) {
        res.status(400).json(constants.bodyErr);
        return;
    }

    res.status(201).json(created);
});

// get farm by ID
router.get("/:farmId", checkJwt, async (req, res) => {
    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const farm = await farms.getFarmById(req);

    switch (farm) {
        case undefined:
            res.status(404).json(constants.doesntExit);
            break;
        case false:
            res.status(403).json(constants.noAccess);
            break;
        default:
            res.status(200).json(farm);
            break;
    }
});

// get all farms for a user
router.get("/", checkJwt, async (req, res) => {
    if (!constants.acceptJson(req)) {
        res.status(406).json(constants.jsonResErr);
        return;
    }

    const results = await farms.getFarmsForOwner(req);
    res.status(200).json(results);
});

// assign some corn to a farm
router.put("/:farmId/cornfields/:cornId", checkJwt, async (req, res) => {
    const success = await farms.assignCorn(req);
    switch (success) {
        case undefined:
            res.status(404).json(constants.itemsNoExist);
            break;
        case false:
            res.status(403).json(constants.unAuthed);
            break;
        default:
            res.status(204).end();
            break;
    }
});

// remove corn from a farm
router.delete("/:farmId/cornfields/:cornId", checkJwt, async (req, res) => {
    const success = await farms.removeCorn(req);
    switch (success) {
        case undefined:
            res.status(404).json(constants.itemsNoExist);
            break;
        case false:
            res.status(403).json(constants.unAuthed);
            break;
        default:
            res.status(204).end();
            break;
    }
});

// garbage we will not tolerate
router.delete("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

router.put("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

router.patch("/", (req, res) => {
    res.status(405).set("Accept", "POST, GET").end();
});

// catch JWT errors (invalid or missing)
router.use((err, req, res, next) => {
    if (err.name === "UnauthorizedError") {
        res.status(401).json({"Error": "Invalid token"});
    } else {
        res.status(500).send(err.response ?? "No corn available!");
    }
});

module.exports = router;
