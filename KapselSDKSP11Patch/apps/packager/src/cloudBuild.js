/**
 ** CLI for Cloud Build
 **/

var shell = require('shelljs'),
    path = require('path'),
    fs = require('fs'),
    RequestQueue = require('./requestQueue.js'),
    Q = require("q"),
    archiver = require('archiver'),
    prompt = require('prompt'),
    SplitterWriteStream = require('./splitterWriteStream'),
    UploadPackageWriteStream = require('./uploadPackageWriteStream');

/**
 ** Create resource in local file system
 **/
function createResource(args, fullPath, content, binary) {
    if (args.verbose) {
        console.log("INFO: createResource: " + fullPath);
    }

    var index = fullPath.lastIndexOf(path.sep);
    if (index >= 0) {
        var prePath = fullPath.substring(0, index);
        shell.mkdir("-p", prePath);
    }

    if (binary) {
        content = Buffer.concat(content);
        fs.writeFileSync(fullPath, content);
    } else {
        content.to(fullPath);
    }
}

function createQueue(config, args) {
    var options = {
	hostname: config.cloudBuild.host,
	port: config.cloudBuild.port,
	auth: config.cloudBuild.username + ":" + config.cloudBuild.password,
	https: true,
	rejectUnauthorized: false,
	maxReqs: args.maxReqs
    }

    if (config.cloudBuild.proxyHost) {
	options.proxyHost = config.cloudBuild.proxyHost;
	options.proxyPort = config.cloudBuild.proxyPort;
    }

    return new RequestQueue(options, args);
}

function getCloudBuildId(targetDir) {
    try {
	var statusStr = fs.readFileSync(path.join(targetDir, "packagerStatus.json"), {encoding: "utf8"});
	var status = JSON.parse(statusStr);
        if (!status.cloudBuild) {
            return new Error("There is no cloud build package. Have you created a cloud package yet?");
        }
	return status.cloudBuild.buildId;
    } catch (e) {
	return new Error("Unable to get build Id: " + e);
    }
}

function getPackagerStatus(targetDir) {
    try {
	var statusStr = fs.readFileSync(path.join(targetDir, "packagerStatus.json"), {encoding: "utf8"});
	var status = JSON.parse(statusStr);
	var packagerStatus = status.packagerStatus.status;
	if (packagerStatus != "downloaded") {
	    return new Error("Package is not downloaded from Front End Server");
	}
        return packagerStatus;
    } catch (e) {
	return new Error("Error reading packager status: " + e);
    }
}

function CloudBuild(args, config) {
    this.queue = null;
    this.config = config;
    this.args = args;
    this.headers = null;
    this.buildId = null;
}

/**
 ** Setup for the Cloud Build Steps
 **
 **/
CloudBuild.prototype.setup = function () {
    var that = this;
    var deferred = Q.defer();

    if (!this.config.cloudBuild.host ||
        !this.config.cloudBuild.port ||
        (typeof this.config.cloudBuild.https === "undefined")) {
	return Q.reject(new Error("Must fully define cloud server connection details!"));
    }

    if (this.command != "signingids"){
        var packagerStatus = getPackagerStatus(this.args.targetDir);
        if (packagerStatus instanceof Error) {
	        return Q.reject(packagerStatus);
        }
    }

    //allow user to input credential from command line 
    var needPromptForUsername = false;
    if (this.args.cloudUsername) {
    	this.config.cloudBuild.username = this.args.cloudUsername;
    } else {
    	needPromptForUsername = true;
    }
    
    var needPromptForPassword = false;
    if (this.args.cloudPassword) {
    	this.config.cloudBuild.password = this.args.cloudPassword;
    } else {
    	needPromptForPassword = true;
    }
    
    if (needPromptForUsername || needPromptForPassword) {
        prompt.message = "Input Cloud Build's ";
        prompt.delimiter ='';
        prompt.start();
        var promptNames = [];
        if (needPromptForUsername) {
            promptNames.push({
        	name:'username',
        	required: true,
        	message: 'username'
	    });
        }
        
        if (needPromptForPassword) {
            promptNames.push({
        	name:'password',
        	hidden: true,
        	required: true,
        	message: 'password:'
	    });
        }
        
    	prompt.get(promptNames, function(err, result) {
    	    if (needPromptForUsername) {
    		that.config.cloudBuild.username = result.username;
    	    }
    		
    	    if (needPromptForPassword) {
    		that.config.cloudBuild.password = result.password;
    	    }

	    that.queue = createQueue(that.config, that.args);
	    deferred.resolve();
    	});
    } else {
	this.queue = createQueue(this.config, this.args);
	deferred.resolve();
    }

    return deferred.promise;
}

/**
 ** Get a CSRF token and the necessary cookies
 **
 **/
