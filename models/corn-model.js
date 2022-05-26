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

    if (retCorn.farm !== null) {
        retCorn.farm = constants.generateFarmObjFromId(retCorn.farm, req);
    }

    return retCorn;
}

async function getAllCorn(req) {
    // keys only query since we just need total count
    const countQuery = ds.createQuery(constants.CORN).select("__key__");

    const cursor = req.query.cursor;

    let query = ds.createQuery(constants.CORN).limit(constants.PAGESIZE);
    if (cursor !== undefined) {
        query = query.start(cursor);
    }

    const [totalCorn, queryCorn] = await Promise.all([ds.runQuery(countQuery), ds.runQuery(query)]);

    const retCorn = {
        cornFields: queryCorn[0].map(corn => {
            corn = datastore.fromDatastore(corn);
            corn.self = constants.generateSelfFromReq(req, corn.id);
            if (corn.farm !== null) {
                corn.farm = constants.generateFarmObjFromId(corn.farm, req);
            }
            return corn;
        })
    };

    retCorn.count = totalCorn[0].length;

    const info = queryCorn[1];
    if (info.moreResults !== ds.NO_MORE_RESULTS) {
        retCorn.next = constants.generateNext(req, info.endCursor);
    }

    return retCorn;
}

module.exports = {
    createCorn,
    getCornById,
    getAllCorn
}