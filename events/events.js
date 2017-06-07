// List of Beastie's events

/*** REQUIRED FILES AND VARIABLES ***/

// Libraries and Utilities
const queue = require("../message-queue");

// Event files
const host = require("./hosts");

// Setup Files
const beastie = require("../beastie-client");
const constants = require("../config/constants.js");



/**
 * TTsBEASTIE EVENTS
 *
 * Beastie's event reponses
 *
 * name                 event                         trigger
 * BEASTIE-GREETING =   Beastie "join" event,         user joins a channel
 * BEASTIE-GOODBYE  =   Process "SIGINT" event,       called when you Ctrl-C
 * GET-HOSTED       =   Broadcaster "hosted" event,   user hosts our channel
 * HOSTING =            Broadcaster "hosting" event   broadcaster hosts channel
 * NEW-FOLLOWER     =   Interval "follow" event,      user follows our channel
 */

// GREETING - Beastie says hello when connecting to chat room - Turn on/off in ../config/constants.js
module.exports.join = function(channel, username, self){
    if(self){
        
        if (!constants.AWOKE) return;
         //do not leave message when joining other channels
        if(channel != beastie.getChannels()[0]) return;
        
        if(channel == "#teamtalima"){
            queue.addMessage( channel, "Hello Team! :D I have awoken! Welcome back to the teamTALIMA channel!");
        } else{
            queue.addMessage( channel, "Hello everybody! :D I have awoken! Welcome back to " + channel.slice(1) + "'s channel!");
        }
    }
};

// GOODBYE - Beastie says goodbye when his node.js process ends
module.exports.part = function(){
    for( var hoster = 0; hoster < host.ourHosts.length; hoster++ ){
            beastie.say( beastie.getChannels()[0], "Thank you for hosting our stream to " + host.ourHosts[hoster][1] + " today " + host.ourHosts[hoster][0] + "! Check out our friend: twitch.tv/" + host.ourHosts[hoster][0]);
    }

    setTimeout(function(){
        if(beastie.getChannels()[0] == "#teamtalima"){
            beastie.say( beastie.getChannels()[0], "Goodbye Team! I'm going to sleep.");
        } else {
            beastie.say( beastie.getChannels()[0], "Goodbye Everyone! I'm going to sleep.");
        }
        process.exit();
    }, 1000); // 1sec OR TRY .5secs * number of hosters + 1 = (500 * host.ourHosts.length + 1)
};

// GET-HOSTED - Beastie automatically thanks and shouts out hosts
module.exports.hosted = function(channel, username, viewers){
    if(viewers >= 3){
        queue.addMessage(channel, username + " has hosted us to " + viewers + " viewers! Thank you ʕ•ᴥ•ʔ rawr!! Let's go check out their awesome channel: twitch.tv/" + username + "!");
        host.ourHosts.push([username, viewers]);
        console.log(host.ourHosts);
    }
};

// NEW-FOLLOWER - Beastie welcomes new follower and hands out Revlo points
module.exports.newFollow = function(follower){
    console.log("We have a new follower! " + follower);
    beastie.say(beastie.getChannels()[0], "Welcome to the team " + follower + "! :D");
};