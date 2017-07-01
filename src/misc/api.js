const secrets = require("./secrets");
const settings = require("./settings");

const _ = require("./utils");
const chalk = require("chalk");
const fetch = require("node-fetch");
const tmi = require("tmi.js");
const url = require("url");
const qs = require("querystring");

const api = module.exports = {
    async client(name, opts = {}){
        let secret, user;
        if(name !== null){
            if(!(name in secrets) || !("oauth" in secrets[name])) throw new Error(`Unable to load secrets for ${name}`);
            secret = secrets[name];
            user = await _.persevere({ retries: 3, timeout: 1000, decay: 2 })(() =>
                api.user(secret.id).then(body => {
                    if(body.error) throw body;
                    else return body;
                })
            );
        }
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

        client.currentLatency = 2000;
        
        if(name !== null){
            user.oauth = secret.oauth;
            client.user = user;
            client.id = _.get(secret, "id", user._id);
            client.name = user.name;
            client.username = user.name;
            client.display_name = user.display_name;
        }

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

        client.on("message", (channel, userstate, message, self) => {
            let event;
            switch(_.get(userstate, "message-type")){
                case "action":
                    event = (
                        (userstate.badges && "broadcaster" in userstate.badges) ? chalk.red.italic : 
                        (userstate.badges && "moderator" in userstate.badges) || userstate.mod ? chalk.green.italic : 
                        chalk.dim.italic
                    )(` ${userstate.username}* ${message}`);
                    break;
                case "chat":
                    event = `<${(
                        (userstate.badges && "broadcaster" in userstate.badges) ? chalk.red : 
                        (userstate.badges && "moderator" in userstate.badges) || userstate.mod ? chalk.green : 
                        chalk.dim
                    )(userstate.username)}> ${(message.startsWith("!") ? chalk.gray : chalk.dim)(message)}`;
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
                            _.delay(_.get(settings, "chat_interval", 5000) * (queue.length + 1))
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
                await _.delay(parseInt(_.get(settings, "chat_interval", 5000), 10));

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
                    let {_clearance} = this;
                    switch(level){
                        case "viewer": 
                            _clearance = () => true; 
                            break;
                        case "moderator": 
                            _clearance = (channel, userstate) => 
                                (userstate.badges && "moderator" in userstate.badges)
                                || userstate.mod
                                // || (userstate.badges && "broadcaster" in userstate.badges)
                                || channel == _.channel(userstate.username); 
                            break;
                        case "broadcaster": 
                            _clearance = (channel, userstate) => 
                                (userstate.badges && "broadcaster" in userstate.badges)
                                || channel == _.channel(userstate.username); 
                            break;
                        default: 
                            _clearance = () => false;
                            if(_.isFunction(level)) _clearance = level;
                            break;
                    }
                    this._clearance = _clearance;
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
                            Promise.reject(`${userstate.username} from ${channel} does not have clearance to run "${this.name}"`);
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
        
        client.parseCommand = async (channel, userstate, message, self = userstate.username == client.name) => {
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

        return client;
    },

    fetch(path = "", opts = { }){
        const endpoint = url.resolve("https://api.twitch.tv/kraken/", path);
        const _endpoint = (url => 
            `${(url.protocol == "https:" ? chalk.gray : chalk.red)(`${url.protocol}`) + chalk.gray("//")}${url.host == "api.twitch.tv" ? chalk.gray(url.host) : url.host}${url.pathname}${chalk.magenta(_.isNull(url.search)?"":_.get(url, "search", ""))}`
        )(url.parse(endpoint));

        return fetch(endpoint, _.merge({
            method: "get",
            headers: _.get(url.parse(endpoint), "hostname", "").endsWith(".twitch.tv") ? {
                "Accept": "application/vnd.twitchtv.v5+json",
                "Client-ID": secrets.client_id
            } : {
                "Content-Type": "application/json"
            }
        }, opts)).then(response => {
            return response.json().then(body => {
                if(!_.get(opts, "silent", false)) 
                    console.log(
                        "[%s] [debug %s] %s", 
                        _.get(require("node-ipc"), "config.id", "?"), 
                        (body.error ? chalk.yellow : chalk.green)("api.fetch"), 
                        _endpoint
                    );
                return body;
            });
        }).catch(error => {
            if(!_.get(opts, "silent", false)) 
                console.log(
                    "[%s] [debug %s] %s", 
                    _.get(require("node-ipc"), "config.id", "?"), 
                    chalk.red("api.fetch"), 
                    _endpoint
                );
            return Promise.reject(error);
        });
    },

    async login(...names){
        return this.fetch(`users?${qs.stringify({ login: names.join(",") })}`);
    },

    async chatters(channel, extended = true){
        return this.fetch(`https://tmi.twitch.tv/group/user/${channel}/chatters`).then(async body => {
            if(body.error) return body;
            const {chatters} = body;
            const usernames = [[], ...Object.values(chatters)].reduce((a, b)=>a.concat(b));
            let users = [];
            if(extended){
                while(usernames.length > 0){
                    let names = usernames.splice(0, 100);
                    users = users.concat((await this.login(...names)).users);
                }
            } else {
                users = usernames.map(username => ({ name: username, display_name: _.upperFirst(username) }));
            }
            body.users = users;
            return body;
        });
    },

    async user(id){
        return this.fetch(`users/${id}`);
    },
};