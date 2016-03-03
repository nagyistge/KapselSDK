/**
 **  CLI for packager
 **/

var nopt = require('nopt'),
    noptUsage = require('nopt-usage'),
    noptDefaults = require('nopt-defaults'),
    path = require('path'),
    fs = require('fs'),
    https = require('https'),
    CloudBuild = require('./cloudBuild.js'),
    Packager = require('./packager.js'),
    Q = require("q");

/**
 ** Execute the user request
 **/
function cli(inputArgs) {

    var knownOpts = {
            "verbose": Boolean,
            "version": Boolean,
            "targetDir": String,
            "config": String,
            "username": String,
            "password": String,
            "host": String,
            "port": Number,
            "https": Boolean,
            "proxy": String,
            "cloudHost": String,
            "cloudUsername": String,
            "cloudPassword": String,
            "cloudProxy": String,
            "client": String,
            "force": Boolean,
            "maxReqs": Number,
            "help": Boolean,
            "debugSource": Boolean,
            "selfsigned": Boolean,
            "noCache": Boolean,
            "cleanCache": Boolean,
            "cleanAppCache": Boolean
        },
        shortHands = {
            "c": ["--client"],
            "d": ["--verbose"],
            "f": ["--config"],
            "F": ["--force"],
            "g": ["--debugSource"],
            "h": ["--help"],
            "H": ["--host"],
            "l": ["--cloudUsername"],
            "m": ["--cloudPassword"],
            "p": ["--password"],
            "P": ["--port"],
            "r": ["--maxReqs"],
            "S": ["--https"],
            "t": ["--targetDir"],
            "u": ["--username"],
            "v": ["--version"],
            "x": ["--proxy"],
            "X": ["--cloudProxy"],
            "k": ["--selfsigned"],
            "N": ["--noCache"],
            "C": ["--cleanCache"],
            "A": ["--cleanAppCache"]
        },
        description = {
            "verbose": "Verbose output",
            "version": "Version of Packager",
            "targetDir": "Target directory",
            "config": "Config File",
            "force": "Force Overwrite of existing target",
            "username": "Front End Server username",
            "password": "Front End Server password",
            "host": "Front End Server hostname",
            "port": "Front End Server port",
            "https": "Front End Server uses https or not",
            "proxy": "Proxy for FES access",
            "cloudHost": "Cloud Server hostname",
            "cloudUsername": "Cloud Server username",
            "cloudPassword": "Cloud Server password",
            "cloudProxy": "Proxy for Cloud access",
            "client": "SAP Client",
            "maxReqs": "Maximum number of parallel requests",
            "help": "Display help",
            "selfsigned": "Handle FES/Cloud servers with self signed certificates",
            "debugSource": "Include Debug Source",
            "noCache": "Do not Cache Assets",
            "cleanCache": "Clean all of Asset Cache",
            "cleanAppCache": "Clean App Section of Asset Cache"
        },
        defaults = {
            "verbose": false,
            "version": "",
            "targetDir": "",
            "cloudHost": "portal.sapmobilesecure.com",
            "force": false,
            "maxReqs": 20,
            "help": false,
            "debugSource": false,
            "selfsigned": false,
            "noCache": false,
            "cleanCache": false,
            "cleanAppCache": false
        };

    inputArgs = inputArgs || process.argv;

    var noptConfig = nopt(knownOpts, shortHands, inputArgs, 2);

    var remain = noptConfig.argv.remain;

    var args = noptDefaults(noptConfig, defaults);

    if (args.help) {
        var usage = noptUsage(knownOpts, shortHands, description, defaults);
        console.log("Usage: packager [options...] [command]\n");
        console.log(usage);
        console.log("\nwhere <command> is optional and can be one of:");
        console.log("\tdownloadfromfes [default]");
        console.log("\tcreatepackage");
        console.log("\tuploadpackage");
        console.log("\tstartbuild");
        console.log("\tstatus");
        console.log("\tinfo");
        console.log("\tsigningids");
        console.log("\tdownloadapp");
        console.log("\tdoall");
        console.log("\nCommand Info:\n");
        console.log("downloadfromfes  Download the web assets from the Front End Server.\n");
        console.log("                 Notes:");
        console.log("                   The packager will use the configuration stored in the specified appConfig.js");
        console.log("                   to determine what application content to download from the Front End Server.");
        console.log("                   Content will be cached (keyed on the Front End Server) so that the next time");
        console.log("                   the packager is executed against the same Front End Server, already downloaded");
        console.log("                   content will be extracted from the cache, reducing network traffic. See the various");
        console.log("                   options (below) to control the way the cache is cleaned or bypassed.\n");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets will be downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                   --host:      specifies the Front End Server host");
        console.log("                   --port:      specifies the Front End Server port");
        console.log("                   --https:     if present, indicates that HTTPS is used to access the");
        console.log("                                Front End Server");
        console.log("                 Optional:");
        console.log("                   --username:      username to use when connecting to Front End Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --password:      password to use when connecting to Front End Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --client:        used to indicate a non-default SAP client should");
        console.log("                                    be used for runtime access to the front end server.");
        console.log("                   --force:         used to force overwrite of target directory contents if");
        console.log("                                    if the directory already exists");
        console.log("                   --proxy:         used to access Front End Server behind a proxy.");
        console.log("                   --maxReqs:       Maximum number of parallel HTTP(S) requests that can be");
        console.log("                                    executed at any one time. Defaults to 20. Use this property");
        console.log("                                    to reduce the load on the Front End Server if required.");
        console.log("                   --selfSigned:    Use this option to connect to a Front End Server using self-");
        console.log("                                    signed certificates. ONLY use if the connection can be");
        console.log("                                    trusted.");
        console.log("                   --noCache:       Do not use any locally cached files, but always extract content");
        console.log("                                    directly from Front End Server.  The cache is untouched and can");
        console.log("                                    be used in subsequent commands if required.");
        console.log("                   --cleanCache:    Erase the locally cached files completely (application and SAP");
        console.log("                                    UI5 library), forcing all content to be obtained directly from");
        console.log("                                    Front End Server. The cache is re-filled after executing the command.");
        console.log("                   --cleanAppCache: Erase the locally cached application files completely, forcing all");
        console.log("                                    application content to be obtained directly from Front End Server.");
        console.log("                                    The application cache is re-filled after executing the command. SAP");
        console.log("                                    UI5 library content is not affected, and will be loaded from the cache");
        console.log("                                    if present.");
        console.log("                   --debugSource:   Include debug versions of web assets when downloading from Front End");
        console.log("                                    Server");
        console.log("                 Example:");
        console.log("");
        console.log("                   The following command downloads web assets from https://myfes.company.com:8083, placing");
        console.log("                   content in the local folder 'myapp', overriding any existing content. Configuration is");
        console.log("                   supplied in the file 'appConfig.js', located in the local directory. The user 'myuser' will");
        console.log("                   be used to authenticate against the Front End Server. The password will be prompted for");
        console.log("                   interactively. Line breaks are for illustration only and should not be inserted in the");
        console.log("                   actual command entered.\n");
        console.log("   node <path-to-SDK>/apps/packager/bin/packager --targetDir myapp --config appConfig.js --host myfes.company.com");
        console.log("        --port 8083 --https --username myuser --force");
        console.log("");
        console.log("createpackage    Creates a 'package' on the Cloud Build Server.\n");
        console.log("                 Notes:");
        console.log("                   The package that is created is used to upload the web assets into. These");
        console.log("                   assets are downloaded using 'downloadfromfes'. Once the package is");
        console.log("                   created, you can upload the web assets there for the final build. Unless");
        console.log("                   overridden, the Cloud Build Server is at portal.sapmobilesecure.com. All");
        console.log("                   network traffic will use HTTPS and port 443, regardless as to whether an");
        console.log("                   alternative Cloud Build Server is used or not.\n");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("                 Example:");
        console.log("");
        console.log("                   The following command creates a package on the default Cloud Build Server. Cloud Build");
        console.log("                   Server credntials (user and password) will be prompted for. A proxy at 'proxy:8080'");
        console.log("                   will be used to connect to the Cloud Build Server. Line breaks are for illustration");
        console.log("                   only and should not be inserted in the actual command entered.\n");
        console.log("   node <path-to-SDK>/apps/packager/bin/packager --targetDir myapp --config appConfig.js");
        console.log("        --cloudProxy proxy:8080 createpackage");
        console.log("");
        console.log("uploadpackage    Uploads the web assets into the 'package' container on the Cloud Build Server.\n");
        console.log("                 Notes:");
        console.log("                   Web assets must have been downloaded already, and a package created on the Cloud");
        console.log("                   Build Server using the 'createpackage' command prior to this command.\n");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("                 Example:");
        console.log("");
        console.log("                   The following command uploads web assets the a target package on the default Cloud");
        console.log("                   Build Server. Username 'C000YXXX28P076542229' will be used, and the password will be");
        console.log("                   prompted for. A proxy at 'proxy:8080' will be used to connect to the Cloud Build");
        console.log("                   Server. Line breaks are for illustration only and should not be inserted in the");
        console.log("                   actual command entered.\n");
        console.log("   node <path-to-SDK>/apps/packager/bin/packager --targetDir myapp --config appConfig.js");
        console.log("        --cloudUsername C000YXXX28P076542229 --cloudProxy proxy:8080 uploadpackage");
        console.log("");
        console.log("startbuild       Starts a build on the Cloud Build Server.\n");
        console.log("                 Notes:");
        console.log("                   Web assets must have already been uploaded using the command 'uploadpackage'.");
        console.log("                   This command will start a Cordova-based build on the cloud server, and sign");
        console.log("                   the final binaries using the signing profiles specified in the appConfig.js");
        console.log("                   file. Once the build is finished, an email will be sent for each target platform");
        console.log("                   indicating success or failure. Once a binary is sucecssfully built, use 'downloadapp'");
        console.log("                   to download the applicayion binary, or use the Mobile Secure Admin UI to perform");
        console.log("                   addtional administrative operations on the binaries.\n");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("                 Example:");
        console.log("");
        console.log("                   The following command starts a build on the default Cloud Build Server.");
        console.log("                   Username 'C000YXXX28P076542229' will be used, and the password will be prompted");
        console.log("                   for. A proxy at 'proxy:8080' will be used to connect to the Cloud Build Server.");
        console.log("                   Line breaks are for illustration only and should not be inserted in the actual");
        console.log("                   command entered.\n");
        console.log("   node <path-to-SDK>/apps/packager/bin/packager --targetDir myapp --config appConfig.js");
        console.log("        --cloudUsername C000YXXX28P076542229 --cloudProxy proxy:8080 startbuild");
        console.log("");
        console.log("status           Checks status of a build.\n");
        console.log("                 Notes:");
        console.log("                   Returns current build status (for each target platform).  A build must have already");
        console.log("                   been initiated using 'startbuild'.");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("");
        console.log("info             Returns information about the status of the 'package'.\n");
        console.log("                 Notes: Use this command to check the overall status of the package created using");
        console.log("                   'createpackage' command.");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("");
        console.log("signingids       Returns all the signingids available to the user.\n");
        console.log("                 Notes: Use this command to obtain a list of the available signing IDs on the Cloud");
        console.log("                   Build Server.  These IDs can be used in appConfig.js to specifiy the signing");
        console.log("                   to use for eachtarget platform.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("");
        console.log("downloadapp      When a cloud build is successful, download the associated binaries.\n");
        console.log("                 Notes: Use this command to download the built binaries.\n");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                 Optional:");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("                 Example:");
        console.log("");
        console.log("                   The following command downloads all binaries built on the default Cloud Build");
        console.log("                   Server. Username and password will be prompted for. A proxy at 'proxy:8080'");
        console.log("                   will be used to connect to the Cloud Build Server. Line breaks are for");
        console.log("                   illustration only and should not be inserted in the actual command entered.\n");
        console.log("   node <path-to-SDK>/apps/packager/bin/packager --targetDir myapp --config appConfig.js");
        console.log("        --cloudProxy proxy:8080 downloadapp");
        console.log("");
        console.log("doall            Combines 'downloadfromfes', 'createpackage', 'uploadpackage' and 'startbuild'.\n");
        console.log("                 Notes: Use this command to combine various commands. This command will sequentially");
        console.log("                   download the web assets, create a target package on Cloud Build Sevrre, upload the");
        console.log("                   assets, and start a build.");
        console.log("                 Required:");
        console.log("                   --targetDir: directory where web assets have been downloaded.");
        console.log("                   --config:    path to appConfig.js file contents that control what");
        console.log("                                applications to package and what runtime qualities will");
        console.log("                                be used. See the example appConfig.js included in the");
        console.log("                                SDK for more details.");
        console.log("                   --host:      specifies the Front End Server host");
        console.log("                   --port:      specifies the Front End Server port");
        console.log("                   --https:     if present, indicates that HTTPS is used to access the");
        console.log("                                Front End Server");
        console.log("                 Optional:");
        console.log("                   --username:      username to use when connecting to Front End Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --password:      password to use when connecting to Front End Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudUsername: username to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --cloudPassword: password to use when connecting to Cloud Build Server. If");
        console.log("                                    not specified, the user will be promted for the details.");
        console.log("                   --client:        used to indicate a non-default SAP client should");
        console.log("                                    be used for runtime access to the front end server.");
        console.log("                   --force:         used to force overwrite of target directory contents if");
        console.log("                                    if the directory already exists");
        console.log("                   --maxReqs:       Maximum number of parallel HTTP(S) requests that can be");
        console.log("                                    executed at any one time. Defaults to 20. Use this property");
        console.log("                                    to reduce the load on the Front End Server if required.");
        console.log("                   --selfSigned:    Use this option to connect to a Front End Server using self-");
        console.log("                                    signed certificates. ONLY use if the connection can be");
        console.log("                                    trusted.");
        console.log("                   --noCache:       Do not use any locally cached files, but always extract content");
        console.log("                                    directly from Front End Server.  The cache is untouched and can");
        console.log("                                    be used in subsequent commands if required.");
        console.log("                   --cleanCache:    Erase the locally cached files completely (application and SAP");
        console.log("                                    UI5 library), forcing all content to be obtained directly from");
        console.log("                                    Front End Server. The cache is re-filled after executing the command.");
        console.log("                   --cleanAppCache: Erase the locally cached application files completely, forcing all");
        console.log("                                    application content to be obtained directly from Front End Server.");
        console.log("                                    The application cache is re-filled after executing the command. SAP");
        console.log("                                    UI5 library content is not affected, and will be loaded from the cache");
        console.log("                                    if present.");
        console.log("                   --proxy:         used to access Front End Server behind a proxy.");
        console.log("                   --cloudProxy:    used to access the Cloud Build Server behind a proxy.");
        console.log("                   --cloudHost:     Hostname to use instead of portal.sapmobilesecure.com.");
        console.log("                   --debugSource:   Include debug versions of web assets when downloading from Front End");
        console.log("                                    Server");
        return;
    }

    if (args.version) {
        console.log("Version: " + require('../package').version);
        return;
    }

	//if the command is only for signingid, then no need to provide targetDir and config parameter
    if (!(remain.length == 1 && remain[0].toLowerCase() == "signingids") && !args.targetDir) {
        console.log("ERROR: Target directory not specified!");
        var usage = noptUsage(knownOpts, shortHands, description, defaults);
        console.log("Usage:\n" + usage);
        return;
    }

    //console.log("__dirname is '" + __dirname + "'");
    var configStr;
    var config = {};
    if (!(remain.length == 1 && remain[0].toLowerCase() == "signingids")) {

		try {
			configStr = fs.readFileSync(args.config, {
				encoding: "utf-8"
			});

			config = eval(configStr);
		} catch (e) {
			console.log("ERROR: Failed to read from config file: " + e);
			return;
		}
    }

    //appConfig.js should only include SMP server connection info, and applications info.
    //Currently it also includes libraries and resources elements as Front End Server API
    //does not provide the information in all cases.
    //TODO: remove library and resources element once Front End Server APIs are finalized.

    if (!config.frontEndServer) {
        config.frontEndServer = {};
    }
    if (args.host) config.frontEndServer.host = args.host;
    if (args.port) config.frontEndServer.port = args.port;
    if (typeof args.https !== "undefined") config.frontEndServer.https = args.https;
    if (args.proxy) {
        var proxyComponents = args.proxy.split(':');
        config.frontEndServer.proxyHost = proxyComponents[0];
        config.frontEndServer.proxyPort = proxyComponents.length > 0 ? proxyComponents[1] : 8080;
    }
    if (args.client) {
        config.frontEndServer.sapClient = args.client;
    }

    if (!config.cloudBuild) {
        config.cloudBuild = {};
    }
    config.cloudBuild.host = args.cloudHost; //"portal.volga.sapmobilesecure.com";
    config.cloudBuild.port = 443;
    config.cloudBuild.https = true;
    if (args.cloudProxy) {
        var proxyComponents = args.cloudProxy.split(':');
        config.cloudBuild.proxyHost = proxyComponents[0];
        config.cloudBuild.proxyPort = proxyComponents.length > 0 ? proxyComponents[1] : 8080;
    }

    if (args.selfsigned) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    doCLI(args, config, remain);
}

function die(command, e) {
    console.log("==== " + command + " ERROR: " + e.message + " ====");
    process.exit(1);
}

function success(command) {
    console.log("==== " + command + " OK ====");
    process.exit(0);
}

function doCLI(args, config, commands) {
    var packager = new Packager(args, config);
    var cb = new CloudBuild(args, config);

    var deferred = Q.defer();
    deferred.resolve();

    if (!commands || commands.length == 0) {
        commands = ['downloadfromfes'];
    }

    for (var idx in commands) {
        var command = commands[idx].toLowerCase();
        cb.command = command;
        
        console.log("Command: " + command);

        if (command == "doall") {
            deferred.promise.
                then(packager.setup.bind(packager)).
                then(cb.setup.bind(cb)).
                then(packager.createPackage.bind(packager)).
                then(cb.createCordovaPackage.bind(cb)).
                then(cb.uploadPackage.bind(cb)).
                then(cb.startBuild.bind(cb)).
                then(cb.getBuildStatus.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "downloadfromfes") {
            deferred.promise.
                then(packager.setup.bind(packager)).
                then(packager.createPackage.bind(packager)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "createpackage") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.createCordovaPackage.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "uploadpackage") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.uploadPackage.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "startbuild") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.startBuild.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "status") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.getBuildStatus.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "info") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.getPackageInfo.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "signingids") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.getSigningIDs.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else if (command == "downloadapp") {
            deferred.promise.
                then(cb.setup.bind(cb)).
                then(cb.downloadApp.bind(cb)).
                done(success.bind(null, command), die.bind(null, command));
        } else {
            console.log("Unknown command: " + command);
            console.log("Commands are:\n");
            console.log("downloadfromfes");
            console.log("createpackage");
            console.log("uploadpackage");
            console.log("startbuild");
            console.log("status");
            console.log("info");
            console.log("signingids");
            console.log("downloadapp");
            console.log("doall");
        }
    }
}

process.on('uncaughtException', function(err) {
    console.error('ERROR exits with uncaughtException:', err.message)
    console.error(err.stack)
    process.exit(1)
});

// do app specific cleaning before exiting
process.on('exit', function() {
    process.emit('cli process exit');
});

module.exports = cli;
