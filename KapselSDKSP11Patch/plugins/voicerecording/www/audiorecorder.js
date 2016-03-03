var utils = require("./VoiceRecording-Utils");

var cc = function(text) {
    console.log("[VoiceRecording][audiorecorder.js] " + text);
};

var store;
var tempRecordingPath = "";
var fileExtension = ".encr";
var encKey = "";

var createAudioRecorder = function(options, successCallback, errorCallback) {
    store = utils.getEncryptedStorage();

    // remove ".encr" extension from target encrypted filepath, to be used as temporary recording filepath on native side
    if (options.path)
        tempRecordingPath = options.path.slice(0, -fileExtension.length);
    else
        tempRecordingPath = "";

    // inits native side, creates or continues temp recording file
    var initNative = function(successCallback, errorCallback) {
        var nativeOptions = {
            path: tempRecordingPath,
            maxLength: options.maxLength || -1,
            playPosition: typeof options.playPosition === 'number' ? options.playPosition : -1,
            encryptionKey: encKey
        };
        cordova.exec(
            // this callback is kept open on native side to be called on events
            function(args) {
                switch (args.event) {
                    case "initOK":
                        cc("Native initialized.");
                        var audioRecorder = new AudioRecorder(options);
                        tempRecordingPath = args.filePath;
                        if (successCallback)
                            successCallback(audioRecorder, {
                                state: args.newState,
                                duration: args.duration,
                                filePath: (args.filePath + fileExtension)
                            });
                        break;

                    case "playStopped":
                        cc("End of audio file reached, new state: " + args.newState);
                        if (options.playStoppedListener)
                            options.playStoppedListener({
                                state: args.newState,
                                duration: args.duration
                            });
                        break;

                    case "maxLengthExceeded":
                        cc("Recording limit reached, new state: " + args.newState);
                        if (options.maxLengthExceededListener)
                            options.maxLengthExceededListener({
                                state: args.newState,
                                duration: args.duration
                            });
                        break;

                    case "closed":
                        cc("Close event happened.");
                        break;

                    default:
                        cc("Unknown event through audioRecorder native listener: " + args.event + ", state: " + args.newState);
                }
            },
            function(error) {
                if (errorCallback)
                    errorCallback(error);
            },
            "VoiceRecording", "initAudioRecorder", [nativeOptions]
        );
    };

    var initNoFile = function(successCallback, errorCallback) {
        utils.prepareEncryptionKey(
            function(encryptionKey) {
                encKey = encryptionKey;
                initNative(successCallback, errorCallback);
            },
            function(error) {
                cc("Encryption key could not be prepared: " + JSON.stringify(error));
                if (errorCallback)
                    errorCallback(error);
            });

    };
    if (!options.path) {
        // if no file path is specified then its a new file
        initNoFile(successCallback, errorCallback);
        return;
    }

    // check if the given encrypted filepath already exists or not
    // it must exist, otherwise its an error
    window.resolveLocalFileSystemURL(
        utils.pathForCordova(options.path),
        function(result) {
            // filePath is given and the file exist
            // it means recording was suspended previously
            // decrypt the encrzpted file so native can continue recording into that file
            cc("File already exists, decrypting...");
            utils.getEncryptionKey(
                function(encryptionKey) {
                    encKey = encryptionKey;
                    store.decryptFile(
                        options.path,
                        encryptionKey,
                        function(decryptedFilePath) {
                            // decryptedFilePath === tempRecordingPath
                            initNative(successCallback, errorCallback);
                        },
                        function(error) {
                            cc("store.decryptFile error: " + JSON.stringify(error));
                            if (errorCallback)
                                errorCallback(error);
                        }
                    );
                },
                function(error) {
                    cc("utils.getEncryptionKey error: " + JSON.stringify(error));
                    if (errorCallback)
                        errorCallback(error);
                }
            );
        },
        function(error) {
            if (error.code === 1) {
                // file path is given, but the file does not exist
                initNoFile(successCallback, errorCallback);
            } else {
                errorCallback("There was an unexpected error at window.resolveLocalFileSystemURL: " + JSON.stringify(error));
            }
        }
    );
};

