// TODO - Construct a GET and POST HTTP Header to replace dependencies.


// Dependencies
const request = require('request');

//json object
const jsonObj = require("../json/polls.json");

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

console.log(title + ": " + options);
    
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
            console.log(jsonObj);
            fs.writeFileSync("./json/polls.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
           // fs.readFileSync("./json/polls.json");
        }
    }
           
);
        
 // overwrite file with jsonObj

}
 
function getPoll(){

}
 
module.exports.pollHandler = pollHandler;