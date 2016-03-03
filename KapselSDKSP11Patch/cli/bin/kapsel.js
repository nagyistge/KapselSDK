#! /usr/bin/env node

/*
 * Kapsel CLI
 *
 * Copyright (c) 2015 SAP
 * All rights reserved.
 */

var path = require('path');
var fs = require('fs');
var lib = path.join(path.dirname(fs.realpathSync(__filename)), '../lib');
var kapsel = require('../lib/kapsel_commands');

// extract the user-provided arguments
var userArgs = process.argv.slice(2);

function processConnectionInfo(host, username, password) {
    var DEFAULT_PORT = 8083;
    var connectionInfo = {
        host: host,
        username: username,
        password: password
    };

    if (connectionInfo.host.indexOf(':') > 0) {
        var splitHost = connectionInfo.host.split(':');
        connectionInfo.host = splitHost[0];
        connectionInfo.port = splitHost[1];
    } else {
        connectionInfo.port = 8083;
    }

    return connectionInfo;
}

function invalidCommand() {
    console.error("Invalid command; try `kapsel help` for a list of accepted commands");
}

if (userArgs[0] === "help" || !userArgs[0]) {
    kapsel.help();
} else if (userArgs[0] === "package") {
    var selectedPlatforms = userArgs.length > 1 ? userArgs.splice(1, userArgs.length - 1) : undefined;
    kapsel.package(selectedPlatforms);
} else if ((userArgs[0] === "deploy" || userArgs[0] === "upload" || userArgs[0] === "status") && userArgs.length >= 4) {
    var appID = userArgs[1];
    var connectionInfo = processConnectionInfo(userArgs[2], userArgs[3], userArgs[4]);

    kapsel[userArgs[0]](appID, connectionInfo);
} else if (userArgs[0] === "unstage" && userArgs.length >= 6) {
    var appID = userArgs[1];
    var platform = userArgs[2];
    var connectionInfo = processConnectionInfo(userArgs[3], userArgs[4], userArgs[5]);

    kapsel[userArgs[0]](appID, platform, connectionInfo);
} else if ((userArgs[0] === "remove" || userArgs[0] === "promote" ||
        userArgs[0] === "stage") && userArgs.length >= 7) {
    var appID = userArgs[1];
    var platform = userArgs[2];
    var revision = userArgs[3];
    var connectionInfo = processConnectionInfo(userArgs[4], userArgs[5], userArgs[6]);

    kapsel[userArgs[0]](appID, platform, revision, connectionInfo);
} else if (userArgs[0] === "smp_create") {
    if (userArgs[1] && userArgs[2]) {
        var username = userArgs[1];
        var password = userArgs[2];
        var configPath = userArgs[3];
        kapsel.createProject(username, password, configPath);
    } else {
        invalidCommand();
    }
} else if (userArgs[0] === "--version" || userArgs[0] === "-v") {
    console.log(require('../package').version);
} else {
    invalidCommand();
}
