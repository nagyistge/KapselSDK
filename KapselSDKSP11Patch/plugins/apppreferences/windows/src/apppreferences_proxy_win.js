var preferenceUIData = null;
var containerKey = "com.sap.mp.settings";
var finishing = false;
var validationWebView = null;

var CONTENT_SECTION_ID = 'content-section';
var SETTINGS_SECTION_ID = 'settings-section';
var APPBAR_SECTION_ID = 'appBar-bottom';
var VALIDATION_WEBVIEW_ID = 'validation-webview';

var SETTINGS_HEADER_CLASSNAME = 'settings-header';
var SETTINGS_CONTENT_CLASSNAME = 'settings-content';
var SETTINGS_LABEL_TITLE_CLASSNAME = 'settings-label-title';
var SETTINGS_LABEL_CATEGORY_CLASSNAME = 'settings-label-category';
var SETTINGS_LABEL_DESCRIPTION_CLASSNAME = 'settings-label-description';

function setValue(containerName, item) {
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;

    if (!localSettings.containers.hasKey(containerName)) {
        if (containerName) {
            localSettings = localSettings.createContainer(containerName, Windows.Storage.ApplicationDataCreateDisposition.always);
        }
    } else {
        localSettings = localSettings.containers.lookup(containerName);
    }

    localSettings.values[item[0]] = JSON.stringify(item[1]);
}

function getValues(containerName, keys) {
    var result = {};
    var localSettings = Windows.Storage.ApplicationData.current.localSettings;
    if (localSettings.containers.hasKey(containerName)) {
        localSettings = localSettings.containers.lookup(containerName);
    }

    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (localSettings.values.hasKey(key)) {
            result[key] = JSON.parse(localSettings.values[key]);
        }
    }

    return result;
}

function getPreferenceValue(preferenceUIData, propertyName) {
    if (typeof (propertyName) == 'undefined') propertyName = "defaultvalue";

    var preferences = preferenceUIData["preferences"];
    var prefValues = {};

    for (var i = 0; i < preferences.length; i++) {
        var prefCategories = preferences[i];

        for (var category in prefCategories) {
            var item = prefCategories[category][0];
            var key = item["key"];
            var value = item[propertyName];

            prefValues[key] = value;
        }
    }

    return prefValues;
}

/*
 * Creates a label element with specified title and className.
 */
function createLabel(containerElement, title, className) {
    var labelElement = document.createElement('label');
    labelElement.innerText = title;
    labelElement.className = className;
    containerElement.appendChild(labelElement);
}

/*
* Reads the strings from the preferences object
*/
function getI18NString(preferenceKey, key, defaultValue) {
    if (preferenceKey == "titles") {
        var titles = preferenceUIData[preferenceKey];
        if (titles != undefined) {
            if (titles[key] != undefined) {
                return titles[key];
            }
        }
    } else {
        var preferences = preferenceUIData["preferences"];
        for (var i = 0; i < preferences.length; i++) {
            var prefCategory = preferences[i];
            for (var categoryKey in prefCategory) {
                var category = prefCategory[categoryKey];
                for (var categoryItemIndex = 0; categoryItemIndex < category.length; categoryItemIndex++) {
                    var item = category[categoryItemIndex];
                    if (item.key === preferenceKey) {
                        return item[key];
                    }
                }
            }
        }
    }
    return defaultValue;
}

/*
 * Creates a div element for the header.
 */
function createHeader(containerElement) {
    var headerElement = document.createElement('div');
    headerElement.className = SETTINGS_HEADER_CLASSNAME;

    createLabel(headerElement, getI18NString('titles', 'title1', 'Settings'), SETTINGS_LABEL_TITLE_CLASSNAME);
    containerElement.appendChild(headerElement);
}

/*
 * Creates a webview for validation.
 */
function createWebViewForValidation(containerElement) {
    validationWebView = document.createElement('x-ms-webview');
    validationWebView.id = VALIDATION_WEBVIEW_ID;
    validationWebView.style.display = 'none';

    if (preferenceUIData.webapppath) {
        var strUrl = preferenceUIData.webapppath.toString().replace('ms-appx', 'ms-appx-web');
        validationWebView.src = strUrl;
        containerElement.appendChild(validationWebView);
    }
}

/* Value change event handler.
 *
 * Write new value to the local state store.
 */
function onValueChange(e) {
    var sourceElement = e.srcElement;
    var newValue = sourceElement.value;

    var winControl = sourceElement.winControl;
    if (sourceElement.type == "checkbox") {
        newValue = sourceElement.checked;
    } else if (winControl instanceof WinJS.UI.ToggleSwitch) {
        newValue = winControl.checked;
    }

    validateAndSave(sourceElement.id, newValue);
}

/*
 * Handle button click events.
 */
