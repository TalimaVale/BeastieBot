const secrets = require("./secrets");
const settings = require("./settings");

const _ = require("./utils");
const chalk = require("chalk");
const fetch = require("node-fetch");
const tmi = require("tmi.js");
const url = require("url");
const qs = require("querystring");

const api = module.exports = {
    clearance: {
        viewer: (channel, userstate) => true,

        regular: (channel, userstate) =>
            [].includes(userstate.id)
            || api.clearance.moderator(channel, userstate),
        patron: (channel, userstate) =>
            [].includes(userstate.id)
            || api.clearance.moderator(channel, userstate),
        subscriber: (channel, userstate) =>
            userstate.subscriber
            || "subscriber" in userstate.badges
            || api.clearance.moderator(channel, userstate),

        _moderator: (channel, userstate) =>
            userstate.mod
            || "moderator" in userstate.badges
            || userstate["user-type"] == "mod",
        moderator: (channel, userstate) =>
            api.clearance._moderator(channel, userstate)
            || api.clearance.super_moderator(channel, userstate),
        super_moderator: (channel, userstate) =>
            (   api.clearance._moderator(channel, userstate)
                && [].includes(userstate.id) )
            || api.clearance.broadcaster(channel, userstate),
        broadcaster: (channel, userstate) =>
            userstate.name === channel.replace(/$#/, "")
            || "broadcaster" in userstate.badges
            || api.clearance.sudoer(channel, userstate),
        sudoer: (channel, userstate) =>
            [].includes(userstate.id),
    },

    fetch(path = "", opts = { }){
        const endpoint = url.resolve("https://api.twitch.tv/kraken/", path);
        const _endpoint = (url =>
            `${(url.protocol == "https:" ? chalk.gray : chalk.red)(url.protocol) + chalk.gray("//")}${url.host == "api.twitch.tv" ? chalk.gray(url.host) : url.host}${url.pathname}${chalk.magenta(_.isNull(url.search)?"":_.get(url, "search", ""))}`
        )(url.parse(endpoint));

        const headers = {};
        const {hostname, host} = url.parse(endpoint);
        if(hostname.endsWith(".twitch.tv")) {
            _.assign(headers, {
                "Accept": "application/vnd.twitchtv.v5+json",
                "Client-ID": _.get(secrets, "client_id")
            });
        } else if(host === "127.0.0.1:8080") {
            _.assign(headers, {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Client-ID": _.get(secrets, "webserver.client_id")
            });
          }

        return fetch(endpoint, _.merge({
            method: "get", headers,
        }, opts)).then(response => {
            return response.json().then(body => {
                if(!_.get(opts, "silent", false))
                    console.log(
                        "[%s] [debug %s] %s",
                        _.get(require("node-ipc"), "config.id", "?"),
                        (body.error ? chalk.yellow : chalk.green)("api.fetch"),
                        _endpoint
                    );
                // if(host === "127.0.0.1:8080")
                //     console.log(body);
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

    _users: [],
    normalize(user){
        let normalized = {};
        if(user == null || typeof user != "object") user = {};
        normalized.id = user.id || user._id || user["user-id"] || null;
        normalized.name = user.name || user.user_name || user.username || null;
        normalized.display_name = user.display_name || user["display-name"] || _.upperFirst(normalized.name) || null;
        normalized.channel = normalized.name ? `#${normalized.name}` : null;
        normalized.badges = user.badges || {};
        return normalized;
    },
    async twitch(user, path = undefined){
        if(_.isString(user)){
            if(user.startsWith("#"))
                user = { name: user.toLowerCase().replace(/$#/, "") };
            else
                user = { name: user.toLowerCase() };
        }

        _.assign(user, this.normalize(user));

        if(path === undefined || !_.has(user, path)){
            let match;
            if(_.has(user, "id") && user.id && !(match = _.find(this._users, { id: user.id }))){
                await this.fetch(`users/${user.id}`).then(body => {
                    if(body.error)
                        return Promise.reject(body);
                    let _user = this.normalize(body);
                    _.assign(user, _user);
                    this._users.push(_user);
                });
            } else if(_.has(user, "name") && user.name && !(match = _.find(this._users, { name: user.name }))){
                await this.fetch(`users?${qs.stringify({ login: user.name })}`).then(body => {
                    if(body.error)
                        return Promise.reject(body);
                    if(body.users == null
                    || body.users.length != 1)
                        return Promise.reject(body);

                    let _user = this.normalize(body.users[0]);
                    _.assign(user, _user);
                    this._users.push(_user);
                });
            }
            if(match) _.assign(user, match);

            if(path !== undefined && !_.has(user, path)) return Promise.reject(`[error: unable to lookup ${path}`);
        }
        return path === undefined ? user : _.get(user, path);
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
                users = users.map(user => Object.setPrototypeOf(api.normalize(user), user));
            } else {
                users = usernames.map(username => ({ name: username, display_name: _.upperFirst(username) }));
            }
            body.users = users;
            return body;
        });
    },

    // async user(id){
    //     return this.fetch(`users/${id}`);
    // },
};

_.assign(api, require("./api/client")(api));
