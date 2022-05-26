/* CONSTANT STRINGS */
const clientId = "749278090840-j1r1cgn54el5p8a8jgtp41t35a3876co.apps.googleusercontent.com";
const clientSecret = "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";
const callback = "http://localhost:8080/auth";
const home = "http://localhost:8080"
const scope = "https://www.googleapis.com/auth/userinfo.profile";
const USER = "User";
const JSON = "application/json";
const NAME = "name";
const SIZE = "size";
const STATE = "state";
const FARM = "Farm";
const CORN = "CornField";

/* NUMBER CONSTANTS */
const PAGESIZE = 5;

/* CONSTANT JSON RESPONSES */
const jsonResErr = {"Error": "This endpoint only supports JSON responses."};
const jsonAccErr = {"Error": "This endpoint only accepts JSON bodies."};
const bodyErr = {"Error": "JSON body has invalid or missing attributes."};
const doesntExit = {"Error": "The requested item does not exist."};
const noAccess = {"Error": "The requested item cannot be accessed by this user."};
const itemsNoExist = {"Error": "One of the specified items does not exist"};
const unAuthed = {"Error": "User not authorized to perform this action."};

/* CONSTANT COLLECTIONS */
const states = new Set(["AL", "AK", "AZ", "AR", "AS", "CA", "CO", "CT", "DE", "DC", "FL", 
    "GA", "GU", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN",
    "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "CM", "OH", "OK", "OR",
    "PA", "PR", "RI", "SC", "SD", "TN", "TX", "TT", "UT", "VT", "VA", "VI", "WA", "WV", "WI",
    "WY"]);

const cornTypes = new Set(["flint", "dent", "sweet", "pop"]);

/* CONSTANT/SHARED FUNCTIONS */
function acceptJson(req) {
    return req.accepts(JSON);
}

function isJson(req) {
    return req.is(JSON);
}

function generateSelfFromReq(req, id) {
    return `${req.protocol}://${req.get("host")}${req.baseUrl}/${id}`;
}

function generateNext(req, cursor) {
    return `${req.protocol}://${req.get("host")}${req.baseUrl}?cursor=${cursor}`;
}

function itemExists(item) {
    return item[0] !== undefined && item[0] !== null;
}

function generateCornObjFromId(cornId, req) {
    return {
        id: cornId,
        self: `${req.protocol}://${req.get("host")}/cornfields/${cornId}`
    };
}

function generateFarmObjFromId(farmId, req) {
    return {
        id: farmId,
        self: `${req.protocol}://${req.get("host")}/farms/${farmId}`
    };
}

module.exports = {
    clientId,
    clientSecret,
    callback,
    scope,
    USER,
    home,
    jsonResErr,
    acceptJson,
    isJson,
    jsonAccErr,
    states,
    STATE,
    NAME,
    SIZE,
    FARM,
    generateSelfFromReq,
    bodyErr,
    doesntExit,
    noAccess,
    PAGESIZE,
    generateNext,
    cornTypes,
    CORN,
    itemExists,
    itemsNoExist,
    unAuthed,
    generateCornObjFromId,
    generateFarmObjFromId
}