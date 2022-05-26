"use strict";

const constants = require("../common/constants");
const datastore = require("../common/datastore");
const ds = datastore.datastore;

function isValidCorn(body) {
    const keys = Object.keys(body);
    const validKeys = (keys.length === 2 || keys.length === 3)
        && keys.includes("size") && keys.includes("type");

    const validSize = typeof(body.size) === "number" && body.size > 0;
    const validType = constants.cornTypes.has(body.type);

    return validType && validSize && validKeys;
}

async function createCorn(req) {
    const key = ds.key([constants.CORN]);
    const cornObj = req.body;

    if (!isValidCorn(cornObj)) {
        return;
    }

    if (cornObj.kneeHighByFourthOfJuly === undefined) {
        cornObj.kneeHighByFourthOfJuly = null;
    }

    cornObj.farm = null;

    await ds.save({key: key, data: cornObj});
    cornObj.id = key.id;
    cornObj.self = constants.generateSelfFromReq(req, cornObj.id);

    return cornObj;
}

async function getCornById(req) {
    const key = ds.key([constants.CORN, parseInt(req.params.cornId, 10)]);

    const corn = await ds.get(key);

    if (!constants.itemExists(corn)) {
        return;
    }

    const retCorn = datastore.fromDatastore(corn[0]);
    retCorn.self = constants.generateSelfFromReq(req, retCorn.id);

    return retCorn;
}

module.exports = {
    createCorn,
    getCornById
}