CloudBuild.prototype.getCSRFToken = function() {
    var that = this;

    var deferred = Q.defer();

    if (this.headers) {
	deferred.resolve();
	return deferred.promise;
    }
    
    var item = {
	path: "/product-api.svc/ApplicationBuildPackages"
    };

    this.queue.add(item).then(function (deferred, o) {
	    if (that.args.verbose) console.log('INFO: getCSRFToken: Response: ' + o.statusCode);
	    if (o.statusCode == 200) {
		var newHeaders = {};
		for (var header in o.headers) {
		    if (header == 'set-cookie') {
			var cookies = null;
			var val = o.headers[header];
			for (var i in val) {
			    var cookie = val[i].split(';')[0];
			    cookies = cookies ? cookies + "; " + cookie : cookie;
			}
			newHeaders["Cookie"] = cookies;
		    } else if (header == 'x-sms-csrftoken') {
			newHeaders["X-SMS-CSRFToken"] = o.headers[header];
		    }
		}

		that.headers = newHeaders;

		deferred.resolve();
	    } else {
		deferred.reject(new Error("Unexpected response from getCSRFToken call: " + o.statusCode));
	    }
    }.bind(null, deferred), function (deferred, rejectReason) {
        deferred.reject(rejectReason);
    }.bind(null, deferred));

    return deferred.promise;
}

/**
 ** Get the build status of a particular cloud package
 **
 **/
CloudBuild.prototype.getBuildStatus = function() {
    var that = this;

    if (!this.buildId) {
        var buildId = getCloudBuildId(this.args.targetDir);
        if (buildId instanceof Error) {
            return Q.reject(buildId);
        }
	this.buildId = buildId;
    }

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
  	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(function () {
	    var headers = that.headers;

	    headers["accept"] = "application/json";

	    var item = {
		path: "/product-api.svc/ApplicationBuildPackages('"+that.buildId+"')/buildStatus",
		headers: headers
	    };
    
	    return that.queue.add(item);
	}, Q.reject.bind(null)).
	then(function (o) {
	    if (that.args.verbose) console.log('INFO: getBuildStatus: Response: ' + o.statusCode+'\n'+o.response);
	    if (o.statusCode == 200) {
		//{"Status":"OK","status":1,"Platforms":[{"Platform":"ANDROID","Status":"Success","ApplicationID":"5688d2094e24833c8d825a41e5a32dfb"},{"Platform":"IOS","Status":"Success","ApplicationID":"f7947a952100be8c271085c1f455c348"}]}
		var response = JSON.parse(o.response);
		var status = response.Status;

		if (status == "OK") {
		    that.buildInfo = {};
		    that.buildInfo.Platforms = response.Platforms; 

                    if (Array.isArray(response.Platforms)) {
                        // legacy response ...
		        for (var idx in response.Platforms) {
			    console.log("INFO: " + response.Platforms[idx].Platform + ": " + response.Platforms[idx].Status);
		        }
                    } else {
                        for (var platform in response.Platforms) {
			    console.log("INFO: " + platform + ": " + response.Platforms[platform].Status);                            
                        }
                    }
		    return deferred.promise;
		} else {
		    return Q.reject(new Error("Unexpected status from getBuildStatus call: " + status));
		}
	    } else {
		return Q.reject(new Error("Unexpected HTTP response from getBuildStatus call: " + o.statusCode));
	    }
	}, Q.reject.bind(null));
}

/**
 ** Get the build status of a particular cloud package
 **
 **/
CloudBuild.prototype.getSigningIDs = function() {
    var that = this;
    
    function submitGet(skip) {
	var headers = that.headers;

	headers["accept"] = "application/json";

	var item = {
	    path: "/product-api.svc/ApplicationSigningProfiles?$inlinecount=allpages&$top=10&$skip=" + skip,
	    headers: headers,
	    skip: skip
	};
    
	return this.queue.add(item);
    }

    function handleResponse(o) {
	if (this.args.verbose) console.log('INFO: getSigningIDs: Response: ' + o.statusCode +'\n' +o.response);
	if (o.statusCode == 200) {
	    var response = JSON.parse(o.response);

	    var results = response.d.results;

	    for (var idx in results) {
		console.log("INFO: Profile ID: " + results[idx].SigningProfileID);
		console.log("INFO: Name: " + results[idx].Name);
		console.log("INFO: Category: " + results[idx].PlatFormCategoryName);
		console.log("INFO: Certificate Name: " + results[idx].CertificateName);
		console.log("INFO: iOS Provisioning Faile Name: " + results[idx].IOSProvisioningFileName);
		console.log("INFO: -------------------------------");
	    }

	    var count = response.d.__count;
	    var skip = o.item.skip;
	    if (skip + 10 < count) {
		return submitGet.call(this, skip + 10).then(handleResponse.bind(this), Q.reject.bind(null));
	    } else {
		console.log("INFO: Total of " + count + " profiles retrieved");
	    }

	    return deferred.promise;
	} else {
	    return Q.reject(new Error("Unexpected HTTP response from getSigningIDs call: " + o.statusCode));
	}
    }
    
    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(submitGet.bind(this, 0), Q.reject.bind(null)).
	then(handleResponse.bind(this), Q.reject.bind(null));
}

