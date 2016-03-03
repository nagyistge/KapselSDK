#!/usr/bin/env node

module.exports = function(context) {

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        et = context.requireCordovaModule('elementtree');

    var projectManifestFile = path.join(context.opts.projectRoot,
            "platforms", "android", 'AndroidManifest.xml'),
            manifestContents = fs.readFileSync(projectManifestFile, 'utf-8'),
            projectManifestXmlRoot = new et.ElementTree(et.XML(manifestContents)),
            application = projectManifestXmlRoot.find("./application");

    application.set("android:name", "android.support.multidex.MultiDexApplication");

    fs.writeFileSync(projectManifestFile, projectManifestXmlRoot.write({indent: 4}), 'utf-8');
};
