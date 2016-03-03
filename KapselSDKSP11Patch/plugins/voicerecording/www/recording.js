/**
 * Voice Recording plugin is a Fiori plugin which can be used to create voice memo.
 * With this plugin the user is able to record a voice memo in order to attach it to an item within Fiori application.
 * </br>
 * </br>
 * This plugin provides an API that allows to initiate the recording of a voice memo.
 * When the user completes the recording of the memo, the recording is accessable so that it can be saved as an attachment or played back.
 * </br>
 * File upload is not in scope of the Voice Recoridng: it is the application's responsibility.
 * In SMP SDK 3.0 SP10 the recording can be played back with a new js API method {@link sap.VoiceRecording.Recording#play}.
 * </br>
 * </br>
 * <h4>Recording</h4>
 * The recording can be initiated by {@link sap.VoiceRecording.audioCapture}. Example usage:
 * <pre>
 *      sap.VoiceRecording.audioCapture(
 *          function(recording) {
 *              // success callback with the created recording as parameter
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 * </pre>
 * <h5>MaxLength</h5>
 * Application can specify maximum length for a recording in millisec. Example usage:
 * <pre>
 *      sap.VoiceRecording.audioCapture(
 *          function(recording) {
 *              // success callback with the created recording as parameter
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          },
 *          {
 *              maxLength: 12000 // 2 minutes
 *          }
 *      );
 * </pre>
 * If the maximum length is exceeded the VoiceRecording stops the recording and does not allow to continue it.
 * </br>
 * </br>
 * <h4>Playback</h4>
 * The playback can be initiated on an existing Recording object with the following method: {@link sap.VoiceRecording.Recording#play}. Example usage:
 * <pre>
 *     recording.play(
 *          function() {
 *              // success callback
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 * </pre>
 * <h4>Lifecycle of Recordings</h4>
 * When a recording is created by {@link sap.VoiceRecording.audioCapture} it is also stored permanently.
 * If the application is restarted the existing Recordings can be retrieved by {@link sap.VoiceRecording.get} and {@link sap.VoiceRecording.getAll} methods.
 * </br>
 *
 * </br>
 * The Recording objects have an id (string). This id can be used by the application for retrieving a certain Recording.
 * Example usage of retrieving a Recording by id ({@link sap.VoiceRecording.get}):
 * <pre>
 *      sap.VoiceRecording.get(
 *          function(recording) {
 *              // success callback with the retrieved Recording as parameter
 *          ,
 *          function(error_code, extra) {
 *              // error callback (e.g. recoridng does not exist for the given id)
 *          },
 *          Id
 *      );
 * </pre>
 * Example usage of retrieving all existing Recordings ({@link sap.VoiceRecording.getAll}):
 * <pre>
 *      sap.VoiceRecording.getAll(
 *          function(retVal) {
 *              // success callback with an array of Recordings as parameter
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 *
 * </pre>
 * When the application does not need the recording any more the Recording must be destroyed by ({@link sap.VoiceRecording.Recording#destroy}).
 * Example usage:
 * <pre>
 *      recording.destroy(
 *          function() {
 *              // success callback
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 *
 * </pre>
 * The application can delete all existing recordings by calling ({@link sap.VoiceRecording#destroyAll}).
 * Example usage:
 * <pre>
 *      recording.destroyAll(
 *          function() {
 *              // success callback
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 *
 * </pre>
 *
 *
 * <h4>Suspend and Resume</h4>
 * The recording or playing operations can be suspended. This case the ongoing recording/playing is paused, the state is stored.
 * When the application is resumed the user can continue the suspended recording/playing.
 * </br>
 * </br>
 * <h4>Thread safety</h4>
 * VoiceRecording is thread-safe in a way that it blocks all API call until an ongoing operation is finished.
 * It means that while there is an ongoing operation (e.g. recording) API method calls throw Error.
 *
 * <h4>3rd party plugin dependency</h4>
 * The VoiceRecording plugin uses the open source cordova plugin 'cordova-plugin-screen-orientation' to lock the screen when the dialog is shown.
 * After the dialog is closed we unlock the screen orientation lock via this plugin.
 * If the main application uses this plugin as well, it has to restore it's own status in the VoiceRecording success- or errorcallback.
 *
 *
 * <h4>Delete file from path</h4>
 * Only on Windows, the VoiceRecording plugin provides utility a function, which allows the usert to delete a decrypted recording.
 * This function should be called by the application developer after recording.getAsFile.
 * Example usage of deleteing a recording from path:
 * <pre>
 *      sap.VoiceRecording.getAsFile(
 *          function(decryptedFilePath) {
 *              // success callback with the decrypted file path
 *
 *              // upload or send the file
 *
 *              // call delete
 *              sap.VoiceRecording.deleteFileFromPath(decryptedFilePath, function() {
 *                       // success callback, delete was successful
 *              }, function(error_code, extra) {
 *                       // error callback
 *              });
 *          },
 *          function(error_code, extra) {
 *              // error callback
 *          }
 *      );
 * </pre>
 *
 * @namespace sap.VoiceRecording
 */

// Importing submodules
//
var AudioScreen = require("./VoiceRecording-AudioScreen").screen,
    AudioRecorder = require("./VoiceRecording-AudioRecorder"),
    utils = require("./VoiceRecording-Utils"),
    exec = require("cordova/exec");

var actionInProgress = false;

var cc = function(text) {
    console.log("[VoiceRecording][recording.js] " + text);
};

/**
 * This type represents a storage of the recorded files of the enclosing {@link sap.VoiceRecording RecordingStorage} object.
 *
 * @constructor
 * @alias sap.VoiceRecording.RecordingStorage
 * @interface
 * @private
 */