/**
 ** Get the info for a cloud package
 **
 **/
CloudBuild.prototype.getPackageInfo = function() {
    var that = this;

    if (!this.buildId) {
        var buildId = getCloudBuildId(this.args.targetDir);
        if (buildId instanceof Error) {
            return Q.reject(buildId);
        }
	this.buildId = buildId;
    }

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(function () {
	    var headers = that.headers;

	    headers["accept"] = "application/json";

	    var item = {
		path: "/product-api.svc/ApplicationBuildPackages('"+that.buildId+"')",
		headers: headers
	    };
    
	    return that.queue.add(item);
	}, Q.reject.bind(null)).
	then(function (o) {
	    if (that.args.verbose) console.log('INFO: getPackageInfo: Response: ' + o.statusCode+'\n'+o.response);
	    if (o.statusCode == 200) {
		var response = JSON.parse(o.response);

		console.log("INFO: Build Package ID: " + response.d.BuildPackageID);
		console.log("INFO: Build Package Type: " + response.d.BuildPackageType);
		return deferred.promise;
	    } else {
		return Q.reject(new Error("Unexpected HTTP response from getPackageInfo call: " + o.statusCode));
	    }
	}, Q.reject.bind(null));
}

/**
 ** Create a cloud package
 **
 **/
CloudBuild.prototype.createCordovaPackage = function () {
    var that = this;

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(function () {
	    var headers = that.headers;

	    headers["content-type"] = "application/json";
	    headers["accept"] = "application/json";
    
	    var item = {
		path: "/product-api.svc/ApplicationBuildPackages/createCordovaPackage",
		method: "POST",
		body: "{\"ApplicationName\": \""+ that.config.appName +"\", \"CreateMethod\": \"File\"}",
		headers: headers
	    };
	
	    return that.queue.add(item);
	}, Q.reject.bind(null)).
	then(function (o) {
	    if (that.args.verbose) console.log('INFO: createCordovaPackage: Response: ' + o.statusCode + '\n' + o.response);
	    if (o.statusCode == 200) {
		// extract package id
		var response = JSON.parse(o.response);
		var status = response.Status;
		if (status == "OK") {
		    var buildId = response.BuildPackageID;

		    that.buildId = buildId;
		    that.headers = o.headers;

		    // save in JSON file in directory
		    fs.writeFileSync(path.join(that.args.targetDir, "packagerStatus.json"), "{\"packagerStatus\": {\"status\": \"downloaded\"}, \"cloudBuild\": {\"buildId\": \""+buildId+"\"}}");

		    console.log("INFO: Successfully created a Cordova Package on Build Server with ID: " + buildId);
		    return deferred.promise;
		} else {
		    return Q.reject(new Error("Unexpected status from createCordovaPackage: " + status));
		}
	    } else {
		return Q.reject(new Error("Unexpected HTTP response from createCordovaPackage: " + o.statusCode));
	    }
	}, Q.reject.bind(null));
}

/**
 ** Upload resources to the Cloud API
 **
 **/
CloudBuild.prototype.uploadPackage = function() {
    var that = this;
    
    if (!this.buildId) {
        var buildId = getCloudBuildId(this.args.targetDir);
        if (buildId instanceof Error) {
            return Q.reject(buildId);
        }
	this.buildId = buildId;
    }

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(function () {
	    var archive = archiver("zip");

	    var deferred = Q.defer();
    
	    var cloudStream = new UploadPackageWriteStream(that.queue, that.buildId, that.headers);
	    var splitterStream = new SplitterWriteStream({
		size: 5000000,
		stream: cloudStream
	    });

	    splitterStream.on('error', function (e) {
		deferred.reject(e);
	    });
    
	    splitterStream.on('close', function () {
		deferred.resolve();
	    });
    
	    archive.on("error", function (e) {
		deferred.reject(e)
	    });
    
	    archive.pipe(splitterStream);
	    archive.append(null, { name:'www/' });
	    archive.directory(path.join(that.args.targetDir, "www"), "www");
	    archive.append(null, { name:'res/' });
	    archive.directory(path.join(that.args.targetDir, "res"), "res");
	    archive.file(path.join(that.args.targetDir, "config.xml"), { "name": "config.xml" });
	    archive.finalize();
	
	    return deferred.promise;
	}, Q.reject.bind(null));
}

/**
 ** Initiate a cloud build
 **
 **/
