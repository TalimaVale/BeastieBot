/**
 * Beastie Bot <GIT repo url>
 * Created for Twitch chatrooms and Discord servers
 * Author: teamTALIMA
 * License: ISC
 */

/*** REQUIRED FILES AND VARIABLES ***/

// Libraries and Utilities
const _ = require("lodash");
const beastieFunctions = require("./beastie-functions");
const queue = require("./message-queue");

// Setup Files
const tmi = require("tmi.js");
const config = require("./config/config");
const secrets = require("./config/secrets");

// Command Files
const commands = require("./commands/commands");
const raid = require("./commands/raids");

// Event Files
const events = require("./events/events");
const followers = require("./events/followers");

// Timer Files
const timers = require("./timers/timers");



/**
 * CREATE and CONNECT TMI CLIENTS
 *
 * beastie      = tmi client for beastie moderator channel
 * broadcaster  = tmi client for broadcasting channel
 */

// Create beastie tmi client
const beastie = require("./beastie-client");
beastie.connect();

// Create broadcaster tmi client
const broadcaster = new tmi.client(
    _.defaults({
        identity: secrets.broadcaster
    },  require ("./config/config")));
broadcaster.connect();



/**
 * TTsBEASTIE MESSAGING & COMMANDS
 *
 * Listen for messages, then respond to action, chat, whisper or command
 *
 * name             command                                     trigger
 * HELLO-BEASTIE =  Beastie says 'hello' to user                !hellobeastie
 * HELP-BEASTIE =   Beastie posts list of commands in chat      !helpbeastie
 * RAID-READY =     Viewers join raidTeam                       !raidready
 * RAWR =           Beastie leaves 'rawr' message               !rawr
 * UPTIME =         Beastie posts uptime in chat                !uptime
 *
 * moderator clearance
 * FLUSH-QUEUE =    Beastie empties message queue               !flushqueue
 * RAID-TEAM =      Moderator checks the raid team              !raidteam
 * SHOUTOUT =       Beastie shouts out a twitch channel         !shoutout <username>
 *
 * broadcaster clearance
 * RAID-START =     Broadcaster prepares to raid                !raidstart
 */

beastie.on("message", function(channel, userstate, message, self){
    // get display_name or username of poster
    var username = beastieFunctions.getUsername(userstate);
    
    // if Beastie himself has posted a message, return
    if(self) return;
    
    switch(userstate["message-type"]){
        case "action":
            break;
            
        case "chat":
            // if Beastie is raiding
            if(raid.raidPrep == true && channel != beastie.getChannels()[0]){
                raid.checkRaidMessage(username);
                break;
            }
            
            if(channel == beastie.getChannels()[0]){
                // iterate through Beastie's commands
                for(var command in commands){
                    if( message === "!" + command || message.startsWith("!" + command + " ") ){
                        try {
                            // execute command
                            commands[command](channel, userstate, message, self);
                        } catch(err){
                            console.log("[%s] %s tried to execute '%s'", channel, username, command);
                            console.log(err);
                        }
                        // break out of for-loop since we found our command
                        break;
                    }
                }
            }
            break;
            
        case "whisper":
            break;
            
        default:
            break;
    }
});



/**
 * TTsBEASTIE EVENTS
 *
 * Listen for individual events, then include Beastie's response
 *
 * name                 event                           trigger
 * BEASTIE-GREETING =   Beastie "join" event            beastie joins a channel
 * BEASTIE-GOODBYE =    Process "SIGINT" event          called when you Ctrl-C
 * GET-HOSTED =         Broadcaster "hosted" event      user hosts our channel
 * HOSTING =            Broadcaster "hosting" event     broadcaster hosts channel
 * NEW-FOLLOWER =       Tapic "follow" event            user follows our channel
 */

// BEASTIE-GREETING - Beastie says hello when connecting to chat room
beastie.on("join", function(channel, username, self){
    events.join(channel, username, self);
});

// BEASTIE-GOODBYE - Beastie says goodbye when his node.js process ends
process.on("SIGINT", function(){
    events.part();
});

// GET-HOSTED - Beastie automatically thanks and shouts out hosts
broadcaster.on("hosted", function(channel, username, viewers){
    events.hosted(channel, username, viewers);
});

// HOSTING - Broadcaster hosts a channel
beastie.on("hosting", function(channel, target, viewers){
    console.log("We are hosting another channel :O");
    events.hosting(channel, target, viewers);
});

// NEW-FOLLOW - Beastie welcomes new follower and hands out awesomeness
beastie.on("newFollow", function(follower){
    events.newFollow(follower);
})



/**
 * TTsBEASTIE TIMERS
 *
 * Beastie's timers
 *
 * name                 timer                               trigger
 * HYDRATION-REMINDER = Beastie reminder for a water break  28 minutes
 * QUOTES =             Beastie shares a random quote       45 minutes
 * RULES =              Beastie posts rules in chat         60 minutes
 */

// HYDRATION-REMINDER - Beastie periodically reminds broadcaster to stay hydrated
setInterval(timers.hydrationReminder, 1000 * 60 * 28); // 1sec * 60 * 28 = 28min timer

// QUOTES - Beastie shares a random quote in chat
setInterval(timers.quote, 1000 * 60 * 46); // 1sec * 60 * 46 = 46min timer

// RULES - Beastie posts the channel rules
setInterval(timers.rules, 1000 * 60 * 60); // 1sec * 60 * 60 = 60min timer