function onButtonClick(e, callback) {
    var sourceElement = e.srcElement;
    var key = sourceElement.id;
    finishing = true;

    var newValue = false;
    var storedValue = getValues(containerKey, [key])[key];
    if (typeof (storedValue) == 'boolean') {
        newValue = !storedValue;
    }

    if (key == "ResetSettings") {
        showMessageDialog(getI18NString(key, "confirmTitle", "Reset settings"), getI18NString(key, "confirmMessage", "Do you want to reset the application?"), [{ label: getI18NString(key, "confirmButton1", "Yes"), commandId: 0 }, { label: getI18NString(key, "confirmButton2", "No"), commandId: 1 }])
            .done(function (result) {
                if (result) {
                    setValue(containerKey, [key, true]);
                    callback && callback("reset");
                    finishing = false;
                };
            });
    } else if (key == "SwitchToProduction") {
        // Specialized case of the Reset settings; we dont need to show a dialog.
        setValue(containerKey, [key, true]);
        callback && callback("reset");
        finishing = false;
    }
    else {

        var confirmTitle = getI18NString(key, "confirmTitle", null);
        var confirmButton1 = getI18NString(key, "confirmButton1", "Yes");
        var confirmButton2 = getI18NString(key, "confirmButton2", "No");
        var confirmMessage = getI18NString(key, "confirmMessage", null);
        var value = newValue;

        if (confirmTitle && confirmButton1 && confirmButton2 && confirmMessage) {
            showMessageDialog(confirmTitle, confirmMessage, [{ label: confirmButton1, commandId: 0 }, { label: confirmButton2, commandId: 1 }])
            .done(function (result) {
                if (result) {
                    setValue(containerKey, [key, true]);
                    if (sourceElement.callbackOnPress === true) {
                        callback && callback(key);
                    }
                    else {
                        callback && callback();
                    }
                    finishing = false; // required to ensure onHideEvent is ignored.
                }
            });
        }
        else {
            setValue(containerKey, [key, newValue]);

            var preferenceValues = getPreferenceValue(preferenceUIData, "postClickToast");
            var postClickToast = preferenceValues[key];
            if (postClickToast) {
                var notifications = Windows.UI.Notifications;
                var templateXml = notifications.ToastNotificationManager.getTemplateContent(notifications.ToastTemplateType.toastText01);
                var textElement = templateXml.getElementsByTagName('text')[0];
                textElement.appendChild(templateXml.createTextNode(postClickToast));

                var notification = new notifications.ToastNotification(templateXml);
                var toastNotifier = notifications.ToastNotificationManager.createToastNotifier();
                toastNotifier.show(notification);
            }
            if (sourceElement.callbackOnPress === true) {
                callback && callback(key);
            }
            else{
                callback && callback();
            }
        }
    }
}

function showMessageDialog(title, message, commands) {
    var alertDialog = new Windows.UI.Popups.MessageDialog(message, title);
    for (var i = 0; i < commands.length; i++) {
        var command = commands[i];
        alertDialog.commands.append(new Windows.UI.Popups.UICommand(command.label, null, command.commandId));
    }
    return alertDialog.showAsync().then(function (command) {
        return command.id == 0;
    });
}

function validateAndSave(key, value) {
    var asyncOp = validationWebView.invokeScriptAsync(preferenceUIData.validationfunction, key, value, JSON.stringify(preferenceUIData));
    asyncOp.oncomplete = function (asyncResult) {
        var resultObject = JSON.parse(asyncResult.target.result);

        if (resultObject.validationResult) {
            setValue(containerKey, [key, value]);
        } else {
            var title = "Validation Error";
            var preferenceValues = getPreferenceValue(preferenceUIData, "title");
            if (preferenceValues) {
                title = preferenceValues[key];
            }

            showMessageDialog(title, resultObject.descriptionResult, [{ label: "OK", commandId: 0 }])
                .done(function (result) {
                    if (result) {
                        undoChanges(key);
                    }
                });
        }
    };
    asyncOp.start();
}

/*
 * Undo changes when validation is invalid.
 */
function undoChanges(key) {
    var element = document.getElementById(key);
    var values = getValues(containerKey, [key]);

    var winControl = element.winControl;
    if (element.type == "checkbox") {
        element.checked = values[key];
    } else if (winControl instanceof WinJS.UI.ToggleSwitch) {
        winControl.checked = values[key];
    } else {
        element.value = values[key];
    }
}


/*
 * Creates settings page based on the preferenceUIData json.
 */
