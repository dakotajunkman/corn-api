"use strict";

const express = require("express");
const { google } = require("googleapis");
const constants = require("../common/constants");

const router = express.Router();
const oauthClient = new google.auth.OAuth2(
    constants.clientId,
    constants.clientSecret,
    constants.callback
);

const scope = [constants.scope];

router.post("/", (req, res) => {
    const url = oauthClient.generateAuthUrl({
        access_type: "offline", 
        scope: scope
    });

    res.status(201).json({url: url});
});

module.exports = router;
