const fs = require("fs");
const ini = require("ini");
const path = require("path");

module.exports = ini.decode(
    fs.readFileSync(
        path.resolve(__dirname, "../../config/secrets.ini"), 
        "utf8"
    )
);