/**
 *
 * AudioRecorder can be used to record audio content into the specified file path. The recording can be paused and resumed.
 * AudioRecorder is also able to play back the current recording, pause the playing and seek for a given position.
 *
 * AudioPlayer is initiated with a file path parameter. AudioRecorder will record the content into this file.
 * If the file exist then AudioRecorder append the audiocontent to the end of the file.
 * <br>
 * AudioRecorder is a javascript wrapper object around platform specific native implementations.
 * <br><br>
 * <h5>States and state transitions</h5>
 * The following diagram depicts the possible states and state transitions of AudioRecorder.
 * <br>
 * <img src="../../doc/AudioRecorderStateChart.png">
 * <br>
 * AudioRecorder has the following states:
 * <ul>
 * <li><b>Initialized</b> - When the AudioRecorder is initiated and the file on the given path does not exist AudioRecorder's state is <b>Initialized</b>. This case the recording can be started.</li>
 * <li><b>Recording Paused</b> - This state represents that the recording is suspended. AudioRecorder's state become <b>Recording Paused</b> when the current recording is paused or when the AudioRecorder is initiated and the file 
 * is initiated but the file on the given path does exist. In this state the recoring can be continued or the current recording can be played back.</li>
 * <li><b>Recording</b> - This state represents that the recording is in progress. From both <b>Recording Paused</b> and <b>Initialized</b> states the recording can be started 
 * by {@link sap.VoiceRecording.AudioRecorder#startRecord startRecord} method.</li>
 * <li><b>Playing</b> - This state represents that the playing is in progress. When the recording is paused it can be played back by {@link sap.VoiceRecording.AudioRecorder#startPlay startPlay} method.
 * When the player reaches end of the recording, it automatically stops playing and switch the state to <b>Playing Paused</b>. This case playStopped callback in {@link sap.VoiceRecording.AudioRecorder.Options} is invoked.</li>
 * <li><b>Playing Paused</b> - This state represents that the playing is paused on the current position. The playing can be paused by {@link sap.VoiceRecording.AudioRecorder#pause pause}.
 * When it is resumed the playing must continue from the current position.</li>
 * <li><b>Closed</b> - From both <b>Recording Paused</b>, <b>Playing Paused</b> and <b>MaxLength Exceeded - Playing paused</b> states the recording can be finished by {@link sap.VoiceRecording.AudioRecorder#close close}. 
 * After this method the AudioRecorder can not be used. All the methods throw "AudioRecorder is closed" error.</li>
 * <li><b>MaxLength Exceeded - Playing paused</b> - this state represents that the maximum length (if it was specified) is exceeded and the recording can not be continued. 
 * The state of AudioRecorder becomes <b>MaxLength Exceeded - Playing paused</b> in the following cases:
 * <ul>
 * <li>From <b>Recording</b> state: the recording was in progress and the max length is exceeded. This case maxLengthExceeded callback specified in {@link sap.VoiceRecording.AudioRecorder.Options} is invoked.</li> 
 * <li>From initialization: when the AudioRecorder is initialized the length of the existing file is checked. If the max length is exceeded, then this state becomes active.</li>
 * <li>From <b>MaxLength Exceeded - Playing</b>: when the max length was exceeded the recording can not be continued, but it can be played back. If the playback is paused then this state becomes active.</li>
 * </ul>
 * </li>
 * <li><b>MaxLength Exceeded - Playing</b> - this state represents that the maximum length (if it was specified) is exceeded and the recording is being played back. 
 * This case the play back can be paused which change the state to <b>MaxLength Exceeded - Playing paused</b>.</li>
 * </ul>
 * In both <b>Playing</b> and <b>Playing Paused</b> states the current playing position can be modified by {@link sap.VoiceRecording.AudioRecorder#seekPlay seekPlay}.
 * In both <b>Playing Paused</b> and <b>Recording Paused</b> states the {@link sap.VoiceRecording.AudioRecorder#pause pause} can be invoked, but it does nothing.
 * <br>
 * Invoking invalid state transitions on the current AudioRecorder state will cause an "Invalid state transition" error.
 *
 * <h5>Max length</h5>
 * Maximum length can be specified (optionally) in the options parameters. If it is specified the AudioPlayer will check the length of the current recording in the initialization and 
 * in the <b>Recording</b> state.
 * If the current length exceeds the maxLength, the state changes to <b>MaxLength Exceeded - Playing paused</b>. In <b>Recording</b> state the given maxLengthExceeded callback is invoked.
 *
 *
 * @param {sap.VoiceRecording.AudioRecorder.Options} options The options needed by AudioRecorder (e.g. path, maxLength).
 *
 * @constructor
 * @private
 * @alias sap.VoiceRecording.AudioRecorder
 */
