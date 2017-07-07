const settings = require("../../misc/settings");
const secrets = require("../../misc/secrets");

const path = require("path");
const chalk = require("chalk");
const _ = require("../../misc/utils");
const api = require("../../misc/api");
const errors = require("feathers-errors");

const dataDir = path.resolve(__dirname, "../../../data/");
const pointsCsv = path.resolve(dataDir, "points.csv");

Object.assign(module, {
    async exports(){
        const app = this;
        const broadcaster = await api.twitch({ id: secrets.broadcaster.id });

        let teammates = [];
        let shouldSave = false;

        const initialized = (async () => {
            const data = await _.csv.read("data/points", {
                mkdir: true,
                columns: [ "name", "id", "points", "earned" ],
                from: 2
            });
            console.log("[beastie-chatbot] parsed points.csv");
            if(_.isArray(data) && !_.isEmpty(data)){
                teammates.push(
                    ..._.uniqBy(data.map(({ name, id, points, earned }) => ({ 
                        name, id, 
                        points: parseInt(points, 10)|0, 
                        earned: parseInt(earned, 10)|0 
                    })), "id")
                );
            }
            console.log("[beastie-chatbot] done loading points (%s teammates)", teammates.length);
            return true;
        })();
        
        // manual save
        async function save(force = false){
            if(!shouldSave && !force) return;
            await initialized;
            await _.csv.write("data/points", teammates = _.sortBy(teammates, ["name", "id"]));
            shouldSave = false;
            console.log("[beastie-chatbot] saved points to points.csv");
        }
        
        // autosave
        (async () => {
            while(true){
                await _.sleep(5 * 60 * 1000).unref();
                if(shouldSave) await save();
            }
        })();

        process.cleanup.unshift(() => save());
        
        app.use("/api/teammates/bonus", {
            async find(params){
                return {};
            },
            async create(data, params){
                let {points, type} = data;
                let targets = data.teammates;
                points = parseInt(points, 10)|0;
                const touched = [];

                if(!_.isArray(targets))
                    targets = (await api.chatters("teamtalima" || broadcaster.name)).users.map(({name, _id})=>({ name, id: _id }));
                
                for(let teammate of targets){
                    let existing = _.find(teammates, { id: teammate.id });
                    if(!existing){
                        teammate.points = 0;
                        teammate.earned = 0;
                        teammates.push(teammate = _.pick(teammate, ["name", "id", "points", "earned"]));
                    } else {
                        teammate = existing;
                    }
                    teammate.points += points;
                    if(type === "earned")
                        teammate.earned += points;
                    touched.push(teammate);

                    shouldSave = true;
                }

                return { teammates: touched };
            }
        });

        app.use("/api/teammates", {
            async get(id, params){
                const teammate = _.find(teammates, { id });
                if(teammate){
                    return teammate;
                }
                return { name: null, id, points: 0, earned: 0 };
            },
            async find(params){
                let page = parseInt(_.get(params.query, "page", 1), 10)|0;
                page = Math.max(0, page - 1);
                return { _count: teammates.length, teammates: teammates.slice(page * 20, (page * 20) + 20) };
            },
            async patch(id, data, params){
                const teammate = _.find(teammates, { id });
                if(teammate){
                    _.assign(teammate, _.defaults(
                        _.pick(data, ["name", "points", "earned"]),
                        teammate
                    ));
                    shouldSave = true;
                    return teammate;
                }
                return Promise.reject(new errors.NotFound(`Teammate "${id}" could not be found`));
            },
        });

        app.use("/api/teammates/:id/bonus", {
            async create(data, params){
                const {id} = params;
                let teammate = _.find(teammates, { id });
                const points = parseInt(data.points, 10)|0;
                if(teammate){
                    teammate.points += points;
                    if(data.type === "earned") 
                        teammate.earned += points;
                    shouldSave = true;
                    return teammate;
                } else {
                    const user = await api.twitch({ id: id });
                    if(user && user.id == id){
                        teammates.push({ 
                            name: user.name, 
                            id, points,
                            earned: data.type === "earned" ? points : 0
                        });
                        shouldSave = true;
                        return _.find({ id });
                    }
                }
                return Promise.reject(new errors.NotFound(`Teammate "${id}" could not be found`));
            }
        });
    }
});