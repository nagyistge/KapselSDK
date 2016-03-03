/**
 **  CLI for packager
 **/

var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    https = require('https'),
    RequestQueue = require('./requestQueue.js'),
    Q = require("q"),
    xml = require("xml2js"),
    prompt = require('prompt');

/**
 ** Add libraries to set of UI5 libs 
 **/
function addToUI5Libs(libsToAdd, ui5Libs, applications) {
    var idx, found, ui5Lib;
    var added = [];

    for (ui5Lib in libsToAdd) {
        // check if this is already in our list of libs or components
        found = false;
        for (idx in ui5Libs) {
            if (ui5Lib == ui5Libs[idx]) {
                found = true;
                break;
            }
        }
        // check if it might be a reuse component in our component list
        // NOTE: we have our full set of components by now so the dependency is either
        // a new lib to be added or an existing component or lib we can ignore
        if (applications) {
            for (idx in applications) {
                if (ui5Lib == applications[idx].id) {
                    found = true;
                    break;
                }
            }
        }

        // we didn't find it - add it
        if (!found) {
            ui5Libs.push(ui5Lib);
            added.push(ui5Lib);
        }
    }

    return added;
}

/**
 ** Download all the resources from the FES
 **/
function getResources(args, config, queue, resourceArr, allResources, appInfo, targetWWWPath, resourceDeferred) {
    for (var idx in resourceArr) {
        var resource = resourceArr[idx];
        // Skip debug files if we are not downloading debug sources ...
        if (!args.debugSource && resource.isDebug) {
            continue;
        }
        // skip 'merged' files
        if (resource.merged) {
            continue;
        }
        
        var requestDeferred = Q.defer();  // the content of the fecth
        allResources.push(requestDeferred.promise);

        var item = {
            path: appInfo.url + '/' + resource.name,
            targetPath: targetWWWPath,
            baseUrl: appInfo.url,
            resource: resource.name,
            cacheable: true
        };
        
        if (args.verbose) {
            console.log("INFO: getResources: download resource: /component:" + appInfo.id + " /resource:" + item.resource);
        }
        
        queue.add(item).then(function(deferred, o) {
            if (o.statusCode == 401) {
                console.log("ERROR: getResources: Access to item is unauthorised: /component:" + appInfo.id + " /resource:" + o.item.resource);
                deferred.reject(new Error("Access to item is unauthorised: /component:" + appInfo.id + " /resource:" + o.item.resource));
                return;
            }
            if (o.statusCode == 404) {
                console.log("WARNING: getResources: Item not found: /component:" + appInfo.id + " /resource:" + o.item.resource);
                deferred.resolve(); // we accept this
                return;
            }

            // received the actual resource file
            createResource(args, o.item, o.response, " /component:" + appInfo.id).then(function () {
                deferred.resolve();
            }, function (e) {
                deferred.reject(e);
            });
        }.bind(null, requestDeferred), function(deferred, rejectReason) {
            console.log("ERROR: getResources: attempt to fetch item failed: " + rejectReason + ", /component:" + appInfo.id + " /resource:" + o.item.resource);
            deferred.reject(rejectReason);
        }.bind(null, requestDeferred));
    }

    // we have determined the set of resources ...
    resourceDeferred.resolve();
}

/**
 ** Find Resources for BSP app using Team Provider API
 **/
function findResourcesForBSP(queue, object, resources) {
    var deferred = Q.defer();

    var item = {
        path: '/sap/bc/adt/filestore/ui5-bsp/objects/' + object + '/content'
    };

    queue.add(item).then(function(deferred, o) {
        if (o.statusCode != 200) {
            deferred.reject(new Error('Unexpected response received when retrieving information for BSP object ' + object + ': [' + o.statusCode + ']'));
            return;
        }

        //console.log('Status: ' + o.statusCode);
        //console.log('Body:\n' + o.response);

        xml.parseString(o.response, function(err, result) {
            if (!err) {
                //console.log(result);

                var adtPromises = [];
                var atomFeed = result["atom:feed"];
                var atomEntries = atomFeed["atom:entry"];
                for (var e in atomEntries) {
                    var entry = atomEntries[e];
                    var content = entry["atom:content"][0];
                    var title = entry["atom:title"][0];
                    var id = entry["atom:id"][0];
                    var category = entry["atom:category"][0];
                    var objectType = category['$']['term']
                    //console.log(indent + ">>>> " + title +  ' ['+id+'] ' +  ' - '  + objectType);

                    if (objectType === 'folder') {
                        adtPromises.push(findResourcesForBSP(queue, id, resources));
                    } else {
                        var resource = title.substring(title.indexOf('/')+1);
                        // add to resources list in a way that is compatible with the resources.json format
                        resources.push({
                            "name": resource,
                            "merged": false,
                            "isDebug": (title.indexOf('-dbg.js') >= 0)
                        });
                    }
                }

                Q.allSettled(adtPromises).then(function() {
                    deferred.resolve();
                }, function(e) {
                    deferred.reject(e);
                });

            } else {
                console.log("ERROR: Failed to parse response details for BSP object " + object + ": [" + err + "]");
                deferred.reject(err);
            }
        });
        
    }.bind(null, deferred), function(deferred, rejectReason) {
        deferred.reject(rejectReason);
    }.bind(null, deferred));
    
    return deferred.promise;
}

/**
 ** Create resource in local file system
 **/
function createResource(args, item, content, requestContext) {
    if (args.verbose) {
        console.log("INFO: createResource: " + requestContext + " /createResource:" + item.resource);
    }

    var promises = [];

    promises.push(createFile(path.join(item.targetPath, item.baseUrl, item.resource), content, item.binary));
    if (item.copyTo) {
        promises.push(createFile(path.join(item.targetPath, item.baseUrl, item.copyTo), content, item.binary));
    }

    return Q.all(promises);
}

var dirsCreated = {};  // maintain a list of directories we have created ...