var RecordingStorage = function() {

    var store;
    var initialized = false;
    var initialize = function(successCallback) {
        if (initialized) {
            successCallback();
            return;
        }

        initialized = true;
        store = utils.getEncryptedStorage();
        successCallback();
    };

    var updateStore = function(isItUpdate, key, recordingData, successCallback, errorCallback) {

        store.getItem(
            key,
            function(data) {
                // JavaScript XOR 'implementation'
                if (isItUpdate ? data : !data) {

                    store.setItem(
                        key,
                        JSON.stringify(recordingData),
                        function() {
                            successCallback();
                        },
                        function(error) {
                            cc("updateStore - error at setItem: " + JSON.stringify(error));
                            errorcallback(error);
                        }
                    );

                } else {
                    var errorMsg = isItUpdate ? "recoridngStorage key does not exist." : "recoridngStorage key already exist.";
                    cc("updateStore - error: " + errorMsg);
                    errorCallback("unknown_error", errorMsg);
                }
            },
            function(error) {
                cc("updateStore - error at getItem: " + JSON.stringify(error));
                errorCallback("encrypted_storage_error");
            }
        );

    };

    /**
     * Updates the specified file to the storage.
     *
     * @param {string} key Key for items in EncryptedStorage.
     * @param {string} recordingData Path and metadata of items in EncryptedStorage.
     * @param {sap.VoiceRecording.RecordingStorage.AddSuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.RecordingStorage.AddErrorCallback} errorCallback Callback method upon failure.
     * @alias sap.VoiceRecording.RecordingStorage#update
     * @private
     */
    var update = function(key, recordingData, successCallback, errorCallback) {
        updateStore(true, key, recordingData, successCallback, errorCallback);
    };

    /**
     * Appends the specified file to the storage.
     *
     * @param {string} key Key for items in EncryptedStorage.
     * @param {string} recordingData Path and metadata of items in EncryptedStorage.
     * @param {sap.VoiceRecording.RecordingStorage.AddSuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.RecordingStorage.AddErrorCallback} errorCallback Callback method upon failure.
     * @alias sap.VoiceRecording.RecordingStorage#add
     * @private
     */
    var add = function(key, recordingData, successCallback, errorCallback) {
        updateStore(false, key, recordingData, successCallback, errorCallback);
    };

    var get = function() {
        var getSuccessCallback, getErrorCallback, getId, iOSPath;

        var precheck = function() {
            if (device.platform.toLowerCase() === "ios" && !iOSPath) {
                iOSGetPath(
                    function(path) {
                        iOSPath = path;
                        proceed();
                    },
                    getErrorCallback
                );
            } else {
                proceed();
            }

        };
        var proceed = function() {

            var data;
            var retVal = [];
            var errors = [];

            var addNewRecording = function(data) {
                if (device.platform.toLowerCase() === "ios") {
                    data.encryptedFilePath = iOSChangePath(data.encryptedFilePath);
                }

                var recording = new Recording(data.encryptedFilePath, data.metaData);
                retVal.push(recording);
            };
            var loadData = function(currentPos) {
                if (currentPos === 0) {
                    if (errors.length !== 0) {
                        getErrorCallback("getall_error", errors);
                        return;
                    }
                    getSuccessCallback(retVal);
                    return;
                }

                store.key(
                    --currentPos,
                    function(key) {
                        if (key.indexOf("recording-") !== 0) {
                            loadData(currentPos);
                        } else {
                            store.getItem(
                                key,
                                function(data) {
                                    addNewRecording(JSON.parse(data));
                                    loadData(currentPos);
                                },
                                function(error) {
                                    cc("get-getAll getItem error at key: " + key + " error:" + JSON.stringify(error));
                                    errors.push("encrypted_storage_error");
                                    loadData(currentPos);
                                }
                            );
                        }
                    },
                    function(error) {
                        cc("get-getAll key error at index: " + currentPos + " error: " + JSON.stringify(error));
                        errors.push("encrypted_storage_error");
                        loadData(currentPos);
                    }
                );
            };

            // Given getId means 'get' call.
            if (getId) {
                store.getItem(
                    getId,
                    function(data) {
                        if (!data) {
                            getErrorCallback("not_found_error");
                        } else {
                            addNewRecording(JSON.parse(data));
                            getSuccessCallback(retVal[0]);
                        }
                    },
                    function(error) {
                        cc("get-get getItem error: " + JSON.stringify(error));
                        getErrorCallback("encrypted_storage_error");
                    }
                );
            }
            // No getId means 'getAll' call.
            else {
                store.length(
                    function(length) {
                        loadData(length);
                    },
                    function(error) {
                        cc("get-getAll length error" + JSON.stringify(error));
                        getErrorCallback("encrypted_storage_error");
                    }
                );
            }

        };

        var iOSGetPath = function(successCallback, errorCallback) {
            window.requestFileSystem(
                LocalFileSystem.TEMPORARY,
                0,
                function(fileSystem) {
                    var foldersNeed = fileSystem.root.nativeURL.split('/');
                    var folderNeed = foldersNeed[foldersNeed.length - 3];
                    successCallback(folderNeed);
                },
                function(error) {
                    utils.fileError(error);
                    cc("iOSGetPath - An error occurred at window.requestFileSystem: " + JSON.stringify(error));
                    errorCallback(error);
                }
            );
        };
        var iOSChangePath = function(path) {
            var folders = path.split('/');
            return path.replace(folders[folders.length - 3], iOSPath);
        };

        var get = function(successCallback, errorCallback, id) {
            getSuccessCallback = successCallback;
            getErrorCallback = errorCallback;
            getId = id;

            precheck();
        };
        var getAll = function(successCallback, errorCallback) {
            getSuccessCallback = successCallback;
            getErrorCallback = errorCallback;
            getId = undefined;

            precheck();
        };

        return {
            /**
             * Get a Recording object from the storage by id. The Recording objects are persisted once they are created. All Recording object has an id. After application restart the application can retrieve the Recording for the given id by this function call.</br>
             * This function can be used for application restart: the application can store the suspended recording id. When the application is restarted it can read the id and get the corresponding recording by this function call.
             *
             * @param {sap.VoiceRecording.GetSuccessCallback} successCallback Callback method upon success. Invoked with the Recording object corresponding to the key.
             * @param {sap.VoiceRecording.GetErrorCallback} errorCallback Callback method upon failure. It could be during the store.getItem() request.
             * @param {string} id the id of the Recording
             * @throws Will throw an error an ongoing VoiceRecording opration is in progress.
             * </br>
             * </br>
             * @alias sap.VoiceRecording.get
             */
            get: function(successCallback, errorCallback, id) {
                if (actionInProgress)
                    throw new Error("get() - An ongoing VoiceRecorder operation is in progress");
                actionInProgress = true;

                if (typeof successCallback !== "function") successCallback = function() {};
                if (typeof errorCallback !== "function") errorCallback = function() {};
                if (typeof id !== "string") {
                    errorCallback("no-id", "An 'id' arguments is required to 'get'.");
                    return;
                }

                initialize(
                    function() {
                        get(
                            function(data) {
                                actionInProgress = false;
                                successCallback(data);
                            },
                            function() {
                                actionInProgress = false;
                                errorCallback.apply(errorCallback, arguments);
                            },
                            id
                        );
                    }
                );
            },
            /**
             * Get the list of existing Recording objects. The Recording objects are persisted once they are created. After application restart the application can retrieve the existing Recordings by this function call.
             *
             * @param {sap.VoiceRecording.GetAllSuccessCallback} successCallback Callback method upon success. Invoked with an array of the Recording objects.
             * @param {sap.VoiceRecording.GetAllErrorCallback} errorCallback Callback method upon failure.
             * @throws Will throw an error if an ongoing VoiceRecording operation is in progress.
             * </br>
             * </br>
             * @alias sap.VoiceRecording.getAll
             */
            getAll: function(successCallback, errorCallback) {
                if (actionInProgress)
                    throw new Error("getAll() - An ongoing VoiceRecorder operation is in progress");
                actionInProgress = true;

                if (typeof successCallback !== "function") successCallback = function() {};
                if (typeof errorCallback !== "function") errorCallback = function() {};

                initialize(
                    function() {
                        getAll(
                            function(data) {
                                actionInProgress = false;
                                successCallback(data);
                            },
                            function() {
                                actionInProgress = false;
                                errorCallback.apply(errorCallback, arguments);
                            }
                        );
                    }
                );
            }
        };
    }();

    /**
     * Removes one item from the Storage.
     *
     * @param {sap.VoiceRecording.RecordingStorage.RemoveSuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.RecordingStorage.RemoveErrorCallback} errorCallback Callback method upon failure.
     * @param {string} id The id of the Recording object to be removed
     * @alias sap.VoiceRecording.RecordingStorage#remove
     */
    var remove = function(successCallback, errorCallback, id) {

        store.removeItem(
            id,
            successCallback,
            errorCallback
        );

    };

    /**
     * Destroys all recordings.
     *
     * @param {sap.VoiceRecording.DestroyAllSuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.DestroyAllErrorCallback} errorCallback Callback method upon failure.
     * @alias sap.VoiceRecording#destroyAll
     */
    var destroyAll = function(successCallback, errorCallback) {

        var recordings;
        var errors = [];

        var remove = function(currentPos) {
            if (currentPos === 0) {
                if (errors.length !== 0) {
                    errorCallback("destroy_error", errors);
                    return;
                }
                successCallback();
                return;
            }

            var record = recordings[--currentPos];
            utils.deleteFile(
                record.getPath(),
                function() {
                    store.removeItem(
                        record.id,
                        function() {
                            remove(currentPos);
                        },
                        function(error) {
                            cc("destroyAll - error at removeItem: " + record.id + " error: " + JSON.stringify(error));
                            errors.push("encrypted_storage_error");
                            remove(currentPos);
                        }
                    );
                },
                function(error) {
                    cc("destroyAll - error at removing file: " + record.getPath() + " error: " + JSON.stringify(error));
                    errors.push("file_error");
                    remove(currentPos);
                }
            );
        };

        actionInProgress = false;
        get.getAll(
            function(_recordings) {
                actionInProgress = true;
                recordings = _recordings;
                remove(recordings.length);
            },
            errorCallback
        );
    };

    return {
        get: get,
        add: function(id, data, successCallback, errorCallback) {
            if (typeof successCallback !== "function") successCallback = function() {};
            if (typeof errorCallback !== "function") errorCallback = function() {};
            if (typeof id !== "string") {
                errorCallback("unknown_error", "An 'id' arguments is required to 'update'.");
                return;
            }

            initialize(
                function() {
                    add(id, data, successCallback, errorCallback);
                }
            );
        },
        update: function(id, data, successCallback, errorCallback) {
            if (typeof successCallback !== "function") successCallback = function() {};
            if (typeof errorCallback !== "function") errorCallback = function() {};
            if (typeof id !== "string") {
                errorCallback("unknown_error", "An 'id' arguments is required to 'update'.");
                return;
            }

            initialize(
                function() {
                    update(id, data, successCallback, errorCallback);
                }
            );
        },
        remove: function(successCallback, errorCallback, id) {
            if (typeof successCallback !== "function") successCallback = function() {};
            if (typeof errorCallback !== "function") errorCallback = function() {};
            if (typeof id !== "string") {
                errorCallback("unknown_error", "An 'id' arguments is required to 'update'.");
                return;
            }

            initialize(
                function() {
                    remove(successCallback, errorCallback, id);
                }
            );
        },
        destroyAll: function(successCallback, errorCallback) {
            if (actionInProgress)
                throw new Error("destroyAll() - An ongoing VoiceRecorder operation is in progress");
            actionInProgress = true;

            if (typeof successCallback !== "function") successCallback = function() {};
            if (typeof errorCallback !== "function") errorCallback = function() {};

            initialize(
                function() {
                    destroyAll(
                        function() {
                            actionInProgress = false;
                            successCallback.apply(successCallback, arguments);
                        },
                        function() {
                            actionInProgress = false;
                            errorCallback.apply(errorCallback, arguments);
                        }
                    );
                }
            );
        },
        decryptFile: function() {
            store.decryptFile.apply(this, arguments);
        }
    };
}();

