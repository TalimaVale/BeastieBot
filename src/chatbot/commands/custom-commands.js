const settings = require("../../misc/settings");
const _ = require("../../misc/utils");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const commands = [];

    setImmediate(async () => {
        const data = await _.csv.read("data/custom-commands", {
            mkdir: true,
            columns: ["trigger", "text"],
            from: 2
        }).catch(()=>[]);
       for(const {trigger, text} of data){
            let command = client.findCommand(trigger);
            if(command != null){
                console.log("[beastie-chatbot] [%s custom-commands] ignoring custom command \"%s\"; command already present", chalk.yellow("warn"), trigger);
                continue;
            } else {
                client
                    .command(trigger, { custom: true })
                    .description(`Replies with a message about ${trigger}`)
                    .action(async (channel) => {
                        await client.say(channel, text);
                    });
                commands.push({ trigger, text });
            }
        }
    });

    async function save(){
        await _.csv.write("data/custom-commands", commands);
    }

    client
        .command("commands add", { unshift: true, hidden: true })
        .clearance("moderator")
        .action(async (channel, userstate, message) => {
            let [trigger, ...text] = message.split(" ").slice(2);

            trigger = (trigger||"").trim().toLowerCase() || "";
            text = (text || []).join(" ").trim() || "";
            if(text.startsWith("/") || text.startsWith(".") || text.startsWith("\\")) 
                text = "\u200d" + text;

            if(!_.isEmpty(trigger) && !_.isEmpty(text)){
                if(client.findCommand(trigger) != null){
                    await client.say(channel, `No custom command added: !${trigger} already exists`);
                } else {
                    client
                        .command(trigger, { custom: true })
                        .description(`Replies with a message about ${trigger}`)
                        .action(async (channel) => {
                            await client.say(channel, text);
                        });
                    _.pullAllBy(commands, [{ trigger }], "trigger");
                    commands.push({ trigger, text });
                    await save();
                    await client.say(channel, `Added custom command: !${trigger}`);
                }
            } else {
                await client.say(channel, `Usage: !commands add <trigger> <text...>`);
            }
        });
    
    client
        .command("commands overwrite", { unshift: true, hidden: true })
        .clearance("moderator")
        .action(async (channel, userstate, message) => {
            let [trigger, ...text] = message.split(" ").slice(2);

            trigger = (trigger||"").trim().toLowerCase() || "";
            text = (text || []).join(" ").trim() || "";
            if(text.startsWith("/") || text.startsWith(".") || text.startsWith("\\")) 
                text = "\u200d" + text;

            if(!_.isEmpty(trigger) && !_.isEmpty(text)){
                const command = client.findCommand(trigger);
                if(command != null && _.get(command, "context.custom", false) === true){
                    command
                        .action(async (channel) => {
                            await client.say(channel, text);
                        });
                    _.find(commands, { trigger }).text = text;
                    await save();
                    await client.say(channel, `Overwrote custom command: !${trigger}`);
                } else if(command != null){
                    await client.say(channel, `No custom command overwritten: !${trigger} is not a custom command`);
                } else {
                    await client.say(channel, `No custom command overwritten: !${trigger} is not a command`);
                }
            } else {
                await client.say(channel, `Usage: !commands overwrite <trigger> <text...>`);
            }
        });

    client
        .command("commands delete", { unshift: true, hidden: true })
        .clearance("moderator")
        .action(async (channel, userstate, message) => {
            let trigger = (message.split(" ")[2]||"").trim().toLowerCase();

            if(!_.isEmpty(trigger)){
                const command = client.findCommand(trigger);
                if(command && _.get(command, "context.custom", false) === true){
                    command.remove();
                    _.pullAllBy(commands, [{ trigger }], "trigger");
                    await save();
                    await client.say(channel, `Deleted custom command: !${trigger}`);
                } else if(command != null) {
                    await client.say(channel, `No custom command deleted: !${trigger} is not a custom command`);
                } else {
                    await client.say(channel, `No custom command deleted: !${trigger} is not a command`);
                }
            } else {
                await client.say(channel, `Usage: !commands delete <trigger>`);
            }
        });
    
    client
        .command("commands custom", { unshift: true, hidden: true })
        .clearance("moderator")
        .action(async (channel, userstate, message) => {
            const list = client.commands
                .filter(command => command.context.custom)
                .map(command => `!${command.name}`)
                .join(", ");
            await client.say(channel, `Custom commands: ${_.isEmpty(list) ? "none" : list}`);
        });
};