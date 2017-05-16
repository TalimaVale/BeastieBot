// Beastie's channel followers functionality

/*** REQUIRED FILES AND VARIABLES ***/

// Setup Files
const beastie = require("../beastie-client");
const beastieFunctions = require("../beastie-functions");
const secrets = require("../config/secrets");

// array of new followers which need to be acknowledged
var newFollows = [];

// display_name or username of latest follower Beastie has recorded
var latestFollow = "#";

// broadcaster's channel _id
//var _id = "#";



// Beastie checks for new follows every interval
setInterval(function(){
    
    // call to api for broadcaster's channel _id
    if(beastie.broadcasterID == "#"){
        console.log("Beastie's broadcasterID is: " + beastie.broadcasterID);
        beastie.api(beastieFunctions.queryTwitchAPI(
            "users?login=" + beastie.getChannels()[0].slice(1)
        ), function(err, res, body){
            beastie.broadcasterID = body.users[0]._id;
            console.log("This is our channel id: " + beastie.broadcasterID);
            checkFollows(beastie.broadcasterID);
        });
    } else {
        checkFollows(beastie.broadcasterID);
    }
    
    // emit 'newFollow' event
    if (newFollows.length > 0) beastie.emit("newFollow", newFollows.shift());
}, 1000 * 10); // 1sec * 10 = 10sec timer



// call to api for broadcaster's latest follows (default 25)
function checkFollows(id){
    // array of new followers (implementing Hold array to avoid twitch api bug which will return channel follows incorrectly)
    let newFollowsHold = [];
    
    beastie.api(beastieFunctions.queryTwitchAPI(
        "channels/" + id + "/follows/"
    ), function(err, res, body) {
        if(err) {
            console.error("There was a problem querying the Twitch API for follows:");
            console.error(err);
        }
        if(!err){
            if (body.follows == null || "error" in body) {
                console.warn("There was no follows array returned in the Twitch API response. :/");
                if(body.error) console.error(body.error + ": " + body.message);
                return;
            }
            if (latestFollow == "#") {
                // for BeastieBot startup
                latestFollow = body.follows[0].user.display_name;
            } else {
                // check for new follows
                for( let i = 0; i < body.follows.length; i++){
                    if(body.follows[i].user.display_name != latestFollow){
                        // if new follow, add to list
                        newFollowsHold.push(body.follows[i].user.display_name);
                    } else{
                        // finished adding new follows, reset variables
                        latestFollow = body.follows[0].user.display_name;
                        newFollows = newFollows.concat(newFollowsHold);
                        break;
                    }
                }
                // error with api call, reset variables
                latestFollow = body.follows[0].user.display_name; // update to make sure 'lastestFollow' is in body.follows next call
            }
        }
    });    
}
