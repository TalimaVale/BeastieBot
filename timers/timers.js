// List of Beastie's timers

/*** REQUIRED FILES AND VARIABLES ***/

// Libraries and Utilities
const beastieFunctions = require("../beastie-functions");
const queue = require("../message-queue");

// Setup Files
const beastie = require("../beastie-client");

// Timer Files
const hydrate = require("./hydration-reminders");
const quotes = require("./quotes");



/**
 * TTsBEASTIE TIMERS
 *
 * Beastie's timer actions
 *
 * name                 timer                               trigger
 * HYDRATION-REMINDER = Beastie reminder for a water break  28 minutes
 * QUOTES =             Beastie shares a random quote       46 minutes
 * RULES =              Beastie posts rules in chat         60 minutes
 * GAWKBOX =            Beastie posts link to GawkBox       40 minutes
 */

// HYDRATION-REMINDER - Beastie periodically reminds broadcaster to stay hydrated
module.exports.hydrationReminder = function(){
    beastie.api(beastieFunctions.queryTwitchAPI(
        "streams/" + beastie.broadcasterID
    ), function(err, res, body) {
        // if no err and stream is not offline
        if(!err && body.stream != null){
            queue.addMessage(beastie.getChannels()[0], beastieFunctions.getArrayElement(hydrate));
        }
    })
}

// QUOTES - Beastie shares a random quote in chat
module.exports.quote = function(){
    beastie.api(beastieFunctions.queryTwitchAPI(
        "streams/" + beastie.broadcasterID
    ), function(err, res, body) {
        // if no err and stream is not offline
        if(!err && body.stream != null){
            queue.addMessage(beastie.getChannels()[0], "Remember that time Talima said, \"" + beastieFunctions.getArrayElement(quotes) + "\" <3");
        }
    })
}

// RULES - Beastie posts the channel rules
module.exports.rules = function(){
    beastie.api(beastieFunctions.queryTwitchAPI(
        "streams/" + beastie.broadcasterID
    ), function(err, res, body) {
        // if no err and stream is not offline
        if(!err && body.stream != null){
            queue.addMessage(beastie.getChannels()[0], "THE RULES GO HERE. rawr");
        }
    })
}

// GAWKBOX - Beastie posts link to GawkBox
module.exports.gawkbox = function(){
    beastie.api(beastieFunctions.queryTwitchAPI(
        "streams/" + beastie.broadcasterID
    ), function(err, res, body) {
        // if no err and stream is not offline
        if(!err && body.stream != null){
            queue.addMessage(beastie.getChannels()[0], "Tip for FREE with GawkBox! https://www.gawkbox.com/teamtalima :D");
        }
    })
}