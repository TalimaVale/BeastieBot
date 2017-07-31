/*
    This file is responsible for everything the chatbot is supposed to do, such as: connect to TMI, process chat commands, etc...
*/

// require("./misc/secrets");
const _ = require("./misc/utils");

(async () => {
    // setup an exit handler for graceful shutdowns:
    _.exitHandler(async () => {
        console.log("[beastie-chatbot] goodbye");
    });

    // make sure there isn't an instance of beastie-chatbot already running:
    if(await _.pid.check("beastie-chatbot")){
        console.error("[beastie-chatbot] already running!");
        return _.exit(1);
    }
    let beastieChatbot = await _.lockProcess("beastie-chatbot");

    // make sure the secrets.ini is defined:
    if(await _.ini.read("config/secrets") == null){
        console.log("[beastie-chatbot] shutting down, no secrets.ini found");
        return await _.stopProcess("beastie-monitor");
    }

    // instantiate the broadcaster and beastie clients:
    await Promise.all([
        require("./chatbot/broadcaster"),
        require("./chatbot/beastie")
    ]);
    
    // log to the console that we're ready to go!
    console.log("[beastie-chatbot] rawr world");
})()