// TODO 
// - error handling
// - refactor to access fs as little as possible.
// - user feedback



var jsonObj = require("./custom.json");
const fs = require("fs");
const _ = require("lodash");

// message is passed from "commands" in commands.js
// sends the command and message to the
function comHandler(message){
        
        //deconstruct message
        var strLower = message.toLowerCase();
        var strSplit = strLower.split(" ");
        //isolate the command and parameters
        var strCom = "!commands " + strSplit[1] + " " + strSplit[2] + " " ;
        //find the message
        var strSliced = strLower.slice(strCom.length);
        //send message to appropriate handler   
        switch(strSplit[1]){
            case "add":
                addCommand(strSplit[2],strSliced);
                break;
            case "edit":
                editCommand(strSplit[2],strSliced);
                break;
            case "delete":
                deleteCommand(strSplit[2],strSliced);
                break;
            }
};

// Adds a new command when !command add <message> is sent
function addCommand(command,message){
    // command and message are passed from comHandler.
    // push new command and its message to the json object
    jsonObj.commands.push({name:command,message:message});
    // overwrite file with jsonObj
    fs.writeFileSync("./commands/custom.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
};
        
function editCommand(command, message){
    console.log("editCommand was called");
    //find index of command name
    var index = _.findIndex(jsonObj.commands, function(c) { return c.name == command; });
    // remove command object at index
    jsonObj.commands[index].message = message;
    fs.writeFileSync("./commands/custom.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
    
};

// Deletes custom command
function deleteCommand(command, message){
    // command and message are passed from comHandler.
    // find index of command name
    var index = _.findIndex(jsonObj.commands, function(c) { return c.name == command; });
    // remove command object at index
    jsonObj.commands.splice(index, 1);
    fs.writeFileSync("./commands/custom.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
};

module.exports.comHandler = comHandler;




