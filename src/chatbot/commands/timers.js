const util = require("util");
const settings = require("../../misc/settings");
const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const template = {
        enabled: false,
        condition: "streaming",
        interval: 60,
        message: "%s",
        command: "",
        random: [],
    };
    settings.timers = _.defaults(_.get(settings, "timers", {}), template);
    const timers = [];
    Object.entries(settings.timers).forEach(([name, timer]) => {
        if(!_.isObject(timer) || _.isArray(timer)) return;

        _.set(timer, "trigger", _.get(timer, "trigger", ""));
        _.set(timer, "enabled", _.get(timer, "enabled", _.get(settings.timers, "enabled")).toString() == "true");
        _.set(timer, "condition", _.get(timer, "condition", _.get(settings.timers, "condition")));
        _.set(timer, "interval", parseFloat(_.get(timer, "interval", _.get(settings.timers, "interval"), 10)));
        _.set(timer, "message", _.ini.unsafe(_.get(timer, "message", _.get(settings.timers, "message"))));
        _.set(timer, "command", _.ini.unsafe(_.get(timer, "command", _.get(settings.timers, "command"))));
        _.set(timer, "random", _.get(timer, "random", _.get(settings.timers, "random")));
    
        async function trigger(channel, userstate){
            if(_.isEmpty(timer.command.trim())){
                const args = [];
                if(_.isArray(timer.random) && !_.isEmpty(timer.random))
                    args.push(_.sample(timer.random));
                await client.say(channel, util.format(timer.message, ...args));
            } else if(timer.command) {
                await client.parseCommand(channel, userstate ? userstate : {
                    "badges": {},
                    "message-type": "chat",
                    "name": client.name,
                    "display_name": client.display_name,
                    "id": client.id,
                    "user-type": null,
                    "mod": false
                }, timer.command, true);
            }
        }
        timers.push(Object.setPrototypeOf(timer, { name }));

        if(!_.isEmpty(timer.trigger) && !client.findCommand(timer.trigger))
            client
                .command(timer.trigger)
                .description(`Tells you the message for the ${name} timer.`)
                .clearance("viewer")
                .action(async (channel, userstate) => {
                    await trigger(channel, userstate);
                });

        setInterval(async () => {
            if(!timer.enabled) return;

            if(timer.condition == "streaming"
            && (await api.fetch(`streams/${broadcaster.id}`).catch(()=>({stream:null}))).stream == null)
                return;
            
            await trigger(settings.home);
        }, _.get(timer, "interval") * 60 * 1000).unref();
    });

    client
        .command("timers")
        .description("Tells you all current timers & controls them if called in the format of: !timers <disable|enable> <timer>")
        .alias("timer")
        .clearance("broadcaster")
        .action(async (channel, userstate, message) => {
            const [command, action, name] = message.split(" ");
            if(action == undefined || action == "list"){
                await client.say(channel, `${userstate.display_name} my timers: ${timers.map(timer => timer.name+(timer.enabled?"":"*")).join(", ")}`)
            } else {
                switch(action){
                    case "pause":
                    case "stop":
                    case "disable":
                        if(name != null && _.find(timers, { name })) {
                            _.find(timers, { name }).enabled = false;
                            await client.say(channel, `Disabled timer ${name}`);
                        } else await client.say(channel, "No such timer");
                        break;
                    case "unpause":
                    case "resume":
                    case "enable":
                        if(name != null && _.find(timers, { name })) {
                            _.find(timers, { name }).enabled = true;
                            await client.say(channel, `Enabled timer ${name}`);
                        } else await client.say(channel, "No such timer");
                        break;
                    case "status":
                        if(name != null && _.find(timers, { name })) {
                            await client.say(channel, `Timer ${name} is ${_.find(timers, { name }).enabled ? "enabled" : "disabled"}`);
                        } else await client.say(channel, "No such timer");
                        break;
                    default:
                        await client.say(channel, `Unrecognized timer action "${action}"`);
                }
            }
        })
};