/**
 * This type represents an audio recording. <br />
 * An instance of this type can be obtained using the following function calls:
 * <ul>
 * <li>{@link sap.VoiceRecording.audioCapture audioCapture} - used when a new recording is created (or continued at resume)</li>
 * <li>{@link sap.VoiceRecording.getAll getAll} - used when the application is restarted. The application can retrieve all the existing recordings by this function</li>
 * <li>{@link sap.VoiceRecording.get get} - used when the application is restarted. The application can save the id of the recordings. Once the application is started the recording for the saved id can be obtained by this function.</li>
 * </ul>
 * The recording is stored in encrypted format. <br />
 * Once the application needs the decrypted file format of the Recording it can retrieve it with {@link sap.VoiceRecording.Recording#getAsFile getAsFile} function. <br />
 * To delete the Recording the {@link sap.VoiceRecording.Recording#destroy destroy} function must be called.
 * @property {string} id The id of the recording
 * @constructor
 * @alias sap.VoiceRecording.Recording
 * @interface
 */
function Recording(encryptedFilePath, metaData) {
    var _duration, _creationDate, _fileName, _maxLength,
        _encryptedFilePath = encryptedFilePath;

    /**
     * update the metadata.
     * @private
     */
    this.updateMetaData = function(metaData) {
        _duration = metaData.duration;
        _creationDate = new Date(metaData.creationDate);
        _fileName = metaData.fileName;
        _maxLength = metaData.maxLength || -1;
    };

    /**
     * Returns the duration of the Recording (in milliseconds).
     * @returns {Number} the duration of the recording in milliseconds
     * @alias sap.VoiceRecording.Recording#getDuration
     */
    this.getDuration = function() {
        return _duration;
    };

    /**
     * Returns the creation date of the Recording.
     * @returns {Date} the date of the creation of the recording
     * @alias sap.VoiceRecording.Recording#getCreationDate
     */
    this.getCreationDate = function() {
        // var locale = sap.ui.getCore().getConfiguration().getLanguage();
        // var formarOptions = {
        //     weekday: "long",
        //     year: "numeric",
        //     month: "short",
        //     day: "numeric",
        //     hour: "2-digit",
        //     minute: "2-digit"
        // };
        // return _creationDate.toLocaleTimeString(locale, formarOptions);
        return _creationDate;
    };

    /**
     * Returns the filename of the Recording. Once {@link sap.VoiceRecording.Recording#getAsFile getAsFile} function is called it will generate the file with this given filename.
     * This filename is generated automatically by VoiceRecording, but can be changed with {@link sap.VoiceRecording.Recording.setFileName setFileName}
     * @returns {string} the filename of the recording
     * @alias sap.VoiceRecording.Recording#getFileName
     */
    this.getFileName = function() {
        return _fileName;
    };

    /**
     * Sets the filename of the Recording. The filename is used only when the file representation is generated by {@link sap.VoiceRecording.Recording#getAsFile getAsFile} function.
     * This filename is generated automatically by VoiceRecording, but can be changed with by this function.
     * @param {string} fileName the filename to be set for this recording.
     * @param {sap.VoiceRecording.Recording.SetFileNameSuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.Recording.SetFileNameErrorCallback} errorCallback Callback method upon failure.
     * @throws Will throw an error if an ongoing voice recording operation is in progress.
     * </br>
     * </br>
     * @alias sap.VoiceRecording.Recording#setFileName
     */
    this.setFileName = function(fileName, successCallback, errorCallback) {
        if (actionInProgress)
            throw new Error("setFileName() - An ongoing VoiceRecorder operation is in progress");
        actionInProgress = true;

        _fileName = fileName;
        var recordingData = {
            encryptedFilePath: encryptedFilePath,
            metaData: {
                duration: _duration,
                creationDate: _creationDate,
                fileName: _fileName
            }
        };
        var recording = this;

        RecordingStorage.update(
            recording.id,
            recordingData,
            function() {
                actionInProgress = false;
                successCallback();
            },
            function() {
                actionInProgress = false;
                errorCallback.apply(errorCallback, arguments);
            }
        );
    };

    /**
     * Creates a decrypted file representation of the Recording object.
     *
     * @param {sap.VoiceRecording.Recording.GetAsFileSuccessCallback} successCallback Callback method upon success. Invoked with the decrypted file path.
     * @param {sap.VoiceRecording.Recording.GetAsFileErrorCallback} errorCallback Callback method upon failure.
     * @throws Will throw an error if an ongoing voice recording operation is in progress.
     * </br>
     * </br>
     * @alias sap.VoiceRecording.Recording#getAsFile
     */
    this.getAsFile = function(successCallback, errorCallback) {
        if (actionInProgress)
            throw new Error("getAsFile() - An ongoing VoiceRecorder operation is in progress");
        actionInProgress = true;

        var error;
        utils.getEncryptionKey(
            function(encryptionKey) {
                sap.logon.Core.getState(
                    function(state) {
                        if (state.secureStoreOpen) {
                            RecordingStorage.decryptFile(
                                encryptedFilePath,
                                encryptionKey,
                                function(decryptedFilePath) {
                                    var decryptedFileName = decryptedFilePath.replace(/^.*[\\\/]/, '');
                                    if (decryptedFileName === _fileName) {
                                        actionInProgress = false;
                                        successCallback(decryptedFilePath);
                                    } else {
                                        utils.renameFile(
                                            decryptedFilePath,
                                            _fileName,
                                            function(renamedFilePath) {
                                                actionInProgress = false;
                                                successCallback(renamedFilePath);
                                            },
                                            function(error) {
                                                cc("An error occurred at utils.renameFile: " + JSON.stringify(error));
                                                actionInProgress = false;
                                                errorCallback("file_error", error);
                                            }
                                        );
                                    }
                                },
                                function(_error) {
                                    cc("An error occurred at store.decryptFile: " + JSON.stringify(utils.encryptedStorageError(_error)));
                                    actionInProgress = false;
                                    errorCallback("encrypted_storage_error", _error);
                                }
                            );
                        } else {
                            cc("An error occurred during check state: Datavault is locked");
                            actionInProgress = false;
                            errorCallback("encrypted_storage_error", 4);
                        }
                    },
                    function(error) {
                        // it can happen only if sap.logon.Core is not initialized
                        // error = {code:2, domain: "MAFLogonCoreCDVPlugin"}
                        cc("An error occurred during get state from store: " + JSON.stringify(error));
                        actionInProgress = false;
                        errorCallback("logon_error", error);
                    }
                );
            },
            function(error) {
                cc("An error occurred at getEncryptionKey: " + JSON.stringify(error));
                actionInProgress = false;
                errorCallback("encrypted_storage_error", error);
            }
        );
    };

    /**
     * Deletes the file on encryptedFilePath.
     *
     * @param {sap.VoiceRecording.Recording.DestroySuccessCallback} [successCallback] Callback method upon success.
     * @param {sap.VoiceRecording.Recording.DestroyErrorCallback} [errorCallback] Callback method upon failure.
     * @throws Will throw an error if an ongoing voice recording operation is in progress.
     * </br>
     * </br>
     * @alias sap.VoiceRecording.Recording#destroy
     */
    this.destroy = function(successCallback, errorCallback) {
        if (actionInProgress)
            throw new Error("destroy() - An ongoing VoiceRecorder operation is in progress");
        actionInProgress = true;

        RecordingStorage.remove(
            function() {
                utils.deleteFile(
                    encryptedFilePath,
                    function() {
                        actionInProgress = false;
                        successCallback();
                    },
                    function() {
                        actionInProgress = false;
                        errorCallback.apply(errorCallback, arguments);
                    }
                );
            },
            function(error) {
                cc("An error occurred at RecordingStorage.remove: " + JSON.stringify(error));
                actionInProgress = false;
                errorCallback("unknown_error", error);
            },
            this.id
        );
    };

    /**
     * Open a new playback dialog where the user can play back the voice recording.
     *
     * @param {sap.VoiceRecording.Recording.PlaySuccessCallback} [successCallback] Callback method upon success.
     * @param {sap.VoiceRecording.Recording.PlayErrorCallback} [errorCallback] Callback method upon failure.
     * @throws Will throw an error if an ongoing voice recording operation is in progress.
     * </br>
     * </br>
     * @alias sap.VoiceRecording.Recording#play
     */
    this.play = function(successCallback, errorCallback, args) {

        // No longer valid, the AudioController - Open checks the progress.
        //
        /*if (actionInProgress)
            throw new Error("An ongoing VoiceRecorder operation is in progress.");
        actionInProgress = true;*/

        var OPTIONS = {
            SCREEN: {
                RECORD: 1,
                PLAY: 2
            },
            SCREEN_MODE: {
                DEFAULT: 1,
                TWO_TIMER: 2
            }
        };
        var internalArgs = {
            screen: OPTIONS.SCREEN.PLAY,
            screenMode: OPTIONS.SCREEN_MODE.DEFAULT,
            path: encryptedFilePath,
            fileName: this.getFileName(),
            creationDate: this.getCreationDate()
        };
        if (args && args.playPosition) internalArgs.playPosition = args.playPosition;

        AudioController.open(successCallback, errorCallback, internalArgs);
    };

    var createId = function() {
        var retVal = encryptedFilePath.replace(/^.*[\\\/]/, '');
        retVal = retVal.substring(0, retVal.indexOf(".encr"));
        //retVal = retVal.substring(0, retVal.lastIndexOf("."));

        return retVal;
    };
    this.hasMaxLength = function() {
        return _maxLength != -1;
    };
    this.getMaxLength = function() {
        return _maxLength;
    };
    this.getPath = function() {
        return _encryptedFilePath;
    };

    /**
     * ID of the Recording object.
     */
    this.updateMetaData(metaData);
    this.id = createId();
}

