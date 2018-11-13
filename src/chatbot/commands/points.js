const settings = require("../../misc/settings");
const secrets = require("../../misc/secrets");

const qs = require("querystring");
const chalk = require("chalk");
const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const loyalty = _.defaults(_.get(settings, "loyalty"), {
        "rewards_url": "<no url defined yet>",
        // plural of loyalty currency
        points: "awesomeness",
        // singular of loyalty currency
        point: _.get(settings, "loyalty.points", "awesomeness"),
        // earning condition
        condition: "streaming",
        // points earned while condition is met
        "rate_earn": 1,
        // per interval of time (in minutes)
        "rate_interval": 1
    });
    _.set(loyalty, "rate_earn", parseInt(loyalty.rate_earn, 10));
    _.set(loyalty, "rate_interval", parseInt(loyalty.rate_interval, 10));

    (async () => {
        while(true){
            const {stream} = (loyalty.condition == "streaming" ? await api.fetch(`streams/${broadcaster.id}`).catch(()=>({stream:null})) : { stream: true });
            if(stream){
                const bonus = loyalty.rate_earn;
                let {error, teammates} = await api.fetch("http://127.0.0.1:8080/api/teammates/bonus", {
                    method: "post",
                    body: JSON.stringify({ type: "earned", points: bonus })
                }).catch(()=>({ error: true }));

                if(!error)
                    console.log(`[beastie-chatbot] ${chalk.gray(`%s teammates earned ${loyalty.points}`)}`, teammates.length);
                else
                    console.log(`[beastie-chatbot] ${chalk.red(`failed to give teammates their earned ${loyalty.points}`)}`);

                await _.sleep(loyalty.rate_interval * 60 * 1000);
                continue;
            }
            await _.sleep(15 * 60 * 1000);
        }
    })();

    client
        .command(loyalty.points.toLowerCase())
        .description(`Tells you how much ${loyalty.points} you have.`)
        .alias("points")
        .clearance("viewer")
        .action(async (channel, userstate, message) => {
            let target = userstate, detailed = false;
            if(api.clearance.moderator(channel, userstate)){
                const [name, earned] = message.split(" ").slice(1);
                if(!_.isEmpty(name)){
                    target = await api.twitch({ name: name.toLowerCase() });
                    detailed = api.clearance.super_moderator(channel, userstate) && earned === "+earned";
                    if(_.isEmpty(target)){
                        return await client.say(channel, `Sorry, "${name}" is not a Twitch user, and therefore doesn't have any ${loyalty.points}.`);
                    }
                }
            }
            let {points, earned, error} = await api.fetch(`http://127.0.0.1:8080/api/teammates/${target.id}`, {}).catch(()=>({points: null, error: true}));
            if(!error)
                await client.say(channel, `${target.display_name} has ${Math.round(points)} ${loyalty.points}.${detailed ? ` (${Math.round(earned)} earned overall)` : ""}`);
            else
                await client.say(channel, `Unable to reach beastie-webserver`);
        });

    client
        .command("bonusall")
        .description(`Gives everyone bonus ${loyalty.points}.`)
        .clearance("broadcaster")
        .action(async (channel, userstate, message) => {
            let [bonus] = message.split(" ").slice(1);
            bonus = parseInt(bonus, 10)|0;

            let body = { points: bonus };
            if(client.chatters && client.chatters(channel).length > 0)
                body.teammates = client.chatters(channel);

            let {error} = await api.fetch("http://127.0.0.1:8080/api/teammates/bonus", {
                method: "post",
                body: JSON.stringify(body)
            }).catch(()=>({ error: true }));
            if(!error)
                await client.say(channel, `Everyone has been given ${bonus} ${loyalty.points}!`);
            else
                await client.say(channel, `Unable to reach beastie-webserver`);
        });

    client
        .command("bonus")
        .description(`Gives a specific user bonus ${loyalty.points}`)
        .clearance("broadcaster")
        .action(async (channel, userstate, message) => {
            let [name, bonus] = message.split(" ").slice(1);
            bonus = parseInt(bonus, 10)|0;

            if(!_.isEmpty(name)){
                const target = await api.twitch({ name: name.toLowerCase() });
                if(_.isEmpty(target)){
                    return await client.say(channel, `Sorry, "${name}" is not a Twitch user, and therefore doesn't have any ${loyalty.points}.`);
                } else {
                    let {error} = await api.fetch(`http://127.0.0.1:8080/api/teammates/${target.id}/bonus`, {
                        method: "post",
                        body: JSON.stringify({ points: bonus }),
                    }).catch(()=>({ error: true }));

                    if(!error)
                        await client.say(channel, `${target.display_name} has been given ${bonus} ${loyalty.points}`);
                    else
                        await client.say(channel, `Unable to reach beastie-webserver`);
                }
            } else {
                await client.say(channel, `Usage: !bonus <username> <${loyalty.points}>`);
            }
        });

    client
        .command("loyalty", { hidden: true })
        .description(`Tells you what ${loyalty.points} are for.`)
        .alias("info")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `You earn ${loyalty.rate_earn} ${loyalty.points} for every ${loyalty.rate_interval} minutes you watch while ${broadcaster.display_name} is live. Check your ${loyalty.points} by typing !${loyalty.points} and visit ${loyalty.rewards_url} to see what you can do with them.`);
        });
};
