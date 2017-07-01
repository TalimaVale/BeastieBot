const settings = require("../../misc/settings");
const _ = require("../../misc/utils");

const path = require("path");
const dataDir = path.resolve(__dirname, "../../../data/");
const customCommandsCsv = path.resolve(dataDir, "custom-commands.csv");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const commands = [];

    setImmediate(async () => {
        await _.mkdirp(dataDir);
        const table = await _.csv.parse(await _.readFile(customCommandsCsv).catch(()=>""), { 
            columns: ["trigger", "text"],
            from: 2
        });
        for(const {trigger, text} of table){
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
        await _.mkdirp(dataDir);
        await _.writeFile(customCommandsCsv, await _.csv.stringify(commands));
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
};