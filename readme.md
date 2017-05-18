## teamTALIMA's Beastie Bot
<sup>*teamTALIMA Project &mdash; [Developed LIVE on twitch.tv/teamTALIMA](https://www.twitch.tv/teamtalima)*</sup>

A bot for Twitch (IRC) chatrooms and Discord servers.
Developed with Node.js and the npm dependencies 'lodash' and 'tmi.js'.


## BeastieBot Features
Some of Beastie's main features include...

- **Commands List** - A list of user commands (!example, etc.) to be used in twitch chatrooms
- **Events** - Beastie will listen for common events when active in twitch chatrooms
- **Custom Timers** - Set of customizable timers which fire even when stream is offline
- **Raid System** - Robust twitch raiding system for tracking # of raiders and awarding loyalty points for successful raids
- **Message Queue** - A system for timed-release of BeastieBot's responses to protect bot from being timed out


## Upcoming Features
These features are soon to be developed, either on stream or merged from collaborating teammate branch

- **Twitch Chat Logs** - A system to record/log all twitch chat from the broadcaster's chatroom
- **Twitch Chat Moderation** - Beastie moderation for purges, timeouts, and bans based off a customizable blacklist
- **Additional Commands** - Commands for community links, project software, and an expanded !pet
- **Beastie Treats** - BeastieBot's personal currency, used to unlock special commands, perks, and surprises
- **Discord Support**
- **Revlo Integration**


## Setup for Collaborators
How to 'git clone' the repo, install node, install npm dependencies, configure secrets.js


## Install & Run
How to download BeastieBot, setup bot channel, configure secrets.js, launch bot (see wiki for how to permanently launch bot)


### Debian Systems

#### Install
```
git clone https://github.com/teamTALIMA/BeastieBot
sudo apt-get install nodejs
sudo apt-get install npm
cd BeastieBot
npm install lodash
npm install tmi.js
```

#### Setup
```
cp config/secrets-example.js config/secrets.js
nano config/secrets.js
```

#### Run
```
nodejs index.js
```

#### Troubleshooting
> SyntaxError: Block-scoped declarations 

Nodejs is out of date
```
sudo npm cache clean -f
sudo npm install -g n
sudo n stable
sudo rm -f /usr/bin/nodejs
sudo ln -s /usr/local/n/versions/node/7.10.0/bin/node /usr/bin/nodejs
```
Check version:
```
nodejs -v
v7.10.0
```










## License
GNU GPLv3
