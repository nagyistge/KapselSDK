#! /usr/bin/env node
/*
 * Kapsel CLI
 *
 * Copyright (c) 2015 SAP
 * All rights reserved.
 */

'use strict';

var fs = require('fs'),
    path = require('path'),
    request = require('request').defaults({ jar: true }),
    Q = require('q'),
    csrfToken = null;

var platformsPaths = {
    android: {
        www_dir: function() {
            return "./platforms/android/assets/www";
        },
        config_file: function() {
            return "./platforms/android/res/xml/config.xml";
        }
    },
    ios: {
        www_dir: function() {
            return "./platforms/ios/www";
        },
        config_file: function() {
            var project = "./platforms/ios";
            var xcodeproj_dir = fs.readdirSync(project).filter(function(e) { return e.match(/\.xcodeproj$/i); })[0];
            var xcodeproj = path.join(project, xcodeproj_dir);
            var originalName = xcodeproj.substring(xcodeproj.lastIndexOf(path.sep)+1, xcodeproj.indexOf('.xcodeproj'));
            return path.join(project, originalName, "config.xml");
        }
    }
};

var ZIP_PACKAGE = "packagedKapselApp.zip";

/*
 * Returns list of platforms added to the project
 */
function listPlatforms() {
    var list = [];

    Object.keys(platformsPaths).forEach(function(platform) {
        if (fs.existsSync(path.join(platformsPaths[platform].www_dir(), "cordova.js"))) {
            list.push(platform);
        }
    });

    return list;
}

function processConfigFile(configPath) {
    return Q.Promise(function(resolve, reject, notify) {
        configPath = configPath ? configPath : './config.json';
        if (configPath.indexOf('.json') === -1) {
            console.error('The file at path ' + configPath + ' is not a JSON file.');
            reject();
            return;
        }

        fs.readFile(configPath, 'utf8', function (err,data) {
            if (err) {
                console.log(err);
                reject();
                return;
            }

            var config = JSON.parse(data);
            config.host = config.serverHost;

            // Make sure all required data is present
            ['appID', 'serverHost', 'port', 'postData'].forEach(function (requiredProp) {
                if (typeof config[requiredProp] === 'undefined') {
                    console.error('config.json is missing the ' + requiredProp + ' property.');
                    reject();
                    return;
                }
            });

            resolve(config);
        });
    });
}

/*
 * Returns a CSRF token to be used with the SMP server
 */
function fetchCSRFToken(connectionInfo) {
    return Q.Promise(function(resolve, reject, notify) {
        if (csrfToken) {
            resolve(csrfToken);
        }
        else {
            var opts = {
                url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/AdminData",
                method : "GET",
                'auth': {
                    'user': connectionInfo.username,
                    'pass': connectionInfo.password,
                    'sendImmediately': true
                },
                strictSSL: false,
                headers: {
                    "x-csrf-token": "fetch"
                }
            };

            request(opts, function (error, response, body) {
                if (response && response.headers && response.headers["x-csrf-token"])
                {
                    csrfToken = response.headers["x-csrf-token"];
                    resolve(csrfToken);
                }
                else {
                    console.error("Failed to fetch CSRF token");
                    resolve(csrfToken);
                }
            });
        }
    });
}

