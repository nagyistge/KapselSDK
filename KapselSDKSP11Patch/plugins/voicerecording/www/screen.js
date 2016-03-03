var cc = function(text) {
    console.log("[VoiceRecording][screen.js] " + text);
};

// Check if we have UI5 support
var sapui5 = function() {
    return typeof(jQuery) !== "undefined" && typeof(sap) !== "undefined" && typeof(sap.m) !== "undefined";
};
var utils = require("./VoiceRecording-Utils");
var i18nPlugin = require('kapsel-plugin-i18n.i18n');
var i18n;

var getLocalizedString = function(key) {
    //    return i18n.getText(key);
    return i18n.get(key);
};
var addLeadingZero = function(time) {
    return (time < 10) ? "0" + time : time;
};
var formatTime = function(milliseconds) {
    var d, hr, min, sec;
    if (milliseconds !== 0) {
        var x;
        x = Math.floor(milliseconds / 1000);
        sec = addLeadingZero(x % 60);
        x = Math.floor(x / 60);
        min = addLeadingZero(x % 60);
        x = Math.floor(x / 60);
        hr = addLeadingZero(x % 24);
        return hr + ":" + min + ":" + sec;
    } else {
        return "00:00:00";
    }

};


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
var screenOptions = {};
var screenProperties = {};
var TEXTS = {};

