 const s = require("./secrets");

module.exports = {
// Client Setup
BROADCASTER        : s.broadcaster.username,
BROADCASTER_PASS   : s.broadcaster.password,
BOT_NAME           : s.TTsBeastie.username,
BOT_PASS           : s.TTsBeastie.password,       
CLIENT_ID           : s.clientId,


// Client Config
AWOKE              : false,            // Greeting on Awake *wired
HELLO              : true,             // Greeting on JOIN
GOODBYE            : true,             // Bye on PART
GET_HOSTED         : true,             // Been Hosted Announcement
RAID               : true,             // Raiding System
NEW_FOLLOW         : true,             // New follow announce and awesomeness reward
NEW_SUB            : true,             // New subscription announcement

// Commands
CUSTOM             : true,             // All Custom commands
POLL_ON            : true,             // Strawpoll !poll

// Strawpoll 
POLL_MULTI         : false,            // Allow multiple votes from the same voter
POLL_PERMISSIVE    : true,             // 

// Timers
WATER_TIMER_ENABLED  : true,            // Hydration reminder
WATER_TIMER_INTERVAL : 30 ,             // Hydration reminder interval in minutes
QUOTE_TIMER_ENABLED  : true,            // Random quote timer   
RULES_TIMER_ENABLED  : true,            //

// LOGS
LOG_LEVEL    : 7          // 0:off 1:chat 2:server 3:client

};
