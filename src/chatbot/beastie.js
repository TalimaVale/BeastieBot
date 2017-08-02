const settings = require("../misc/settings");

const _ = require("../misc/utils");
const api = require("../misc/api");
const chalk = require("chalk");

module.exports = (async () => {
    const beastie = await api.client("beastie");
    await beastie.connect();

    setImmediate(async () => {
        const broadcaster = await require("./broadcaster");

        if(_.isEmpty(settings.home))
            settings.home = broadcaster.user.channel;

        await beastie.use(
            require("./events/hosts"),
            require("./events/follows"),
            require("./commands/chatters"),
            require("./commands/general"),
            require("./commands/points"),
            require("./commands/uptime"),
            require("./commands/raids"),
            require("./commands/stream-info"),
            require("./commands/timers"),
            require("./commands/custom-commands"),
            require("./commands/strawpoll")
        );

        beastie.on("chat", async (channel, userstate, message, self) => {
            if(message.toLowerCase().trim() === "!deliberatecrash"
            && userstate.id == broadcaster.id){
                throw "deliberate crash!";
            }

            if(self || !["#"+settings.home, broadcaster.user.channel].includes(channel)) return;

            if(userstate.id == beastie.id && !userstate.mod) 
                await _.sleep(1000);

            if(message.startsWith("!"))
                await beastie.parseCommand(channel, userstate, message, self);
        });
        
        await beastie.join(settings.home);
        if(settings.home != broadcaster.user.channel)
            await beastie.join(broadcaster.user.channel);

        // startup announcement:
        if(!_.isEmpty(settings.announce.startup))
            await beastie.say(settings.home, settings.announce.startup);

        // shutdown announcement:
        if(!_.isEmpty(settings.announce.shutdown))
            process.cleanup.unshift(() => 
                beastie.say(settings.home, process.exitCode == 0 ? settings.announce.shutdown : "Something went wrong, shutting down.").catch(()=>{})
            );
    });

    return beastie;
})();