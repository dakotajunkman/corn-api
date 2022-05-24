"use strict";

const jwtDecode = require("jsonwebtoken");
const constants = require("../common/constants");
const datastore = require("../common/datastore");
const ds = datastore.datastore;

async function createUser(jwt) {
    const decoded = jwtDecode.decode(jwt);
    const key = ds.key([constants.USER]);
    const user = {
        sub: decoded.sub,
        firstName: decoded.given_name,
        lastName: decoded.family_name
    }

    await ds.save({key: key, data: user});
    user.id = key.id;
    return user;
}

module.exports = {
    createUser
}