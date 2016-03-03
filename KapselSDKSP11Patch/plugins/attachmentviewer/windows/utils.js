

module.exports = {

    SHORT_TIME: 2000, // 2 second
    LONG_TIME: 4000, // 4 second.
    DOWNLOAD_FOLDER: "downloads", //download folder name

    /**
     * Utility function to log messages. Logs messages to the sap.Logger if available.
     * if not, logs to console
     */
    logMessage: function (message, severity, tag) {
        if (sap.Logger) {
            if (severity && severity.toLowerCase() === "info") {
                sap.Logger.info(message, tag);
            }
            else if (severity && severity.toLowerCase() === "error") {
                sap.Logger.error(message, tag);
            }
            else if (severity && severity.toLowerCase() === "warn") {
                sap.Logger.warn(message, tag);
            }
            else if (severity && severity.toLowerCase() === "debug") {
                sap.Logger.debug(message, tag);
            }
        }
        else {
            console.log(message);
        }
    },

    /**
     * Utility function to show messages on the device screen.
     */
    showMessage: function (message, duration) {
        var _this = this;
        var messageDiv = document.createElement('div');
        messageDiv.id = 'messageDiv';
        messageDiv.className = 'messageClass';

        messageDiv.innerText = message;

        messageDiv.style.opacity = '0';
        document.body.appendChild(messageDiv);
        WinJS.UI.Animation.fadeIn(messageDiv);

        var time = _this.SHORT_TIME;
        if (duration != null && duration === "long") {
            time = _this.LONG_TIME;
        }

        setTimeout(function () {
            WinJS.UI.Animation.fadeOut(messageDiv);
            document.body.removeChild(messageDiv);
        }, time);
    },

    mimeExtensionsTable: (function () {
        // List of mime types are read from a file. Used for attachment handling. 
        var extensionsMap;

        return {
            load: function (fileName, callback) {
                var uri = new Windows.Foundation.Uri(fileName);
                Windows.Storage.StorageFile.getFileFromApplicationUriAsync(uri).done(
                    function (file) {
                        WinJS.xhr({ url: uri.toString() }).done(function (response) {
                            extensionsMap = JSON.parse(response.responseText);
                            callback();
                        }, function (error) {
                            console.log("error loading mime json content : " + error);
                            callback();
                        });

                    },
                    function (error) {
                        // error accessing file.
                        console.log("error accessing: " + fileName);
                        callback();
                    }
                );
            },
            get: function (key) {
                if (extensionsMap) {
                    result = extensionsMap[key];
                }

                if (!result) {
                    result = ".unknowntype";
                }

                return result;
            }
        }
    })()
}