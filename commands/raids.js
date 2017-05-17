// Beastie client
const beastie = require("../beastie-client");

// Helper functions
const beastieFunctions = require("../beastie-functions");

// Chat message queue module
const queue = require("../message-queue");

// Chat command modules:
const commands = require("./commands");
const clearance = require("./clearance");

const raid = {
    // Boolean to represent whether or not we are currently raiding. 
    // True if the broadcaster has called !raidstart, but before 2 minutes after a hosting event fires.
    raiding: false,

    // Array of teammates who committed to participating in the raid in exchange for bonus awesomeness.
    team: [],

    // Array of teammates who committed to participating in the raid AND were actually seen participating in the raid.
    team_verified: [],


    // Object of raid-related commands. See the bottom of /commands/commands.js for its importation.
    commands: {
        // "!raidready" -- Viewers volunteer to join the raid team.
        "raidready": clearance.viewer((channel, userstate) => {
            // get the users display name (or username if display name is null):
            const name = beastieFunctions.getUsername(userstate);

            // if we are raiding:
            if(raid.raiding) {
                // then if the raid team does not already include the user attempting to !raidready:
                if(!raid.team.includes(userstate.username)) {
                    // add the user to the raid team:
                    raid.team.push(userstate.username);
                    queue.addMessage(channel, name + " is ready to raid!");
                } else {
                    // else, remind them that they already volunteered and joined the raid team:
                    queue.addMessage(channel, name + ", you have already joined the raid team.");
                }
            } else {
                queue.addMessage(channel, name + ", we are not raiding yet.");
            }
        }),

        // "!raidteam" -- Moderator checks the status of current raid team.
        "raidteam": clearance.moderator((channel) => {
            // if we are raiding:
            if(raid.raiding) {
                // then say how many teammates are prepared to raid and remind everyone how to join + the benefit of joining the raid team.
                queue.addMessage(channel, raid.team.length + " teammates are prepared to raid! Use !raidready to join the raid team and receive bonus raid awesomeness!");
            } else {
                queue.addMessage(channel, "No active raid team.");
            }
        }),
        // "!raidstart" -- Broadcaster prepares to raid and initializes a raid team.
        "raidstart": clearance.broadcaster((channel) => {
            // if we are NOT raiding:
            if(!raid.raiding){
                // then we start raiding:
                raid.raiding = true;
                // clear the raid team:
                raid.team = [];
                // clear the verified raiders:
                raid.team_verified = [];
                // tell everyone that the raid is about to begin and remind them of the benefit of joining the raid team.
                queue.addMessage(channel, "The teamTALIMA RAID IS ABOUT TO BEGIN!!! We have started a raid team. Use !raidready to join and receive bonus raid awesomeness!");
            } else {
                // else just remind everyone how to join the raid team:
                queue.addMessage(channel, "Use !raidready to join and receive bonus raid awesomeness!");
            }
        })
    }
};

// when we see a chat message in any channel...
beastie.on("chat", (channel, userstate, message, self) => {
    // then definitely ignore that message if it is from beastie...
    if(self) return;

    // ... and if we are currently raiding and the chat message is likely not from the broadcaster's channel:
    if(raid.raiding && channel != beastie.getChannels()[0]){
        // then if the message is from a raider in our raid team and they previously haven't been verfied as having been seen raided:
        if(raid.team.includes(userstate.username) && !raid.team_verified.includes(userstate.username)){
            // then add their name to the array of verified raiders.
            raid.team_verified.push(userstate.username);
        }
    }
});

// when beastie sees a hosting event occur:
beastie.on("hosting", (channel, target, viewers) => {
    // ensure that nothing happens if we are not raiding:
    if(!raid.raiding) return;

    // ensure that nothing happens if the hosting event was fired on a channel other than our broadcaster's:
    if(channel != beastie.getChannels()[0]) return;

    // join the target channel and tell everyone to start raiding:
    beastie.join(target);
    beastie.say(channel, "Time to raid! :D rawr");

    // set a timer to wait for 2 minutes before...
    setTimeout(() => {
        // ensure we do nothing if we are somehow not currently raiding (possible when multiple subsequent hosting events are fired):
        if(!raid.raiding) return;

        // ... parting the target channel that we just raided:
        beastie.part(target);
        // and handing out bonus awesomeness equal to the amount of raiders in our raid team that we saw raid the target chat:
        beastie.say(channel, "Great raid team! :D You just made the whole team more awesome!");
        beastie.say(channel, "!bonusall " + raid.team_verified.length);

        // debug log how many raiders that joined the raid team and actually raided:
        console.debug("[raid] raid complete -- " + raid.team_verified.length + " of " + raid.team.length);

        // clear and reset the raiding state:
        raid.team = [];
        raid.team_verified = [];
        raid.raiding = false;
    }, 1000 * 60 * 2); // 1sec * 60 * 2 = 2min timer
});

// export our raid module:
module.exports = raid;