function AudioRecorder(options) {

    /**
     * Start or resume playing the current audio file. This method changes the AudioRecorder's state to <b>Playing</b> or <b>Max Length Exceeded - Playing</b>.
     * It can be invoked only if the AudioRecorder is in <b>Recording Paused</b>, <b>Playing Paused</b> or <b>Max Length Exceeded - Playing Paused</b> states. Otherwise "Invalid state transition" error is thrown.
     * If it is invoked in <b>Recording Paused</b> state it starts playing at the beginning of the audio file.
     * If it is invoked in <b>Playing Paused</b> it starts the playing at the position where the playing was paused.
     * @param {sap.VoiceRecording.AudioRecorder.SuccessCallback} successCallback Callback method is called immediatelly when the play is started/resumed successfully.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#startPlay
     */
    this.startPlay = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "startPlay", []);
    };

    /**
     * Pause the current recording or playing. This method changes the AudioRecorder's state to <b>Playing Paused</b>, <b>Max Length Exceeded - Playing Paused</b> or <b>Recording Paused</b>.
     * It can be invoked only if the AudioRecorder is in <b>Playing</b>, <b>Max Length Exceeded - Playing</b> or <b>Recording</b> states. Otherwise "Invalid state transition" error is thrown.
     * The recording and the playing can be resumed by {@link sap.VoiceRecording.AudioRecorder#startRecord startRecord} and {@link sap.VoiceRecording.AudioRecorder#startPlay startPlay}.
     *
     * @param {sap.VoiceRecording.AudioRecorder.SuccessCallback} successCallback Callback method is called immediatelly when the pause is done successfully.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#pause
     */
    this.pause = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "pause", []);
    };

    /**
     * Seek the player position. This method does not change the AudioRecorder's state.
     * It can be invoked only if the AudioRecorder is in <b>Playing</b>, <b>Playing Paused</b>, <b>Max Length Exceeded - Playing</b> or <b>Max Length Exceeded - Playing Paused</b> states. Otherwise "Invalid state transition" error is thrown.
     * @param {long} position The position in miliseconds where the player has to seek.
     * @param {sap.VoiceRecording.AudioRecorder.SuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#seekPlay
     */
    this.seekPlay = function(position, successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "seekPlay", [position]);
    };

    /**
     * Start recording an audio file. This method changes the AudioRecorder's state to <b>Recording</b>.
     * It can be invoked only if the AudioRecorder is in <b>Initialized</b> or <b>Recording Paused</b> states. Otherwise "Invalid state transition" error is thrown.
     * If it is invoked in <b>Recording Paused</b> state the audio content will be append to the end of the existing recording.
     * @param {sap.VoiceRecording.AudioRecorder.SuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#startRecord
     */
    this.startRecord = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "startRecord", []);
    };

    /**
     * Close the AudioRecording. This method changes the AudioRecorder's state to <b>Closed</b>. After this no mehtods can be invoked on the AudioRecording except {@link sap.VoiceRecording.AudioRecorder#getRecordDuration getRecordDuration}.
     *
     * It can be invoked only if the AudioRecorder is in <b>Playing Paused</b>, <b>Recording Paused</b> or <b>MaxLength Exceeded - Playing Paused</b> states. Otherwise "Invalid state transition" error is thrown.
     *
     * @param {sap.VoiceRecording.AudioRecorder.SuccessCallback} successCallback Callback method upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#close
     */
    this.close = function(successCallback, errorCallback, screen, needSave) {
        cordova.exec(
            function(args) {
                var apiArgs = {
                    state: args.newState,
                    duration: args.duration
                };
                if (screen === "play") {

                    utils.deleteFile(tempRecordingPath);
                    encKey = undefined;
                    successCallback(apiArgs);

                } else if (screen === "record") {

                    if (!needSave) {
                        utils.deleteFile(tempRecordingPath);
                        utils.deleteFile(tempRecordingPath + ".encr");
                        successCallback();
                    } else {
                        store.encryptFile(
                            tempRecordingPath,
                            encKey,
                            function(encryptedFilePath) {
                                // encryptedFilePath === options.path
                                utils.deleteFile(tempRecordingPath);
                                successCallback(apiArgs);
                            },
                            function(error) {
                                cc("An error occurred at store.encryptFile: " + JSON.stringify(error));
                                errorCallback(error);
                            }
                        );
                    }
                    encKey = undefined;

                }
            },
            function() {
                encKey = undefined;
                errorCallback.apply(errorCallback, arguments);
            },
            "VoiceRecording", "close", []
        );
    };

    /**
     * Get the current duration of the recording in milliseconds.
     *
     * @param {function} successCallback Callback method invoed with the duration of the recording in seconds upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#getRecordDuration
     */
    this.getRecordDuration = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "getRecordDuration", []);
    };

    /**
     * Get the current position of the recording playback in milliseconds.
     *
     * @param {function} successCallback Callback method invoked with the position in seconds upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#getPlayPosition
     */
    this.getPlayPosition = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "getPlayPosition", []);
    };

    /**
     * Get the current state of the AudioRecorder.
     *
     * @param {function} successCallback Callback method invoked with the state upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#getPlayPosition
     */
    this.getState = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "getState", []);
    };

    /**
     * Method for handling the suspend event on windows.
     *
     * @param {function} successCallback Callback method invoked with the state upon success.
     * @param {sap.VoiceRecording.AudioRecorder.ErrorCallback} errorCallback Callback method upon failure.
     * @private
     * @alias sap.VoiceRecording.AudioRecorder#onSuspendEvent
     */
    this.onSuspendEvent = function(successCallback, errorCallback) {
        cordova.exec(successCallback, errorCallback, "VoiceRecording", "onSuspendEvent", []);
    };
}

