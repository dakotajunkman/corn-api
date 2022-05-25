"use strict";

const constants = require("../common/constants");
const datastore = require("../common/datastore");
const ds = datastore.datastore;

function itemExists(item) {
    return item[0] !== undefined && item[0] !== null;
}

function validBody(farmObj) {
    const keys = Object.keys(farmObj);
    const validKeys = keys.length === 3 &&
        keys.includes(constants.NAME) &&
        keys.includes(constants.STATE) && 
        keys.includes(constants.SIZE);
    
    const validName = typeof(farmObj.name) === "string" && farmObj.name.length > 0 && farmObj.name.length < 50;
    const validSize = typeof(farmObj.size) === "number" && farmObj.size > 0;
    const validState = constants.states.has(farmObj.state);

    return validKeys && validName && validSize && validState;
}

async function createFarm(req) {
    const body = req.body;
    if(!validBody(body)) {
        return;
    }

    body.owner = req.auth.sub;

    const key = ds.key([constants.FARM]);
    await ds.save({key: key, data: body});
    body.id = key.id;
    body.self = constants.generateSelfFromReq(req, body.id);

    return body;
}

module.exports = {
    createFarm
}