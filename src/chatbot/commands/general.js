const qs = require("querystring");
const _ = require("../../misc/utils");
const api = require("../../misc/api");
const fs = require("fs");
const path = require("path");



const secrets = require("../../misc/secrets");
const Twitter = require("twitter");
const Discord = require('discord.io');
const YouTube = require('simple-youtube-api');

// Initializing YouTube Bot
const youtubeClient = secrets.youtube ? new YouTube(secrets.youtube.api_key) : null;

// Initialize Twitter Bot
const twitterClient = secrets.twitter ? new Twitter({
  consumer_key: secrets.twitter.consumer_key,
  consumer_secret: secrets.twitter.consumer_secret,
  access_token_key: secrets.twitter.access_token_key,
  access_token_secret: secrets.twitter.access_token_secret,
}) : null;

// Initialize Discord Bot
const discordClient = secrets.discord ? new Discord.Client({
    token: secrets.discord.token,
    autorun: true
}) : null;

module.exports = async (client) => {
    const broadcaster = await require("../broadcaster");
    let streamId = +fs.readFileSync(path.join(__dirname, `../../../data/stream-id`), { encoding: "utf8" });
    let videoIds = fs.readFileSync(path.join(__dirname, `../../../data/video-ids`), { encoding: "utf8" });
    let ttDiscordChannelID = '';
    let newsDiscordChannelID = '';

    setInterval(async () => {
      const streamData = await api.fetch(`streams/${broadcaster.id}`).catch(()=>({stream: null}));
      if(streamData.stream !== null) {
        if(streamData.stream._id !== streamId) {
          streamId = streamData.stream._id;
          fs.writeFileSync(path.join(__dirname, `../../../data/stream-id`), streamId, { encoding: "utf8" });

          if(twitterClient !== null){
            twitterClient.post('statuses/update', {
              status: `BeastieBot is rawring because we are LIVE! rawr https://www.twitch.tv/teamTALIMA#stream-${streamId} #teamTALIMA #GameDev #Awesomeness`
            }, function(error, tweet, response) {
              if(error) throw error;
              console.log(tweet);  // Tweet body
            });
          }

          if(discordClient !== null) {
            discordClient.sendMessage({
              to: newsDiscordChannelId,
              message: `@here BeastieBot is rawring because we are LIVE! rawr https://www.twitch.tv/teamTALIMA`,
            });
          }
        }
      }

      if(youtubeClient !== null) {
        youtubeClient.getPlaylist('https://www.youtube.com/playlist?list=UUKjIJW6mQg7rEnDJ-KnVL-w')
        .then(playlist => {
            playlist.getVideos()
            .then(myVideos => {
                const myVideoIds = myVideos.map(video => video.id);
                const newVideoId = myVideoIds.filter(videoId => !videoIds.includes(videoId));

                if(newVideoId.length > 0){
                  console.log(`Our new video's id: ${newVideoId[0]}`);
                  videoIds = myVideoIds.join(`,`);
                  fs.writeFileSync(path.join(__dirname, `../../../data/video-ids`), videoIds, { encoding: "utf8" });

                  twitterClient.post('statuses/update', {
                    status: `BeastieBot is rawring because Talima has posted a new video! rawr https://www.youtube.com/watch?v=${newVideoId[0]} #teamTALIMA #GameDev #Awesomeness`
                  }, function(error, tweet, response) {
                    if(error) throw error;
                    console.log(tweet);  // Tweet body
                  });

                  discordClient.sendMessage({
                    to: newsDiscordChannelId,
                    message: `@here BeastieBot is rawring because Talima has posted a new video! rawr https://www.youtube.com/watch?v=${newVideoId[0]}`,
                  });
                }
            })
            .catch(console.log);
        })
        .catch(console.log);
      }
    }, 10 * 1000);

    if(discordClient !== null) {
      discordClient.on('ready', function (evt) {
        console.log('Connnected');
        console.log(`logged in as: ${discordClient.username} - (${discordClient.id})`);

        ttDiscordChannelId = Object.values(discordClient.channels).find(channel => channel.name == "teamtalima" && channel.type == 0).id;
        newsDiscordChannelId = Object.values(discordClient.channels).find(channel => channel.name == "news" && channel.type == 0).id;

        discordClient.sendMessage({
          to: ttDiscordChannelId,
          message: `Hello Team! :D I have awoken! Welcome back to teamTALIMA's server!`,
        });
      });

      discordClient.on('message', function (user, userID, channelID, message, evt) {
        // Our bot needs to know if it will execute a command
        // It will listen for messages that will start with `!`
        if (message.substring(0, 1) == '!') {
            let args = message.substring(1).split(' ');
            const cmd = args[0];
            console.log(`my channelID: ${channelID}`);

            args = args.splice(1);
            switch(cmd) {
                // !hellobeastie
                case 'hellobeastie':
                    discordClient.sendMessage({
                        to: channelID,
                        message: `Hello ${user}! rawr`
                    });
                break;
                // Just add any case commands if you want to..
            }
        }
      });

      discordClient.on("disconnect", (...args) => console.log(args));
    }







    client
        .command("helpbeastie")
        .alias("beastiecommands", "help", "commands")
        .description("Shows helpful information regarding my commands.")
        .action(async (channel, userstate, message) => {
            const [command, trigger] = message.split(" ");
            if(["!help", "!helpbeastie"].includes(command) && trigger != null && !_.isEmpty(trigger)){
                const command = client.findCommand(trigger);
                if(command){
                    const desc = _.get(command, "_description", "No description is available for that command.");
                    await client.say(channel, `${userstate.display_name}, !${trigger}: ${desc}`);
                } else {
                    await client.say(channel, `${userstate.display_name}, !${trigger} is not a command that I recognize.`);
                }
                return;
            }


            const list = (await Promise.all(
                    client.commands.map(command => new Promise(async resolve => {
                        resolve(await command._clearance(channel, userstate) ? command : null);
                    }))
                ))
                .filter(command => command !== null && !_.get(command, "context.hidden", false))
                .map(command => `!${command.name}`)
                .join(", ");
            await client.say(channel, `Here are some of my tricks: ${list}. rawr`);
        });

    client
        .command("hellobeastie")
        .alias("hibeastie", "heybeastie", "heyabeastie", "heyobeastie")
        .alias("hello", "hi", "hey", "heya", "heyo")
        .description("Says hello to you!")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `Hello ${userstate.display_name}! rawr`);
        });

    client
        .command("goodbyebeastie")
        .alias("byebeastie", "goodbye", "bye")
        .description("Says goodbye to you!")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `Goodbye ${userstate.display_name}! See you next stream :)`);
        });

    client
        .command("rawr")
        .description("Rawrs in the chat.")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.say(channel, `ʕ•ᴥ•ʔ RAWR`);
        });

    client
        .command("pet")
        .description("Pets me on the head.")
        .alias("petbeastie")
        .clearance("viewer")
        .action(async (channel, userstate) => {
            await client.action(channel, `purrs while ${userstate.display_name} pets his head OhMyDog`);
        });

    client
        .command("shoutout")
        .description("Gives a shoutout to an awesome channel.")
        .clearance("moderator")
        .action(async (channel, userstate, messages) => {

            let [command, name] = messages.split(" ");

            if(name == null || _.isEmpty(name)){
                return await client.say(channel, `${userstate.display_name} please call the command in the format of "!shoutout <channel>", where <channel> is a valid twitch channel name.`);
            }

            const friend = await api.twitch({ name: name.toLowerCase() });

            if(!friend){
                await client.say(channel, `${userstate.display_name} \"${name}\" does not appear to be a channel :/`)
            } else {
                await client.say(channel, `Shoutout to our friend ${friend.display_name}!! Check out their awesome channel: https://www.twitch.tv/${friend.name == friend.display_name.toLowerCase() ? friend.display_name : friend.name} !`);
            }
        });
};