var AudioScreen = function() {

    var actionInProgress = false;
    var statusField;
    var fileNameField;
    var actionButtonContainer;
    var defaultTimeField;
    var remainingTimeField;
    var defaultTimeFieldLabel;
    var remainingTimeFieldLabel;
    var defaultTimerVBox;
    var remainingTimerVBox;
    var timersField;
    var maxLengthForTimer_formatted;
    var maxLengthForTimer_number;
    var seekBar;
    var seekBarId = "vrSlider";
    var seekInProgress = false;
    var screenContent;
    var saveButton;
    var cancelButton;
    var dialog;
    var busyIndicator;
    var iconCache;
    var _position;
    var btnWidth;

    var actionButtonListener,
        seekBarLiveListener,
        seekBarChangedListener,
        saveButtonListener,
        cancelButtonListener;

    var setActionInProgress = function(isAction) {
        if (isAction) {
            actionInProgress = true;
            setTimeout(
                function() {
                    if (actionInProgress) {
                        busyIndicator.open();
                    }
                },
                300
            );
        } else {
            actionInProgress = false;
            busyIndicator.close();
        }
    };

    var initialized = false;
    var initialize = function(successCallback) {
        if (initialized) {
            successCallback();
            return;
        }
        if (!sapui5()) throw new Error("no_sapui5");
        initialized = true;

        iconCache = new sap.m.Button("iconCache", {
            icon: "sap-icon://display"
        }).addStyleClass("iconCache").setEnabled(false);

        // Status field for displaying current state.
        statusField = new sap.m.Text({
            text: ''
        }).addStyleClass("vrDark").addStyleClass("vrStatusField");

        // File name field for play screen only.
        fileNameField = new sap.m.Text({
            text: "File name - YYYY.MM.DD hh:mm:ss"
        }).addStyleClass("vrLight").addStyleClass("vrFileName");

        if (screen.height <= 480) fileNameField.addStyleClass("vrSmall");

        // Action button for changing between states,
        // and indicating progress
        actionButtonContainer = new sap.m.HBox(
            "actionButtonContainer"
        );

        // Default time field for displaying..
        // : Record: ..elapsed time from the start of the recording
        // : Play: ..elsapsed time from the start of the file and the length of the file
        defaultTimeField = new sap.m.Text({
            text: formatTime(0)
        }).addStyleClass("vrLight");

        // Remaining time field only for Recoring screen with given max_length option.
        remainingTimeField = new sap.m.Text({
            text: formatTime(0)
        }).addStyleClass("vrLight");

        defaultTimeFieldLabel = new sap.m.Text({
            text: "",
            maxLines: 1
        }).addStyleClass("vrDark");

        remainingTimeFieldLabel = new sap.m.Text({
            text: "",
            maxLines: 1
        }).addStyleClass("vrDark");

        defaultTimerVBox = new sap.m.VBox({
            items: [
                defaultTimeFieldLabel,
                defaultTimeField
            ]
        });

        remainingTimerVBox = new sap.m.VBox({
            items: [
                remainingTimeFieldLabel,
                remainingTimeField
            ]
        }).addStyleClass("vrTimer").addStyleClass("vrTwoTimers").setAlignItems(sap.m.FlexAlignItems.End);

        timersField = new sap.m.HBox({
            items: [
                defaultTimerVBox,
                remainingTimerVBox
            ]
        }).addStyleClass("vrTimerContainer");

        if (screen.height <= 480) timersField.addStyleClass("vrSmall");

        // Seek bar for play only.ff
        seekBar = new sap.m.Slider(seekBarId, {
            liveChange: function(e) {
                onSeekBarLive(e.getParameters().value);
            },
            change: function(e) {
                onSeekBarChanged(e.getParameters().value);
            }
        }).addStyleClass("vrSeekBar");

        screenContent = new sap.m.VBox({
            items: [
                statusField,
                fileNameField,
                actionButtonContainer,
                timersField,
                seekBar,
                iconCache
            ]
        }).setAlignItems(sap.m.FlexAlignItems.Center);

        saveButton = new sap.m.Button({
            text: "",
            press: function() {
                onSave();
            }
        }).addStyleClass("vrDialogButtons");
        cancelButton = new sap.m.Button({
            text: "",
            press: function() {
                onCancel();
            }
        }).addStyleClass("vrDialogButtons");

        dialog = new sap.m.Dialog("vrDialogId", {
            keepInWindow: true,
            title: '',
            content: screenContent,
            contentWidth: "320px",
            stretch: sap.ui.Device.system.phone,
            buttons: [
                saveButton,
                cancelButton
            ],
            beforeOpen: function() {
                if (sap.ui.Device.system.phone) screen.lockOrientation("portrait");

                defaultTimerVBox.removeStyleClass("vrTwoTimers");
                defaultTimerVBox.addStyleClass("vrOneTimer");
                defaultTimerVBox.setAlignItems(sap.m.FlexAlignItems.Center);

                statusField.addStyleClass("vrStatusFieldMargin");

                defaultTimeFieldLabel.setVisible(true);
                saveButton.setEnabled(false);
                saveButton.setVisible(true);
                seekBar.setVisible(false);
                fileNameField.setVisible(false);
                remainingTimerVBox.setVisible(false);

                if (screenOptions.state == STATE.PAUSE) {
                    statusField.setText(TEXTS[screenOptions.screen].titlePause);
                } else {
                    statusField.setText(TEXTS[screenOptions.screen].titleIdle);
                }
                dialog.setTitle(TEXTS[screenOptions.screen].dialogTitle);

                if (screenProperties.fileNameAndTime) {
                    fileNameField.setText(screenProperties.fileNameAndTime).setVisible(true);
                    statusField.removeStyleClass("vrStatusFieldMargin");
                }

                if (screenOptions.screen == OPTIONS.SCREEN.RECORD) {
                    if (screenOptions.state == STATE.PAUSE) {
                        saveButton.setEnabled(true);
                        saveButton.setVisible(true);
                    }
                    if (screenOptions.screenMode == OPTIONS.SCREEN_MODE.TWO_TIMER) {
                        defaultTimerVBox.removeStyleClass("vrOneTimer");
                        defaultTimerVBox.addStyleClass("vrTwoTimers");
                        defaultTimerVBox.setAlignItems(sap.m.FlexAlignItems.Start);
                        remainingTimerVBox.setVisible(true);
                    } else if (screenOptions.screenMode == OPTIONS.SCREEN_MODE.DEFAULT) {
                        // Default.
                    } else {
                        cc("ERROR: Undefined 'screenMode' in dialog preset!");
                    }
                } else if (screenOptions.screen == OPTIONS.SCREEN.PLAY) {
                    seekBar.setVisible(true);
                    defaultTimeFieldLabel.setVisible(false);
                    saveButton.setVisible(false);
                } else {
                    cc("ERROR: Undefined 'screen' in dialog preset!");
                }
            },
            afterOpen: function() {
                if (sap.ui.Device.system.phone && cordova.platformId.toLowerCase() === "windows") {
                    var appBar = $("#appBar-bottom");
                    if (appBar.size() !== 0) {
                        var appBarPixelSize = appBar.height();
                        var appBarDisplay = appBar.css("display");
                        if (appBarPixelSize && appBarDisplay !== "none") {
                            $("#vrDialogId").css({
                                "margin-bottom": appBarPixelSize.toString() + "px",
                                "margin-top": "-" + (appBarPixelSize / 3).toString() + "px"
                            });
                        }
                    }
                }
                $("#iconCache").css("display", "none");
                $("#vrDialogId > header").addClass("vrDialogHeader");
                $("#vrDialogId > section").addClass(screen.height > 480 ? "vrDialogSection" : "vrDialogSectionSmall");

                if (screenOptions.screen == OPTIONS.SCREEN.PLAY)
                    btnWidth = "100%";
                else
                    btnWidth = "50%";
                $(".vrDialogButtons").css({
                    "width": btnWidth,
                    "margin-right": "0px"
                });

                $("#" + seekBarId).parent().css("width", "100%");
                seekBar.setMax(Math.ceil(screenProperties.duration / 100));

                $("#actionButtonContainer").append($("<canvas id='actionButton' width='" + cnv.width + "' height='" + cnv.height + "'></canvas>"));
                $("#actionButtonContainer").click(onActionButton);

                CanvasButton.initialize("actionButton", cnv.width, cnv.height, function() {
                    var time = screenProperties.time || 0;
                    CanvasButton.refreshCanvas();
                    AudioScreen.slowTimeRefresh(time, 1);
                });
                CanvasButton.setMaxLength(screenProperties.duration);
            },
            afterClose: function() {
                if (sap.ui.Device.system.phone) screen.unlockOrientation();
            }
        }).addStyleClass(".vrDialog");

        busyIndicator = new sap.m.BusyDialog({
            showCancelButton: false
        });

        jQuery.sap.require("jquery.sap.resources");
        jQuery.sap.require("sap.m.MessageBox");
        jQuery.sap.includeStyleSheet(utils.findCordovaPath() + "plugins/kapsel-plugin-voicerecording/www/dialogs.css");

        i18nPlugin.load({
                path: "plugins/kapsel-plugin-voicerecording/www/i18n"
            },
            function(loadedBundle) {
                i18n = loadedBundle;
                TEXTS[OPTIONS.SCREEN.RECORD] = {
                    dialogTitle: getLocalizedString("TLT_RECORDING_SCREEN_TITLE"),
                    titleIdle: getLocalizedString("FLD_STATUS_START_RECORDING_LABEL"),
                    titleRun: getLocalizedString("FLD_STATUS_RECORDING_LABEL"),
                    titlePause: getLocalizedString("FLD_STATUS_CONTINUE_RECORDING_LABEL"),
                    overflow: getLocalizedString("FLD_STATUS_RECORDING_MAX_LENGTH_EXCEEDED_LABEL")
                };
                TEXTS[OPTIONS.SCREEN.PLAY] = {
                    dialogTitle: getLocalizedString("TLT_PLAYING_SCREEN_TITLE"),
                    titleIdle: getLocalizedString("FLD_STATUS_START_PLAYING_LABEL"),
                    titleRun: getLocalizedString("FLD_STATUS_PLAYING_LABEL"),
                    titlePause: getLocalizedString("FLD_STATUS_PAUSED_LABEL"),
                    overflow: getLocalizedString("FLD_STATUS_START_PLAYING_LABEL")
                };

                defaultTimeFieldLabel.setText(getLocalizedString("FLD_RECORDED_TIME_LABEL"));
                remainingTimeFieldLabel.setText(getLocalizedString("FLD_REMAINING_TIME_LABEL"));
                saveButton.setText(getLocalizedString("BTN_SAVE"));
                cancelButton.setText(getLocalizedString("BTN_CANCEL"));

                successCallback();
            }
        );
    };

    var open = function(args, obj) {
        if (!initialized) {
            cc("Screen is not initialized !");
            return;
        }
        if ((args.screenMode == OPTIONS.SCREEN_MODE.TWO_TIMER || args.screen == OPTIONS.SCREEN.PLAY) && (!obj || !obj.duration)) {
            throw new Error("audioscreen.js duration not defined");
        }

        screenOptions = args;
        if (obj) {
            if (obj.duration) {
                maxLengthForTimer_number = Math.round(obj.duration / 1000) * 1000;
                maxLengthForTimer_formatted = formatTime(maxLengthForTimer_number);
            }
        }
        screenProperties = obj;
        dialog.open();
    };
    var close = function() {
        screenOptions = {};
        dialog.close();
    };

    var quickTimeRefresh = function(time, inline) {
        if (seekInProgress && !inline) {
            // We are currently seeking, and a timer tries to update the UI
            return;
        } else if (!seekInProgress) {
            seekBar.setValue(time / 100);
        }

        if (screenOptions.screen == OPTIONS.SCREEN.PLAY || screenOptions.screenMode == OPTIONS.SCREEN_MODE.TWO_TIMER) {
            CanvasButton.progress(time);
        }
    };
    var slowTimeRefresh = function(time, inline) {
        if (seekInProgress && !inline) {
            // We are currently seeking, and a timer tries to update the UI
            return;
        }

        if (screenOptions.screenMode == OPTIONS.SCREEN_MODE.TWO_TIMER) {
            var remainingTime = maxLengthForTimer_number - (Math.round(time / 1000) * 1000);
            if (remainingTime < 0) {
                remainingTime = 0;
                time = screenProperties.duration;
            }
            remainingTimeField.setText(formatTime(remainingTime));
        }

        if (screenOptions.screen == OPTIONS.SCREEN.PLAY && time >= screenProperties.duration) {
            defaultTimeField.setText(maxLengthForTimer_formatted + " | " + maxLengthForTimer_formatted);
        } else {
            var timeStamp = formatTime(Math.round(time / 1000) * 1000);
            if (screenOptions.screen == OPTIONS.SCREEN.PLAY) {
                timeStamp += " | " + maxLengthForTimer_formatted;
            }
            defaultTimeField.setText(timeStamp);
        }

        this.quickTimeRefresh(time, 1);
    };
    var setActionButtonListener = function(_actionButtonListener) {
        actionButtonListener = _actionButtonListener;
    };
    var setSeekBarLiveListener = function(_seekBarLiveListener) {
        seekBarLiveListener = _seekBarLiveListener;
    };
    var setSeekBarChangedListener = function(_seekBarChangedListener) {
        seekBarChangedListener = _seekBarChangedListener;
    };
    var setSaveButtonListener = function(_saveButtonListener) {
        saveButtonListener = _saveButtonListener;
    };
    var setCancelButtonListener = function(_cancelButtonListener) {
        cancelButtonListener = _cancelButtonListener;
    };

    var showCancelConfirm = function(successCallback) {
        var confirmationText = getLocalizedString("CNF_CANCEL");
        var confirmationTitle = getLocalizedString("CNF_CANCEL_TITLE");
        var messageBoxObj = {
            title: confirmationTitle,
            onClose: function(oAction) {
                if (oAction == sap.m.MessageBox.Action.OK) {
                    successCallback();
                }
            },
            initialFocus: sap.m.MessageBox.Action.Cancel
        };

        sap.m.MessageBox.confirm(
            confirmationText,
            messageBoxObj
        );
    };

    var updateUI = function(state, obj) {
        screenOptions.state = state;
        switch (screenOptions.state) {
            case STATE.IDLE:

                statusField.setText(TEXTS[screenOptions.screen].titleIdle);
                saveButton.setEnabled(false);
                break;

            case STATE.PAUSE:

                statusField.setText(TEXTS[screenOptions.screen].titlePause);
                saveButton.setEnabled(true);
                break;

            case STATE.RUN:

                statusField.setText(TEXTS[screenOptions.screen].titleRun);
                saveButton.setEnabled(false);
                break;

            case STATE.OVERFLOW:

                statusField.setText(TEXTS[screenOptions.screen].overflow);
                saveButton.setEnabled(true);
                break;

            default:

                cc("ERROR: Undefined 'state' in stateTransition:" + state);
                break;
        }
        if (screenOptions.screen == OPTIONS.SCREEN.PLAY)
            btnWidth = "100%";
        else
            btnWidth = "50%";
        setTimeout(function() {
            $(".vrDialogButtons").css({
                "width": btnWidth,
                "margin-right": "0px"
            });
        }, 0);
        CanvasButton.refreshCanvas();
        if (obj && (typeof obj.time) === "number") {
            AudioScreen.slowTimeRefresh(obj.time, 1);
        }
    };

    var setCanvasProgress = function(value) {
        if (screenOptions.screen == OPTIONS.SCREEN.PLAY || screenOptions.screenMode == OPTIONS.SCREEN_MODE.TWO_TIMER) {
            CanvasButton.progress(value);
        }
    };

    var onSeekBarLive = function(value) {
        seekInProgress = true;
        AudioScreen.slowTimeRefresh(value * 100, 1);
    };

    var onSeekBarChanged = function(value) {
        seekInProgress = false;
        seekBarChangedListener(value * 100);
    };

    var onSave = function() {
        saveButtonListener();
    };
    var onCancel = function() {
        cancelButtonListener();
    };
    var onActionButton = function() {
        cc("ActionButton clicked!");
        actionButtonListener();
    };

    return {
        setActionInProgress: setActionInProgress,
        initialize: initialize,
        open: open,
        close: close,
        quickTimeRefresh: quickTimeRefresh,
        slowTimeRefresh: slowTimeRefresh,
        setActionButtonListener: setActionButtonListener,
        setSeekBarLiveListener: setSeekBarLiveListener,
        setSeekBarChangedListener: setSeekBarChangedListener,
        setSaveButtonListener: setSaveButtonListener,
        setCancelButtonListener: setCancelButtonListener,
        showCancelConfirm: showCancelConfirm,
        updateUI: updateUI
    };

}();

