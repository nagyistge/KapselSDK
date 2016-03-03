
var toolbars = {
    bottom: {
        appbar: null, // AppBar control
        commands: [] // AppBarCommand controls
    },
    top: {
        appbar: null,
        commands: []
    }
};

// expected AppBar properties
var appbarPropertiesList = ["placement", "closedDisplayMode"];

var observer;

function closeToolbars() {
    if (toolbars.bottom.appbar) {
        toolbars.bottom.appbar.close();
    }

    if (toolbars.top.appbar) {
        toolbars.top.appbar.close();
    }
}

function createCommand(options, callback) {
    var commandElement = document.createElement('button');
    var commandControl = new WinJS.UI.AppBarCommand(commandElement, options);
    commandControl.onclick = function() {
        closeToolbars();
        var onClickFunc = function () {
            callback(null, {
                keepCallback: true
            });
        };
        if (observer && options.id) {
            invokeObserver("itemClick", options.id, onClickFunc);
        } else {
            onClickFunc();
        }
    };

    if (options.icon === "print") {
        commandControl.icon = "";//there is no built in print icon
        var iconDiv = document.createElement("div");
        iconDiv.style.fontSize = "30px";
        iconDiv.style.fontFamily = "Segoe UI Symbol";
        iconDiv.textContent = "\u2399";
        var iconElement = commandElement.getElementsByClassName("win-commandicon")[0];
        commandElement.getElementsByClassName("win-commandicon")[0].insertBefore(iconDiv, iconElement.firstChild);
    }

    return commandControl;
}

function sortOptions(options) {
    // default values for some properties
    var commandOptions = {
        disabled: false
    };
    var appbarOptions = {
        placement: "bottom",
        closedDisplayMode: "minimal"
    };

    for (var prop in options) {
        if (appbarPropertiesList.indexOf(prop) != -1) {
            appbarOptions[prop] = options[prop];
        } else {
            commandOptions[prop] = options[prop];
        }
    }

    return {
        appbarOptions: appbarOptions,
        commandOptions: commandOptions
    };
}

function showToolbar(toolbar) {
    if (toolbar.appbar && toolbar.commands.length > 0) {
        toolbar.appbar.open();
    }
}

function clearToolbar(toolbar) {
    if (!toolbar || !toolbar.appbar) {
        return;
    }

    // TODO: dispose first? Without disposing its commands?
    document.body.removeChild(toolbar.appbar.element);
    toolbar.appbar.removeEventListener("afterclose", reportShowHideEvent);
    toolbar.appbar.removeEventListener("afteropen", reportShowHideEvent);
    toolbar.appbar = null;
}

function buildToolbar(toolbar, options) {
    if (toolbar.appbar !== null)
        clearToolbar(toolbar);

    var appbarElement = document.createElement('div');
    appbarElement.id = "appBar-" + options.placement;
    document.body.appendChild(appbarElement);

    toolbar.commands.forEach(function(command) {
        appbarElement.appendChild(command.element);
    });
    toolbar.appbar = new WinJS.UI.AppBar(appbarElement, options);
    toolbar.appbar.addEventListener("afterclose", reportShowHideEvent);
    toolbar.appbar.addEventListener("afteropen", reportShowHideEvent);
}

function invokeObserver(eventId, menuItemId, callback) {
    if (observer) {
        var result = [eventId];
        if (menuItemId)
            result.push(menuItemId);
        observer(result, {
            keepCallback: true
        });
        callback && callback();
    }
}

function reportShowHideEvent(event) {
    var isVisible;
    if (event.type === "afteropen") {
        isVisible = true;
    } else {
        isVisible = false;
    }
    invokeObserver(isVisible ? "show" : "hide", null);
}

module.exports = {

    add: function(successCallback, errorCallback, args) {
        // arguments may include options not only for the new command, but for the whole appbar as well
        // sort the given options into 2 objects accordingly: options.appbarOptions and options.commandOptions
        var options = sortOptions(args[0]);

        // Top placement is not supported on Windows Phone 8.1
        // The item will be added to the bottom toolbar.
        if (WinJS.Utilities.isPhone && options.appbarOptions.placement == "top") {
            console && console.error && console.error("Error: Top placement is not supported on Windows Phone 8.1.!");
            options.appbarOptions.placement = "bottom";
        }

        var changedToolbar = toolbars[options.appbarOptions.placement]; // eg. toolbars.bottom
        var newCommand = createCommand(options.commandOptions, successCallback);

        clearToolbar(changedToolbar);
        changedToolbar.commands.push(newCommand);
        buildToolbar(changedToolbar, options.appbarOptions);
    },

    clear: function(successCallback, errorCallback) {
        try {
            clearToolbar(toolbars.top);
            toolbars.top.commands = [];

            clearToolbar(toolbars.bottom);
            toolbars.bottom.commands = [];

            successCallback && successCallback();
        } catch (ex) {
            errorCallback && errorCallback(ex);
        }
    },

    show: function(successCallback, errorCallback) {
        showToolbar(toolbars.top);
        showToolbar(toolbars.bottom);

        successCallback && successCallback();
    },

    setObserver: function(successCallback) {
        observer = successCallback;
    }

};

document.addEventListener('deviceready', function() {
    // right click event triggers the 'menubutton' event
    document.addEventListener('contextmenu', function() {
        // module.exports.show()
        var event = document.createEvent('Event');
        event.initEvent('menubutton', true, true);
        document.dispatchEvent(event);
    }, false);
}, false);

require("cordova/exec/proxy").add("toolbar", module.exports);