function createFile(fullPath, content, binary) {
    var deferred = Q.defer();
    
    var index = fullPath.lastIndexOf(path.sep);
    if (index >= 0) {
        var prePath = fullPath.substring(0, index);
        if (!dirsCreated[prePath]) {
            shell.mkdir("-p", prePath);
            dirsCreated[prePath] = prePath;
        }
    }

    function cb(error) {
        if (error) {
            console.log("ERROR: createFile: Unable to create file at '"+fullPath+"': " + error);
            deferred.reject(error);
        } else {
            deferred.resolve();
        }
    }
    
    if (binary) {
        content = Buffer.concat(content);
        fs.writeFile(fullPath, content, cb);
    } else {
        //content.to(fullPath);
        fs.writeFile(fullPath, content, {encoding: "utf8"}, cb);
    }

    return deferred.promise;
}

/**
 ** Get library from FES
 ** the first request gets library manifest.json which contains the dependent libraries
 ** the second request gets resources.json, which contains each resource items
 **/
function getLibrary(args, config, packagerConfig, queue, libs, manifestPromises, resourcePromises, targetWWWPath, libInfo, requestContext, allResources) {
    var idx;
    if (args.verbose) console.log("INFO: getLibrary: " + requestContext + "/library:" + libInfo.componentId);
    
    var libDeferred = Q.defer();
    manifestPromises.push(libDeferred.promise);

    var item = {
        x: libInfo.componentId,
        path: libInfo.url + '/manifest.json',
        targetPath: targetWWWPath,
        cacheable: true
    };
    
    if (args.verbose) console.log("INFO: getLibrary: Request manifest: " + requestContext + "/library:" + item.x + " /path:" + item.path);

    queue.add(item).then(function(deferred, o) {
        var ui5Libs = null;
        if (o.statusCode == 401) {
            console.log("ERROR: getLibrary: Unauthorized access for manifest file: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
            deferred.reject(new Error("Unauthorized access for manifest file: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path));
            return;
        }
        if (o.statusCode == 404) {
            console.log("WARNING: getLibrary: Manifest file not found: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
            // get the list from the local config (if present)
            var foundManifest = false;
            for (var i in packagerConfig.libraries) {
                var libDetail = packagerConfig.libraries[i];
                if (libDetail.id == o.item.x) {
                    ui5Libs = libDetail.manifest["sap.ui5"].dependencies.libs;
                    if (args.verbose) console.log("INFO: getLibrary: Manifest file not found, load from package config instead: " + requestContext + "/library:" + o.item.x);
                    foundManifest = true;

                    break;
                }
            }
            if (!foundManifest) {
                console.log("ERROR: getLibrary: No manifest details for library: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
                deferred.reject(new Error("No manifest details for library: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path));
                return;
            }
        } else {
            try {
                ui5Libs = JSON.parse(o.response)["sap.ui5"].dependencies.libs;
            } catch (e) {
                console.log("ERROR: getLibrary: Error parsing manifest file [" + e + "]: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
                deferred.reject(new Error("Error parsing manifest file [" + e + "]: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path));
                return;
            }
        }

        var dependentLibPromises = [];
        if (!ui5Libs) {
            console.log("WARNING: getLibrary: No dependent UI5 lib available for " + requestContext + "/library:" + o.item.x);
        } else {
            var added = addToUI5Libs(ui5Libs, libs, null);

            for (idx in added) {
                var ui5Lib = added[idx];
                if (args.verbose) console.log("INFO: getLibrary: Get dependent ui5 library: " + requestContext + "/library:" + o.item.x + " /lib:" + ui5Lib)

                var libInfoInner = {
                    url: "/sap/bc/ui5_ui5/ui2/ushell/resources/" + ui5Lib.replace(/\./g, '/'),
                    localUrl: "resources/" + ui5Lib.replace(/\./g, '/'),
                    componentId: ui5Lib
                }

                getLibrary(args, config, packagerConfig, queue, libs, dependentLibPromises, resourcePromises, targetWWWPath, libInfoInner, requestContext + "/library:" + o.item.x, allResources);
            }
        }

        if (args.verbose) console.log("INFO: getLibrary: " + requestContext + "/library:" + o.item.x);
        Q.all(dependentLibPromises).then(function() {
            deferred.resolve();
        }, function(e) {
            deferred.reject(e);
        });
    }.bind(null, libDeferred), function(deferred, rejectReason) {
        console.log("ERROR: getLibrary: Fetch of manifest.json failed: " + rejectedReason + ", " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
        deferred.reject(rejectReason);
    }.bind(null, libDeferred));

    var libResourcesDeferred = Q.defer();   // used to validate the actual content
    resourcePromises.push(libResourcesDeferred.promise);

    var libResourcesItem = {
        x: libInfo.componentId,
        path: libInfo.url + '/resources.json',
        cacheable: true
    }
    
    queue.add(libResourcesItem).then(function(deferred, o) {
        var resources = {};
        if (o.statusCode == 401) {
            console.log("ERROR: getLibrary: Unauthorised access for resource: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
            deferred.reject(new Error("Unauthorised access for resource: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path));
            return;
        }
        if (o.statusCode == 404) {
            console.log("WARNING: getLibrary: Resources list not found: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
            // get the list from the local config (if present)
            for (var i in packagerConfig.libraries) {
                var libDetail = packagerConfig.libraries[i];
                if (libDetail.id == libInfo.componentId) {
                    resources.resources = libDetail.resources;
                    break;
                }
            }
            if (!resources.resources) {
                for (var i in config.resources) {
                    var detail = config.resources[i];
                    if (detail.id == libInfo.componentId) {
                        resources.resources = detail.resources;
                        break;
                    }
                }
                if (!resources.resources) {
                    console.log("ERROR: getLibrary: Failed to find any resources: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
                    deferred.reject(new Error("Failed to find any resources: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path));
                    return;
                }
            }
        } else {
            // received the resources.json
            try {
                resources = JSON.parse(o.response);
            } catch (e) {
                console.log("ERROR: getLibrary: Failed to parse resources.json [" + e + "]: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
                deferred.reject(e);
                return;
            }
        }

        // we're happy with the content of the resources ...
        deferred.resolve();

        if (!resources.resources) {
            console.log("WARNING: getLibrary: Could not find resources for " + requestContext + "/library:" + o.item.x);
            return;
        }

        // we must ensure that themed files are handled properly
        for (idx in resources.resources) {
            var resource = resources.resources[idx];
            var themesIdx = resource.name.indexOf("themes/base/");
            if (themesIdx >= 0) {
                // check to see if there is a sap_bluecrystal version ...
                var theme = "sap_bluecrystal";
                if (config.theme) {
                	theme = config.theme;
                }
                var file = resource.name.substring(0, themesIdx) + "themes/" + theme + "/" + resource.name.substring(themesIdx + 12); // the non-theme specific name
                var skip = false;
                for (var idx2 in resources.resources) {
                    var resource2 = resources.resources[idx2];
                    if (resource2.name === file) {
                        skip = true;
                        break;
                    }
                }
                if (!skip) {
                    // must add it to the filesystem as a copy in the target bluecrystal theme
                    resource["copyTo"] = file;
                }
            }
        }
        
        for (var idx in resources.resources) {
            var resource = resources.resources[idx];
            if (!args.debugSource && resource.isDebug) {
                continue;
            }
            if (resource.merged && (!(resource.name == '../../../sap-ui-core.js') &&
                                    !(args.debugSource && resource.name == '../../../sap-ui-core-dbg.js'))) {
                continue;
            }
            
            var deferred = Q.defer();  // for validating the content
            allResources.push(deferred.promise);

            var itemInner = {
                x: libInfo.componentId,
                path: libInfo.url + '/' + resource.name,
                targetPath: targetWWWPath,
                baseUrl: libInfo.localUrl,
                resource: resource.name,
                cacheable: true
            };
            if (resource.copyTo) {
                itemInner["copyTo"] = resource.copyTo;
            }
            if (args.verbose) {
                console.log("INFO: getLibrary: Request for resource " + requestContext + "/library:" + o.item.x + " /resource:" + itemInner.resource);
            }

            queue.add(itemInner).then(function(deferred, o) {
                if (o.statudsCode == 401) {
                    console.log("ERROR: getLibrary: Unauthorised access to resource: " + requestContext + "/library:" + o.item.x + " /resource:" + o.item.path);
                    deferred.reject(new Error("Unauthorised access to resource: " + requestContext + "/library:" + o.item.x + " /resource:" + o.item.path));
                    return;
                } else if (o.statusCode == 404) {
                    console.log("WARNING: getLibrary: Resource not found: " + requestContext + "/library:" + o.item.x + " /resource:" + o.item.path);
                    deferred.resolve();  // we accept this failure ...
                    return;
                }
                // if (args.verbose) console.log("Downloaded [" + o.item.path + "]");
                createResource(args, o.item, o.response, requestContext + "/library:" + o.item.x).then(function () {
                    deferred.resolve();
                }, function (e) {
                    deferred.reject(e);
                });
            }.bind(null, deferred), function(deferred, rejectReason) {
                console.log("ERROR: getLibrary: Fetch of resource failed [" + rejectReason + "]: " + requestContext + "/library:" + o.item.x + " /resource:" + o.item.path);
                deferred.reject(rejectReason);
            }.bind(null, deferred));
        }
    }.bind(null, libResourcesDeferred), function(deferred, rejectReason) {
        console.log("ERROR: getLibrary: Failed to fetch resources.json [" + rejectReason + "]: " + requestContext + "/library:" + o.item.x + " /path:" + o.item.path);
        deferred.reject(rejectReason);
    }.bind(null, libResourcesDeferred));
}

/**
 ** Get the app's ui5_app_info in json format, 
 ** /sap/bc/ui2/app_index/ui5_app_info?id=nw.epm.refapps.lib.reuse
 ** for returned library, if ending with reuse, then getappInfo to get the reuse app
 ** for returned component, call getComponent to get the component

 ** sample response:
 ** {
 ** 	"nw.epm.refapps.shop":{
 ** 
 ** 		"dependencies":[
 ** 			{"id":"nw.epm.refapps.shop","type":"UI5COMP","url":"/sap/bc/ui5_ui5/sap/epm_ref_shop","error":false},
 ** 			{"id":"sap.ca.scfld.md","type":"UI5COMP","url":"","error":false},
 ** 			{"id":"nw.epm.refapps.lib.reuse","type":"UI5LIB","url":"/sap/bc/ui5_ui5/sap/epm_ref_lib","error":false},
 ** 			{"id":"sap.m","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.ui.core","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.me","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.ui.commons","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.ui.comp","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.ui.table","type":"UI5LIB","url":"","error":false},
 ** 			{"id":"sap.ushell","type":"UI5LIB","url":"","error":false}
 ** 		],
 ** 		"error":false
 ** 	}
 ** }
 **
 **/
function getAppInfo(args, config, queue, app, promises, applications, requestContext) {
    if (args.verbose) console.log("INFO: getAppInfo: " + requestContext + "/app:" + app.id);

    //deferred promise is resolved when all libraries and components belong to this application are downloaded
    var deferred = Q.defer();
    promises.push(deferred.promise);
    
    if (!app.reuse) {
        app.reuse = false;
        app.root = true;
    } else {
        app.reuse = true;
        app.root = false;
    }

    //if application url is specified in the appconfig.js then directly get component for the app without requesting it from front end server
    if (app.url) {
        var hidden = false;
        if (app.reuse) {
            hidden = true;
        }
        if (args.verbose) console.log("INFO: getAppInfo: download component based app url from appconfig.js " + requestContext + "/app:" + app.id);

        deferred.resolve();
    } else {
        function processAppIndex(deferred, o) {
            //console.log("getAppInfo response: "+ o.statusCode + " for getAppInfo: " + requestContext + "/app:" + app.id );
            if (o.statusCode == 401) {
                console.log("ERROR: getAppInfo: Unauthorised access to application details API: " + requestContext + "/app:" + app.id);
                deferred.reject(new Error("Unauthorised access to application details API: " + requestContext + "/app:" + app.id));
                return;
            }
            if (o.statusCode == 404) {
                if (o.item.path.substring(0, 12) == "/sap/bc/ui2/") {
                    // retry with older API (without the ui2 piece)

                    var appInfoItem2 = {
                        path: '/sap/bc/app_index/ui5_app_info?id=' + app.id
                    }

                    queue.add(appInfoItem2).then(processAppIndex.bind(null, deferred), function(deferred, e) {
                        console.log("ERROR: getAppInfo: Unable to retrieve application details [" + e + "]: " + requestContext + "/app:" + app.id);
                        deferred.reject(new Error("Unable to retrieve application details: " + e));
                    }.bind(null, deferred));

                    return;
                }

                console.log("ERROR: getAppInfo: Application details API not present: " + requestContext + "/app:" + app.id);
                deferred.reject(new Error("Application details API not present: " + requestContext + "/app:" + app.id));
                return;
            }

            // received the app info
            try {
                var appInfos = JSON.parse(o.response);
            } catch (e) {
                console.log('ERROR: getAppInfo: Failed to parse application details response [' + e + ']: ' + requestContext + "/app:" + app.id);
                deferred.reject(new Error("Failed to parse application details response [" + e + "]"));
                return;
            }

            // locate the app we want
            if (!appInfos) {
                console.log("ERROR: getAppInfo: Unable to locate any information in application details API response: " + requestContext + "/app:" + app.id);
                deferred.reject(new Error("Unable to locate any information in application details API response: " + requestContext + "/app:" + app.id));
                return;
            }

            var appInfo = appInfos[app.id];
            if (!appInfo) {
                console.log("ERROR: getAppInfo: Unable to find details of application in application details API response: " + requestContext + "/app:" + app.id);
                deferred.reject(new Error("Unable to find details of application in application details API response: " + requestContext + "/app:" + app.id));
                return;
            }

            var dependencies = appInfo.dependencies;
            for (var idx in dependencies) {
                var dependency = dependencies[idx];

                if (dependency.error && dependency.error !== false) {
                    console.log("WARNING: getAppInfo: Dependency '" + dependency.id + "' shows as error: " + requestContext + "/app:" + app.id);
                    continue;
                }

                if (dependency.url && dependency.url.length > 0) {
                    // check to see if the component is already noted, else add
                    var found = false;
                    for (var idx in applications) {
                        if (applications[idx].id == dependency.id) {
                            applications[idx].url = dependency.url;  // remember the url
                            found = true;
                            break;
                        }
                    }
                    if (!found) {
                        var appInfo = {
                            id: dependency.id,
                            url: dependency.url,
                            reuse: true   // it must be reuse component as it's not in our app list so it will be hidden
                        }
                        applications.push(appInfo);
                    }
                }
            }

            deferred.resolve();
        }
        
        var appInfoItem = {
            path: '/sap/bc/ui2/app_index/ui5_app_info?id=' + app.id
        }
        queue.add(appInfoItem).then(processAppIndex.bind(null, deferred), function(deferred, e) {
            console.log("ERROR: getAppInfo: Unable to retrieve application details [" + e + "]: " + requestContext + "/app:" + app.id);
            deferred.reject(new Error("Unable to retrieve application details [" + e + "]: " + requestContext + "/app:" + app.id));
        }.bind(null, deferred));
    }
}

/**
 ** Get component from FES. 
 ** component manifest file: "/sap/bc/ui5_ui5/sap/epm_ref_shop/manifest.json". 
 ** manifest.json is app descriptor. The handler of manifest.json will save the manifest.json file and then
 ** add all dependent library into libs collection, so they will be downloaded later by getLibrary method
 **
 ** component resource file: "/sap/bc/ui5_ui5/sap/epm_ref_shop/resources.json"
 ** resouces.json contains all the resouce items and the handler of resources.json will download and save each 
 ** resource item
 **
 **/
function getComponent(args, config, queue, appInfo, libs, applications, manifestPromises, resourcePromises, targetWWWPath, allResources) {
    if (args.verbose) console.log("INFO: getComponent: /component:" + appInfo.id);

    var manifestDeferred = Q.defer();
    manifestPromises.push(manifestDeferred.promise);

    if (!appInfo.url) {
        manifestDeferred.reject(new Error("Missing url for component: " + appInfo.id));
        return;
    }
    
    var appManifestItem = {
        x: appInfo.id,
        path: appInfo.url + '/manifest.json',
        targetPath: targetWWWPath,
        baseUrl: appInfo.url,
        resource: 'manifest.json',
        cacheable: true
    }
    queue.add(appManifestItem).then(function(deferred, o) {
        // received the manifest.json
        if (o.statusCode == 401) {
            console.log("ERROR: getComponent: Unauthorised access for manifest: /component:" + appInfo.id + " /path:" + o.item.path);
            deferred.reject(new Error("Unauthorised access for manifest: /component:" + appInfo.id + " /path:" + o.item.path));
            return;
        }
        if (o.statusCode == 404) {
            // No manifest file ...
            console.log("WARNING: getComponent: Manifest not found: /component:" + appInfo.id + " /path:" + o.item.path);

            if (args.verbose) console.log("INFO: getComponent: Using provided configuration data (" + JSON.stringify(appInfo) + "): /component:" + appInfo.id + " /path:" + o.item.path);

            // ensure we have these libs added
            addToUI5Libs(appInfo.libs, libs, null);
            //addToUI5Libs({"sap.uxap":{}, "sap.uiext.inbox":{}, "sap.ui.ux3":{}, "sap.ui.commons":{}}, libs, null);
            
            deferred.resolve();
            return;
        }

        var ui5Libs = null;

        // if (args.verbose) console.log("Downloaded [" + o.item.path + "]");

        try {
            var content = null;
            if (o.item.binary) {
                content = Buffer.concat(o.response);
            } else {
                content = o.response;
            }
            var manifestData = JSON.parse(content);
            if (manifestData["sap.ui5"]) {
                ui5Libs = manifestData["sap.ui5"].dependencies.libs;
            }

            // set application title based on manifest file
            if (!appInfo.title && manifestData["sap.app"] && manifestData["sap.app"].title) {
                appInfo.title = manifestData["sap.app"].title;
                if (manifestData["sap.app"].i18n) {
                    appInfo.i18n = manifestData["sap.app"].i18n;
                }
            }

            // set application icon based on manifest file
            if (!appInfo.icon && manifestData["sap.ui"] && manifestData["sap.ui"].icons && manifestData["sap.ui"].icons["icon"]) {
                appInfo.icon = manifestData["sap.ui"].icons["icon"];
            }

            // set the scenario info in the app detail
            if (appInfo.scenario) {
                if (manifestData["sap.mobile"]) {
                    if (manifestData["sap.mobile"].scenario) {
                        appInfo.scenarioInit = manifestData["sap.mobile"].scenario;
                    }

                    if (manifestData["sap.mobile"].stores) {
                        appInfo.stores = manifestData["sap.mobile"].stores;
                    }
                }
            }
        } catch (e) {
            console.log("ERROR: getComponent: Error parsing manifest [" + e + "]: /component:" + appInfo.id + " /path:" + o.item.path);
            deferred.reject(new Error("Error parsing manifest [" + e + "]: /component:" + appInfo.id + " /path:" + o.item.path));
            return;
        }

        if (!ui5Libs) {
            console.log("WARNING: getComponent: Could not find any ui5 dependent libraries: /component:" + appInfo.id + " /path:" + o.item.path);
        } else {
            addToUI5Libs(ui5Libs, libs, applications);
        }

        if (args.verbose) console.log("INFO: getComponent: /component:" + appInfo.id + " /path:" + o.item.path);
        
        deferred.resolve();
    }.bind(null, manifestDeferred), function(deferred, rejectReason) {
        console.log("ERROR: getComponent: Error retrieving manifest file [" + rejectReason + "]: /component:" + appInfo.id + " /path:" + o.item.path);
        deferred.reject(rejectReason);
    }.bind(null, manifestDeferred));

    // now sort out resources ...
    var resourceDeferred = Q.defer();
    resourcePromises.push(resourceDeferred.promise);

    if (appInfo.useADT) {
        var resourceArr = [];
        var bspName = appInfo.url.substring(appInfo.url.lastIndexOf('/') + 1);
        findResourcesForBSP(queue, bspName, resourceArr).done(function() {
            getResources(args, config, queue, resourceArr, allResources, appInfo, targetWWWPath, resourceDeferred);
        }, function (e) {
            console.log("ERROR: getComponent: Failed to find resources for BSP: " + e);
            resourceDeferred.reject(e);
        });
        return;
    }
    
    var appResourcesItem = {
        path: appInfo.url + '/resources.json',
        cacheable: true
    }
    queue.add(appResourcesItem).then(function(deferred, o) {
        if (o.statusCode == 401) {
            console.log("ERROR: getComponent: Unauthorised access for resources file: /component:" + appInfo.id + " /path:" + o.item.path);
            deferred.reject(new Error("Unauthorised access for resources file: /component:" + appInfo.id + " /path:" + o.item.path));
            return;
        }

        if (o.statusCode == 404) {
            console.log("WARNING: getComponent: Resources file not found: /component:" + appInfo.id + " /path:" + o.item.path);
            var resourceArr = [];
            var bspName = appInfo.url.substring(appInfo.url.lastIndexOf('/') + 1);
            findResourcesForBSP(queue, bspName, resourceArr).done(function() {
                getResources(args, config, queue, resourceArr, allResources, appInfo, targetWWWPath, deferred);
            }, function (e) {
                console.log("ERROR: getComponent: Failed to find resources [" + e + "]: /component:" + appInfo.id + " /path:" + o.item.path);
                deferred.reject(e);
            });
            return;
        }

        var resources = {};
        // received the resources.json
        try {
            resources = JSON.parse(o.response);
        } catch (e) {
            console.log("WARNING: Error parsing resources file: " + e);
        }

        if (!resources || !resources.resources) {
            console.log("ERROR: getComponent: Could not find resources: /component:" + appInfo.id + " /path:" + o.item.path);
            deferred.reject(new Error("Could not find resources: /component:" + appInfo.id + " /path:" + o.item.path));
            return;
        }

        getResources(args, config, queue, resources.resources, allResources, appInfo, targetWWWPath, deferred)
    }.bind(null, resourceDeferred), function(deferred, rejectReason) {
        console.log("ERROR: getComponent: Failed to retrieve resource [" + rejectReason + "]: /component:" + appInfo.id + " /path:" + o.item.path);
        deferred.reject(rejectReason);
    }.bind(null, resourceDeferred));
}

function Packager(args, config) {
    this.args = args;
    this.config = config;
}

/**
 ** Setup for the packager
 **
 **/
Packager.prototype.setup = function() {
    var that = this;
    var deferred = Q.defer();

    if (!this.config.frontEndServer.host ||
        !this.config.frontEndServer.port ||
        (typeof this.config.frontEndServer.https === "undefined")) {
        console.log("ERROR: Must fully define front end server connection details!");
        deferred.reject(new Error("Must fully define front end server connection details!"));
        return deferred.promise;
    }

    //allow user to input credential from command line 
    var needPromptForUsername = false;
    if (this.args.username) {
        this.config.frontEndServer.username = this.args.username;
    } else {
        needPromptForUsername = true;
    }

    var needPromptForPassword = false;
    if (this.args.password) {
        this.config.frontEndServer.password = this.args.password;
    } else {
        needPromptForPassword = true;
    }

    if (needPromptForUsername || needPromptForPassword) {
        prompt.message = "Input Front End Server's ";
        prompt.delimiter = '';
        prompt.start();
        var promptNames = [];
        if (needPromptForUsername) {
            promptNames.push({
                name: 'username',
                required: true,
                message: 'username'
            });
        }

        if (needPromptForPassword) {
            promptNames.push({
                name: 'password',
                hidden: true,
                required: true,
                message: 'password:'
            });
        }

        prompt.get(promptNames, function(err, result) {
            if (needPromptForUsername) {
                that.config.frontEndServer.username = result.username;
            }

            if (needPromptForPassword) {
                that.config.frontEndServer.password = result.password;
            }
            deferred.resolve();
        });
    } else {
        deferred.resolve();
    }

    return deferred.promise;
}

/**
 ** Create a local package by downloading resources from the Front End Server
 **
 **/
Packager.prototype.createPackage = function() {
    var that = this;

    // the libs variable specifies all ui5 library used by local launchpad. L
    // local launchpad cannot not be downloaded from front end server
    var allUI5Libs = ["sap.ui.core", "sap.ushell", "sap.m", "sap.ui.layout", "sap.ui.unified", "sap.fiori", "sap.ca.scfld.md", "sap.ca.ui", "sap.me", "sap.suite.ui.commons", "sap.collaboration", "sap.viz"];

    var componentManifestPromises = [];
    var componentResourcePromises = []; 
    var libManifestPromises = [];
    var libResourcePromises = [];
    var allResources = [];
    
    var targetPath = this.args.targetDir;
    var targetWWWPath = path.join(targetPath, "www");
    var applications = this.config.applications;
    var packagerResourcesDir = path.join(__dirname, "..", "resources");

    var options = {
        hostname: this.config.frontEndServer.host,
        port: this.config.frontEndServer.port,
        auth: this.config.frontEndServer.username + ":" + this.config.frontEndServer.password,
        https: true,
        rejectUnauthorized: false,
        maxReqs: this.args.maxReqs
    }

    if (this.config.frontEndServer.proxyHost) {
        options.proxyHost = this.config.frontEndServer.proxyHost;
        options.proxyPort = this.config.frontEndServer.proxyPort;
    }

    if (this.config.frontEndServer.sapClient) {
        options.sapClient = this.config.frontEndServer.sapClient;
    }

    try {
        var queue = new RequestQueue(options, this.args);
    } catch (e) {
        return Q.reject(e);
    }

    var deferred = Q.defer();

    var boot = Q.defer();
    boot.resolve();
    boot.promise.
    then(function() {
        // ==========
        // Phase 1: create file system structure and get app component details
        // ==========

        // is this a scenario based package?
        that.config.scenario = -1;
        for (var idx in applications) {
            var application = applications[idx];
            if (application.scenario) {
                if (that.config.scenario != -1) {
                    // can't be already set ...
                    console.log("ERROR: Only define one component as the scenario component");
                    deferred.reject(new Error("Only define one component as the scenario component"));
                    return deferred.promise;
                }
                that.config.scenario = idx; // index into application array
            }
        }

        if (!applications || applications.length == 0) {
            console.log("ERROR: No application is defined in the appConfig.js file");
            deferred.reject(new Error("No application is defined in the appConfig.js file"));
            return deferred.promise;
        }

        var singleAppInfo = null;
        if (that.config.singleApp) {
            for (var app in applications) {
                if (applications[app].id == that.config.singleApp) {
                    singleAppInfo = applications[app];
                    break;
                }
            }
            if (!singleAppInfo) {
                console.log("ERROR: If creating a single app, the specified app ('" + that.config.singleApp + "') must be defined in the config file");
                deferred.reject(new Error("If creating a single app, the specified app ('" + that.config.singleApp + "') must be defined in the config file"));
                return deferred.promise;
            }
        }

        if (shell.test('-e', that.args.targetDir)) {
            if (that.args.force) {
                try {
                    shell.rm("-rf", that.args.targetDir);
                    var err = shell.error();
                    if (err) {
                        console.log("ERROR: Failed to remove directory: " + err);
                        deferred.reject(new Error("Failed to remove directory: " + err));
                        return deferred.promise;
                    }
                } catch (e) {
                    console.log("ERROR: Unable to remove existing target!");
                    deferred.reject(new Error("Unable to remove existing target!"));
                    return deferred.promise;
                }
            } else {
                console.log("ERROR: Path '" + that.args.targetDir + "' already exists");
                deferred.reject(new Error("Path '" + that.args.targetDir + "' already exists"));
                return deferred.promise;
            }
        }


        if (that.args.verbose) console.log("INFO: Create directory at '" + targetPath + "'");

        shell.mkdir("-p", targetPath);

        shell.cp(path.join(packagerResourcesDir, "config.xml"), targetPath);
        if (that.args.client) {
            shell.sed("-i", /index.html/, "index.html?sap-client=" + that.args.client, path.join(targetPath, "config.xml"));
        }

        if (that.config.bundleID) {
            shell.sed("-i", /com.sap.mobile.fioripackaged/, that.config.bundleID, path.join(targetPath, "config.xml"));
        }

        if (that.config.appVersion) {
            shell.sed("-i", /0.0.1/, that.config.appVersion, path.join(targetPath, "config.xml"));
        }

        if (that.config.appName) {
            shell.sed("-i", /LocalLaunchPad/, that.config.appName, path.join(targetPath, "config.xml"));
        }

        shell.mkdir("-p", path.join(targetPath, "platforms"));
        shell.mkdir("-p", path.join(targetPath, "plugins"));
        shell.cp("-r", path.join(packagerResourcesDir, "assets/ios"), path.join(targetPath, "res"));
        shell.cp("-r", path.join(packagerResourcesDir, "assets/android"), path.join(targetPath, "res"));
        shell.cp("-r", path.join(packagerResourcesDir, "assets/screen"), path.join(targetPath, "res"));

        shell.mkdir("-p", targetWWWPath);

        if (that.args.singleApp) {
            shell.cp(path.join(packagerResourcesDir, "index_single_app.html"), path.join(targetWWWPath, "index.html"));
        } else {
            shell.cp(path.join(packagerResourcesDir, "index.html"), targetWWWPath);
        }
                
        if (that.config.theme) {
        	shell.sed("-i", /sap_bluecrystal/g, that.config.theme, path.join(targetWWWPath, "index.html"));	
        }

        // Create the Fiori Applications definition
        if (that.args.verbose) {
            console.log("INFO: Packaging these apps:");
            for (var app in applications) {
                console.log("    " + applications[app].id);
            }
        }

        //copy appconfig.js to www folder - rename to standard name when doing this
        shell.cp(that.args.config, path.join(targetWWWPath, "appConfig.js"));

        // Place the Window UShell definition
        shell.cp(path.join(packagerResourcesDir, "ushellconfig.js"), targetWWWPath);

        // Now copy the basic bootstrap JS files into place
        shell.cp("-r", path.join(packagerResourcesDir, "js"), targetWWWPath);
        shell.cp("-r", path.join(packagerResourcesDir, "css"), targetWWWPath);
        shell.cp("-r", path.join(packagerResourcesDir, "localShell"), targetWWWPath);

        //create www/resources folder
        shell.mkdir("-p", path.join(targetWWWPath, "resources"));

        //
        // Copy Apps from the FES
        //

        if (that.args.verbose) console.log("INFO: Get the Application content from the front end server");

        // This promise array is resolved when all application manifests are downloaded.
        var appInfoPromises = [];
        for (var idx in applications) {
            var app = applications[idx];

            if (that.args.singleApp && app.id != that.args.singleApp) {
                // building a single app so ignore apps that we are not including
                continue;
            }

            getAppInfo(that.args, that.config, queue, app, appInfoPromises, applications, "");
        }

        return Q.all(appInfoPromises);
    }, function(e) {
        var rejected = Q.defer();
        rejected.reject(e);
        return rejected.promise;
    }).
    then(function() {
        // ==========
        // Phase 2: we have a list of components to package: get the component content (manifests and resources.json files)
        // ==========

        if (that.args.verbose) console.log("INFO: All application info loaded");

        if (applications.length == 0) {
            return Q.reject(new Error("No components found to package"));
        }
        
        // now we have the list of components
        
        for (var idx in applications) {
            var appInfo = applications[idx];

            getComponent(that.args, that.config, queue, appInfo, allUI5Libs, applications, componentManifestPromises, componentResourcePromises, targetWWWPath, allResources);
        }

        return Q.all(componentManifestPromises);
    }, function(e) {
        var rejected = Q.defer();
        rejected.reject(e);
        return rejected.promise;
    }).
    then(function() {
        // ==========
        // Phase 3: adjust files and get the UI5 libs
        // ==========

        if (that.args.verbose) console.log("INFO: All manifests for the components have been loaded");

        // we have our full list of libraries and apps now

        if (that.args.singleApp) {
            shell.sed("-i", /__FIORI_APP_ID__/g, singleAppInfo.id, path.join(targetWWWPath, "index.html"));
            shell.sed("-i", "__FIORI_APP_URL__", singleAppInfo.url, path.join(targetWWWPath, "index.html"));
        }

        // Adjust index.html to reflect OFFLINE config
        function setupForOffline(app) {
            shell.cp(path.join(packagerResourcesDir, "contentplace_scenario.js"), path.join(targetWWWPath, "js", "contentplace.js"));
            shell.sed("-i", /__SCENARIO_ID__/g, app.id, path.join(targetWWWPath, "js", "contentplace.js"));
            var url = app.url;
            if (url.charAt(0) == '/') {
                url = url.substring(1);
            }
            shell.sed("-i", /__SCENARIO_PATH__/g, url, path.join(targetWWWPath, "js", "contentplace.js"));
            shell.sed("-i", /__SCENARIO_INIT__/g, app.scenarioInit, path.join(targetWWWPath, "js", "contentplace.js"));
            var storesJs = "var stores = [";
            for (var idx in app.stores) {
                var store = app.stores[idx];
                // fixup serviceroot
                var fioriURL = that.config.fioriURL.replace(/\/*$/, "");
                store.serviceRoot = fioriURL + store.serviceRoot;
                if (idx > 0) {
                    storesJs += ",";
                }
                storesJs += JSON.stringify(store);
            }
            storesJs += "];";
            storesJs.to(path.join(targetWWWPath, "js", "stores.js"));
        }
        
        // Adjust index.html to reflect ONLINE config
        function setupForOnline() {
            shell.cp(path.join(packagerResourcesDir, "contentplace.js"), path.join(targetWWWPath, "js", "contentplace.js"));
            // remove the offline store logic
            shell.sed("-i", /.*js\/stores.js.*\n/, "", path.join(targetWWWPath, "index.html"));
            shell.sed("-i", /.*js\/createStores.js.*\n/, "", path.join(targetWWWPath, "index.html"));
        }
        
        if (that.config.scenario != -1) {
            var app = applications[that.config.scenario];
            if (!app.scenarioInit) {
                console.log("WARNING: Failed to find the scenario method definition in the manifest file");
                setupForOnline();
            } else {
                setupForOffline(app);
            }
        } else {
            setupForOnline();
        }

        // patch up the resource roots to add reuse/hidden components
        var resourceRoots = "{\"\":\"resources\"";
        for (var idx in applications) {
            var appDetail = applications[idx];
            if (!appDetail.reuse) {
                continue;
            }

            // don't include leading / in url
            resourceRoots += ",\"" + appDetail.id + "\":\"" + appDetail.url.substring(1) + "\"";
        }
        resourceRoots += "}";
        shell.sed("-i", "__RESOURCEROOTS__", resourceRoots, path.join(targetWWWPath, "index.html"));

        if (!that.args.singleApp) {
            // Create the application list

            var applicationsJs = "var applications = {};\n";
            for (var app in applications) {
                var appDetail = applications[app];
                if (!appDetail.root) continue;

                if (!appDetail.url) {
                    console.log("ERROR: Missing url for app '" + appDetail.id + "'");
                    deferred.reject(new Error("Missing url for app '" + appDetail.id + "'"));
                    return deferred.promise;
                }

                // don't include leading / in url
                applicationsJs += "applications[\"" + appDetail.intent + "\"] = {\n" +
                    "  additionalInformation: \"" + "SAPUI5.Component=" + appDetail.id + "\",\n" +
                    "  applicationType: \"URL\",\n" +
                    "  url: \"" + appDetail.url.substring(1) + "\"\n" +
                    "};" + "\n";
            }
            applicationsJs.to(path.join(targetWWWPath, "applications.js"));

            // Now create the Tile layouts

            var tilesJs = "var tiles = [];\n";
            var i = 0;
            for (var app in applications) {
                var appDetail = applications[app];
                if (!appDetail.root) continue;

                if (!appDetail.title) {
                    console.log("ERROR: Missing title for app '"+appDetail.id+"'");
                    deferred.reject(new Error("Missing title for app '" + appDetail.id + "'"));
                    return deferred.promise;
                }
                
                if (!appDetail.icon) {
                    console.log("ERROR: Missing icon for app '"+appDetail.id+"'");
                    deferred.reject(new Error("Missing icon for app '" + appDetail.id + "'"));
                    return deferred.promise;
                }
                
                tilesJs += "tiles[" + i + "] = {\n" +
                    "  id: \"tile_" + i + "\",\n" +
                    "  title: \"" + (appDetail.i18n ? (appDetail.id + ".title") : (appDetail.title)) + "\",\n" +
                    "  size: \"1x1\",\n" +
                    "  tileType: \"sap.ushell.ui.tile.StaticTile\",\n" +
                    "  properties: {\n" +
                    "    title: \"" + (appDetail.i18n ? (appDetail.id + ".title") : (appDetail.title)) + "\",\n" +
                    "    subtitle: \"\",\n" +
                    "    info: \"\",\n" +
                    "    icon: \"" + appDetail.icon + "\",\n" +
                    "    targetURL: \"#" + appDetail.intent + "\"\n" +
                    "  }\n" +
                    "};\n";
                i++;
            }
            tilesJs.to(path.join(targetWWWPath, "tiles.js"));
        }

        //
        // Copy SAP UI5 from the FES
        //
        var packagerConfigPath = path.join(__dirname, "..", "config", "config.json");
        var packagerConfigStr = fs.readFileSync(packagerConfigPath, {
            encoding: "utf8"
        });
        try {
            var packagerConfig = JSON.parse(packagerConfigStr);
        } catch (e) {
            console.log("ERROR: Failed to parse config file: " + e);
            deferred.reject(new Error("Failed to parse config file: " + e));
            return deferred.promise;
        }

        if (that.args.verbose) console.log("INFO: Get the SAP UI5 libraries from the front end server ...");

        for (var idx in allUI5Libs) {
            var lib = allUI5Libs[idx];

            if (that.args.verbose) console.log('INFO: Need to download SAP UI5 library [' + lib + ']');

            var libInfo = {
                url: "/sap/bc/ui5_ui5/ui2/ushell/resources/" + lib.replace(/\./g, '/'),
                localUrl: "resources/" + lib.replace(/\./g, '/'),
                componentId: lib
            }

            getLibrary(that.args, that.config, packagerConfig, queue, allUI5Libs, libManifestPromises, libResourcePromises, targetWWWPath, libInfo, "", allResources);
        }
        
        // wait for the UI5 manifests ...
        return Q.all(libManifestPromises);
    }, function(e) {
        var rejected = Q.defer();
        rejected.reject(e);
        return rejected.promise;
    }).
    then(function() {
        // ==========
        // Phase 4: we now have all the UI5 lib manifests
        // ==========

        // We've got all the UI5 manifest files
        if (that.args.verbose) console.log("INFO: All UI5 manifests loaded");

        // patch up the index.html with the correct libs list in the boot of SAP UI5
        var bootLibs = [];
        for (var i in allUI5Libs) {
            bootLibs.push(allUI5Libs[i]);
        }
        var libsStr = bootLibs.join();
        shell.sed("-i", "__LIBS__", libsStr, path.join(targetWWWPath, "index.html"));

        // now wait for various resource.json loads
        // first the component resource.jsons
        return  Q.all(componentResourcePromises).
            then(function() {
                // then the library resource.jsons
                return Q.all(libResourcePromises);
            }).
            then(function() {
                // then wait for the actual resources themselves ...
                return Q.all(allResources);
            });
    }, function(e) {
        var rejected = Q.defer();
        rejected.reject(e);
        return rejected.promise;
    }).
    then(function() {
        // ==========
        // Phase 5: we have all the resources for all aocmponents and libs: finish up
        // ==========

        // Now we have all the file fetches complete

        // create the message bundle that contains the tile names
        var messageBundle = "";
        try {
            for (var idx in applications) {
                var appDetail = applications[idx];
                if (appDetail.reuse) {
                    continue;
                }
                var appTitle = appDetail.title;
                var appI18n = appDetail.i18n;
                if (appI18n) {
                    if (appTitle.indexOf('{{') === 0) {
                        appTitle = appTitle.substring(2, appTitle.length - 2);

                        var i18nFile = fs.readFileSync(path.join(targetWWWPath, appDetail.url, appI18n), {encoding: 'utf8'});
                        var lines = i18nFile.split('\n');
                        for (var idx2 in lines) {
                            var line = lines[idx2];
                            if (line.indexOf(appTitle+'=') === 0) {
                                messageBundle += appDetail.id + ".title=" + line.split('=')[1] + '\n';
                            }
                        }
                    } else {
                        messageBundle += appDetail.id + ".title=" + appTitle + '\n';
                    }
                }
            }
        } catch (e) {
            console.log("WARNING: Unable to set the message properties for the Application labels in launchpad: " + e);
        }
        messageBundle.to(path.join(targetWWWPath, "messagebundle.properties"));

        //console.log(">>> hits:   " + queue.hits);
        //console.log(">>> misses: " + queue.misses);
        try {
            fs.writeFileSync(path.join(that.args.targetDir, "packagerStatus.json"), "{\"packagerStatus\": {\"status\": \"downloaded\"}}");
        } catch (e) {
            console.log("ERROR: writing packager status: " + e);
        }
        if (that.args.verbose) console.log("INFO: cli completed");

        deferred.resolve();
        return deferred.promise;
    }, function(e) {
        deferred.reject(e);
        return deferred.promise;
    });

    if (this.args.verbose) console.log("INFO: cli returned");

    return deferred.promise;
};

module.exports = Packager;
