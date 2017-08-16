const settings = require("../../misc/settings");
const secrets = require("../../misc/secrets");

const qs = require("querystring");
const chalk = require("chalk");
const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    let raiding = false,
        raidteam = [],

        watching = false,
        raiders = [];

    client
        .command("raidready")
        .description(`Joins you into the active chat raid team, if there is one.`)
        .clearance("viewer")
        .action(async (channel, userstate) => {
            if(raiding && !raidteam.includes(userstate.name)){
                raidteam.push(userstate.name);
                await client.action(channel, `sees that ${userstate.display_name} is ready to raid!`);
            } else if(raiding && raidteam.includes(userstate.name)){
                await client.say(channel, `${userstate.display_name}, you are already joined the raid team! :D`);
            } else {
                await client.say(channel, `${userstate.display_name}, we are not raiding yet.`);
            }
        });
    
    client
        .command("raidteam")
        .description(`Tells you how many teammates have joined the raid team & explains how to join.`)
        .clearance("moderator")
        .action(async (channel, userstate) => {
            if(raiding){
                const raided = raiders.length > 0 ? `; ${raiders.length} have already begun` : "";
                await client.say(channel, `${userstate.display_name}, ${raidteam.length} ${raidteam.length == 1 ? "teammate" : "teammates"} are prepared to raid${raided}. Use !raidready to join the raid team and receive bonus raid awesomeness!`);
            } else
                await client.say(channel, `${userstate.display_name}, we are not currently raiding.`);
        });

    client
        .command("raidstart")
        .description(`Starts the process for a chat raid and tells everyone how to join.`)
        .clearance("broadcaster")
        .action(async (channel, userstate) => {
            if(!raiding){
                raiding = true;
                watching = false;
                raidteam = [];
                raiders = [];

                await client.say(channel, `The ${broadcaster.display_name} RAID IS ABOUT TO BEGIN!!! We have started a raid team. Use !raidready to join, and receive bonus raid awesomeness by raiding a fellow Twitch streamer's chat with us!`);
            } else {
                await client.say(channel, `${userstate.display_name}, the raid process has already started. ${raidteam.length} ${raidteam.length == 1 ? "teammate" : "teammates"} have already joined the raid team`);
            }
        });

    client
        .command("raidstop")
        .description(`Stops an active raid.`)
        .clearance("broadcaster")
        .action(async (channel, userstate) => {
            if(raiding){
                raiding = false;
                watching = false;

                if(raidteam.length > 0){
                    await client.say(channel, `Great raid team! :D You just made everyone more awesome! Everyone has been given +${raiders.length} bonus ${_.get(settings, "loyalty.points", "points")}.`);

                    await api.fetch("http://127.0.0.1:8080/api/teammates/bonus", {
                        method: "post",
                        headers: {
                            "Client-ID": _.get(secrets, "webserver.api_access")
                        },
                        body: JSON.stringify({ points: raiders.length })
                    }).catch(()=>{});
                }

                raidteam = [];
                raiders = [];
            } else {
                await client.say(channel, `No raid to stop.`);
            }
        });

    client.on("hosting", async (channel, target) => {
        if(![settings.home, broadcaster.user.channel].includes(channel)) return;

        await client.say(channel, `https://www.twitch.tv/${target}`, true);

        if(raiding && !watching){
            watching = true;
            await client.join(target);
            let listener = (channel, {name}, message, self) => {
                if(channel.replace(/^#/, "") !== target || self) return;
                if(!raiding){
                    client.removeListener("message", listener);
                    return;
                }
                if(raidteam.includes(name) && !raiders.includes(name)){
                    console.log("[beastie-chatbot] saw %s raid in %s", chalk.blue(name), chalk.magenta(target));
                    raiders.push(name);
                }
            };
            client.on("message", listener);
            await client.say(channel, `https://www.twitch.tv/${target}`, true);
            await client.say(channel, `https://www.twitch.tv/${target}`, true);
            await client.say(channel, `Time to raid! :D rawr`, true);

            await _.sleep(2 * 60 * 1000);
            if(!raiding) return;
            raiding = false;
            await client.part(target);
            client.removeListener("message", listener);
            await client.say(channel, `Great raid team! :D You just made everyone more awesome! Everyone has been given +${raiders.length} bonus ${_.get(settings, "loyalty.points", "points")}.`);

            await api.fetch("http://127.0.0.1:8080/api/teammates/bonus", {
                method: "post",
                headers: {
                    "Client-ID": _.get(secrets, "webserver.api_access")
                },
                body: JSON.stringify({ points: raiders.length })
            }).catch(()=>{});

            watching = false;
            raidteam = [];
            raiders = [];
        }
    });
};