function createSettingsPage(callback) {
    var preferences = preferenceUIData["preferences"];

    var rootElement = document.getElementById(SETTINGS_SECTION_ID);
    if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = SETTINGS_SECTION_ID;
    } else {
        while (rootElement.firstChild) {
            rootElement.removeChild(rootElement.firstChild);
        }
    }

    createWebViewForValidation(rootElement);
    createHeader(rootElement);

    for (var i = 0; i < preferences.length; i++) {
        var prefCategory = preferences[i];

        for (var categoryKey in prefCategory) {
            var category = prefCategory[categoryKey];
            var containerElement = document.createElement('div');
            containerElement.className = SETTINGS_CONTENT_CLASSNAME;
            createLabel(containerElement, categoryKey, SETTINGS_LABEL_CATEGORY_CLASSNAME);

            for (var categoryItemIndex = 0; categoryItemIndex < category.length; categoryItemIndex++) {

                var item = category[categoryItemIndex];

                createLabel(containerElement, item.summary, SETTINGS_LABEL_DESCRIPTION_CLASSNAME);
                var storedItem = getValues(containerKey, [item.key]);

                // Create input elements
                var inputElement = null;
                var elementType = item.type != null ? item.type.toLowerCase() : null;
                switch (elementType) {
                    case "checkbox":
                        {
                            inputElement = document.createElement('input');
                            inputElement.type = 'checkbox';
                            inputElement.className += " win-checkbox";
                            inputElement.checked = storedItem[item.key];
                        }
                        break;
                    case "edittext":
                        {
                            inputElement = document.createElement('textarea');
                            inputElement.className += " win-textarea";
                            if (typeof storedItem[item.key] != 'undefined') {
                                inputElement.value = storedItem[item.key];
                            }
                        }
                        break;
                    case "list":
                        {
                            inputElement = document.createElement('select');
                            inputElement.className += " win-dropdown";
                            for (var listItemIndex = 0; listItemIndex < item.listentries.length; listItemIndex++) {
                                var option = document.createElement('option');
                                option.text = item.listentries[listItemIndex];
                                option.value = item.listvalues[listItemIndex];
                                inputElement.appendChild(option);
                            }

                            inputElement.value = storedItem[item.key];
                        }
                        break;
                    case "switch":
                        {
                            inputElement = document.createElement('div');
                            new WinJS.UI.ToggleSwitch(inputElement, { checked: storedItem[item.key], disabled: item.readonly });
                        }
                        break;
                    case "button":
                        {
                            inputElement = document.createElement('button');
                            inputElement.className += " win-button";
                            inputElement.textContent = item.title;
                            inputElement.callbackOnPress = item.callbackOnPress != null ? item.callbackOnPress : false;
                            inputElement.onclick = function (e) {
                                onButtonClick(e, callback);
                            };
                        }
                        break;
                    default:
                }

                if (inputElement) {
                    inputElement.id = item.key;
                    inputElement.disabled = item.readonly;
                    inputElement.addEventListener("change", onValueChange, false);
                    containerElement.appendChild(inputElement);
                }

                rootElement.appendChild(containerElement);
            }
        }
    }

    return rootElement;
}

/* 
 * Navigates to settings page with application bar visibility option.
 */
function navigate(from, to, appBarVisible) {
    if (!from || !to) {
        return;
    }

    var appBarElement = document.getElementById(APPBAR_SECTION_ID);
    if (appBarElement && appBarElement.winControl) {
        appBarElement.hidden = !appBarVisible;
    }

    from.style.display = "none";
    to.style.display = "block";
    WinJS.UI.Animation.enterContent(to);
}

module.exports = {

    getPreferenceValues: function (successCallback, errorCallback, args) {
        try {
            var result = getValues(containerKey, args[0]);
            successCallback && successCallback(result);
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    },

    setPreferenceValue: function (successCallback, errorCallback, args) {
        try {
            setValue(containerKey, args);
            successCallback && successCallback();
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    },

    setPreferenceValues: function (successCallback, errorCallback, args) {
        try {
            var items = args[0];

            for (var prop in items) {
                setValue(containerKey, [prop, items[prop]]);
            }
            successCallback && successCallback();
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    },

    showPreferencesScreen: function (successCallback, errorCallback, args) {
        try {
            var settingsPage = createSettingsPage(successCallback);
            document.body.appendChild(settingsPage);

            if (WinJS.Utilities.isPhone) {
                var contentPage = document.getElementById(CONTENT_SECTION_ID);
                navigate(contentPage, settingsPage, false);

                var backButtonHandler = function () {
                    navigate(settingsPage, contentPage, true);
                    WinJS.Application.removeEventListener("backclick", backButtonHandler, false);
                    if (!finishing) {
                        successCallback && successCallback();
                    }
                    return true;
                };
                WinJS.Application.addEventListener("backclick", backButtonHandler, false);
            } else {
                var settingsElement = document.getElementById(SETTINGS_SECTION_ID);
                if (!settingsElement || !settingsElement.winControl) {
                    new WinJS.UI.SettingsFlyout(settingsElement);
                }

                var settingsFlyout = settingsElement.winControl;
                settingsFlyout.onbeforehide = function () {
                    if (!finishing) {
                        successCallback && successCallback();
                    }
                };
                settingsFlyout.show();
            }
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    },

    configurePreferencesScreen: function (successCallback, errorCallback, args) {
        try {
            preferenceUIData = args[0];
            var prefValues = getPreferenceValue(preferenceUIData);

            for (var prop in prefValues) {
                var prefValue = getValues(containerKey, [prop]);
                if (!prefValue.hasOwnProperty(prop)) {
                    setValue(containerKey, [prop, prefValues[prop]]);
                }
            }

            successCallback && successCallback(args[0]);
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    }

};

require("cordova/exec/proxy").add("AppPreferences", module.exports);
