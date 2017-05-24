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
const raid = require("./raids");
const custom = require("./custom");

// Helper function for responding to the user with a generic/non-interactive reply in the format of "@{username}, {text}".
// Usage: 
// var commands = {
//   "hello": reply("Hello!"), // => replies with "@{username}, Hello!"
// };
const reply = (text) => clearance.viewer((channel, userstate) => {
    queue.addMessage( channel, "@" + beastieFunctions.getUsername(userstate) + ", " + text);
});


/**
 * Beastie's command chart
 *
 * viewer commands          description                                  file
 * ------------------------ -------------------------------------------- -----------------------
 * !twitter                 Beastie links to Twitter                     /commands/commands.js
 * !patreon                 Beastie links to Patreon                     /commands/commands.js
 * !github                  Beastie links to GitHub                      /commands/commands.js
 * !gitlab                  Beastie links to GitLab                      /commands/commands.js
 * !discord                 Beastie links to Discord                     /commands/commands.js
 * !instagram               Beastie links to Instagram                   /commands/commands.js
 * !youtube                 Beastie links to YouTube                     /commands/commands.js
 * !teamsite                Beastie links to Team Site                   /commands/commands.js
 * !teamwall                Beastie links to Team Wall                   /commands/commands.js
 *                                                                       
 * !goodbyebeastie          Beastie says 'goodbye' to user               /commands/commands.js
 * !hellobeastie            Beastie says 'hello' to user                 /commands/commands.js
 * !helpbeastie             Beastie posts list of commands in chat       /commands/commands.js
 * !pet                     Viewer /me pets Beastie                      /commands/commands.js
 * !raidready               Viewers join raidTeam                        /commands/commands.js
 * !rawr                    Beastie leaves 'rawr' message                /commands/raids.js
 * !uptime                  Beastie posts uptime in chat                 /commands/commands.js
 *
 * moderator commands       description                                  file
 * ------------------------ -------------------------------------------- -----------------------
 * !flushqueue              Beastie empties message queue                /commands/commands.js
 * !raidteam                Moderator checks the raid team               /commands/raids.js
 * !shoutout <username>     Beastie shouts out a twitch channel          /commands/commands.js
 *
 * broadcaster commands     description                                  file
 * ------------------------ -------------------------------------------- -----------------------
 * !raidstart               Broadcaster prepares to raid                 /commands/raids.js
 *
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
    
    // SHOUTOUT - Beastie shouts out a friendly channel
    "shoutout":     clearance.moderator(
                        function(channel, userstate, message){
                            queue.addMessage(channel, "Shoutout to our friend " + message.slice("!shoutout ".length) + "!! Check out their awesome channel: https://twitch.tv/" + message.slice("!shoutout ".length) + "!");
                        }),
    
    /*** BROADCASTER COMMANDS ***/
        // COMMANDS - Beastie adds, edits, or deletes custom commands
    "commands":     clearance.viewer(
                        function(channel, userstate, message){
                            // bring message into scope
                            var str = message;
                            // send to custom.js comHandler
                            custom.comHandler(str);
                           // queue.addMessage(channel, "");
                        }),
                        
    // dummy command for testing functions
    "testcommand": clearance.broadcaster(
                        function(channel, userstate, message){
                            // DO STUFF
                        })
    // ...
};

// *** Build object of custom commands and attach it to commands object. I seriously need to seriously refactor this for serious-SoG *** //
var jsonObj = require("./custom.json");
var names = _.map(jsonObj.commands, "name");
var customCom  = {};
var name;

// iterate names and messages by index[i]. 
for(var i=0;i < names.length;i++){
    name = names[i];
    //build array of custom commands
    customCom[name.replace("!","")] = clearance.broadcaster(
            // function in addMessage parameter fetches message of custom command when clearance.broadcaster() is called.
        function(channel,userstate,message){queue.addMessage(channel,getM(message));});
    // attach custom commands to commands 
    _.merge(commands, customCom);
    }
 

function getM(message)
{
    // TODO - fetch message of !{customCommand} being passed in message from custom.json. Return {message:"custom commands message"}
    return "The command :" + message + ": was called";
}
// **************************************************************************************************************************************** //


// Assigns all of the raid.commands to 
Object.assign(commands, raid.commands);

module.exports = commands;

