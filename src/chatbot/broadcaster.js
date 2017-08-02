const settings = require("../misc/settings");

const _ = require("../misc/utils");
const api = require("../misc/api");

module.exports = (async () => {
    const broadcaster = await api.client("broadcaster");
    await broadcaster.connect();

    setImmediate(async () => {
        const beastie = await require("./beastie");
    });

    return broadcaster;
})();