// TTsBeastie custom functions

const secrets = require("./config/secrets");

/**
 * CUSTOM TTsBEASTIE FUNCTIONS
 *
 * Beastie's custom functions for coding
 *
 * name                 action
 * getUsername =        get user 'display-name' OR 'username' from tmi's userstate object
 * getArrayElement      get a random element of an array
 */

// Get the user's display-name if they have set one, or their username
//      for tmi.js, twitch api will return username if no display_name is found
module.exports.getUsername =        function (userstate){
                                        return userstate["display-name"] || userstate.username;
                                    }

// Get an element from a random position from an array
module.exports.getArrayElement =    function(array){
                                        return array[Math.floor(Math.random() * array.length)];
                                    }

module.exports.queryTwitchAPI =     function(queryUrl){
                                        return {
                                            url: "https://api.twitch.tv/kraken/" + queryUrl,
                                            headers: {
                                                "Accept": "application/vnd.twitchtv.v5+json",
                                                "Authorization": "OAuth " + secrets.broadcaster.password,
                                                "Client-ID": secrets.clientId
                                            }
                                        };
                                    }