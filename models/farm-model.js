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

function validPatch(body) {
    const valid = [];

    Object.keys(body).forEach(att => {
        if (!constants.farmPatch.has(att)) {
            valid.push(false);
        } else {
            switch (att) {
                case "name":
                    valid.push(typeof(body.name) === "string" && body.name.length > 0 && body.name.length < 50);
                    break;
                case "size":
                    valid.push(typeof(body.size) === "number" && body.size > 0);
                    break;
                case "state":
                    valid.push(constants.states.has(body.state));
                    break;
            }
        }
    });

    return valid.every(ele => ele === true);
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

    if (farm.cornFields.length > 0) {
        farm.cornFields = farm.cornFields.map(cornId => constants.generateCornObjFromId(cornId, req));
    }

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
            farm.cornFields = farm.cornFields.map(cornId => constants.generateCornObjFromId(cornId, req));
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

async function removeCorn(req) {
    const farmId = req.params.farmId;
    const cornId = req.params.cornId;
    const [farmRes, cornRes] = await getFarmAndCorn(farmId, cornId);
    if (!constants.itemExists(farmRes) || !constants.itemExists(cornRes)) {
        return;
    }

    const farm = farmRes[0];
    const corn = cornRes[0];

    // User not authorized to edit this farm
    if (farm.owner !== req.auth.sub || corn.farm !== farmId) {
        return false;
    }

    corn.farm = null;
    farm.cornFields = farm.cornFields.filter(id => id !== cornId);

    return updateFarmAndCorn(farm, farmId, corn, cornId)
        .then(() => true);
}

async function deleteFarm(req) {
    const farmId = req.params.farmId;
    const key = ds.key([constants.FARM, parseInt(farmId, 10)]);
    const farmObj = await ds.get(key);

    if (!constants.itemExists(farmObj)) {
        return;
    }

    const farm = farmObj[0];
    if (farm.owner !== req.auth.sub) {
        return false;
    }

    const promises = [];
    if (farm.cornFields.length > 0) {
        const fields = await getCornFields(farm.cornFields);
        const noFarm = fields.map(corn => {
            corn.farm = null;
            return corn;
        });

        noFarm.forEach(corn => {
            const id = corn[ds.KEY].id;
            const key = ds.key([constants.CORN, parseInt(id, 10)]);
            promises.push(ds.update({key: key, data: corn}));
        });
    }

    promises.push(ds.delete(key));
    return Promise.all(promises).then(() => true);
}

async function getCornFields(arr) {
    const promises = [];
    arr.forEach(cornId => {
        const key = ds.key([constants.CORN, parseInt(cornId, 10)]);
        promises.push(ds.get(key));
    });

    const resolved = await Promise.all(promises);

    return resolved.map(corn => corn[0]);
}

async function putFarm(req) {
    const farmId = req.params.farmId;
    const key = ds.key([constants.FARM, parseInt(farmId, 10)]);
    const farmObj = await ds.get(key);
    if (!constants.itemExists(farmObj)) {
        return;
    }

    const farm = farmObj[0];
    if (farm.owner !== req.auth.sub) {
        return false;
    }

    const body = req.body;
    if (!validBody(body)) {
        return "400";
    }

    body.owner = farm.owner;
    body.cornFields = farm.cornFields;
    await ds.update({key: key, data: body});
    body.id = farmId;
    body.self = constants.generateSelfFromReq(req, farmId);
    return body;
}

async function patchFarm(req) {
    const body = req.body;
    if (!validPatch(body)) {
        return;
    }

    const farmId = req.params.farmId;
    const key = ds.key([constants.FARM, parseInt(farmId, 10)]);
    const farmObj = await ds.get(key);
    if (!constants.itemExists(farmObj)) {
        return false;
    }

    const farm = farmObj[0];
    if (farm.owner !== req.auth.sub) {
        return "NOAUTH";
    }

    Object.keys(body).forEach(att => farm[att] = body[att]);
    await ds.update({key: key, data: farm});
    farm.id = farmId;
    farm.self = constants.generateSelfFromReq(req, farmId);
    return farm;
}

module.exports = {
    createFarm,
    getFarmById,
    getFarmsForOwner,
    assignCorn,
    removeCorn,
    deleteFarm,
    putFarm,
    patchFarm
}