function Timer(interval, func) {
    this.interval = interval;
    this.start = function() {
        this.timer = setInterval(
            func,
            this.interval
        );
    };

    this.pause = function() {
        clearInterval(this.timer);
        delete this.timer;
    };
}

var AudioController = function() {
    // Callbacks used to communicate with the main application.
    var audioSuccessCallback, audioErrorCallback;

    var initialized = false;
    var internalActionInProgress = false;

    // audioRecorder provides the native record and playback functionality
    var audioRecorder,
        // continueRecording represents a recording object that the user wishes to continue
        continueRecording;

    // recordingOptions is a set of properties that we send to the native side
    var recordingOptions,
        // internalArgs is a set of properties that we use to maintain the states and screen
        internalArgs;

    // actionTime represents the amount time since the start of the recording/playing
    var actionTime,
        // timer holds a javascript timer ID, we use it to communicate with the screen
        timer,
        // secondTimer is a helper-variable, used to send slower feedbacks to the screen
        secondTimer;

    var app;

    var STATE = {
        IDLE: 1,
        RUN: 2,
        PAUSE: 3,
        OVERFLOW: 4
    };
    var OPTIONS = {
        SCREEN: {
            RECORD: 1,
            PLAY: 2
        },
        SCREEN_MODE: {
            DEFAULT: 1,
            TWO_TIMER: 2
        }
    };

    var screenFunctions = {};
    screenFunctions[OPTIONS.SCREEN.RECORD] = {};
    screenFunctions[OPTIONS.SCREEN.RECORD][STATE.RUN] = "startRecord";
    screenFunctions[OPTIONS.SCREEN.RECORD][STATE.PAUSE] = "startRecord";
    screenFunctions[OPTIONS.SCREEN.PLAY] = {};
    screenFunctions[OPTIONS.SCREEN.PLAY][STATE.RUN] = "startPlay";
    screenFunctions[OPTIONS.SCREEN.PLAY][STATE.PAUSE] = "startPlay";

    var initialize = function(successCallback) {
        if (initialized) {
            successCallback();
            return;
        }

        initialized = true;
        AudioScreen.setActionButtonListener(actionButtonListener);
        AudioScreen.setSeekBarChangedListener(seekBarChangedListener);
        AudioScreen.setSaveButtonListener(save);
        AudioScreen.setCancelButtonListener(cancel);
        AudioScreen.initialize(successCallback);
    };

    var TIMER_INTERVAL = 50;
    timer = new Timer(
        TIMER_INTERVAL,
        function() {
            actionTime += TIMER_INTERVAL;
            AudioScreen.quickTimeRefresh(actionTime);

            secondTimer += TIMER_INTERVAL;
            if (secondTimer >= 1000) {
                secondTimer = 0;
                AudioScreen.slowTimeRefresh(actionTime);
            }
        }
    );

    //
    // Initializes the native side, and opens the AudioScreen.
    //
    var createAudioRecorder = function(successCallback, errorCallback) {
        if (typeof successCallback !== "function") successCallback = function() {};
        if (typeof errorCallback !== "function") errorCallback = function() {};

        AudioRecorder.createAudioRecorder(
            recordingOptions,
            function(result, args) {

                audioRecorder = result;

                if (internalArgs.screen == OPTIONS.SCREEN.PLAY) {

                    internalArgs.duration = parseInt(args.duration);
                    internalArgs.screenState = (actionTime === 0) ? STATE.IDLE : STATE.PAUSE;

                } else if (internalArgs.screen == OPTIONS.SCREEN.RECORD) {

                    if (recordingOptions.maxLength) internalArgs.duration = recordingOptions.maxLength;

                    if (recordingOptions.path) {
                        actionTime = parseInt(args.duration);
                        internalArgs.screenState = (actionTime === 0) ? STATE.IDLE : STATE.PAUSE;
                    } else {
                        actionTime = 0;
                        internalArgs.screenState = STATE.IDLE;
                        recordingOptions.path = args.filePath;
                    }
                }
                successCallback();
            },
            function(errorObj) {
                resetController();
                cc("Init error: " + JSON.stringify(arguments));
                if (!audioErrorCallback) return;

                if (errorObj && errorObj.code === "permission_denied") {
                    audioErrorCallback(errorObj.extra + "_permission_denied");
                } else {
                    audioErrorCallback("initialization_error");
                }
            }
        );
    };

    /**
     * An audio dialog appears where the user can start/stop/save the recording.</br>
     *
     * @param {sap.VoiceRecording.AudioCaptureSuccessCallback} successCallback Callback method upon success. Invoked with the created Recording object.
     * @param {sap.VoiceRecording.AudioCaptureErrorCallback} errorCallback Callback method upon failure.
     * @param {sap.VoiceRecording.AudioCaptureArgs} args The arguments for audio capture.
     * @throws Will throw an error if SAPUI5 or jQuery is not defined or an ongoing voice recording operation is in progress.
     * </br>
     * </br>
     * @alias sap.VoiceRecording.audioCapture
     */
    var open = function(successCallback, errorCallback, args) {

        if (cordova.platformId === "windows") {
            if (!app) {
                app = WinJS.Application;
                app.oncheckpoint = function(checkPoinArgs) {
                    checkPoinArgs.setPromise(new WinJS.Promise(suspend));
                };
            }
        }

        var createConfigObjects = function(args) {
            internalArgs = (args) ? jQuery.extend(true, {}, args) : {};
            if (!internalArgs.screen) internalArgs.screen = OPTIONS.SCREEN.RECORD;

            recordingOptions = {};
            switch (internalArgs.screen) {
                case OPTIONS.SCREEN.PLAY:
                    if (!args) throw new Error("Must define arguments.");
                    if (internalArgs.screenMode != OPTIONS.SCREEN_MODE.DEFAULT) throw new Error("Only default screen allowed on playing AudioScreen.");
                    if (internalArgs.maxLength) throw new Error("Can't use 'maxLength' property on playing AudioScreen.");
                    if (!internalArgs.path) throw new Error("Must define 'path' property for playing.");

                    recordingOptions.path = internalArgs.path;
                    delete internalArgs.path;

                    recordingOptions.playPosition = internalArgs.playPosition || 0;
                    actionTime = recordingOptions.playPosition;
                    delete internalArgs.playPosition;

                    if (internalArgs.fileName) {
                        internalArgs.fileNameAndTime = (internalArgs.fileName.length > 20) ? internalArgs.fileName.substring(0, 15) + "..." : internalArgs.fileName;
                        if (internalArgs.creationDate) {
                            internalArgs.fileNameAndTime += " - " + internalArgs.creationDate.toLocaleString();
                        }
                    } else {
                        internalArgs.fileNameAndTime = "Not defined.";
                    }
                    recordingOptions.playStoppedListener = function(args) {
                        internalArgs.screenState = STATE.OVERFLOW;
                        state_actionCompleted(parseInt(args.duration));
                    };

                    break;

                case OPTIONS.SCREEN.RECORD:
                    if (args) {
                        if (internalArgs.playPosition) throw new Error("Can't use 'playPosition' property on recording AudioScreen.");
                        if (internalArgs.continueRecording) {
                            continueRecording = args.continueRecording;
                            // continueRecording is from the suspend-event
                            if (continueRecording.isSuspended) {
                                recordingOptions.path = continueRecording.path;
                                if (continueRecording.maxLength) recordingOptions.maxLength = continueRecording.maxLength;
                            }
                            // continueRecording was given via API call
                            else {
                                if (internalArgs.maxLength) throw new Error("Can't define new 'maxLength property for existing recording.");
                                recordingOptions.path = continueRecording.getPath();
                                if (continueRecording.hasMaxLength()) recordingOptions.maxLength = continueRecording.getMaxLength();
                            }
                        } else if (internalArgs.maxLength) {
                            recordingOptions.maxLength = internalArgs.maxLength;
                            delete internalArgs.maxLength;
                        }
                    }
                    internalArgs.screenMode = recordingOptions.maxLength ? OPTIONS.SCREEN_MODE.TWO_TIMER : OPTIONS.SCREEN_MODE.DEFAULT;
                    recordingOptions.maxLengthExceededListener = function(args) {
                        internalArgs.screenState = STATE.OVERFLOW;
                        state_actionCompleted(parseInt(args.duration));
                    };

                    break;

                default:
                    throw new Error("undefined-screen");
            }
        };

        // Future feature.
        //
        // if (getSuspendObject()) {
        //     alert("There WAS a suspended action. Now its garbage, becouse this check is not implemented yet.");
        //     resetSuspended();
        // }

        audioSuccessCallback = successCallback;
        audioErrorCallback = errorCallback;

        AudioScreen.setActionInProgress(true);

        continueRecording = undefined;
        actionTime = undefined;
        secondTimer = 0;

        //
        // creating internalArgs and recordingOptions
        //
        createConfigObjects(args);

        createAudioRecorder(
            function() {
                AudioScreen.setActionInProgress(false);
                AudioScreen.open({
                    screen: internalArgs.screen,
                    state: internalArgs.screenState,
                    screenMode: internalArgs.screenMode
                }, {
                    time: actionTime,
                    duration: internalArgs.duration,
                    fileNameAndTime: internalArgs.fileNameAndTime
                });
            }
        );

    };

    var screenActionInProgress = false;
    var actionButtonListener = function() {
        if (screenActionInProgress) return;
        screenActionInProgress = true;

        switch (internalArgs.screenState) {
            case STATE.IDLE:
                stateRun();
                break;

            case STATE.RUN:
                statePause();
                break;

            case STATE.PAUSE:
                stateRun();
                break;

            case STATE.OVERFLOW:
                screenActionInProgress = false;
                // Only recording stays in this mode, we dont have to do anything
                break;

            default:
                cc("Error: Undefined state in actionButtonListener: " + internalArgs.state);
                screenActionInProgress = false;
                break;
        }
    };
    var state_actionCompleted = function(time) {
        screenActionInProgress = false;
        if (!internalArgs) return;

        if (internalArgs.screenState == STATE.OVERFLOW) {
            timer.pause();
            if (internalArgs.screen == OPTIONS.SCREEN.PLAY) {
                internalArgs.screenState = STATE.IDLE;
                actionTime = 0;
            } else {
                actionTime = recordingOptions.maxLength;
            }
            time = actionTime;
        }

        AudioScreen.updateUI(
            internalArgs.screenState, {
                time: time
            }
        );
    };
    var state_actionFailed = function() {
        screenActionInProgress = false;
        cancel();
    };

    var stateRun = function(successCallback, errorCallback) {
        cc("stateRun()");
        AudioScreen.setActionInProgress(true);
        internalArgs.screenState = STATE.RUN;

        if (audioRecorder) {
            audioRecorder[screenFunctions[internalArgs.screen][internalArgs.screenState]](
                function(args) {
                    AudioScreen.setActionInProgress(false);
                    cc("audioRecorder new state: " + args.state);

                    timer.start();
                    state_actionCompleted(actionTime);

                    if (successCallback) successCallback(actionTime);
                },
                function(error) {
                    AudioScreen.setActionInProgress(false);
                    cc("An error occurred at audioRecorder.startRecord. Error: " + error);

                    state_actionFailed();
                    if (errorCallback) errorCallback();
                }
            );
        } else {
            createAudioRecorder(stateRun);
        }
    };

    var statePause = function(successCallback, errorCallback) {
        cc("statePause()");
        AudioScreen.setActionInProgress(true);
        internalArgs.screenState = STATE.PAUSE;
        timer.pause();

        audioRecorder.pause(
            function(args) {
                actionTime = parseInt(args.duration);

                AudioScreen.setActionInProgress(false);
                cc("audioRecorder.pause new state: " + args.state);
                state_actionCompleted(actionTime);

                if (successCallback) successCallback(actionTime);
            },
            function(error) {

                AudioScreen.setActionInProgress(false);
                cc("An error occurred at audioRecorder.pause(). Error: " + error);
                state_actionFailed();

                if (errorCallback) errorCallback();
            }
        );
    };

    var seekBarChangedListener = function(value) {
        if (internalArgs.screen == OPTIONS.SCREEN.PLAY) {
            if (value >= 0 && value <= internalArgs.duration) {
                cc("seeking to position: " + value);
                actionTime = value;
                AudioScreen.slowTimeRefresh(actionTime, 1);
                // seekPlay's successCallback ?
                audioRecorder.seekPlay(value);
            } else {
                cc("warning: seekplay was called with out of ranged parameter: " + value);
            }
        } else {
            cc("warning: seekbar only allowed on playing AudioScreen.");
        }
    };

    var _internalActionInProgress = function() {
        if (internalActionInProgress || !internalArgs) {
            return false;
        } else {
            internalActionInProgress = true;
            return true;
        }
    };

    var save = function() {
        if (_internalActionInProgress()) {
            close(true);
        }
    };

    var cancel = function() {
        if (_internalActionInProgress()) {
            close(false);
        }
    };

    var close = function(needSave) {

        var close_paused = function(needSave) {
            if (internalArgs.screen == OPTIONS.SCREEN.RECORD && actionTime !== 0 && !needSave) {
                AudioScreen.setActionInProgress(false);
                internalActionInProgress = false;
                AudioScreen.showCancelConfirm(
                    function() {
                        internalActionInProgress = true;
                        close_paused_confirmed(false);
                    }
                );
            } else {
                close_paused_confirmed(needSave);
            }
        };
        var close_paused_confirmed = function(needSave) {
            var screen = internalArgs.screen == OPTIONS.SCREEN.PLAY ? "play" : "record";
            AudioScreen.setActionInProgress(true);
            audioRecorder.close(
                function(args) {

                    if (needSave) {

                        var maxLengthForMetadata = (internalArgs.screen == OPTIONS.SCREEN.RECORD && recordingOptions.maxLength) ? recordingOptions.maxLength : undefined;
                        var metaData = createMetadata(args, maxLengthForMetadata);
                        close_recordingToSave(recordingOptions.path, metaData);

                    } else {

                        if (internalArgs.screen == OPTIONS.SCREEN.RECORD) {

                            if (continueRecording) {
                                RecordingStorage.remove(
                                    function() {
                                        resetController();
                                        audioErrorCallback("recording-cancel");
                                    },
                                    function(error) {
                                        resetController();
                                        cc("An error occurred at RecordingStorage.remove: " + JSON.stringify(error));
                                        audioErrorCallback("unknown_error", error);
                                    },
                                    continueRecording.id
                                );
                            } else {
                                resetController();
                                audioErrorCallback("recording-cancel");
                            }

                        } else {

                            var position = actionTime;
                            resetController();
                            audioSuccessCallback();

                        }
                    }
                },
                function() {

                    resetController();

                    var error = (needSave) ? "save_error" : "cancel_error";
                    audioErrorCallback(error);
                },
                screen,
                needSave
            );
        };
        var close_recordingToSave = function(encryptedFilePath, metaData) {
            var recording, action;
            var data = {
                encryptedFilePath: encryptedFilePath,
                metaData: metaData
            };

            if (continueRecording) {
                continueRecording.updateMetaData(metaData);
                recording = continueRecording;
                action = "update";
            } else {
                recording = new Recording(encryptedFilePath, metaData);
                action = "add";
            }

            RecordingStorage[action](
                recording.id,
                data,
                function() {

                    resetController();
                    audioSuccessCallback(recording);

                },
                function(error) {

                    resetController();
                    audioErrorCallback(error);

                }
            );
        };
        var createMetadata = function(args, maxLengthForMetadata) {
            var p = recordingOptions.path.replace(/^.*[\\\/]/, '');
            var metaData = {
                duration: args.duration,
                creationDate: new Date(),
                fileName: p.substring(0, p.lastIndexOf("."))
            };
            if (maxLengthForMetadata) {
                metaData.maxLength = maxLengthForMetadata;
            }
            return metaData;
        };

        AudioScreen.setActionInProgress(true);
        if (audioRecorder) {
            if (internalArgs.screenState == STATE.RUN) {
                statePause(
                    function() {
                        close_paused(needSave);
                    },
                    function() {
                        audioErrorCallback("close-pause-error");
                    }
                );
            } else {
                close_paused(needSave);
            }
        } else {
            createAudioRecorder(
                function() {
                    close(needSave);
                }
            );
        }
    };
    var resetController = function() {
        actionTime = undefined;
        secondTimer = undefined;
        internalArgs = undefined;
        recordingOptions = undefined;
        actionInProgress = false;
        internalActionInProgress = false;

        window.setTimeout(
            function() {
                AudioScreen.setActionInProgress(false);
                AudioScreen.close();
            },
            0
        );
    };

    // parameters needed for windows to handle the suspend event
    var suspend = function(completeDispatch, errorDispatch, progressDispatch) {
        // No valid internalArgs means the screen is not open.
        if (!internalArgs) return;

        timer.pause();
        internalArgs.screenState = STATE.PAUSE;
        AudioScreen.updateUI(
            internalArgs.screenState, {
                time: actionTime
            }
        );

        if (cordova.platformId === "windows") {
            var counter = 0;
            var waitForPromise = new Timer(50, function() {
                counter++;
                progressDispatch(counter);
            });
            waitForPromise.start();

            audioRecorder.onSuspendEvent(function() {
                cc("screen suspended");
                waitForPromise.pause();
                audioRecorder = undefined;
                app = undefined;
                completeDispatch("suspended");
            }, function() {
                waitForPromise.pause();
                audioRecorder = undefined;
                app = undefined;
                cc("Pause failed during suspend: " + JSON.stringify(arguments));

            });
        } else {
            audioRecorder = undefined;
        }
        cc("screen suspended");

        // Future feature
        //
        // var obj = {
        //     path: recordingOptions.path
        // };
        // if (internalArgs.screen == OPTIONS.SCREEN.PLAY) {
        //     obj.type = "play";
        //     obj.playPosition = actionTime;
        // } else if (internalArgs.screen == OPTIONS.SCREEN.RECORD) {
        //     obj.type = "record";
        //     if (recordingOptions.maxLength) obj.maxLength = recordingOptions.maxLength;
        // }
        // localStorage.setItem("voicerecording-suspend", JSON.stringify(obj));
        // cc("Suspend event occured, stored object: "+JSON.stringify(obj));
    };
    var resume = function() {
        // No valid internalArgs means the screen is not open.
        if (!internalArgs) return;

        cc("restoring screen.");
        AudioScreen.setActionInProgress(true);
        screenActionInProgress = true;

        if (internalArgs.screen == OPTIONS.SCREEN.PLAY) {
            recordingOptions.playPosition = actionTime;
        }
        createAudioRecorder(
            function() {
                AudioScreen.updateUI(
                    internalArgs.screenState, {
                        time: actionTime
                    }
                );
                screenActionInProgress = false;
                AudioScreen.setActionInProgress(false);
                cc("screen restored.");
            }
        );
    };
    // Future feature.
    //
    // var getSuspendObject = function() {
    //     var item = localStorage.getItem("voicerecording-suspend");
    //     if (!item) return false;

    //     item = JSON.parse(item);
    //     return {
    //         type: item.type
    //     };

    // };
    // var resetSuspended = function() {
    //     var item = localStorage.getItem("voicerecording-suspend");
    //     localStorage.removeItem("voicerecording-suspend");
    //     if (!item) return;

    //     item = JSON.parse(item);
    //     if (item.type == "play") return;
    //     else if (item.type == "record") utils.deleteFile(item.path);
    // };
    // var restoreSuspended = function(successCallback, errorCallback) {
    //     if (typeof successCallback !== "function") successCallback = function() {};
    //     if (typeof errorCallback !== "function") errorCallback = function() {};

    //     var item = localStorage.getItem("voicerecording-suspend");
    //     localStorage.removeItem("voicerecording-suspend");
    //     if (!item) {
    //         cc("Can't find suspend object.");
    //         errorCallback("no-suspend", "There is no suspended action");
    //         return;
    //     }
    //     item = JSON.parse(item);

    //     if (item.type == "play") {
    //         var id = item.path.replace(/^.*[\\\/]/, '');
    //         id = id.substring(0, id.indexOf(".encr"));

    //         RecordingStorage.get(
    //             function(recording) {
    //                 recording.play(
    //                     successCallback,
    //                     errorCallback, {
    //                         playPosition: item.playPosition
    //                     });
    //             },
    //             function(error) {
    //                 cc("There was an error during restoring playing screen.");
    //                 errorCallback(error);
    //             },
    //             id
    //         );
    //     } else if (item.type == "record") {
    //         var continueRecording = {
    //             path: item.path
    //         };
    //         if (item.maxLength) continueRecording.maxLength = item.maxLength;

    //         AudioController.open(
    //             successCallback,
    //             errorCallback, {
    //                 continueRecording: continueRecording
    //             }
    //         );
    //     }
    // };

    return {
        open: function(successCallback, errorCallback, args) {
            if (actionInProgress)
                throw new Error("open() - An ongoing VoiceRecorder operation is in progress");
            actionInProgress = true;

            if (typeof successCallback !== "function") successCallback = function() {};
            if (typeof errorCallback !== "function") errorCallback = function() {};

            initialize(
                function() {
                    open(
                        function() {
                            actionInProgress = false;
                            successCallback.apply(successCallback, arguments);
                        },
                        function() {
                            actionInProgress = false;
                            errorCallback.apply(errorCallback, arguments);
                        },
                        args
                    );
                }
            );
        },
        suspend: suspend,
        resume: resume //,
            //getSuspendObject: getSuspendObject,
            //restoreSuspended: restoreSuspended
    };
}();

