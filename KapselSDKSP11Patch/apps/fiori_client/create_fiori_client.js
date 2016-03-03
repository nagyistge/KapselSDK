#!/usr/bin/env node

var fs = require('fs'),
    path = require('path'),
    shell = require('shelljs');

var opts = process.argv.slice(2),
    config = readConfig(opts[0]),
    targetFolder = path.resolve(config.targetFolder),
    searchPath = path.normalize(path.join(shell.pwd(), '..', '..', 'plugins')),
    commonPlugins = [
        'kapsel-plugin-logon',
        'kapsel-plugin-logger',
        'kapsel-plugin-apppreferences',
        'kapsel-plugin-settings',
        'kapsel-plugin-authproxy',
        'kapsel-plugin-online',
        'kapsel-plugin-toolbar',
        'kapsel-plugin-cachemanager',
        'kapsel-plugin-encryptedstorage',
        'kapsel-plugin-barcodescanner',
        'kapsel-plugin-fioriclient',
        'kapsel-plugin-attachmentviewer',
        'kapsel-plugin-calendar',
        'de.appplant.cordova.plugin.printer',
        'kapsel-plugin-voicerecording',
        'kapsel-plugin-usage',
        'kapsel-plugin-cdsprovider',
        'kapsel-plugin-push',
        'cordova-plugin-whitelist',
        'cordova-plugin-camera@2.0.0',
        'cordova-plugin-contacts@2.0.0',
        'cordova-plugin-file@4.0.0',
        'cordova-plugin-geolocation@2.0.0',
        'cordova-plugin-statusbar@2.0.0',
        'cordova-plugin-splashscreen@3.0.0',
        'cordova-plugin-network-information@1.1.0',
        'cordova-plugin-privacyscreen@0.1.2'
    ],
    commonPluginVariables = [],
    androidPlugins = [
        'cordova-plugin-crosswalk-webview@1.4.0',
        'cordova-plugin-customurlscheme@4.0.0',
        'kapsel-plugin-inappbrowser-xwalk'
    ],
    androidPluginVariables = [
        'URL_SCHEME=' + config.packageName + '.xcallbackurl' /* Used by Custom URL Scheme plugin */
    ],
    iosPlatform = 'ios',
    androidPlatform = 'android',
    iosPlugins = [],
    iosPluginVariables = [];

// Die on script errors
shell.config.fatal = true;

// Create the Fiori Client
createClient();

function createClient() {
    // Copy template to use as base for application
    if (fs.existsSync(targetFolder)) {
        console.error("Path already exists: " + targetFolder);
        process.exit(2);
    }

    shell.cp('-R', path.join('template', '*'), targetFolder);
    shell.config.silent = true;
    shell.pushd(targetFolder);
    shell.config.silent = false;

    // Update package name and app name
    var configFile = path.join(targetFolder, 'config.xml');
    shell.sed('-i', /id=\"(.*)\" v/, 'id="' + config.packageName + '" v', configFile);
    shell.sed('-i', /<name>.*<\/name>/, '<name>' + config.appName + '</name>', configFile);

    // Add required platforms
    addPlatforms();

    // Add required plugins
    addPlugins();

    // Update project
    shell.exec('cordova prepare');

    shell.popd();
    console.log('App created in the ' + targetFolder + ' directory.');
    console.log('Make sure that you navigate to ' +
        path.join(targetFolder, 'www', 'appConfig.js') +
        ' and enter your application settings, then run \'cordova prepare\'.');
}

function addPlatforms() {
    if (config.platforms && config.platforms.length > 0) {
        console.log('Adding platform(s)...');
        shell.exec('cordova platform add ' + config.platforms.join(' ') + ' --searchpath ' + searchPath);
        
        // Platforms can include version information, like this: android@5.0.0
        // Get the value used for platform tests later.
        for (var i = 0, len = config.platforms.length; i < len; i++) {
            if (config.platforms[i].charAt(0) === 'i') {
                iosPlatform = config.platforms[i];
            } else if (config.platforms[i].charAt(0) === 'a') {
                androidPlatform = config.platforms[i];
            }
        }
    }
}

function addPlugins() {
    console.log('Adding plugins...');
    var plugins = commonPlugins;
    var variables = commonPluginVariables;

    if (config.platforms) {
        if (config.platforms.indexOf(androidPlatform) >= 0) {
            plugins = plugins.concat(androidPlugins);
            variables = variables.concat(androidPluginVariables);
        }
        if (config.platforms.indexOf(iosPlatform) >= 0) {
            plugins = plugins.concat(iosPlugins);
            variables = variables.concat(iosPluginVariables);
        }
    }

    shell.exec('cordova plugin add ' +
        plugins.join(' ') + " --searchpath " + searchPath +
        ' ' + formatVariables(variables));

    if (config.platforms && config.platforms.indexOf(androidPlatform) >= 0) {
        // If multidex is added with the rest of the plugins the changes to AndroidManifest.xml will not be applied properly.
        shell.exec('cordova plugin add kapsel-plugin-multidex --searchpath ' + searchPath);
    }
}

function formatVariables(variables) {
    if (variables && variables.length > 0) {
        return "--variable " + variables.join(" --variable ");
    } else {
        return "";
    }
}

function readConfig(configFile) {
    var config = null;

    if (!configFile) {
        configFile = path.join(shell.pwd(), 'config.json');
    }

    console.log('Reading config file');

    try {
        config = JSON.parse(fs.readFileSync(configFile));
    } catch (e) {
        console.error('Failed to read config file: ' + configFile);
        console.error(e);
        process.exit(2);
    }

    ['packageName', 'targetFolder', 'appName', 'platforms'].forEach(function(property) {
        if (config[property] === undefined || config[property] === '') {
            console.error('Property ' + property + ' was not found. Please open the configuration file (config.json by default) and enter your settings.');
            process.exit(2);
        }
    });

    return config;
}
