"use strict";

const express = require("express");
const { google } = require("googleapis");
const constants = require("../common/constants");
const axios = require("axios");

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

    res.status(201).json({ url: url });
});

router.get("/", async (req, res) => {
    const code = req.query.code;
    const { tokens } = await oauthClient.getToken(code);

    const user = await axios.post(`${constants.home}/users`, {
        jwt: tokens.id_token
    });

    const data = {
        jwt: tokens.id_token,
        sub: user.data.user.sub
    };

    res.status(200).render("jwt", { data });
});

module.exports = router;
