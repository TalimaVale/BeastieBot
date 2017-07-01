const _ = require("./misc/utils");
const forever = require("forever-monitor");

(async () => {
    let beastieWebserver, beastieChatbot;
    let done, startup = new Promise(resolve => done=resolve);
    _.exitHandler(async () => {
        await Promise.race([
            startup, 
            _.delay(6*1000).unref() 
        ]);
        await Promise.all([
            _.stopProcess("beastie-webserver"),
            _.stopProcess("beastie-chatbot")
        ]);
        console.log("[beastie-monitor] goodbye");
    });
    if(await _.running("beastie-monitor")){
        console.error("[beastie-monitor] already running!");
        return _.exit(1);
    }
    const beastieMonitor = await _.lockProcess("beastie-monitor");
    console.log("[beastie-monitor] rawr world");

    if(await _.running("beastie-webserver"))
        await _.killProcess("beastie-webserver");
    beastieWebserver = await _.startForeverProcess("./webserver", {
        cwd: __dirname
    }, "beastie-webserver");
    beastieWebserver.monitor.on("restart", function() {
        console.error("[beastie-monitor] restarting [beastie-webserver] for " + beastieWebserver.monitor.times + " time");
    });
    beastieWebserver.monitor.on("exit:code", function(code) {
        console.error("[beastie-monitor] detected [beastie-webserver] exited with code " + code);
    });

    if(await _.running("beastie-chatbot"))
        await _.killProcess("beastie-chatbot");
    beastieChatbot = await _.startForeverProcess("./chatbot", {
        cwd: __dirname
    }, "beastie-chatbot");
    beastieChatbot.monitor.on("restart", function() {
        console.error("[beastie-monitor] restarting [beastie-chatbot] for " + beastieChatbot.monitor.times + " time");
    });
    beastieChatbot.monitor.on("exit:code", function(code) {
        console.error("[beastie-monitor] detected [beastie-chatbot] exited with code " + code);
    });

    if(done) done();
    else startup = Promise.resolve();
})()