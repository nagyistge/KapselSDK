#!/usr/bin/env node

module.exports = function(context) {
    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        shell = context.requireCordovaModule('shelljs');

    var iosPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'ios'),
        fileName = 'Root.plist',
        rootPlistFile = path.join(context.opts.projectRoot,
            'scripts', 'ios', 'after_prepare', fileName);

    if (fs.existsSync(iosPlatformDir)) {
        var xcodeproj = fs.readdirSync(iosPlatformDir).filter(
                function(e) {
                    return e.match(/\.xcodeproj$/i);
                })[0],
            project = xcodeproj.substring(xcodeproj.lastIndexOf(path.sep) + 1, xcodeproj.indexOf('.xcodeproj')),
            iosSettingsBundleDir = path.join(iosPlatformDir,
                project, 'Resources', 'Settings.bundle');

        if (fs.existsSync(iosSettingsBundleDir)) {
            shell.cp('-f', rootPlistFile, path.join(iosSettingsBundleDir, fileName));
        }
    }
};