var deleteFileFromPath = function (path, successCallback, errorCallback) {
    if (typeof path !== "undefined" && path !== null && path !== "") {
            utils.deleteFile(path, successCallback, errorCallback);
    } else {
        errorCallback("file_error", "No path was specified");
    }
};

document.addEventListener(
    "deviceready",
    function() {
        if (cordova.platformId === "windows") {
            WinJS.Application.addEventListener("onSapResumeSuccess", AudioController.resume, false);
            module.exports.deleteFileFromPath = deleteFileFromPath;
        } else {
            var pauseListener = (cordova.platformId === "ios") ? "resign" : "pause";
            document.addEventListener(
                pauseListener,
                function() {
                    AudioController.suspend();
                },
                false
            );
            document.addEventListener(
                "onSapResumeSuccess",
                function() {
                    AudioController.resume();
                },
                false
            );
        }
    },
    false
);

module.exports = {
    audioCapture: AudioController.open,
    get: RecordingStorage.get.get,
    getAll: RecordingStorage.get.getAll,
    destroyAll: RecordingStorage.destroyAll //,
        //getSuspendObject: AudioController.getSuspendObject,
        //restoreSuspended: AudioController.restoreSuspended
};

//
// Callback definitions.
//

/**
 * Callback invoked to inform the user about the audio capture process.
 *
 * @callback sap.VoiceRecording.AudioCaptureSuccessCallback
 * @param {sap.VoiceRecording.Recording} recording the Recording object which is passed to the application. This object can be used for playback and upload.
 */

