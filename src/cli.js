#!/usr/bin/env node
/**
 * Beastie Bot (https://github.com/teamTALIMA/BeastieBot)
 * A bot for Twitch (IRC) chatrooms and Discord servers.
 * Author: Talima Vale <teamTALIMA@gmail.com> (https://www.twitch.tv/teamTALIMA)
 * License: GPL-3.0
 */

const path = require("path");
const {spawn} = require("child_process");

const _ = require("./misc/utils");
const chalk = require("chalk");
const fetch = require("node-fetch");
const ini = require("ini");
const rt = require("rand-token");
const inquirer = require("inquirer");
const pkg = require("../package.json");
const program = require("commander");

const secretsPath = path.resolve(__dirname, "../config/secrets.ini");
const beastiePidPath = path.resolve(__dirname, "../beastie.pid");

_.exitHandler(async () => {});

program._name = "beastie";
program.version(`v${pkg.version}`);

program.command("init").description("configure the secrets.ini").action(async () => {
    let secrets = {};
    let secretsIni = await _.readFile(secretsPath, "utf8").catch(() => "");
    _.assign(secrets, ini.decode(secretsIni));

    const Accept = "application/vnd.twitchtv.v5+json";

    async function ask(type, name, message, given, test){
        while(true){
            _.assign(secrets, await inquirer.prompt([
                {
                    type, mask: type == "password",
                    name, message,
                    default: given
                }
            ]));

            try {
                console.log(await test(_.get(secrets, name)));
                console.log();
                return _.get(secrets, name);
            } catch(err){
                console.log(err);
            } 
        }
    }
    function fetch_json(url, opts){
        return fetch(url, opts).then(req => req.json());
    }
    function display_name(id){
        return fetch_json(`https://api.twitch.tv/kraken/users/${id}`, {
            method: "get",
            headers: { Accept, "Client-ID" : secrets.client_id }
        }).then(user => {
            return user.display_name || _.upperFirst(user.name);
        });
    }

    console.log(chalk.gray("  Register your Chat Bot/Application to access the Twitch API:\n    https://www.twitch.tv/kraken/oauth2/clients/new"));
    let client_id = await ask(
        "input", "client_id", 
        "Your Client-ID?", 
        _.get(secrets, "client_id"), 
        async client_id => {
            console.log(chalk.gray("  Checking with the Twitch API..."));
            let body = await fetch_json("https://api.twitch.tv/kraken", {
                method: "get", headers: {
                    Accept, "Client-ID": client_id
                }
            });
            if(body && !body.error){
                return chalk.green(`  API check was successful.`);
            } else {
                throw chalk.red(`  API check failed. ${
                    body && body.message ? 
                        `(Twitch API says "${ body.message }")` : 
                        `(Network Failure)`
                }`);
            }
        }
    );

    console.log(chalk.gray("  You can get an OAuth token by connecting your Broadcaster's Twitch account here:\n    https://twitchapps.com/tmi/"));
    let broadcaster_oauth = _.get(secrets, "broadcaster.oauth");
    await ask(
        "password", "broadcaster.oauth", 
        `Your Broadcaster's OAuth Token?${
            broadcaster_oauth ? chalk.gray(" (leave blank to use token in secrets.ini)") : ""
        }`, undefined,
        async oauth => {
            if(oauth == "" && broadcaster_oauth)
                _.set(secrets, "broadcaster.oauth", oauth = broadcaster_oauth);
            console.log(chalk.gray("  Checking with the Twitch API..."));
            let body = await fetch_json("https://api.twitch.tv/kraken", {
                method: "get", headers: {
                    Accept, "Client-ID": client_id,
                    "Authorization": `OAuth ${oauth}`
                }
            });
            if(body && !body.error && body.token && body.token.valid){
                _.set(secrets, "broadcaster.id", body.token.user_id);
                // _.set(secrets, "broadcaster.name", body.token.user_name);
                return chalk.green(`  API check was successful. Hello ${
                    chalk.magenta(await display_name(body.token.user_id).catch(()=>{})||body.token.user_name)
                }`);
            } else {
                throw chalk.red(`  API check failed. ${
                    body && body.message ? 
                        `(Twitch API says "${ body.message }")` : 
                        `(Network Failure)`
                }`);
            }
        }
    );

    console.log(chalk.gray("  You can get an OAuth token by connecting your Bot's Twitch account here:\n    https://twitchapps.com/tmi/"));
    let beastie_oauth = _.get(secrets, "beastie.oauth");
    await ask(
        "password", "beastie.oauth", 
        `Your Bot's OAuth Token?${
            beastie_oauth ? chalk.gray(" (leave blank to use token in secrets.ini)") : ""
        }`, undefined,
        async oauth => {
            if(oauth == "" && beastie_oauth)
                _.set(secrets, "beastie.oauth", oauth = beastie_oauth);
            console.log(chalk.gray("  Checking with the Twitch API..."));
            let body = await fetch_json("https://api.twitch.tv/kraken", {
                method: "get", headers: {
                    Accept, "Client-ID": client_id,
                    "Authorization": `OAuth ${oauth}`
                }
            });
            if(body && !body.error && body.token && body.token.valid){
                _.set(secrets, "beastie.id", body.token.user_id);
                // _.set(secrets, "beastie.name", body.token.user_name);
                return chalk.green(`  API check was successful. Rawr ${
                    chalk.magenta(await display_name(body.token.user_id).catch(()=>{})||body.token.user_name)
                }`);
            } else {
                throw chalk.red(`  API check failed. ${
                    body && body.message ? 
                        `(Twitch API says "${ body.message }")` : 
                        `(Network Failure)`
                }`);
            }
        }
    );

    // _.set(secrets, "webserver.overlay_token", _.get(secrets, "webserver.overlay_token", rt.generate(32)));
    // _.set(secrets, "webserver.jwt_secret", _.get(secrets, "webserver.jwt_secret", rt.generate(32)));
    _.set(secrets, "webserver.api_access", _.get(secrets, "webserver.api_access", rt.generate(32)));

    console.log(chalk.green("Done acquiring secrets."));
    
    secretsIni = `; ${ (new Date).toJSON() }\n;\n; Be careful not to show this file on stream!${ "\n;".repeat(120) }\n; (whew)\n\n${ ini.encode(secrets) }`;
    await _.mkdirp(path.dirname(secretsPath));
    await _.writeFile(secretsPath, secretsIni);

    console.log(chalk.gray("Saved to ") + chalk.dim(secretsPath));
});

