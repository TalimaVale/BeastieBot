const qs = require("querystring");
const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    client
        .command("helpbeastie")
        .alias("beastiecommands", "help", "commands")
        .description("Shows helpful information regarding my commands.")
        .action(async (channel, userstate, message) => {
            const [command, trigger] = message.split(" ");
            if(["!help", "!helpbeastie"].includes(command) && trigger != null && !_.isEmpty(trigger)){
                const command = client.findCommand(trigger);
                if(command){
                    const desc = _.get(command, "_description", "No description is available for that command.");
                    await client.say(channel, `${userstate.display_name}, !${trigger}: ${desc}`);
                } else {
                    await client.say(channel, `${userstate.display_name}, !${trigger} is not a command that I recognize.`);
                }
                return;
            }


            const list = (await Promise.all(
                    client.commands.map(command => new Promise(async resolve => {
                        resolve(await command._clearance(channel, userstate) ? command : null);
                    }))
                ))
                .filter(command => command !== null && !_.get(command, "context.hidden", false))
                .map(command => `!${command.name}`)
                .join(", ");
            await client.say(channel, `Here are some of my tricks: ${list}. rawr`);
        });

    client
        .command("hellobeastie")
        .alias("hibeastie", "heybeastie", "heyabeastie", "heyobeastie")
        .alias("hello", "hi", "hey", "heya", "heyo")
        .description("Says hello to you!")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `Hello ${userstate.display_name}! rawr`);
        });
    
    client
        .command("goodbyebeastie")
        .alias("byebeastie", "goodbye", "bye")
        .description("Says goodbye to you!")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `Goodbye ${userstate.display_name}! See you next stream :)`);
        });

    client
        .command("rawr")
        .description("Rawrs in the chat.")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `ʕ•ᴥ•ʔ RAWR`);
        });

    client
        .command("pet")
        .description("Pets me on the head.")
        .alias("petbeastie")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.action(channel, `purrs while ${userstate.display_name} pets his head OhMyDog`);
        });

    client
        .command("shoutout")
        .description("Gives a shoutout to an awesome channel.")
        .clearance("moderator")
        .action(async (channel, userstate, messages) => {
            
            let [command, name] = messages.split(" ");

            if(name == null || _.isEmpty(name)){
                return await client.say(channel, `${userstate.display_name} please call the command in the format of "!shoutout <channel>", where <channel> is a valid twitch channel name.`);
            }

            const friend = await api.twitch({ name: name.toLowerCase() });

            if(!friend){
                await client.say(channel, `${userstate.display_name} \"${name}\" does not appear to be a channel :/`)
            } else {
                await client.say(channel, `Shoutout to our friend ${friend.display_name}!! Check out their awesome channel: https://www.twitch.tv/${friend.name == friend.display_name.toLowerCase() ? friend.display_name : friend.name} !`);
            }
        });
};
