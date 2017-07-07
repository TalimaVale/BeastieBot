const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    if(client.chatters != undefined) 
        throw new Error(`Already tracking chatters on this client.`);

    const chatters = {};

    // const onjoin = () => {};
    // const onpart = () => {};
    // const onmessage = () => {};
    // client.on("join", onjoin);
    // client.on("part", onpart);
    // client.on("message", onmessage);

    // (async () => {
    //     while(true){
    //         for(let room of client.getChannels()){
                

    //             // populate new
    //             // prune old/stale
    //         }
    //         await api.chatters()
    //         await _.sleep(5 * 60 * 1000)
    //     }
    // });

    client.chatters = room => room ? chatters[room] : chatters;    

    client
        .command("chatters", { hidden: true })
        .description("Tells you how many chatters are in the room.")
        .clearance("moderator")
        .action(async (channel, userstate) => {

        });
};