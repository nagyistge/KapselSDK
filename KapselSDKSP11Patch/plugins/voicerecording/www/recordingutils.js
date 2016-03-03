var store;
var defaultEncryptedStorageName = "VoiceRecordingStorage";
var encryptionKeyKey = "VoiceRecordingEncryptionKey";
var pathPrefix = "file://";

var cc = function(text) {
    console.log("[VoiceRecording][recordingutils.js] "+text);
};

/**
 * Path should start with "/" prefix
 * @param  {string} path The path to check and modify
 * @return {string} A new instance with the modified path
 * @private
 */
var pathForNative = function(path) {
    if (cordova.platformId.toLowerCase() === "windows") {
        var winPath = Windows.Storage.ApplicationData.current.localFolder.path;
        var cordovaPathPrefix = 'ms-appdata:///local/';
        if (path.indexOf(winPath) === -1) {
            path = winPath + "\\" + path.replace(/^.*[\\\/]/, '');
        }
    }
    var retVal = path;
    if (retVal.indexOf(pathPrefix) === 0) {
        retVal = retVal.substring(pathPrefix.length);
    }
    return retVal;
};

/**
 * Path should start with "file:///" prefix
 * @param  {string} path The path to check and modify
 * @return {string} A new instance with the modified path
 * @private
 */
var pathForCordova = function(path) {
    if (cordova.platformId.toLowerCase() === "windows") {
        var winPath = Windows.Storage.ApplicationData.current.localFolder.path;
        var cordovaPathPrefix = 'ms-appdata:///local/';
        if (path.indexOf(cordovaPathPrefix) === -1) {
            var fileName = path.substring(winPath.length + 1);
            path = cordovaPathPrefix + fileName;
        }
        //return path;
    }
    var retVal = path;
    if (path.split(":").length <= 1) {
        retVal = pathPrefix + path;
    }
    return retVal;
};

var findCordovaPath = function() {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = 'cordova.js';
    for (var n = scripts.length - 1; n > -1; n--) {
        var src = scripts[n].src;
        if (src.indexOf(term) == (src.length - term.length)) {
            path = src.substring(0, src.length - term.length);
            break;
        }
    }
    return path;
};

var getFilePathForFile = function(successCallback, errorCallback, path) {
    var directory;
    if (cordova.platformId.toLowerCase() === "windows") {
        directory = pathForCordova(Windows.Storage.ApplicationData.current.localFolder.path);
    } else {
        directory = cordova.file.dataDirectory;
    }
    window.resolveLocalFileSystemURL(
        directory,
        function(directoryEntry) {
            directoryEntry.getFile(
                path,
                null,
                function(fileEntry) {
                    successCallback(fileEntry.nativeURL);
                },
                function(error) {
                    errorCallback(error);
                }
            );
        },
        function(error) {
            cc("Error at getFilePathForFile - requestFileSystem");
        }
    );
};

var getEncryptedStorage = function() {
    if (!store)
        store = new sap.EncryptedStorage(defaultEncryptedStorageName);

    return store;
};

var getEncryptionKey = function(successCallback, errorCallback) {
    store.getItem(
        encryptionKeyKey,
        function(value) {
            successCallback(value);
        },
        function(error) {
            errorCallback(error);
        }
    );
};

var setEncryptionKey = function(successCallback, errorCallback) {
    cordova.exec(
        function(encryptionKey) {
            store.setItem(
                encryptionKeyKey,
                encryptionKey,
                function() {
                    cc("Key has been set.");
                    successCallback(encryptionKey);
                },
                function(error) {
                    var _error = encryptedStorageError(error);
                    cc("An error occurred at key set: " + JSON.stringify(_error));
                    errorCallback(_error);
                }
            );
        },
        function(error) {
            cc("An error occurred at getEncryptionKeyAsString: " + JSON.stringify(error));
            errorCallback(error);
        },
        "VoiceRecording",
        "getEncryptionKeyAsString", []
    );
};

var prepareEncryptionKey = function(successCallback, errorCallback) {
    getEncryptionKey(
        function(encryptionKey) {
            if (encryptionKey === null) {
                cc("Encryption key not found, setting new one...");
                // Not found
                setEncryptionKey(
                    function(newEncryptionKey) {
                        cc("New encryption key has been set.");
                        successCallback(newEncryptionKey);
                    },
                    function(error) {
                        cc("An error occurred at setEncryptionKey: " + JSON.stringify(error));
                        errorCallback(error);
                    }
                );
            } else {
                cc("Encryption key found.");
                successCallback(encryptionKey);
            }
        },
        function(error) {
            cc("Store getItem error: " + JSON.stringify(error));
            errorCallback(error);
        }
    );
};