/**
 * Callback invoked to inform the user about the audio capture process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'logon_error': logon is not initialized - extra parameter is the nested error comes from logon plugin.</li>
 * <li>'encrypted_storage_error': error thrown by encrypted storage - extra parameter is the nested error comes from encrypted storage.</li>
 * <li>'recording-cancel': the recording was cancelled by the user.</li>
 * <li>'cancel_error': the recording was cancelled by the user, but there was an error during closing the audio recorder.</li>
  * <li>'save_error': the recording was cancelled by the user, but there was an error during closing the audio recorder.</li>
 * <li>'metadata_error': can not read/write metadata. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'file_error': can not read/write files. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'unknown_error': unknown error happened. 'extra' parameter is the nested error.</li>

 * </ul>
 * @callback sap.VoiceRecording.AudioCaptureErrorCallback
 * @param {string} code error code
 * @param {Object=} extra extra parameter for the given error code
 */


/**
 * Declaration of the object which is passed in the {@link sap.VoiceRecording.audioCapture audioCapture} method.
 *
 * @typedef sap.VoiceRecording.AudioCaptureArgs
 * @property {long} maxLength the maximum length of the recording. If it is exceeded the recording will be stopped and it can not be continued.
 */


/**
 * Callback invoked to inform the user about the decryption process.
 *
 * @callback sap.VoiceRecording.Recording.GetAsFileSuccessCallback
 * @param {string} path The path of the decrypted file.
 */

