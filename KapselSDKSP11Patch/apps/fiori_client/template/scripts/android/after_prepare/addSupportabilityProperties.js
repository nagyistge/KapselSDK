#!/usr/bin/env node

module.exports = function(context) {

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        shell = context.requireCordovaModule('shelljs');

    var androidAssetsDir = path.join(context.opts.projectRoot,
            'platforms', 'android', 'assets'),
        fileName = 'sap-supportability.properties';
    supportabilityFile = path.join(context.opts.projectRoot,
        'scripts', 'android', 'after_prepare', fileName);

    if (fs.existsSync(androidAssetsDir)) {
        shell.cp('-f', supportabilityFile, path.join(androidAssetsDir, fileName));
    }
};
