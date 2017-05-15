// TTsBeastie message queue

/*** REQUIRED FILES AND VARIABLES ***/

var beastie = require("./beastie-client");

var messageQueue = [];



/*** CREATE MESSAGE QUEUE ***/

// .addMessage - add a chat message to Beastie's message queue
module.exports.addMessage = function(channel, message){
    // 'push' the beastie.say() method into the messageQueue array
    messageQueue.push(() => beastie.say(channel, message));
}

// .addWhisper - add a whisper message to Beastie's message queue
module.exports.addWhisper = function(username, message){
    // 'push' the beastie.whisper() method into the messageQueue array
    messageQueue.push(() => beastie.whisper(username, message));
}

// .flushQueue - dump messageQueue array, and send a confirmation chat message
module.exports.flushQueue = function(channel, message){
    // replace messageQueue contents with confirmation message
    messageQueue = [() => beastie.say(channel, message)];
}



// Beastie releases one queued message per second
setInterval(function(){
    if(messageQueue.length > 0){
        // return first element (messageQueue[0]) in messageQueue, execute it, then remove it
        messageQueue.shift()();
    }
}, 500); // .5sec timer