program.command("status").description("output the status of beastie").action(async () => {
    if(await _.running("beastie-monitor")){
        console.log("Beastie is running");
    } else {
        console.log("Beastie is not running");
    }
});

program.command("start").description("").action(async () => {
    if(await _.running("beastie-monitor")){
        console.log("Beastie is already running.");
    } else {
        console.log("Starting Beatsie...");
        let beastieMonitor;
        try {
            beastieMonitor = spawn("node", ["./monitor"], {
                cwd: __dirname,
                detached: true,
                stdio: "ignore"
            });
            beastieMonitor.unref();
        } catch(err){
            console.log("Failed.");
            console.error(err);
            return _.exit(1);
        } finally {
            console.log("Started!");
            await _.savePid("beastie-monitor", beastieMonitor.pid);
        }
    }
});

program.command("stop").description("").action(async () => {
    let beastieMonitor;
    if(await _.running("beastie-monitor")) {
        console.log("Stopping Beastie...");
        try {
            await _.stopProcess("beastie-monitor");
        } catch(err){
            console.error("Error: Unable to connect to beastie-monitor");
            return _.exit();
        } finally {
            console.log("Stopped!");
        }
    } else {
        console.log("Beastie doesn't appear to be running!");
    }
});


// TODO: implement restart
program.command("restart").description("").action(() => {
    console.log("Restarting Beastie");
    console.log(chalk.gray("Sorry, not really -- this hasn't been implemented yet.\nPlease run \"beastie stop\" and then \"beastie stop\"."));
});

program.parse(process.argv);

if(program.args.length == 0)
    console.log(program.helpInformation());