/**
 * Callback invoked to inform the user about the decryption process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'file_error': can not read/write files. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'logon_error': logon is not initialized - extra parameter is the nested error comes from logon plugin.</li>
 * <li>'encrypted_storage_error': error thrown by encrypted storage - extra parameter is the nested error comes from encrypted storage.</li>
 * </ul>
 *
 * @callback sap.VoiceRecording.Recording.GetAsFileErrorCallback
 * @param {string} code error code
 * @param {Object=} extra an object associated to the given error code
 */

/**
 * Callback invoked to inform the user about the setFileName process.
 *
 * @callback sap.VoiceRecording.Recording.SetFileNameSuccessCallback
 */

/**
 * Callback invoked to inform the user about the setFileName process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'encrypted_storage_error': error thrown by encrypted storage - extra parameter is the nested error comes from encrypted storage. </li>
 * <li>'metadata_error': can not read/write metadata. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'file_error': can not read/write files. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'unknown_error': unknown error happened. 'extra' parameter is the nested error.</li>
 * </ul>
 *
 * @callback sap.VoiceRecording.Recording.SetFileNameErrorCallback
 * @param {string} code error code
 * @param {Object=} extra an object associated to the given error code
 */

/**
 * Callback invoked to inform the user about the destroy process.
 *
 * @callback sap.VoiceRecording.Recording.DestroySuccessCallback
 */

