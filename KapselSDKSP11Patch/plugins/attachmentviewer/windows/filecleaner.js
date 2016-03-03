
var utils = require('kapsel-plugin-attachmentviewer.Utils');

module.exports = {

    cleanFolder: function (folderName, successCallback, errorCallback) {

        utils.logMessage("Folder cleaning is started", "debug", "FileCleaner");

        Windows.Storage.ApplicationData.current.temporaryFolder.getFolderAsync(folderName).done(
         function (folder) {
             folder.getFilesAsync().done(
                 function (files) {
                     var now = new Date().getTime();
                     var i = null;
                     deleteNextFile();

                     function deleteNextFile() {
                         i = (i == null) ? 0 : i + 1;

                         if (i < files.length) {
                             files[i].deleteAsync().done(
                                 function () {
                                     //logMessage("Deleted file", "error", "FileCleaner");										
                                     deleteNextFile();
                                 },
                                 function (error) {
                                     var errorMsg = (error && error.message) ? error.message : error;
                                     utils.logMessage("File delete error " + errorMsg, "error", "FileCleaner");
                                     deleteNextFile();
                                 }
                             );
                         } else {
                             if (successCallback) {
                                 successCallback();
                             }
                         }
                     }
                 }, function (error) {
                     errorHandler("Get files async error", error);
                 });
         }, function (error) {
             errorHandler("Get folder async error", error);
         });

        function errorHandler(errorMessagePrefix, error) {
            var errorMsg = (error && error.message) ? error.message : error;
            utils.logMessage(errorMessagePrefix + " " + errorMsg, "error", "FileCleaner");

            if (errorCallback) {
                errorCallback(error);
            }
        }
    }
}