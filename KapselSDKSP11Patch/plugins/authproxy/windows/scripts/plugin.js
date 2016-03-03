#!/usr/bin/env node

/*
    Concept behind the hooks.
    These hook are required because Cordova currently does not support adding references to dependencies different for Windows 8.1 and 10.

    plugin.js   -   Contains all the plugin specific information. Which dependencies to add and which folder to remove on uninstall.
    helper.js   -   Contains helper methods which enables the hooks to actually insert/remove the references and copy/delete the folders.
    afterPluginInstall.js   -   Executes the steps required after the plugin is installed. Copies files and inserts references.
    beforePluginUninstall.js    -   Executes the steps required before the plugin is uninstalled. Removes references and deletes folders.

    The hooks were created in a way to make it easy to apply them for other plugins if needed.  Meaning if the plugin only need to simply add 
    reference to architecture dependent dependencies than only the plugin specific information should be modified in the plugin.js file.
*/

module.exports = function (ctx) {
    var plugin = {};

    var path = ctx.requireCordovaModule('path');
    var fs = ctx.requireCordovaModule('fs');

    plugin.pluginId = ctx.opts.plugin.id;
    plugin.pluginDir = path.join("plugins", plugin.pluginId);
    plugin.rootdir = ctx.opts.projectRoot;

    plugin.archDependent = false;

    // Files to copy and add reference
    plugin.filesToCopy = [
        "SAP.AuthProxy.winmd",
        "SAP.Logon.winmd",
        "SAP.CertificateProvider.winmd",
        "SAP.Logon.Core.winmd",
        "SAP.Net.Http.dll",
        "SAP.SecureStore.winmd",
        "SAP.Supportability.winmd",
        "Newtonsoft.Json.dll"
    ];

    // Add reference to these files in the .jsporj
    plugin.insertReference = [
        "SAP.AuthProxy.winmd"
    ];

    /*
    Copy the architecture dependent files from these folders to the destination folder.
        key: source folder
        value: destination folder
    */
    plugin.foldersToCopy = [
        //windows81
        {
            "plugins/kapsel-plugin-authproxy/windows/windows81/bin/":
              "platforms/windows/plugins/kapsel-plugin-authproxy/windows81"
        },
        //windows10
        {
            "plugins/kapsel-plugin-authproxy/windows/windows10/bin/":
              "platforms/windows/plugins/kapsel-plugin-authproxy/windows10"
        }
    ];

    // Folders to remove during uninstall
    plugin.foldersToRemove = [
        path.join(plugin.rootdir, "platforms/windows/plugins/kapsel-plugin-authproxy")
    ];

    /*
    RegExps for the references to remove from the .jsproj files during uninstall.
    Generated from filesToCopy by converting the filenames to RegExps.
    */
    plugin.filesToRemove = (function () {
        //helper function for RegExp escaping.
        var escapeRegExp = function (str) {
            return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
        };

        var files2R = [];
        plugin.filesToCopy.forEach(function (filename) {
            var regexpfilename = escapeRegExp(path.basename(filename, path.extname(filename)));
            files2R.push(regexpfilename);
        });
        return files2R;
    })();

    return plugin;
};