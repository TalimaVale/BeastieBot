var jsonObj = require("./custom.json");
const fs = require("fs");

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
    fs.writeFile("./commands/custom.json", JSON.stringify(jsonObj), (err) => {if (err){ console.log(err);}});
};
        
function editCommand(command, message){};

function deleteCommand(command, message){};

module.exports.comHandler = comHandler;




