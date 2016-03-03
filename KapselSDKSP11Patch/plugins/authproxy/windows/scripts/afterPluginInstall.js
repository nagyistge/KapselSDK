#!/usr/bin/env node

module.exports = function (ctx) {
    var path = ctx.requireCordovaModule('path');
    var fs = ctx.requireCordovaModule('fs');
    var shell = ctx.requireCordovaModule('shelljs');

    var sap = sap || {};
    sap.helper = require('./helper.js')(ctx);
    sap.plugin = require('./plugin.js')(ctx);

    var firstTime = true;
    sap.plugin.foldersToCopy.forEach(function (folder) {
        Object.keys(folder).forEach(function (sourceFolder) {
            //First create folder structure and copy the files specified in the plugin.js
            var destinationFolderFullPath = path.join(sap.plugin.rootdir, folder[sourceFolder]);
            var sourceFolderFullPath = path.join(sap.plugin.rootdir, sourceFolder);
            sap.helper.copyFolder(sourceFolderFullPath, destinationFolderFullPath);

            //Insert references in .jsproj files. References must only be inserted once per file.
            if (firstTime) {
                var jsprojs = shell.ls(path.join(sap.plugin.rootdir, 'platforms/windows/*.jsproj'));
                var allfiles = shell.ls(sourceFolderFullPath);

                //Insert the reference on the file
                jsprojs.forEach(function (proj) {
                    allfiles.forEach(function (file) {
                        if(sap.plugin.filesToCopy.indexOf(file) !== -1 && sap.plugin.insertReference.indexOf(file) > -1){
                            sap.helper.insertItemGroup(proj, file);
                        }
                    });
                });
                firstTime = false;
            }
        });
    });

};
