const settings = require("../../misc/settings");
// const qs = require("querystring");
const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    client
        .command("strawpoll").alias("poll")
        .description(`Creates a Straw Poll. Usage: !strawpoll <poll title>|<answer 1>|<answer N...>`)
        .clearance("moderator")
        .action(async (channel, userstate, message) => {
            const [command, ...params] = message.split(" ");
            let [title, ...options] = params.join(" ").split("|");

            title = title.trim() || "";
            options = (options||[])
                .map(option => option.trim())
                .filter(option => !_.isEmpty(option));
            console.log(title, options);

            if(!_.isEmpty(title) && options.length >= 2){
                let poll = await api.fetch("https://www.strawpoll.me/api/v2/polls", {
                    method: "post",
                    body: JSON.stringify({
                        title,
                        options,
                        multi: false,
                        dupcheck: "normal",
                        captcha: true
                    })
                }).catch(()=>{});

                if(poll && poll.id){
                    await client.say(channel, `[POLL] ${poll.title} https://strawpoll.me/${poll.id}`);
                } else {
                    await client.say(channel, `Unable to create strawpoll... NotLikeThis rawr`);
                }
            } else {
                if(!_.isEmpty(title) && options.length < 2){
                    await client.say(channel, `Not enough parameters, must provide at least two answers.`)
                }
                await client.say(channel, `Usage: !strawpoll <poll title>|<answer 1>|<answer N...>`);
            }
        });
};