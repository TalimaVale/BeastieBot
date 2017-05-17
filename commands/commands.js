// List of Beastie's commands

/*** REQUIRED FILES AND VARIABLES ***/

// Libraries and Utilities
const _ = require("lodash");
const beastieFunctions = require("../beastie-functions");
const queue = require("../message-queue");

// Setup Files
const beastie = require("../beastie-client");
const secrets = require("../config/secrets");

// Command Files
const clearance = require("./clearance");
// const raid = require("./raids");


// Helper function for responding to the user with a generic/non-interactive reply in the format of "@{username}, {text}".
// Usage: 
// var commands = {
//   "hello": reply("Hello!"), // => replies with "@{username}, Hello!"
// };
const reply = (text) => clearance.viewer((channel, userstate) => {
    queue.addMessage( channel, "@" + beastieFunctions.getUsername(userstate) + ", " + text);
});


/**
 * TTsBEASTIE COMMANDS
 *
 * Beastie's command reponses
 *
 * name                 command                                     trigger
 * GOODBYE-BEASTIE =    Beastie says 'goodbye' to user              !goodbyebeastie
 * HELLO-BEASTIE =      Beastie says 'hello' to user                !hellobeastie
 * HELP-BEASTIE =       Beastie posts list of commands in chat      !helpbeastie
 * PET =                Viewer /me pets Beastie                     !pet
 * RAID-READY =         Viewers join raidTeam                       !raidready
 * RAWR =               Beastie leaves 'rawr' message               !rawr
 * UPTIME =             Beastie posts uptime in chat                !uptime
 *
 * moderator clearance
 * FLUSH-QUEUE =    Beastie empties message queue               !flushqueue
 * RAID-TEAM =      Moderator checks the raid team              !raidteam
 * SHOUTOUT =       Beastie shouts out a twitch channel         !shoutout <username>
 *
 * broadcaster clearance
 * RAID-START =     Broadcaster prepares to raid                !raidstart
 */

var commands = {

    // LINKS - Beastie says to the user a link in the format of "@{username}, {url}"
    // TODO: Maybe this should be refactored so all of the links are configured in another file for other streamers who run Beastie.
    "twitter": reply("https://twitter.com/talimavale"),
    "patreon": reply("https://www.patreon.com/talimavale"),
    "github": reply("https://github.com/teamTALIMA"),
    "gitlab": reply("https://gitlab.com/teamTALIMA"),
    "discord": reply("https://discord.gg/dGFQ5tE"),
    "instagram": reply("https://www.instagram.com/talimavale"),
    "youtube": reply("https://www.youtube.com/channel/UCQEtRUEQItKpn-q_ZBJXUVQ"),
    "teamsite": reply("http://teamtalima.com"),
    "teamwall": reply("http://teamtalima.com/team-wall/"),


    // GOODBYE-BEASTIE - Beastie says goodbye back to user
    "goodbyebeastie": clearance.viewer(
                        function(channel, userstate){
                            queue.addMessage( channel, "Goodbye " + beastieFunctions.getUsername(userstate) + "! See you next stream :)" );
                        }),
    
    // HELLO-BEASTIE - Beastie says hello back to user
    "hellobeastie": clearance.viewer(
                        function(channel, userstate){
                            queue.addMessage( channel, "Hello " + beastieFunctions.getUsername(userstate) + "! rawr" );
                        }),
    
    // HELP-BEASTIE - Beastie posts list of commands in chat
    "helpbeastie":  clearance.viewer(
                        function(channel){
                            // use 'keys' function to return array of the property names of 'commands' object
                            // use 'filter' function to test array elements against provided function
                            var cmds = _.keys(commands).filter( function(cmd){
                                if(cmd == "helpbeastie" || commands[cmd].restricted) return false;
                                return true;
                            // use 'map' function to call provided function on every array element
                            }).map( function(cmd){
                                return "!" + cmd;
                            });

                            queue.addMessage(channel, "Here are some of my tricks: " + cmds.join(", ") + ". rawr");
                        }),
    
    // PET - 
    "pet":          clearance.viewer(
                        function(channel, userstate){
                            var username = beastieFunctions.getUsername(userstate);
                            queue.addMessage( channel, "/me purrs while " + username + " pets his head OhMyDog");
                        }),
    
    // // RAID-READY - Viewers use command to join the raidTeam
    // "raidready":    clearance.viewer(
    //                     function(channel, userstate){
    //                         var username = beastieFunctions.getUsername(userstate);
    //                         if( raid.raidPrep == true && !raid.raidTeam.includes(username)){
    //                             raid.raidTeam.push(username);
    //                             queue.addMessage(channel, username + " is ready to raid!");
    //                         } else if( raid.raidPrep == true){
    //                             queue.addWhisper(username, "You are already in the raid team.")
    //                         } else {
    //                             queue.addMessage(channel, username + "we're not raiding yet.");
    //                         }
    //                     }),

    // RAWR - Beastie says 'rawr' in chat
    "rawr":         clearance.viewer(
                        function(channel){
                            queue.addMessage(channel, "ʕ•ᴥ•ʔ RAWR");
                        }),
    
    // UPTIME - Beastie posts stream uptime in chat
    "uptime":       clearance.viewer(
                        function(channel){
                            if(beastie.broadcasterID != "#"){
                                var streamStart = Date.now();

                                // query twitch api
                                beastie.api(beastieFunctions.queryTwitchAPI(
                                    "https://api.twitch.tv/kraken/streams/" + beastie.broadcasterID
                                ), function(err, res, body) {
                                    // if no err and stream is not offline
                                    if(!err && body.stream != null){
                                        streamStart = new Date(body.stream.created_at);

                                        var diff = Math.floor((Date.now() - streamStart) / 1000);
                                        var hours = Math.floor(diff / 60 / 60);
                                        var minutes = Math.floor(diff / 60) % 60;
                                        var seconds = Math.floor(diff - (hours * 60 * 60) - (minutes * 60));

                                        queue.addMessage( channel, "teamTALIMA has been LIVE for: " + hours + " hours " + minutes + " minutes " + seconds + " seconds. rawr");
                                    }
                                });
                            }
                        }),
    
    
    
    /*** MODERATOR COMMANDS ***/
    
    // FLUSH-QUEUE - Flush Beastie's message queue of all messages
    "flushqueue":   clearance.moderator(
                        function(channel){
                            queue.flushQueue(channel, "I emptied my message queue.");
                        }),
    
    // // RAID-TEAM - 
    // "raidteam":   clearance.moderator(
    //                     function(channel){
    //                         if(raid.raidPrep){
    //                             queue.addMessage(channel, );
    //                         } else{
    //                             queue.addMessage(channel, "No active raid team.");
    //                         }
    //                     }),

    // SHOUTOUT - Beastie shouts out a friendly channel
    "shoutout":     clearance.moderator(
                        function(channel, userstate, message){
                            queue.addMessage(channel, "Shoutout to our friend " + message.slice("!shoutout ".length) + "!! Check out their awesome channel: https://twitch.tv/" + message.slice("!shoutout ".length) + "!");
                        }),
    
    
    
    /*** BROADCASTER COMMANDS ***/
    
    // RAID-START - 
    // "raidstart":     clearance.broadcaster(
    //                     function(channel, userstate){
    //                         raid.raidPrep = true;
    //                         queue.addMessage(channel, "The teamTALIMA RAID IS ABOUT TO BEGIN!!! We have started a raid team. Use !raidready to join and receive bonus raid awesomeness!");
                            
    //                     })
}

module.exports = commands;