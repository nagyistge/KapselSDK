#!/usr/bin/env node

module.exports = function(context) {

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        shell = context.requireCordovaModule('shelljs');

    var androidPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'android'),
        androidCordovaDir = path.join(androidPlatformDir, 'CordovaLib'),
        androidCordovaDirSrc = path.join(androidCordovaDir, 'src'),
        cordovaGradleFile = path.join(androidCordovaDir, 'build.gradle'),
        fileName = 'PluginAspect.aj';
    aspectFile = path.join(context.opts.projectRoot,
        'scripts', 'android', 'after_platform_add', fileName);

    if (fs.existsSync(androidPlatformDir)) {
        shell.cp('-f', aspectFile, path.join(androidCordovaDirSrc, fileName));

        shell.sed('-i', 'classpath \'com.android.tools.build:gradle:1.0.0+\'', 'classpath \'com.android.tools.build:gradle:1.0.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', cordovaGradleFile);
        shell.sed('-i', 'classpath \'com.android.tools.build:gradle:0.14.0+\'', 'classpath \'com.android.tools.build:gradle:0.14.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', cordovaGradleFile);
        shell.sed('-i', 'classpath \'com.android.tools.build:gradle:0.12.0+\'', 'classpath \'com.android.tools.build:gradle:0.12.0+\' \r\n classpath \'com.uphyca.gradle:gradle-android-aspectj-plugin:0.9.12\'', cordovaGradleFile);
        shell.sed('-i', 'apply plugin: \'android-library\'', 'apply plugin: \'android-library\' \r\n apply plugin: \'android-aspectj\'', cordovaGradleFile);
    }
};
