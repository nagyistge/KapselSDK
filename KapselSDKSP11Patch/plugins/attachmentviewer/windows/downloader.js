

var utils = require('kapsel-plugin-attachmentviewer.Utils');

getExtension = function (mime) {
    return utils.mimeExtensionsTable.get(mime);
}
module.exports = {
    downloadFile: function (urlToLaunch,i18nBundle, errorCB) {
        utils.showMessage(i18nBundle.get("downloading_file", "Downloading file ... "), "short");
        WinJS.xhr({
            url: urlToLaunch, responseType: "blob",
            // use this header to ensure that winjs does not use cached responses.
            headers: {
                "If-Modified-Since": "Mon, 27 Mar 1972 00:00:00 GMT"
            }
        })
         .done(function complete(result) {
             utils.showMessage(i18nBundle.get("downloading_complete", "Download complete. File will be opened in external app."), "short");
             var arrayResponse = result.response;
             var mime = result.getResponseHeader("Content-Type");
             utils.logMessage("Mime = " + mime, "INFO", "Attachment")
             var filename = "download-" + new Date().getTime() + getExtension(mime);
             var size = arrayResponse.size;
             var parentFolder = Windows.Storage.ApplicationData.current.temporaryFolder;
             parentFolder.createFolderAsync(utils.DOWNLOAD_FOLDER, Windows.Storage.CreationCollisionOption.openIfExists).done(
                 function (folder) {
                     var file = folder.createFileAsync(filename, Windows.Storage.CreationCollisionOption.replaceExisting).then(
                     function (_file) {
                         var stream = arrayResponse.msDetachStream();
                         var reader = new Windows.Storage.Streams.DataReader(stream);
                         var iBuffer;
                         reader.loadAsync(size).then(function (count) {
                             iBuffer = reader.readBuffer(size);

                             Windows.Storage.FileIO.writeBufferAsync(_file, iBuffer).then(
                             function () {
                                 var options = new Windows.System.LauncherOptions();
                                 options.displayApplicationPicker = true;

                                 Windows.System.Launcher.launchFileAsync(_file, options).then(
                                    function (success) {
                                        if (success) {
                                            utils.logMessage("Attachment opened successfully", "INFO", "Attachment");
                                        } else {
                                            navigator.notification.alert(i18nBundle.get("attachment_open_failed", "Failed to open attachment"), function () { }, i18nBundle.get("attachment_viewer_page", "Attachment Viewer page"), i18nBundle.get("close", "Close"));
                                            utils.logMessage("Failed to open attachment; file = " + _file, "ERROR", "Attachment");
                                        }
                                    });
                             },
                             function (err) {
                                 navigator.notification.alert(i18nBundle.get("attachment_open_failed", "Failed to open attachment"), function () { }, i18nBundle.get("attachment_viewer_page", "Attachment Viewer page"), i18nBundle.get("close", "Close"));
                                 utils.logMessage("Failed to open attachment due to " + err, "ERROR", "Attachment");
                             });
                         }, function (err) {
                             navigator.notification.alert(i18nBundle.get("attachment_open_failed", "Failed to open attachment"), function () { }, i18nBundle.get("attachment_viewer_page", "Attachment Viewer page"), i18nBundle.get("close", "Close"));
                             utils.logMessage("Failed to open attachment due to " + err, "ERROR", "Attachment");
                         }
                     );
                     },
                 function (err) {
                     navigator.notification.alert(i18nBundle.get("attachment_open_failed", "Failed to open attachment"), function () { }, i18nBundle.get("attachment_viewer_page", "Attachment Viewer page"), i18nBundle.get("close", "Close"));
                     utils.logMessage("Failed to open attachment due to " + err, "ERROR", "Attachment");
                 });
                 },
             function (err) {
                 navigator.notification.alert(i18nBundle.get("attachment_open_failed", "Failed to open attachment"), function () { }, i18nBundle.get("attachment_viewer_page", "Attachment Viewer page"), i18nBundle.get("close", "Close"));
                 utils.logMessage("Failed to open attachment due to " + err, "ERROR", "Attachment");
             });
         },
         errorCB);
    }
}