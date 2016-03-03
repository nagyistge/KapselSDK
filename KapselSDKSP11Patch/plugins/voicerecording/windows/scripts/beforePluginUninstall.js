#!/usr/bin/env node

module.exports = function (ctx) {
    var path = ctx.requireCordovaModule('path');
    var fs = ctx.requireCordovaModule('fs');
    var shell = ctx.requireCordovaModule('shelljs');

    var sap = sap || {};
    sap.helper = require('./helper.js')(ctx);
    sap.plugin = require('./plugin.js')(ctx);

    // Delete plugin folders, also removes all files within the folders
    sap.plugin.foldersToRemove.forEach(function (folder) {
        sap.helper.deleteFolder(folder);
    });

    //Remove the references from the .jsproj files
    var projitems = shell.ls(path.join(sap.plugin.rootdir, 'platforms/windows/*.jsproj'));
    projitems.forEach(function (projitem) {
        sap.plugin.filesToRemove.forEach(function (filename) {
            sap.helper.removeItemGroup(projitem, filename);
        });
    });
};