var deleteFile = function(path, successCallback, errorCallback) {
    var url = pathForCordova(path);
    window.resolveLocalFileSystemURL(
        url,
        function(fileEntry) {
            fileEntry.remove(
                function success() {
                    if (successCallback) {
                        cc("Delete file was successful");
                        successCallback();
                    }
                },
                function fail(error) {
                    fileError(error);
                    cc("An error occurred at FileEntry.remove: " + JSON.stringify(error));
                    if (errorCallback) {
                        errorCallback("file_error", error);
                    }
                }
            );
        },
        function(error) {
            fileError(error);
            cc("An error occurred at window.resolveLocalFileSystemURL: " + JSON.stringify(error));
            if (errorCallback) {
                errorCallback("file_error", error);
            }
        }
    );
};

var renameFile = function(path, newName, successCallback, errorCallback) {

    window.resolveLocalFileSystemURL(
        pathForCordova(path),
        function(entry) {
            entry.getParent(
                function(parentEntry) {
                    entry.moveTo(
                        parentEntry,
                        newName,
                        function success(entry) {
                            successCallback(pathForNative(entry.nativeURL));
                        },
                        function(error) {
                            fileError(error);
                            cc("An error occurred at file.moveTo: " + JSON.stringify(error));
                            errorCallback(error);
                        }
                    );
                },
                function(error) {
                    fileError(error);
                    cc("An error occurred at file.getParent: " + JSON.stringify(error));
                    errorCallback(error);
                }
            );
        },
        function(error) {
            fileError(error);
            cc("An error occurred at window.resolveLocalFileSystemURI: " + JSON.stringify(error));
            if (errorCallback) {
                errorCallback(error);
            }
        }
    );
};

var mediaCaptureError = function(error) {
    switch (error.code) {
        case CaptureError.CAPTURE_INTERNAL_ERR:
            error.message = "The camera or microphone failed to capture image or sound.";
            break;
        case CaptureError.CAPTURE_APPLICATION_BUSY:
            error.message = "The camera or audio capture application is currently serving another capture request.";
            break;
        case CaptureError.CAPTURE_INVALID_ARGUMENT:
            error.message = "Invalid use of the API (e.g., the value of limit is less than one).";
            break;
        case CaptureError.CAPTURE_NO_MEDIA_FILES:
            error.message = "The user exits the camera or audio capture application before capturing anything.";
            break;
        case CaptureError.CAPTURE_NOT_SUPPORTED:
            error.message = "The requested capture operation is not supported.";
            break;
        default:
            error.message = "Unknown error";
    }
};

var fileError = function(error) {
    switch (error.code) {
        case 1:
            error.message = "NOT_FOUND_ERR";
            break;
        case 2:
            error.message = "SECURITY_ERR";
            break;
        case 3:
            error.message = "ABORT_ERR";
            break;
        case 4:
            error.message = "NOT_READABLE_ERR";
            break;
        case 5:
            error.message = "ENCODING_ERR";
            break;
        case 6:
            error.message = "NO_MODIFICATION_ALLOWED_ERR";
            break;
        case 7:
            error.message = "INVALID_STATE_ERR";
            break;
        case 8:
            error.message = "SYNTAX_ERR";
            break;
        case 9:
            error.message = "INVALID_MODIFICATION_ERR";
            break;
        case 10:
            error.message = "QUOTA_EXCEEDED_ERR";
            break;
        case 11:
            error.message = "TYPE_MISMATCH_ERR";
            break;
        case 12:
            error.message = "PATH_EXISTS_ERR";
            break;
        default:
            error.message = "Unknown error";
    }
};

var encryptedStorageError = function(_error) {
    var error = {};
    error.code = _error;
    switch (error.code) {
        case 1:
            error.message = "JSON error";
            break;
        case 2:
            error.message = "Bad password error";
            break;
        case 3:
            error.message = "Greater than maxium size error";
            break;
        case 4:
            error.message = "Datavault locked error";
            break;
        case 5:
            error.message = "Database error";
            break;
        case 6:
            error.message = "Datavault access error";
            break;
        case 7:
            error.message = "File does not exists at path error";
            break;
        case 8:
            error.message = "Write to file failed error";
            break;
        default:
            error.message = "Unknown error";
    }
    return error;
};

module.exports = {
    pathForNative: pathForNative,
    pathForCordova: pathForCordova,
    findCordovaPath: findCordovaPath,
    getEncryptedStorage: getEncryptedStorage,
    getEncryptionKey: getEncryptionKey,
    prepareEncryptionKey: prepareEncryptionKey,
    deleteFile: deleteFile,
    renameFile: renameFile,
    mediaCaptureError: mediaCaptureError,
    fileError: fileError,
    encryptedStorageError: encryptedStorageError,
    getFilePathForFile: getFilePathForFile
};

document.addEventListener(
    "deviceready",
    function() {
        getEncryptedStorage();
    },
    false
);
