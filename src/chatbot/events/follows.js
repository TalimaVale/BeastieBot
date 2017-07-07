const settings = require("../../misc/settings");

const _ = require("../../misc/utils");
const api = require("../../misc/api");
const qs = require("querystring");
const chalk = require("chalk");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    let follows = [];
    (async () => {
        let {_cursor} = await api.fetch(`channels/${broadcaster.id}/follows?${qs.stringify({
            limit: 1,
            offset: 0,
            direction: "desc"
        })}`);

        await _.sleep(1000);

        while(true){
            const body = _.defaults(
                await api.fetch(`channels/${broadcaster.id}/follows?${qs.stringify({
                    limit: 100,
                    direction: "asc",
                    cursor: _cursor
                })}`).catch(() => {}),
                { _cursor, follows: [] }
            );
            _cursor = body._cursor;

            let streaming = false;
            if(body.follows.length > 0){
                console.log(
                    "[beastie-chatbot] [%s] %s", 
                    chalk.gray("debug follows"), 
                    body.follows
                        .map(follower => (
                            _.find(follows, { user: { _id: follower.user._id } }) ? 
                            chalk.gray : chalk.blue
                        )(follower.user.display_name))
                        .join(", ")
                );
                body.follows = body.follows.filter(follower => 
                    !_.find(follows, { user: { _id: follower.user._id } })
                );
                follows = follows.concat(body.follows);
                let {stream} = await api.fetch(`streams/${broadcaster.id}`).catch(()=>({ stream: null }));
                if(stream){
                    streaming = true;
                    for(const follower of body.follows){
                        if(!streaming) continue;
                        broadcaster.emit("follow", follower);
                        await _.sleep(2000);
                    }
                }
            }

            await _.sleep(streaming ? 15*1000 : 5*60*1000);
        }
    })();

    broadcaster.on("follow", async follow => {
        await client.say(settings.home, `Welcome to the team ${follow.user.display_name}! :D`);
    });

    client
        .command("follows", { hidden: true })
        .description("Tells you how many new followers I've seen since I started up")
        .clearance("broadcaster")
        .action(async (channel, userstate) => {
            await client.say(channel, `${userstate.display_name}, ${follows.length} new follows since startup`);
        });
};