CloudBuild.prototype.startBuild = function() {
    var that = this;
    
    if (!this.buildId) {
        var buildId = getCloudBuildId(this.args.targetDir);
        if (buildId instanceof Error) {
            return Q.reject(buildId);
        }
	this.buildId = buildId;
    }

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(function () {	
	    var headers = that.headers;

	    headers["content-type"] = "application/json";
	    headers["accept"] = "application/json";

	    var body = "{\"SigningProfiles\": [";

	    if (that.config.androidSigningID) {
		body += "{\"Platform\": \"ANDROID\", \"SigningProfileID\": \""+that.config.androidSigningID+"\"}";
	    }
	    if (that.config.iosSigningID) {
		if (that.config.androidSigningID) {
		    body += ", ";
		}
		body += "{\"Platform\": \"IOS\", \"SigningProfileID\": \""+that.config.iosSigningID+"\"}";
	    }
	    
	    body += "]}";
	    
	    var item = {
		path: "/product-api.svc/ApplicationBuildPackages('"+that.buildId+"')/startBuild",
		method: "POST",
		body: body,
		headers: headers
	    };

	    return that.queue.add(item);
	}, Q.reject.bind(null)).
	then(function (o) {
	    // build started ...
	    if (that.args.verbose) console.log('INFO: startBuild: Response: ' + o.statusCode + '\n' + o.response);
	    if (o.statusCode == 200) {
		var response = JSON.parse(o.response);
		var status = response.Status;
		if (status == "OK") {
		    console.log("INFO: Build started successfully");
		    return deferred.promise;
		} else {
		    return Q.reject(new Error("Start build status not OK: " + status));
		}
	    } else {
		// unexpected response code from start build
		return Q.reject(new Error("Unexpected HTTP response from startBuild: " + o.statusCode));
	    }
	}, Q.reject.bind(null));
}

/**
 ** Download the final app
 **
 **/
CloudBuild.prototype.downloadApp = function() {
    var that = this;

    if (!this.buildId) {
        var buildId = getCloudBuildId(this.args.targetDir);
        if (buildId instanceof Error) {
            return Q.reject(buildId);
        }
	this.buildId = buildId;
    }

    var deferred = Q.defer();
    deferred.resolve();
    return deferred.promise.
	then(this.getCSRFToken.bind(this), Q.reject.bind(null)).
	then(this.getBuildStatus.bind(this), Q.reject.bind(null)).
	then(function () {
	    var appPromises = [];
	    for (var idx in that.buildInfo.Platforms) {

                var platform = that.buildInfo.Platforms[idx];
                var platformName;
                if (Array.isArray(that.buildInfo.Platforms)) {
                    platformName = platform.Platform;
                } else {
                    platformName = idx;
                }
		var status = platform.Status;
		if (status != "Success") {
		    var deferred = Q.defer();
		    deferred.reject(new Error("Application for platform " + platformName + " cannot be downloaded as it is in status " + status));
		    appPromises.push(deferred.promise);
		    continue;
		}
		
		var appId = platform.ApplicationID;

		var headers = that.headers;

		headers["accept"] = "application/octet-stream";
    
		var item = {
		    targetPath: path.join(that.args.targetDir, "build", platformName),
		    path: "/product-api.svc/Applications('"+appId+"')/$value",
		    method: "GET",
                    platform: platformName,
		    headers: headers,
		    deferred: deferred
		};

		appPromises.push(that.queue.add(item));
	    }
            
	    return Q.allSettled(appPromises);
	}, Q.reject.bind(null)).
	then(function (results) {
	    //
            var allOK = true;
            var failure = "";
	    var deferred = Q.defer();
	    for (var idx in results) {
                var snapshot = results[idx];
                if (snapshot.state == 'fulfilled') {
		    var o = snapshot.value;
		    if (o.statusCode == 200) {
		        var contentDisposition = o.headers["content-disposition"].split(";")[1];
		        var fileName = contentDisposition.split('=')[1].replace(/^"|"$/g, '');
		        console.log("INFO: Downloaded binary for "+o.item.platform+" to " + o.item.targetPath);
		        createResource(that.args, path.join(o.item.targetPath, fileName), o.response, true);
		    } else {
		        // unexpected response code from start build
                        if (!allOK) {
                            failure += "\n";
                        }
                        failure += "Unexpected response from downloadApp: " + o.statusCode;
		        allOK = false;
		    }
                } else { // rejected
                    if (!allOK) {
                        failure += "\n";
                    }
                    failure += "" + snapshot.reason;
                    allOK = false;
                }
	    }
            if (allOK) {
                // everything came down OK
	        deferred.resolve();
            } else {
                // we had some problem ...
                deferred.reject(new Error(failure));
            }
	    return deferred.promise;
	}, Q.reject.bind(null));
}

module.exports = CloudBuild;
