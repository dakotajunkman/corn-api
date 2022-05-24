// Creates a datastore entity to share across models
const Datastore = require("@google-cloud/datastore");
const datastore = new Datastore.Datastore();

function fromDatastore(item) {
    item.id = item[datastore.KEY].id;
    return item;
}

module.exports = {
    datastore,
    fromDatastore
};