#!/usr/bin/env node

module.exports = function (ctx) {
    var helper = {};

    var path = ctx.requireCordovaModule('path');
    var fs = ctx.requireCordovaModule('fs');
    var shell = ctx.requireCordovaModule('shelljs');
    plugin = require('./plugin.js')(ctx);

    var projectEndString = "<\/Project>";

    /*
    Used to decide whether .jsproj is windows or phone project
        key: notation in .jsporj
        value: name of the folder for the dependencies
    */
    var archTargetPlatformMap = {
        "Windows": "windows81\\win",
        "UAP": "windows10",
        "WindowsPhoneApp": "windows81\\wp"
    };
    var targetPlatformMap = {
        "Windows": "windows81",
        "UAP": "windows10",
        "WindowsPhoneApp": "windows81"
    };

    /*
    Insert the ItemGroup reference in the .jsproj file
    */
    helper.insertItemGroup = function (projItem, filename) {
        var content = fs.readFileSync(projItem, 'utf8');
        var target = getTargetPlatform(content);

        var result = content.replace(projectEndString, getInsertItemGroupString(target, filename));

        fs.writeFileSync(projItem, result, 'utf8');
    };

    /*
    Remove the ItemGroup reference from the .jsproj file
    */
    helper.removeItemGroup = function (projItem, filename) {
        var content = fs.readFileSync(projItem, 'utf8');
        var result = content.replace(getRemoveItemGroupRegexp(filename), "");
        fs.writeFileSync(projItem, result, 'utf8');
    };

    /*
    Copies the content of the source folder to the destination folder recursively.
    Note: destinationFolder does not have to be an exsisting folder.
    */
    helper.copyFolder = function (sourceFolder, destinationFolder) {
        createDir(destinationFolder);
        var files = shell.ls(sourceFolder);
        files.forEach(function (sourcefileName) {
            if (plugin.filesToCopy.indexOf(path.basename(sourcefileName)) !== -1) {
                var destFile = path.join(destinationFolder, sourcefileName);
                var sourceFile = path.join(sourceFolder, sourcefileName);
                if (fs.existsSync(sourceFile) && fs.existsSync(destinationFolder)) {
                    copyFile(sourceFile, destFile);
                }
                else {
                    console.log("Failed to install plugin. Destination file or source file does not exist.\nDestintaion folder: " + destFile + "\nSource file: " + sourceFile);
                    process.exit(1);
                }
            }
        });
    }

    /*
    Recursivly deletes the provided directory. 
    Note: directory does not have to be empty.
    */
    helper.deleteFolder = function (dir) {
        if (fs.existsSync(dir)) {
            fs.readdirSync(dir).forEach(function (file, index) {
                var curPath = path.join(dir, file);
                if (fs.lstatSync(curPath).isDirectory()) {
                    helper.deleteFolder(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dir);
        }
    };

    /*
        Helpers
    */

    // target: windows or phone, depending on the project type
    var getInsertItemGroupString = function (target, filename) {
        var result =
             "\t<ItemGroup>\n" +
             "\t\t<Reference Include=\"" + path.basename(filename, path.extname(filename)) + "\">\n";
			 
        if(plugin.archDependent){
            result += "\t\t\t<HintPath>" + "plugins\\" + plugin.pluginId + "\\" + target + "\\$(Platform)\\" + filename + "</HintPath>\n";
        }
        else{
            result += "\t\t\t<HintPath>" + "plugins\\" + plugin.pluginId + "\\" + target + "\\" + filename + "</HintPath>\n";
        }

        if (filename.match(/\.winmd$/)) {
            result +=
                "\t\t\t<IsWinMDFile>true</IsWinMDFile>\n";
        }

        result +=
            "\t\t</Reference>\n" +
            "\t</ItemGroup>\n" +
            "</Project>";

        return result;
    };

    var getRemoveItemGroupRegexp = function (filename) {
        return new RegExp("[\n\t]*<ItemGroup>[\n\t]*" +
                            "<Reference Include=\"" + filename + "\">[\n\t]*" +
                                "<HintPath>.*" + filename + ".*<\/HintPath>[\n\t].*[\n\t]*" +
                            "<\/Reference>[\n\t]*" +
                         "<\/ItemGroup>[\n\t]*", "i");
    };

    var copyFile = function (source, destination) {
        fs.writeFileSync(destination, fs.readFileSync(source));
    }

    //Recursively create folder structure. Yes, there is no native support for this
    var createDir = function (dir) {
        if (fs.existsSync(dir)) {
            return;
        }

        var parentDir = dir.slice(0, dir.lastIndexOf(path.sep));
        if (!fs.existsSync(parentDir)) {
            createDir(parentDir);
        }
        fs.mkdirSync(dir);
    };

    /*
    Returns whether the given .jsproj item is a phone or a windows project.
    */
    var getTargetPlatform = function (content) {
        var regexp = /<TargetPlatformIdentifier>(.*)<\/TargetPlatformIdentifier>/i;
        var target = regexp.exec(content)[1];
        if(plugin.archDependent){
            return archTargetPlatformMap[target];
        }
        return targetPlatformMap[target];
    };

    return helper;
};