var CANVAS_SIZE = 137.5;
var cnv = {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE
};
var CanvasButton = function() {
    var canvasID;
    var width, height;
    var maxLength;
    var init = false;
    var ctx;

    var images = {};
    images[OPTIONS.SCREEN.PLAY] = {};
    images[OPTIONS.SCREEN.RECORD] = {};

    var RAD = 2 * Math.PI;
    var QUART = RAD / 4;
    var COLOR_GREY = "#C4C4C4";
    var COLOR_RED = "#CC1919";
    var COLOR_GREEN = "#61A656";
    var COLOR_BLUE = "#009DE0";

    // Helper functions
    var drawCircle = function(color, borderWidth, r, sAngle, eAngle, isFilled) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineCap = "square";
        ctx.lineWidth = borderWidth;
        ctx.arc(width / 2, height / 2, r, sAngle, eAngle, false);
        ctx.stroke();
        if (isFilled) {
            ctx.fillStyle = color;
            ctx.fill();
        }
    };

    // iconSize param: use without measure!
    var drawIcon = function(iconColor, iconSize, iconCode, x, y) {
        ctx.fillStyle = iconColor;
        ctx.font = iconSize + "px" + " SAP-icons";
        ctx.fillText(iconCode, x, y);
    };

    // Clear canvas and restore saved canvas parts
    var restoreCircle = function(element) {
        ctx.clearRect(0, 0, width, height);
        ctx.putImageData(element, 0, 0);
    };

    // Object methods

    var setMaxLength = function(length) {
        maxLength = length;
    };

    var initialize = function(canvas_id, canvas_height, canvas_width, successCallback, iOSDone) {

        var bufferCanvas = $("<canvas></canvas>").get(0).getContext('2d');
        bufferCanvas.font = "2px SAP-icons";
        bufferCanvas.fillText('\ue14b', 0, 0);

        if ($("#" + canvas_id).length === 0 || !iOSDone) {
            window.setTimeout(
                function() {
                    CanvasButton.initialize(canvas_id, canvas_height, canvas_width, successCallback, true);
                },
                400);
            return;
        }

        canvasID = canvas_id;
        width = canvas_width;
        height = canvas_height;
        ctx = $("#" + canvasID).get(0).getContext("2d");
        init = true;

        // Drawing the grey circle of radial progress bar
        drawCircle(COLOR_GREY, 3, 63.75, 0, RAD, false);
        var greyCircle = ctx.getImageData(0, 0, height, width);

        // Drawing the green filled pause button on playing screen
        drawCircle(COLOR_GREEN, '', 54.75, 0, RAD, true);
        drawIcon('white', 66, '\ue14c', 54, 97);
        images[OPTIONS.SCREEN.PLAY][STATE.RUN] = ctx.getImageData(0, 0, height, width);

        restoreCircle(greyCircle);

        // Drawing the red filled pause button on recording screen
        drawCircle(COLOR_RED, '', 54.75, 0, RAD, true);
        drawIcon('white', 66, '\ue14c', 54, 97);
        images[OPTIONS.SCREEN.RECORD][STATE.RUN] = ctx.getImageData(0, 0, height, width);

        restoreCircle(greyCircle);

        // Drawing the play icon
        drawIcon(COLOR_GREEN, 71, '\ue14b', 48.75, 101.25);
        var st_play = ctx.getImageData(0, 0, height, width);
        images[OPTIONS.SCREEN.PLAY][STATE.IDLE] = st_play;
        images[OPTIONS.SCREEN.PLAY][STATE.OVERFLOW] = st_play;
        images[OPTIONS.SCREEN.PLAY][STATE.PAUSE] = st_play;

        restoreCircle(greyCircle);

        // Draw microphone icon
        drawIcon(COLOR_BLUE, 76, '\ue0f2', 42.5, 100);
        var st_rec = ctx.getImageData(0, 0, height, width);
        images[OPTIONS.SCREEN.RECORD][STATE.IDLE] = st_rec;
        images[OPTIONS.SCREEN.RECORD][STATE.PAUSE] = st_rec;

        restoreCircle(greyCircle);

        // Draw microphone icon on overflow view
        drawIcon(COLOR_GREY, 76, '\ue0f2', 42.5, 100);
        images[OPTIONS.SCREEN.RECORD][STATE.OVERFLOW] = ctx.getImageData(0, 0, height, width);

        init = true;
        if (successCallback) successCallback();
    };

    var progress = function(value) {
        if (!init) return;
        if (!screenOptions || !screenOptions.screen) return;

        ctx = $("#" + canvasID).get(0).getContext("2d");

        // We put the new image on it based on the screen mode and it's state
        this.refreshCanvas();

        value /= maxLength;

        var borderColor = COLOR_GREEN;
        if (screenOptions.screen == OPTIONS.SCREEN.RECORD) {
            borderColor = (screenOptions.state == STATE.PAUSE) ? COLOR_BLUE : COLOR_RED;
        }

        drawCircle(borderColor, 3, 63.75, -(QUART), ((RAD) * value) - QUART, false);
        ctx.closePath();
    };

    var refreshCanvas = function() {
        if (!init) return;
        if (!screenOptions || !screenOptions.screen) return;

        ctx = $("#" + canvasID).get(0).getContext("2d");
        restoreCircle(images[screenOptions.screen][screenOptions.state]);
    };

    return {
        setMaxLength: setMaxLength,
        initialize: initialize,
        progress: progress,
        refreshCanvas: refreshCanvas
    };

}();

module.exports = {
    screen: AudioScreen
};
