/**
 * BEASTIE CLIENT
 *
 * Create Beastie client in seperate file to be required by other bot files
 */

// Libraries and Utilities
const _ = require("lodash");

// Setup Files
const tmi = require("tmi.js");
const secrets = require("./config/secrets");

var beastie = new tmi.client(
    _.defaults({
        identity: secrets.TTsBeastie,
        channels: [secrets.broadcaster.username]
    },  require ("./config/config"))
);

beastie.broadcasterID = "#";

module.exports = beastie;