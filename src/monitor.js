/*
    This file is responsible for monitoring & ensuring that both the `chatbot` and `webserver` process are running; restarting either if they crash.

    This process also will tell both of them to shutdown gracefully if it receives a SIGINT message (primarily via IPC (Interprocess communication) -- thanks Windows).

    Scryptonite: looks like beastie's first message was "testing" on (Thu, 13 Oct 2016 19:49:53 GMT) + 2 hours 55 minutes into the stream
*/


const _ = require("./misc/utils");
const forever = require("forever-monitor");

(async () => {
    let beastieWebserver, beastieChatbot;
    let done, startup = new Promise(resolve => done=resolve);
    _.exitHandler(async () => {
        await Promise.race([
            startup,
            _.sleep(6*1000).unref()
        ]);
        await Promise.all([
            _.stopProcess("beastie-webserver"),
            _.stopProcess("beastie-chatbot")
        ]);
        console.log("[beastie-monitor] goodbye");
    });
    if(await _.pid.check("beastie-monitor")){
        console.error("[beastie-monitor] already running!");
        return _.exit(1);
    }
    const beastieMonitor = await _.lockProcess("beastie-monitor");
    console.log("[beastie-monitor] rawr world");

    if(await _.pid.check("beastie-webserver"))
        await _.pid.kill("beastie-webserver");
    beastieWebserver = await _.startForeverProcess("./webserver", {
        cwd: __dirname,
        sourceDir: __dirname
    }, "beastie-webserver");
    beastieWebserver.monitor.on("restart", function() {
        console.error("[beastie-monitor] restarting [beastie-webserver] for " + beastieWebserver.monitor.times + " time");
    });
    beastieWebserver.monitor.on("exit:code", function(code) {
        console.error("[beastie-monitor] detected [beastie-webserver] exited with code " + code);
    });

    if(await _.pid.check("beastie-chatbot"))
        await _.pid.kill("beastie-chatbot");
    beastieChatbot = await _.startForeverProcess("./chatbot", {
        cwd: __dirname,
        sourceDir: __dirname
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
