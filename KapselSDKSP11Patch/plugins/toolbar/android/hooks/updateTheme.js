#!/usr/bin/env node

module.exports = function(context) {

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        shell = context.requireCordovaModule('shelljs');

    var androidPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'android'),
        projectManifestFile = path.join(androidPlatformDir,
            'AndroidManifest.xml');

    if (fs.existsSync(projectManifestFile)) {
        shell.sed('-i', /android:name="MainActivity" android:theme=\"@android:style\/Theme.Black.NoTitleBar\"/,
            'android:name="MainActivity" android:theme="@android:style/Theme.Holo.Light"', projectManifestFile);
    }
};
