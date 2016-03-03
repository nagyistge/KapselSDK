// List of mime types. Used for attachment handling. 
var mimeTypes = require("./MimeTypes");
var mimeExtensionTable = function () { };

mimeExtensionTable.prototype.get = function (key) {
    if (mimeTypes) {
        result = mimeTypes[key];
    }
    if (!result) {
        result = ".unknowntype";
    }
    return result;
};
mimeExtensionTable.prototype.listAsJSON = function () {
    return JSON.stringify(mimeTypes);
};

module.exports = mimeExtensionTable;