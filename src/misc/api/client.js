const secrets = require("../secrets");
const settings = require("../settings");

const _ = require("../utils");
const chalk = require("chalk");
const fetch = require("node-fetch");
const tmi = require("tmi.js");

module.exports = api => ({
    async client(name, opts = {}){
        if(!(name in secrets) || !("oauth" in secrets[name])) throw new Error(`Unable to load secrets for ${name}`);
        let secret = secrets[name];
        let user = await _.persevere({ 
            retries: 3, 
            timeout: 1000, 
            decay: 2 
        })(() => api.twitch({ id: secret.id }));

        const client = new tmi.Client(_.merge({
            identity: name == null ? null : { 
                username: user.name, 
                password: secret.oauth 
            },
            options: {
                clientId: secrets.client_id,
                debug: _.get(settings, "tmi.debug", false),
            },
            connection: {
                // server: null,
                // port: null,
                reconnect: _.get(settings, "tmi.reconnect", true),
                // maxReconnectAttempts: null,
                // maxReconnectInterval: null,
                // reconnectDecay: null,
                // reconnectInterval: null,
                secure: _.get(settings, "tmi.secure", true),
                // timeout: null,
            },
            channels: [],
            // logger: null,
        }, opts));

        client.currentLatency = 200;
        
        if(name !== null){
            user.oauth = secret.oauth;
            client.user = user;
            client.id = _.get(secret, "id", user.id);
            client.name = user.name;
            client.display_name = user.display_name;
        }

        client.on("cheer", (channel, userstate, message) => {
            client.emit("message", channel, _.assign(userstate, { "message-type": "cheer" }), message);
        });

        client.on("hosting", (channel, target, viewers) => {
            console.log("[beastie-chatbot] %s hosting %s to %s viewers", 
                // chalk.gray(client.name), 
                chalk.magenta(channel),
                chalk.yellow(target),
                viewers);
        });

        client.on("clearchat", (channel) => 
            console.log("[beastie-chatbot] [%s/%s] chat cleared", chalk.gray(client.name), chalk.magenta(channel))
        )

        client.on("join", (channel, username, self)=>{
            console.log("[beastie-chatbot] %s joined %s", chalk.gray(username), chalk.magenta(channel));
        });

        client.on("part", (channel, username, self)=>{
            console.log("[beastie-chatbot] %s parted %s", chalk.gray(username), chalk.magenta(channel));
        });

        process.cleanup.push(() => Promise.all(
            client.getChannels().map(channel => client.part(channel))
        ));

        const patcher = (channel, userstate) =>  {
            if(userstate.id && _.isString(userstate.id) && userstate.id.length == 36){
                userstate["message-id"] = userstate.id;
                delete userstate.id;
            }
            _.assign(userstate, api.normalize(userstate));
        };
        client.on("chat", patcher);
        client.on("action", patcher);

        client.on("message", (channel, userstate, message, self) => {
            let event;
            switch(_.get(userstate, "message-type")){
                case "action":
                    event = (
                        (userstate.badges && "broadcaster" in userstate.badges) ? chalk.red.italic : 
                        (userstate.badges && "moderator" in userstate.badges) || userstate.mod ? chalk.green.italic : 
                        chalk.dim.italic
                    )(` ${userstate.name}* ${message}`);
                    break;
                case "chat":
                    event = `<${(
                        (userstate.badges && "broadcaster" in userstate.badges) ? chalk.red : 
                        (userstate.badges && "moderator" in userstate.badges) || userstate.mod ? chalk.green : 
                        chalk.dim
                    )(userstate.name)}> ${(message.startsWith("!") ? chalk.gray : chalk.dim)(message)}`;
                    break;
                default:
                    event = "?";
                    break;
            }
            console.log("[beastie-chatbot] [%s/%s] %s", chalk.gray(client.name), chalk.magenta(channel), event);
        });

        const {say, action} = client;
        const queue = [];
        for(let method of ["say", "action", "whisper"]){
            const original = client[method];
            client[method] = (channel, message, immediately = false) => {
                if(immediately){
                    return original.call(client, channel, message);
                } else {
                    let resolve, reject;
                    let task = () => 
                        original.call(client, channel, message)
                            .then()
                            .catch(reject)
                    
                    return Promise.race([
                        new Promise((_resolve, _reject) => {
                            resolve = _resolve;
                            reject = _reject;
                            queue.push(task);
                        }), new Promise(resolve => {
                            _.sleep(_.get(settings, "chat_interval", 5000) * (queue.length + 1))
                                .unref()
                                .then(() => {
                                    if(queue.includes(task))
                                        queue.splice(queue.indexOf(task), 1);
                                    resolve();
                                });
                        })
                    ]);
                }
            };
        }

        (async () => {
            while(true){
                await _.sleep(parseInt(_.get(settings, "chat_interval", 5000), 10));

                if(queue.length > 0 && client.readyState() == "OPEN"){
                    let job = queue.shift();
                    try { 
                        await job();
                    } catch(err){
                        console.error(err);
                    }
                }
            }
        })();

        client.commands = [];
        client.command = (name, context = {}) => {
            const command = Object.setPrototypeOf({
                name, aliases: [],
                context,
                _description: null,
                _clearance: async (channel, userstate) => true,
                _action: async (channel) => await client.say(channel, `Error: the command !${command.name} has no action associated.`),
            }, {
                alias(...aliases){
                    this.aliases.push(...aliases);
                    return this;
                },
                description(_description){ 
                    this._description = _description; 
                    return this; 
                },
                clearance(level = "viewer"){
                    if(level in api.clearance)
                        this._clearance = api.clearance[level];
                    else
                        this._clearance = _.isFunction(level) ? level : () => false;
                    return this;
                },
                action(_action){
                    this._action = _action;
                    return this;
                },
                async invoke(channel, userstate, message, self){
                    if(this._action)
                        return await this._clearance(channel, userstate) ? 
                            this._action.call(this.context, channel, userstate, message, self) : 
                            Promise.reject(`${userstate.name} from ${channel} does not have clearance to run "${this.name}"`);
                    else
                        return Promise.reject(`No action defined for ${this.name}`)
                },

                remove(){
                    let removed;
                    if(removed = client.commands.includes(command)){
                        client.commands.splice(client.commands.indexOf(command), 1);
                    }
                    return removed;
                },
            });
            if(context && context.unshift === true)
                client.commands.unshift(command);
            else
                client.commands.push(command);
            return command;
        };

        client.findCommand = (name) => {
            for(let i = 0; i < client.commands.length; i++){
                const command = client.commands[i];
                if(command.name == name
                || command.aliases.includes(name)) return command;
            }
        };
        
        client.parseCommand = async (channel, userstate, message, self = userstate.name == client.name) => {
            for(let i = 0; i < client.commands.length; i++){
                const command = client.commands[i];
                // if(command.aliases.length) console.log(command.aliases);
                if((message.startsWith(`!${command.name} `)
                    || message === `!${command.name}`
                    || (command.aliases.length > 0 && command.aliases.map(alias => 
                        message.startsWith(`!${alias} `) || message === `!${alias}`
                    ).reduce((a, b) => a || b)))
                && await command._clearance(channel, userstate)) 
                    return command.invoke(channel, userstate, message, self);
            }
        };

        client.use = (...features) => {
            return new Promise(async (resolve, reject) => {
                try { 
                    const completed = [];
                    while(features.length){
                        let feature = features.shift();
                        completed.push(await feature(client));
                    }
                    resolve(completed);
                } catch(error){
                    reject(error);
                }
            });
        };

        return client;
    }
});