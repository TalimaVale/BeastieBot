const fs = require("fs");
const ini = require("ini");
const path = require("path");

module.exports = Object.assign({

}, ini.decode(
    fs.readFileSync(
        path.resolve(__dirname, "../../config/settings.ini"),
        "utf8"
    )
));