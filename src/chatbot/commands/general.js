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
                    await client.say(channel, `${_.displayName(userstate)}, !${trigger}: ${desc}`);
                } else {
                    await client.say(channel, `${_.displayName(userstate)}, !${trigger} is not a command that I recognize.`);
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
            await client.say(channel, `Hello ${_.displayName(userstate)}! rawr`);
        });
    
    client
        .command("goodbyebeastie")
        .alias("byebeastie", "goodbye", "bye")
        .description("Says goodbye to you!")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `Goodbye ${_.displayName(userstate)}! See you next stream :)`);
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
            await client.action(channel, `purrs while ${_.displayName(userstate)} pets his head OhMyDog`);
        });

    client
        .command("shoutout")
        .description("Gives a shoutout to an awesome channel.")
        .clearance("moderator")
        .action(async (channel, userstate, messages) => {
            
            let [command, name] = messages.split(" ");

            if(name == null || _.isEmpty(name)){
                return await client.say(channel, `${_.displayName(userstate)} please call the command in the format of "!shoutout <channel>", where <channel> is a valid twitch channel name.`);
            }

            const {users} = await api.login(name).catch(() => {
                return { users: [] };
            });
            const friend = users[0];

            if(!friend){
                await client.say(channel, `${_.displayName(userstate)} \"${name}\" does not appear to be a channel :(`)
            } else {
                await client.say(channel, `Shoutout to our friend ${_.displayName(friend)}!! Check out their awesome channel: https://www.twitch.tv/${friend.name == _.displayName(friend).toLowerCase() ? _.displayName(friend) : friend.name} !`);
            }
        });
};
