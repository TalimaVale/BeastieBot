const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    if(client.chatters != undefined) 
        throw new Error(`Already tracking chatters on this client.`);

    const chatters = {};

    (async () => {
        client.on("join", async (channel, username, self) => {
            if(!(channel in chatters))
                chatters[channel] = [];
            
            if(!_.find(chatters[channel], { name: username })){
                const user = await api.twitch({ name: username });
                console.log(user);
                chatters[channel].push({ name: user.name, id: user.id });
            }

            if(self){
                const {users} = await api.chatters(channel.slice(1)).catch(()=>{users:[]});
                for(const user of users){
                    if(!_.find(chatters[channel], { name: user.name }))
                        chatters[channel].push({ name: user.name, id: user._id });
                }
            }
        });

        client.on("part", (channel, username, self) => {
            if(_.isArray(chatters[channel]))
                _.remove(chatters[channel], name => name === username);

            if(_.isEmpty(chatters[channel]) || self)
                delete chatters[channel];
        });

        client.on("message", (channel, userstate, message, self) => {
            if(["chat", "action", "cheer"].includes(userstate["message-type"]))
                if(channel in chatters && !_.find(chatters[channel], { name: userstate.username }))
                    chatters[channel].push({ name: userstate.name, id: userstate.id });
        });

        // while(true){
        //     const channels = client.getChannels();
        //     for(let [channel, usernames] of Object.entries(chatters)){
        //         if(!channels.includes(channel))
        //             delete chatters[channel];
        //     }
        //     await _.sleep(5 * 60 * 1000);
        // }
    })();

    client.chatters = channel => channel ? (channel in chatters ? chatters[channel] : []) : chatters;    

    client
        .command("chatters", { hidden: true })
        .description("Tells you how many chatters are in this channel.")
        .clearance("moderator")
        .action(async (channel, userstate) => {
            client.say(channel, `There are ${client.chatters(channel).length} chatters`);
        });
};