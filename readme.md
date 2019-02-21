# Introducing BeastieBot
## Welcome to the BeastieBot chatbot!
Beastie is an ongoing, open source, chatbot project created by [teamTALIMA](https://github.com/teamTALIMA). Originally designed for Twitch IRC chat rooms, Beastie can now also join Discord servers and Twitter accounts. Beastie is a customizable live streaming tool and online community moderator.

Primary Features include:

* Commands to display community links / general info
* Automated messages upon live streaming events / on timers
* System for Twitch 'raiding', including rewards for participating 'raiders'
* Automated Twitter and Discord posts when a Twitch stream or YouTube video goes live

BeastieBot is an ongoing community project, and we are always interested in new ideas, features and developers interested in helping us train Beastie to be even more awesome!

## Using BeastieBot
### Requirements
BeastieBot is developed in Node.js and requires the machine running him to have Node.js installed.

[Install Node.js Here](https://nodejs.org/en/)

### Installation
First, download BeastieBot by cloning this git repository into an empty directory on your machine.

```
git clone https://github.com/teamTALIMA/BeastieBot.git
```
To install Beastie's dependencies, open a command line pointed at his directory and run:
```
npm install
```

To initialize Beastie, use the same command line and run:
```
node . init
```
You will be presented interactive prompts. Follow them, and provide your Twitch Client-ID, Broadcaster channel's OAuth (channel which will stream) and Bot channel's OAuth (channel which will be Beastie).
* [*Where can I get a Twitch Client-ID?*](https://dev.twitch.tv/dashboard/apps/create)
* [*Where do I get an OAuth Token for my Twitch account?*](https://twitchapps.com/tmi/)

To start Beastie, use the same command line and run:
```
npm start
```

## Contributing to BeastieBot
For project updates and discussion, we suggest that you join the teamTALIMA [Discord server](https://discordapp.com/invite/dGFQ5tE "teamTALIMA's Discord Server") or try to catch a teamTALIMA [Twitch stream](https://www.twitch.tv/teamtalima "teamTALIMA's Twitch Channel") (where we develop the project live), but neither is strictly necessary.

We encourage anyone interested in learning more about chatbot development to ‘Watch’ this project on Github and join the teamTALIMA community! Everyone from hobbyists to students to professionals to experts are welcome here. We have many teammates within our community who mentor and do their best to answer questions and share knowledge about their development process and areas of expertise.

### How do I contribute?
All contributions should be made through [teamTALIMA's](https://github.com/teamTALIMA) BeastieBot repository. Create a ‘Pull Request’ with your contribution and description of contribution, and it will be reviewed by one of our project managers. Pull requests should contain as few changes as possible (only those necessary to implement the single, new feature the pull request is contributing) in order to avoid conflicts when merging into the project.

> *Note:* Many pull requests will need to be critiqued/revised slightly to merge with the project properly. This is standard. Do not be discouraged if your contribution is not accepted immediately.

## Who are the Project Managers?
* Talima (via teamTALIMA account)
* Scryptonite

## teamTALIMA Community Links
[GitHub Repo for teamTALIMA: theGAME](https://github.com/teamTALIMA/teamTALIMA_theGAME "teamTALIMA's theGAME Repo")

[Twitch Channel](https://www.twitch.tv/teamtalima "teamTALIMA's Twitch Channel")

[Discord Server](https://discordapp.com/invite/dGFQ5tE "teamTALIMA's Discord Server")

[YouTube Channel](https://www.youtube.com/channel/UCQEtRUEQItKpn-q_ZBJXUVQ "teamTALIMA's YouTube Channel")

## License
GNU GPLv3
