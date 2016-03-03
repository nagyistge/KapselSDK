#!/usr/bin/env node

/*
    Concept behind the hooks.
    These hook are required because Cordova currently does not support adding references to dependencies different for Windows 8.1 and 10.

    plugin.js   -   Contains all the plugin specific information. Which dependencies to add and which folder to remove on uninstall.
    helper.js   -   Contains helper methods which enables the hooks to actually insert/remove the references and copy/delete the folders.
    afterPluginInstall.js   -   Executes the steps required after the plugin is installed. Copies files and inserts references.
    beforePluginUninstall.js    -   Executes the steps required before the plugin is uninstalled. Removes references and deletes folders.

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
        "SAP.E2ETrace.winmd",
        "SAP.Net.Http.dll",
        "SAP.Supportability.winmd"
    ];

    // Do not add reference to these files in the .jsporj
    plugin.insertReference = [
        "SAP.E2ETrace.winmd"
    ];

    /*
    Copy the architecture dependent files from these folders to the destination folder.
        key: source folder
        value: destination folder
    */
    plugin.foldersToCopy = [
        //windows81
        {
            "plugins/kapsel-plugin-e2etrace/windows/windows81/bin/":
              "platforms/windows/plugins/kapsel-plugin-e2etrace/windows81"
        },
        //windows10
        {
            "plugins/kapsel-plugin-e2etrace/windows/windows10/bin/":
              "platforms/windows/plugins/kapsel-plugin-e2etrace/windows10"
        }
    ];

    // Folders to remove during uninstall
    plugin.foldersToRemove = [
        path.join(plugin.rootdir, "platforms/windows/plugins/kapsel-plugin-e2etrace")
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