"use strict";

const constants = require("../common/constants");
const datastore = require("../common/datastore");
const ds = datastore.datastore;

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

async function getFarmAndCorn(farmId, cornId) {
    const farmKey = ds.key([constants.FARM, parseInt(farmId, 10)]);
    const cornKey = ds.key([constants.CORN, parseInt(cornId, 10)]);

    const res = await Promise.all([ds.get(farmKey), ds.get(cornKey)]);

    return res;
}

async function updateFarmAndCorn(farm, farmId, corn, cornId) {
    const farmKey = ds.key([constants.FARM, parseInt(farmId, 10)]);
    const cornKey = ds.key([constants.CORN, parseInt(cornId, 10)]);
    await Promise.all([ds.update({key: farmKey, data: farm}), ds.update({key: cornKey, data: corn})]);
}

async function createFarm(req) {
    const body = req.body;
    if(!validBody(body)) {
        return;
    }

    body.owner = req.auth.sub;
    body.cornFields = [];

    const key = ds.key([constants.FARM]);
    await ds.save({key: key, data: body});
    body.id = key.id;
    body.self = constants.generateSelfFromReq(req, body.id);


    return body;
}

async function getFarmById(req) {
    const key = ds.key([constants.FARM, parseInt(req.params.farmId, 10)]);
    const farmObj = await ds.get(key);

    if (!constants.itemExists(farmObj)) {
        return;
    }

    const farm = farmObj[0];
    if (farm.owner !== req.auth.sub) {
        return false;
    }

    farm.self = constants.generateSelfFromReq(req, req.params.farmId);
    return datastore.fromDatastore(farm);
}

async function getFarmsForOwner(req) {
    // gets all entities of this owner
    // only getting the key since we just need the total count
    const countQuery = ds.createQuery(constants.FARM)
        .select("__key__")
        .filter("owner", "=", req.auth.sub);

    let query = ds.createQuery(constants.FARM)
        .filter("owner", "=", req.auth.sub)
        .limit(constants.PAGESIZE);

    const cursor = req.query.cursor;
    if (cursor !== undefined) {
        query = query.start(cursor);
    }

    const [totalResults, farms] = await Promise.all([ds.runQuery(countQuery), ds.runQuery(query)]);

    const retObj = {
        farms: farms[0].map(farm => {
            farm = datastore.fromDatastore(farm);
            farm.self = constants.generateSelfFromReq(req, farm.id);
            return farm;
        })
    };

    retObj.count = totalResults[0].length;
    const info = farms[1];
    
    if (info.moreResults !== ds.NO_MORE_RESULTS) {
        retObj.next = constants.generateNext(req, info.endCursor);
    }

    return retObj;
}

async function assignCorn(req) {
    const farmId = req.params.farmId;
    const cornId = req.params.cornId;
    const [farmRes, cornRes] = await getFarmAndCorn(farmId, cornId);
    if (!constants.itemExists(farmRes) || !constants.itemExists(cornRes)) {
        return;
    }

    const farm = farmRes[0];
    const corn = cornRes[0];

    // User not authorized to edit this farm
    if (farm.owner !== req.auth.sub || corn.farm !== null) {
        return false;
    }

    farm.cornFields.push(cornId);
    corn.farm = farmId;

    return updateFarmAndCorn(farm, farmId, corn, cornId)
        .then(() => true);
}

module.exports = {
    createFarm,
    getFarmById,
    getFarmsForOwner,
    assignCorn
}