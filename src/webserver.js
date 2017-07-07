const settings = require("./misc/settings");
const secrets = require("./misc/secrets");

const path = require("path");

const _ = require("./misc/utils");
const authentication = require("feathers-authentication");
const bodyParser = require("body-parser");
const errors = require("feathers-errors");
// const favicon = require("serve-favicon");
const feathers = require("feathers");
const handler = require("feathers-errors/handler");
const hooks = require("feathers-hooks");
const jwt = require("feathers-authentication-jwt");
const local = require("feathers-authentication-local");
const memory = require("feathers-memory");
const rest = require("feathers-rest");
const socketio = require("feathers-socketio");

const publicDir = path.resolve(__dirname, "./webserver/public");

(async () => {
    _.exitHandler(async () => {
        console.log("[beastie-webserver] goodbye");
    });

    if(await _.pid.check("beastie-webserver")){
        console.error("[beastie-webserver] already running!");
        return _.exit(1);
    }

    const beastieWebServer = await _.lockProcess("beastie-webserver");

    const app = feathers();

    // app.use(favicon(path.resolve(__dirname, "./webserver/public/favicon.ico")));
    app.use(feathers.static(publicDir));

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.configure(hooks());
    app.configure(rest());
    app.use((req, res, next) => {
        req.feathers.client_id = _.get(req, "query.client_id", req.get("Client-ID")) || null;
        next();
    });
    // app.configure(socketio());
    // app.configure(authentication({ idField: "id", secret: "" }));
    // app.configure(local());
    // app.configure(jwt());

    // await require("./webserver/endpoints/contests").call(app);
    // await require("./webserver/endpoints/giveaways").call(app);
    // await require("./webserver/endpoints/goals").call(app);
    // await require("./webserver/endpoints/leaderboard").call(app);
    // await require("./webserver/endpoints/oauth").call(app);
    // await require("./webserver/endpoints/overlay").call(app);
    // await require("./webserver/endpoints/redemptions").call(app);
    // await require("./webserver/endpoints/rewards").call(app);
    await require("./webserver/endpoints/teammates").call(app);

    for(const [endpoint, service] of Object.entries(app.services)){
        if(endpoint.startsWith("api/"))
            service.hooks({
                before(hook){
                    if(hook.params.client_id !== secrets.webserver.client_id)
                        return Promise.reject(new errors.NotAuthenticated("Wrong or missing Client-ID"));
                }
            })
    }

    // app.use("/users", memory());
    app.use(handler({ html: false }));


    // app.service("authentication").hooks({
    //     before: {
    //         create: [ authentication.hooks.authenticate(["jwt", "local"]) ],
    //         remove: [ authentication.hooks.authenticate("jwt") ]
    //     }
    // });

    // app.service("users").hooks({
    //     before: {
    //         find: [ authentication.hooks.authenticate("jwt") ],
    //         create: [ local.hooks.hashPassword({ passwordField: "password" }) ]
    //     },
    // });

    // app.service("users").create({
    //     email: "beastie@localhost",
    //     password: "beastie"
    // });

    const server = app.listen(8080);
    process.cleanup.push(() => new Promise(resolve => {
        if(server.listening) 
            Promise.race([
                new Promise(resolve => server.close(resolve)),
                _.sleep(2000).unref().then(()=>server.unref())
            ]).then(resolve)
        else resolve();
    }));

    console.log("[beastie-webserver] rawr world. ready to rumble!");
})()