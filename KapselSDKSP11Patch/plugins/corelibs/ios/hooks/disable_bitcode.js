#!/usr/bin/env node

module.exports = function(context) {
    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path');

    var iosPlatformDir = path.join(context.opts.projectRoot, 'platforms', 'ios'),
        buildConfigFile = path.join(iosPlatformDir, 'cordova/build.xcconfig');

    if (fs.existsSync(iosPlatformDir)) {
        // Update build config used by CLI 'cordova build'
        if (fs.existsSync(buildConfigFile)) {
            var raw = fs.readFileSync(buildConfigFile).toString('utf8');

            if (raw.indexOf('ENABLE_BITCODE') === -1) {
                console.log('Disabling bitcode');
                raw += '\nENABLE_BITCODE = NO';
                fs.writeFileSync(buildConfigFile, raw, 'utf8');
            }
        }
    }
};
