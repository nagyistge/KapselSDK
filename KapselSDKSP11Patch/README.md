SAP Mobile Platform - Kapsel SDK
================================

Kapsel is part of the SAP Mobile Platform SDK and a suite of enterprise plugins for the open-source Apache Cordova framework (www.cordova.io). Kapsel plugins provide a Cordova application with some enterprise capabilities and expose APIs that give an application access to enterprise services provided by the SMP server.

The Getting Started with Kapsel Guide located at [http://scn.sap.com/docs/DOC-65386](http://scn.sap.com/docs/DOC-65386 "Getting Started with Kapsel") provides step by step instructions demonstrating many of the plugins provided by Kapsel.

SDK Folders
-----------
The Kapsel SDK folder where this file is located contains the following subfolders:

+ apps - This folder contains tools that can be used with Kapsel SDK.  
The "fiori_client" subfolder contains a Node.js application to create a custom SAP Fiori Client application using kapsel plugins.  
The "packager" subfolder contains a Node.js application to create and build a pre-packaged Fiori application using the mobile cloud build service.

+ cli - Contains the installation files for the Kapsel Command-line Interface (CLI). The Kapsel CLI exposes a set of commands that allow a developer to package a Kapsel application's web content for deployment to a SMP server as well as deploy the files to the SMP server. Refer to the cli/readme.md file for details how to install and use the Kapsel CLI.

+ docs - Contains a set of API documentation for the Kapsel plugins.

+ plugins - The Kapsel plugin files (in a separate folder for each plugin). The Kapsel plugins are described at [http://help.sap.com/saphelp_smp3011sdk/helpdata/en/7c/041aaa7006101481a7fc662daecd3f/content.htm](http://help.sap.com/saphelp_smp3011sdk/helpdata/en/7c/041aaa7006101481a7fc662daecd3f/content.htm "SP11 Kapsel Plugins").

Requirements
------------
Kapsel currently supports Android, iOS, and Windows 10 applications.  For additional details on Windows support see [http://help.sap.com/saphelp_smp3011sdk/helpdata/en/10/e4e12b7a7d4de3a2b80c9c935aded2/content.htm](http://help.sap.com/saphelp_smp3011sdk/helpdata/en/10/e4e12b7a7d4de3a2b80c9c935aded2/content.htm "Supported Kapsel Plugins for Windows")

The Kapsel plugins are compiled and tested against a particular version of Cordova.

It is recommended to use Cordova 5.4.1 with SDK SP11.  