module.exports = {
    package: function(platforms) {
        if (!platforms) {
            platforms = listPlatforms();
        }

        if (platforms.length === 0) {
            console.error("Package failed.  No platforms detected.");
            return;
        }

        console.log("Creating zip");

        var archiver = require("archiver");
        var output = fs.createWriteStream(ZIP_PACKAGE);

        var archive = archiver('zip');

        archive.on('error', function(err) {
            console.log("Zip error: " + err);
            throw err;
        });

        archive.pipe(output);

        platforms.forEach(function(platform) {
            console.log("Adding platform " + platform + " to zip");

            archive.bulk([
                { expand: true, cwd: platformsPaths[platform].www_dir(), src: ['**'], dest: platform + "/www" }
            ]);
            archive.file(platformsPaths[platform].config_file(), { name:platform + "/config.xml" });
        });

        archive.finalize();
        console.log("Zip finished");
    },
    deploy: function(appID, connectionInfo) {
        module.exports.upload(appID, connectionInfo).then(function() {
            return module.exports.promote(appID, null, null, connectionInfo);
        }).fail(function(error) {
            console.error("ERROR: " + error.message);
        });
    },
    upload: function(appID, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            if (!fs.existsSync(ZIP_PACKAGE)) {
                console.error("Zip not found did you run the package command?");
                reject();
                return;
            }

            fetchCSRFToken(connectionInfo).then(function(csrfToken) {
                var headers = {};

                if (csrfToken) {
                    headers["x-csrf-token"] = csrfToken;
                }

                var stats = fs.statSync(ZIP_PACKAGE);
                var fileSizeInBytes = stats.size;
                var ProgressBar = require('progress');
                var bar = new ProgressBar(':percent', { total: fileSizeInBytes });

                var opts = {
                    url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID,
                    'auth' : {
                        'user' : connectionInfo.username,
                        'pass' : connectionInfo.password,
                        'sendImmediately' : true
                    },
                    strictSSL: false,
                    headers : headers,
                    formData : {
                        "file" : {
                            value:  fs.createReadStream(ZIP_PACKAGE).on('data', function(chunk) {
                                bar.tick(chunk.length);
                            }),
                            options: {
                                filename: ZIP_PACKAGE,
                                contentType: 'application/octet-stream'
                            }
                        }
                    }
                };

                var req = request.post(opts, function (error, response, body) {
                    if (response) {
                        if (response.statusCode === 201) {
                            resolve();
                        }
                        else {
                            console.error("ERROR: Server returned status code " + response.statusCode);
                            console.error(body);
                            reject();
                        }
                    }
                    else {
                        console.error("ERROR: " + error);
                        reject();
                    }
                });
            });
        });
    },
    remove: function(appID, platform, revision, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            console.log("Removing pending app " + appID + " for platform " + platform + " at revision " + revision);

            fetchCSRFToken(connectionInfo).then(function(csrfToken) {
                var headers = {
                    "Content-Type" : "application/json",
                    "X-HTTP-METHOD" : "DELETE"
                };

                if (csrfToken) {
                    headers["X-CSRF-Token"] = csrfToken;
                }

                var body = JSON.stringify([{platform: platform, revisions: [revision]}]);

                var opts = {
                    url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID + "/deletePendings",
                    method : "POST",
                    'auth': {
                        'user': connectionInfo.username,
                        'pass': connectionInfo.password,
                        'sendImmediately': true
                    },
                    strictSSL: false,
                    headers : headers,
                    body : body
                };

                request(opts, function (error, response, body) {
                    if (response) {
                        if (response.statusCode === 200) {
                            resolve();
                        }
                        else {
                            console.error("ERROR: Server returned status code: " + response.statusCode);
                            console.error(body);
                            reject();
                        }
                    }
                    else {
                        console.error("ERROR: " + error);
                        reject();
                    }
                });
            });
        });
    },
    promote: function(appID, platform, revision, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            console.log("Promoting application");

            fetchCSRFToken(connectionInfo).then(function(csrfToken) {
                var staged = revision > 0;
                var headers = {
                    "Content-Type" : "application/json"
                };

                if (csrfToken) {
                    headers["X-CSRF-Token"] = csrfToken;
                }

                var body = null;

                if (!platform && !revision) {
                    body = JSON.stringify([{platform: "android", revisions: [-1]}, {platform: "ios", revisions: [-1]}]);
                }
                else {
                    body = JSON.stringify([{platform: platform, revisions: [revision]}]);
                }

                var opts = {
                    url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID + "/" + (staged ? "promoteStaged" : "promotePending"),
                    method : "PUT",
                    'auth': {
                        'user': connectionInfo.username,
                        'pass': connectionInfo.password,
                        'sendImmediately': true
                    },
                    strictSSL: false,
                    headers : headers,
                    body : body
                };

                request(opts, function (error, response, body) {
                    if (response) {
                        if (response.statusCode === 200) {
                            var adminResponse = JSON.parse(body);

                            // if there is a message, display that
                            if (adminResponse.message) {
                                console.log(adminResponse.message);
                            } else {
                                adminResponse.forEach(function(appStatus) {
                                    if (appStatus.platform && appStatus.currentVersion) {
                                        console.log(appStatus.platform + " at revision " + appStatus.currentVersion.revision);
                                    }
                                });
                                resolve();
                            }
                        }
                        else {
                            console.error("ERROR: Server returned status code: " + response.statusCode);
                            reject();
                        }
                    }
                    else {
                        console.error("ERROR: " + error);
                        reject();
                    }
                });
            });
        });
    },
    stage: function(appID, platform, revision, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            console.log("Staging application");

            fetchCSRFToken(connectionInfo).then(function(csrfToken) {
                var headers = {
                    "Content-Type" : "application/json"
                };

                if (csrfToken) {
                    headers["X-CSRF-Token"] = csrfToken;
                }

                var body = JSON.stringify([{platform: platform, revisions: [revision]}]);

                var opts = {
                    url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID + "/stage",
                    method : "PUT",
                    'auth': {
                        'user': connectionInfo.username,
                        'pass': connectionInfo.password,
                        'sendImmediately': true
                    },
                    strictSSL: false,
                    headers : headers,
                    body : body
                };

                request(opts, function (error, response, body) {
                    if (response) {
                        if (response.statusCode === 200) {
                        }
                        else {
                            console.error("ERROR: Server returned status code: " + response.statusCode);
                            console.error(body);
                            reject();
                        }
                    }
                    else {
                        console.error("ERROR: " + error);
                        reject();
                    }
                });
            });
        });
    },
    unstage: function(appID, platform, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            console.log("Unstaging application");

            fetchCSRFToken(connectionInfo).then(function(csrfToken) {
                var headers = {
                    "Content-Type" : "application/json"
                };

                if (csrfToken) {
                    headers["X-CSRF-Token"] = csrfToken;
                }

                var body = JSON.stringify([{platform: platform}]);

                var opts = {
                    url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID + "/unstage",
                    method : "PUT",
                    'auth': {
                        'user': connectionInfo.username,
                        'pass': connectionInfo.password,
                        'sendImmediately': true
                    },
                    strictSSL: false,
                    headers : headers,
                    body : body
                };

                request(opts, function (error, response, body) {
                    if (response) {
                        if (response.statusCode === 200) {
                        }
                        else {
                            console.error("ERROR: Server returned status code: " + response.statusCode);
                            console.error(body);
                            reject();
                        }
                    }
                    else {
                        console.error("ERROR: " + error);
                        reject();
                    }
                });
            });
        });
    },
    status: function(appID, connectionInfo) {
        return Q.Promise(function(resolve, reject, notify) {
            var opts = {
                url : "https://" + connectionInfo.host + ":" + connectionInfo.port + "/Admin/kapsel/jaxrs/KapselApp/" + appID,
                'auth' : {
                    'user' : connectionInfo.username,
                    'pass' : connectionInfo.password,
                    'sendImmediately' : true
                },
                strictSSL: false
            };

            var req = request.get(opts, function (error, response, body) {
                if (response) {
                    if (response.statusCode === 200) {
                        var appStatus = JSON.parse(body);
                        var newVersions = [];
                        var currentVersions = [];
                        var stagedVersions = [];

                        var formatApp = function(appInfo) {
                            return appInfo.platform + " app at revision " +
                                    appInfo.revision + ". Modified on " +
                                    new Date(appInfo.lastModified);
                        };

                        appStatus.forEach(function(platformStatus) {
                            if (platformStatus.currentVersion) {
                                platformStatus.currentVersion.platform = platformStatus.platform;
                                currentVersions.push(platformStatus.currentVersion);
                            }
                            if (platformStatus.stagedVersion) {
                                platformStatus.stagedVersion.platform = platformStatus.platform;
                                stagedVersions.push(platformStatus.stagedVersion);
                            }
                            if (platformStatus.pendingVersions && platformStatus.pendingVersions.length > 0) {
                                platformStatus.pendingVersions.forEach(function(pending) {
                                    pending.platform = platformStatus.platform;
                                    newVersions.push(pending);
                                });
                            }
                        });

                        if (currentVersions.length > 0) {
                            console.log("Current Version:");
                            console.log("\n");
                            currentVersions.forEach(function(currentVersion) {
                                console.log("\t" + formatApp(currentVersion));
                            });
                            console.log("\n");
                        }

                        if (stagedVersions.length > 0) {
                            console.log("Staged Version:");
                            console.log("  (use kapsel promote... to update the current version)");
                            console.log("  (use kapsel unstage... to remove the staged version");
                            console.log("\n");
                            stagedVersions.forEach(function(stagedVersion) {
                                console.log("\t" + formatApp(stagedVersion));
                            });
                            console.log("\n");
                        }

                        if (newVersions.length > 0) {
                            console.log("New Version:");
                            console.log("  (use kapsel remove... to remove the version from the server");
                            console.log("  (use kapsel promote... to update the current version)");
                            console.log("  (use kapsel stage... to update the version for testers");
                            console.log("\n");
                            newVersions.forEach(function(newVersion) {
                                console.log("\t" + formatApp(newVersion));
                            });
                            console.log("\n");
                        }

                        resolve();
                    }
                    else {
                        console.error("ERROR: Server returned status code " + response.statusCode);
                        reject();
                    }
                }
                else {
                    console.error("ERROR: " + error);
                    reject();
                }
            });
        });
    },
    help: function() {
        var raw = fs.readFileSync(path.join(__dirname, 'help.txt')).toString('utf8');
        console.log(raw);
    }
};
