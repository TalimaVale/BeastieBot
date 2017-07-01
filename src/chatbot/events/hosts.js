const settings = require("../../misc/settings");

const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const hosts = [];

    broadcaster.on("hosted", async (home, away, viewers) => {
        if(home == _.channel(broadcaster.name) 
        && viewers >= parseInt(_.get(settings, "announce.hosted.threshold", 0), 10)){
            const time = new Date();
            const friend = (await api.login(away).catch(()=>{
                return { users: [] };
            }).then(({users}) => {
                users.push({ name: away });
                return users;
            }))[0];

            await client.say(home, `${_.displayName(friend)} has hosted us to ${viewers} ${viewers == 1 ? "viewer" : "viewers"}! Thank you ʕ•ᴥ•ʔ rawr!! Let's go check out their awesome channel: https://www.twitch.tv/${friend.name == _.displayName(friend).toLowerCase() ? _.displayName(friend) : friend.name}`);

            hosts.push([away, viewers, friend, time]);
        }
    });
};