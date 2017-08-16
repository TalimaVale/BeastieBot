const settings = require("../../misc/settings");

const _ = require("../../misc/utils");
const api = require("../../misc/api");

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");

    const hosts = [];

    broadcaster.on("hosted", async (home, away, viewers, autohost) => {
        if(autohost && !_.get(settings, "announce.hosted.autohosts", true)) 
            return;

        if([settings.home, broadcaster.user.channel].includes(home)
        && viewers >= parseInt(_.get(settings, "announce.hosted.threshold", 0), 10)){
            const time = new Date();
            const friend = await api.twitch({ name: away });
            hosts.push(friend);

            await client.say(home, `${friend.display_name} has hosted us to ${viewers} ${viewers == 1 ? "viewer" : "viewers"}! Thank you ʕ•ᴥ•ʔ rawr!! Let's go check out their awesome channel: https://www.twitch.tv/${friend.name == friend.display_name.toLowerCase() ? friend.display_name : friend.name}`);

            hosts.push([away, viewers, friend, time]);
        }
    });
};