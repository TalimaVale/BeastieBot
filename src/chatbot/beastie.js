const settings = require("../misc/settings");

const _ = require("../misc/utils");
const api = require("../misc/api");
const chalk = require("chalk");

module.exports = (async () => {
    const beastie = await api.client("beastie");
    await beastie.connect();

    setImmediate(async () => {
        const broadcaster = await require("./broadcaster");

        await require("./events/hosts")(beastie);
        await require("./events/follows")(beastie);

        await require("./commands/general")(beastie);
        await require("./commands/points")(beastie);
        await require("./commands/uptime")(beastie);
        await require("./commands/stream-info")(beastie);
        await require("./commands/raids")(beastie);
        await require("./commands/timers")(beastie);

        await require("./commands/custom-commands")(beastie);
        await require("./commands/strawpoll")(beastie);

        beastie.on("chat", async (channel, userstate, message, self) => {
            if(message.toLowerCase().trim() === "!deliberatecrash"
            && _.get(userstate, "user-id") === broadcaster.id){
                throw "deliberate crash!";
            }

            if(self || channel != _.channel(broadcaster.name)) return;

            if(userstate.username == beastie.name && !userstate.mod) 
                await _.delay(1000);

            if(message.startsWith("!"))
                await beastie.parseCommand(channel, userstate, message, self);
        });

        await beastie.join(broadcaster.name);
        if(!_.isEmpty(settings.announce.startup))
            await beastie.say(broadcaster.name, settings.announce.startup);

        if(!_.isEmpty(settings.announce.shutdown))
            process.cleanup.unshift(() => 
                beastie.say(broadcaster.name, process.exitCode == 0 ? settings.announce.shutdown : "Something went wrong, shutting down.").catch(()=>{})
            );
    });

    return beastie;
})();