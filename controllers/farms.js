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