module.exports = {
    createAudioRecorder: createAudioRecorder
};

/**
 * Declaration of the options object which is passed in the constructor of the AudioRecorder. 
 *
 * @typedef sap.VoiceRecording.AudioRecorder.Options
 * @property {string} path The path to the file where the encrypted recording will be saved.
 * @property {function=} playStoppedListener The callback function is invoked when the player reaches the end of the recording. This case the status switches <b>Playing Paused</b> state.
 * @property {long=} maxLength The maximum length in milliseconds of the recording. If it exceeded the state is becomes <b>MaxLength Exceeded - Playing Paused</b> and maxLengthExceededListener is invoked.
 * @property {function=} maxLengthExceededListener The callback function is invoked when the given maxLength is exceeded.
 */

/**
 * Callback invoked after the corresponding function call is executed successfully.
 *
 * @callback sap.VoiceRecording.AudioRecorder.SuccessCallback
 * @param {sap.VoiceRecording.AudioRecorder.SuccessCallbackParam} args An object containing the new state of the AudioRecorder and the current duration of the recording.
 */

/**
 * Callback invoked after the corresponding function call is failed.
 *
 * @callback sap.VoiceRecording.AudioRecorder.ErrorCallback
 * @param {string=} errorCode the error code represents the cause of the failure.
 */

/**
 * Declaration of the object which is passed in the success callback of each function call. 
 *
 * @typedef sap.VoiceRecording.AudioRecorder.SuccessCallbackParam
 * @property {string} state The new state of the AudioRecorder after the function call is completed.
 * @property {long} duration The duration of the recording. If the recording is in progress it does not count the latest in progress recording: the previous (paused) recordings are counted.
 */
