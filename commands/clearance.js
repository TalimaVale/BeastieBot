// Beastie's clearance levels

/*** REQUIRED FILES AND VARIABLES ***/

// Libraries and Utilities
const _ = require("lodash");
const beastieFunctions = require("../beastie-functions");

// Setup Files
const beastie = require("../beastie-client");
const secrets = require("../config/secrets");



/**
 * TTsBEASTIE CLEARANCE LEVELS
 *
 * Beastie's clearance levels for commands
 *
 * name             effect                                  requirement
 * viewer =         lvl 1, can use viewer commands          connect to channel chat room
 * moderator =      lvl 2, can use moderator commands       channel moderator permissions
 * broadcaster =    lvl 3, can use broadcaster commands     channel broadcaster
 */

// wrap all 'viewer' commands with this clearance check
module.exports.viewer = function(callback){
    // return and execute command
    return callback;
}

// wrap all 'moderator' commands with this clearance check
module.exports.moderator = function(callback){
    var clearanceCheck = function(channel, userstate, message, self){
        // test for moderator permissions
        if(userstate.mod){
            // return and execute command
            return callback(channel, userstate, message, self);
        }
    }
    // set restricted property so moderator commands will not appear in !helpbeastie
    clearanceCheck.restricted = true;
    
    // return clearance check function
    return clearanceCheck;
}

// wrap all 'broadcaster' commands with this clearance check
module.exports.broadcaster = function(callback){
    var clearanceCheck = function(channel, userstate, message, self){
        // test for broadcaster badge
        if(userstate.badges.broadcaster == 1 && userstate.badges != null){
            // return and execute command
            return callback(channel, userstate, message, self);
        }
    }
    
    // set restricted property so broadcaster commands will not appear in !helpbeastie
    clearanceCheck.restricted = true;
    
    // return clearance check function
    return clearanceCheck;
}