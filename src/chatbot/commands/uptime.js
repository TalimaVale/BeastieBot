const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    client
        .command("uptime")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            let problem = false;
            const {stream} = await api.fetch(`streams/${broadcaster.id}`).catch(() => {
                problem = true;
                return { stream: null };
            });

            if(stream == null){
                await client.say(channel, `${_.displayName(broadcaster)} is not streaming right now${problem?"*":"."}`);
            } else {
                const started = new Date(_.get(stream, "created_at", Date.now()));
                const now = Date.now();
                const since = Math.floor((now - started) / 1000);
                const [hours, minutes, seconds] = [
                    Math.floor(since / 60 / 60),
                    Math.floor(since / 60) % 60,
                    Math.floor(since) % 60
                ];
                const duration = [
                    hours === 0 ? "" : `${hours} hours `.slice(0,-1-(hours === 1)),
                    minutes === 0 ? "" : `${minutes} minutes `.slice(0,-1-(minutes === 1)),
                    seconds === 0 ? "" : `${seconds} seconds `.slice(0,-1-(seconds === 1))
                ];
                await client.say(channel, `${_.displayName(stream.channel)} has been streaming ${stream.game} for ${duration.join(" ").trim() || "null seconds"}. rawr`);
            }
        });
};