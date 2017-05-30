// TODO - Construct a GET and POST HTTP Header to replace dependencies.


// Dependencies
const request = require("request");
const queue = require("../message-queue");
const beastie = require("../beastie-client");

//json object
var jsonObj = require("../json/polls.json");

const fs = require("fs");

function pollHandler(message) 
{
    var msgLower = message.toLowerCase();
    var msgSplit = msgLower.split(" ");  //
    // find the index of | and slice the rest of the message
    var optionsIndex = message.indexOf("|");
    var msgSliced = message.slice(optionsIndex+1);
    //find the title for the poll by slicing from parameter index to options index  
    var title = message.slice(message.indexOf(msgSplit[2]),optionsIndex);  
    // options string into an array with | delimiter 
    var arryOptions = msgSliced.split("|");
   
    switch(msgSplit[1]){
   
    case "new":
        // iterate options and trim surrounding whitespace
        for(var i=0, len= arryOptions.length; i < len; i++){
            arryOptions[i] = arryOptions[i].trim();
            }
         // send title and options to createPoll    
        createPoll(title,arryOptions);
        break;
    case "results":
        getPoll();
        break;
    }
}
 
function createPoll(title,options){
   
var poll = { title: title, options: options };

request.post({
  url: 'https://strawpoll.me/api/v2/polls',
  followAllRedirects: true,
  body: poll,
  json: true
},
    function (error, response, body) {
        if (!error && response.statusCode == 200) {
            jsonObj.polls.push({id:body.id});
            // overwrite file with jsonObj
            fs.writeFileSync("./json/polls.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
            //jsonObj = fs.readFileSync("./json/polls.json");
            
        }else
        {
            console.log("There was an error connecting to strawpoll: " + error);
        }
    }
           
);
}
 
function getPoll(){
 //get last poll index
 var pollIds = jsonObj.polls;
 var pollIdx = pollIds.length-1;
 //get channel
 var channel = beastie.getChannels();
 //return channel message with link to latest poll
 queue.addMessage(channel[0], "www.strawpoll.me/" + pollIds[pollIdx].id);
 }
 
module.exports.pollHandler = pollHandler;