/**
 * Callback invoked to inform the user about the destroy process.
 * <ul>
 * <li>'metadata_error': can not read/write metadata. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'file_error': can not read/write files. 'extra' parameter is the nested error from file plugin.</li>
 * <li>'unknown_error': unknown error happened. 'extra' parameter is the nested error.</li>
 * </ul>
 *
 * @callback sap.VoiceRecording.Recording.DestroyErrorCallback
 * @param {string} error the error code (see above)
 * @param {Object=} extra an object containing the nested error
 */


/**
 * Callback invoked to inform the user about the get recording process.
 *
 * @callback sap.VoiceRecording.GetSuccessCallback
 * @param {sap.VoiceRecording.Recording} recording the Recording object itself.
 */

/**
 * Callback invoked to inform the user about the get recording process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'file_error': error occured when trying to load resources from the file system. Extra parameter contains the nested error.</li>
 * <li>'encrypted_storage_error': error thrown by encrypted storage. Extra parameter contains the nested error comes from encrypted storage.</li>
 * <li>'not_found_error': the recording with the given id was not found </li>
 * </ul>
 *
 * @callback sap.VoiceRecording.GetErrorCallback
 * @param {string} error the error code (see above)
 * @param {Object=} extra an object containing the nested error
 */

/**
 * Callback invoked to inform the user about the get all recording process.
 *
 * @callback sap.VoiceRecording.GetAllSuccessCallback
 * @param {Array.<Recording>} recordings the Recording objects stored in the encrypted storage.
 */

/**
 * Callback invoked to inform the user about the get all recording process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'getall_error': can not retreive all recordings. 'extra' parameter is an array of errors raised during getting the recordings. The array contains
 * 'encrypted_storage_error'.</li>
 * </ul>
 *
 * @callback sap.VoiceRecording.GetAllErrorCallback
 * @param {string} error the error code (see above)
 * @param {Object=} extra an object containing the nested error
 */

/**
 * Callback invoked to inform the user about the remove recording process.
 *
 * @callback sap.VoiceRecording.RecordingStorage.RemoveSuccessCallback
 */

/**
 * Callback invoked to inform the user about the remove recording process.
 *
 * @callback sap.VoiceRecording.RecordingStorage.RemoveErrorCallback
 * @param {Object} error An object containing two properties: 'code' and 'message'.
 */

/**
 * Callback invoked to inform the user about the play voice recording process.
 *
 * @callback sap.VoiceRecording.Recording.PlaySuccessCallback
 */

/**
 * Callback invoked to inform the user about the play recording process.
 * The error codes and the associated extra parameters can be the following:
 * <ul>
 * <li>'cancel_error': the recording was cancelled by the user, but there was an error during closing the audio recorder.</li>
 * </ul>
 *
 * @callback sap.VoiceRecording.Recording.PlayErrorCallback
 * @param {string} error the error code (see above)
 * @param {Object=} extra an object containing the nested error
 */

/**
 * Callback invoked to inform the user about the destroyAll process.
 *
 * @callback sap.VoiceRecording.DestroyAllSuccessCallback
 */

/**
 * Callback invoked to inform the user about the destroyAll process.
 * <ul>
 * <li>'destroy_error': can not destroy all recording. 'extra' parameter is an array of errors raised during destroying the recordings.
 * </ul>
 *
 * @callback sap.VoiceRecording.DestroyAllErrorCallback
 * @param {string} error the error code (see above)
 * @param {Object=} extra an object containing the nested error
 */
