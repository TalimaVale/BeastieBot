require("./misc/secrets");
const _ = require("./misc/utils");

(async () => {
    _.exitHandler(async () => {
        console.log("[beastie-chatbot] goodbye");
    });

    if(await _.running("beastie-chatbot")){
        console.error("[beastie-chatbot] already running!");
        return _.exit(1);
    }

    let beastieChatbot = await _.lockProcess("beastie-chatbot");

    if(await _.readFile("../config/secrets.ini").catch(() => null) == null){
        console.log("[beastie-chatbot] shutting down, no secrets.ini found");
        return await _.stopProcess("beastie-monitor");
    }

    await Promise.all([
        require("./chatbot/broadcaster"),
        require("./chatbot/beastie")
    ]);
    
    console.log("[beastie-chatbot] rawr world");
})()