Kapsel CLI
==========
A command-line tool for Kapsel applications; the CLI exposes commands that allow a developer to:

1. Package a Kapsel application's web application content for deployment to a SMP server.
2. Deploy updates to a Kapsel application's content to a SMP Server.

Getting Started
--------------------
In order to use the Kapsel CLI, you must first install nodeJS from nodejs.org. If you are running the Kapsel CLI on a system that is already used for Kapsel or Cordova development, you should have the required tools already installed.

To validate that your system is properly configured to use the Kapsel CLI, open a terminal window and execute the following command:

	node -v
 
It should return a number such as v5.4.1.  If an error message is displayed, validate that nodeJS is properly installed.

In order to be able to use the Kapsel CLI with any Kapsel application, you must install the Kapsel CLI so it is available globally (from any folder). The installation instructions will vary depending on whether the development system is running Windows or OS X.  

The CLI installation will add several node modules to your local system's configuration; if you are running in a corporate environment with a proxy, you may first have to create the following environemnt variables for npm depending. 

	http_proxy=http://proxy.phl.sap.corp:8080
	https_proxy=$http_proxy

You will need to substitute the correct proxy server address (and optionally port number).

### Windows Installation
To install the CLI, open a terminal window and navigate to the Kapsel CLI folder. On Windows, the SDK installer installs the SDK by default in C:\SAP\MobileSDK3\, so the Kapsel CLI can be found in C:\SAP\MobileSDK3\KapselSDK\cli. With a terminal window open to the cli folder, issue the following command:

	npm -g install

### Macintosh OS X Installation
To install the CLI, open a terminal window and navigate to the Kapsel CLI folder. On OS X, the SDK installer installs the SDK by default in /users/user_name/SAP/MobileSDK3/ (replacing user_name with the login name for the user performing the installation), so the Kapsel CLI can usually be found in /users/user_name/SAP/MobileSDK3/KapselSDK\cli. With a terminal window open to the cli folder, issue the following command:

	sudo npm -g install

You will be prompted to enter the system password before the installation will begin.

### Validating the Installation
To validate that the Kapsel CLI installation completed successfully, open a terminal window, navigate to any folder **except** the cli folder from where you installed the Kapsel CLI and issue the following command:

	kapsel

If the Kapsel CLI is installed correctly, you should see the contents of the Kapsel CLI help file displayed in the terminal window. 

Using the Kapsel CLI
--------------------
To use the Kapsel CLI, open a terminal window, navigate to a Kapsel project folder and issue one of the available commands in the following format:	

	kapsel command [options]

The Kapsel CLI supports the following commands:

+ package
+ deploy

The [options] parameter refers to optional command parameters that can be passed on the command line.

**Note** The Kapsel CLI will only function when executed from a valid Kapsel project folder.

### Package Command

A Kapsel application is usually deployed with an initial version of the application's web content. When the web application is updated, an organization will use the SMP server's life-cycle management capabilities and the Kapsel AppUpdate plugin to deploy the update to users that already have the application deployed to their device.  

The package command is used to create a local archive (.zip file) containing a Kapsel web application's content so that the application updates can be deployed to a SMP server. The format for the package command is:

	kapsel package [platform_list]
	
A Kapsel project can target Android and/or iOS devices; the platform_list parameter is used to instruct the Kapsel CLI which target mobile platforms to include in the archive. Valid platforms options are: android and ios.

**Note** If you omit the platform_list parameter, web content for all target platforms will be included in the archive.

The output of this command is an archive called packagedKapselApp.zip which will be written to the root folder of the project.

**Note** Be sure to execute the Cordova CLI prepare command prior to executing the Kapsel package command to ensure that the latest version of the application's web content has been copied into the target mobile device platform project folders.
	
#### Example usage:
To package the web application content for the Android platform only use:

    kapsel package android

To package the web application content for the iOS platform only use:

    kapsel package ios

To package the web application content for all target platforms use:
	
	kapsel package

You can also accomplish the same thing by specifying all of the target platforms on the command line:
 
	kapsel package android ios

### Deploy Command
The deploy command is used to upload an archive containing a Kapsel application's web application content to the SMP server for distribution to an existing Kapsel application. The archive can be one created using the Kapsel CLI package command or created through some other process. The format for the deploy command is:

	kapsel deploy <app_id> <server_host[:server_port]> <user_name> <user_password>

The deploy command requires 4 parameters:
 
+ app_id: The application's unique ID as defined on the SMP server
+ server_host: The SMP server host address (and optionally port number)
+ user_name: A valid SMP administrator user name
+ user_password: The password for the specified SMP Administrator

**Note** The application must already have been created on the SMP server before running the deploy command.
  
#### Example usage
To deploy updates to an existing Kapsel application with an ID (as defined on the SMP server) of KapselApp to a SMP server called server3 use the following: 
    
    kapsel deploy KapselApp server3 theadmin thepass

The admin user name (theadmin) and password (thepass) must be valid user credentials for the server or the command will fail.

For environments where the SMP server port has been changed from its default (8083) you can append the port number to the server host address in the format server_host:server_port. In the following example, the server port has been changed from 8083 to 8085:

    kapsel deploy KapselApp server3:8085 theadmin thepass

The deploy command will automatically increment the revision number for the application on the SMP server. To see the revision of the app on the server, go to applications screen, click on the app, go to the Application specific settings tab. 
