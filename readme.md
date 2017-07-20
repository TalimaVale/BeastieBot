# teamTALIMA BeastieBot

## Content
* [What is BeastieBot](#what-is-beastiebot)
* [Use BeastieBot](#can-i-use-beastiebot) 
* [Contribute to BeastieBot](#this-is-awesome!-how-do-i-contribute?) 
* [Programming](#programming) 
* [Testing](#testing) 
* [New Feature Ideas](#new-feature-ideas) 
* [Who are the Project Managers](#who-are-the-project-managers) 
* [teamTALIMA Community Links](#teamTALIMA-community-links) 
* [License](#license) 


## What is BeastieBot?

## Can I use BeastieBot?

## Can I contribute to the BeastieBot project?

## This is Awesome! How do I contribute?

### Programming

### Testing

### New Feature Ideas


## Who are the Project Managers?
* Talima (via teamTALIMA acct.)
* Scryptonite

## teamTALIMA Community Links
[GitHub Repo for BeastieBot](https://github.com/teamTALIMA/BeastieBot "teamTALIMA's BeastieBot Repo")

[Discord Server](https://discordapp.com/invite/dGFQ5tE "teamTALIMA's Discord Server")

[Twitch Channel](https://www.twitch.tv/teamtalima "teamTALIMA's Twitch Channel")

[YouTube Channel](https://www.youtube.com/channel/UCQEtRUEQItKpn-q_ZBJXUVQ "teamTALIMA's YouTube Channel")

## License
GNU GPLv3





# teamTALIMA's Beastie Bot
<sup>*teamTALIMA Project &mdash; [Developed LIVE on twitch.tv/teamTALIMA](https://www.twitch.tv/teamtalima)*</sup>

> A bot for Twitch (IRC) chatrooms and Discord servers. Developed with Node.js and the npm dependencies 'lodash' and 'tmi.js'.
> 


 ## Content
 * [BeastieBot Features](#beastiebot-features) 
 * [Upcoming Features](#upcoming-features) 
 * [Dependencies](#dependencies) 
 * [Install and Configuration](#install-and-configuration) 
   - [Debian](#debian) 
   - [Windows](#windows) 
 * [License](#license) 




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


## Dependencies
* Node.js: ^7.10:  https://nodejs.org
* lodash: ^4.17.4 : https://lodash.com/
* tmi.js: ^1.1.2 : https://docs.tmijs.org/


## Install and Configuration
note: current install and setup is aimed towards contributors. The wiki will provide high level instructions for end users.

### Debian 

#### Install
```git clone https://github.com/teamTALIMA/BeastieBot```

```sudo apt-get install nodejs```

```sudo apt-get install npm```

```cd BeastieBot```

```npm install```

#### Setup
```cp config/secrets-example.js config/secrets.js```

```nano config/secrets.js```

#### Run
```nodejs index.js```

#### Troubleshooting
> SyntaxError: Block-scoped declarations 

Nodejs is out of date

```sudo npm cache clean -f```

```sudo npm install -g n```

```sudo n stable```

```sudo rm -f /usr/bin/nodejs```

```sudo ln -s /usr/local/n/versions/node/7.10.0/bin/node /usr/bin/nodejs```

Check version:

```nodejs -v```

```v7.10.0```

### Windows 

#### Install
Download and install Node.js

``` https://nodejs.org/en/ ```

Open command prompt and change to your development folder

```git clone https://github.com/teamTALIMA/BeastieBot ```

```cd BeastieBot ```

```npm install```

#### Setup
```copy config\secrets-example.js config\secrets.js```

```notepad config\secrets.js```

#### Run
```node index.js```


## License
GNU GPLv3






