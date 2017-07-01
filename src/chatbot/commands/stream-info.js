const settings = require("../../misc/settings");
const _ = require("../../misc/utils");

module.exports = async (client) => {
    Object.entries(_.get(settings, "streaminfo", {})).forEach(([command, response]) => {
        if(_.isEmpty(response) || !_.isString(response)) return;
        client.command(command)
            .alias("stream-" + command)
            .action(async (channel, userstate) => {
                await client.say(channel, `@${_.displayName(userstate)}, ${response}`);
            });
    });
};
