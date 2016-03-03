# Packager

## Installation and Setup

After cloning, you need to install the npm dependencies

```
npm install nopt  
npm install nopt-usage  
npm install nopt-defaults  
npm install shelljs  
npm install q  
```

## Example

To run the Packager, provide a `config.json` file locally.  The `config.json.example` shows an example of such a file.  By default, the Packager will use a local file with the name `config.json` to obtain config details from; if you want another name, specifiy it on the command line.

    <Packager>/bin/packager --config config.json --username 'ff2_off_ahn' --password 'welcome' --host ldcigm6.wdf.sap.corp --port 44333 --https --targetDir xxx --force --verbose

Front end server details can be provided in the config file; else they can be provided on the command line.

After the packager has downloaded and created the directory hierarchy, you can pass this to the cloud build service, or else build a Cordova application out of it directly.

To do the latter, cd into the src folder, and run the cordova plugin add commands.  For example:

    cd xxx/src
    cordova plugins add com.sap.mp.cordova.plugins.corelibs --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add com.sap.mp.cordova.plugins.authproxy --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add com.sap.mp.cordova.plugins.logger --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add com.sap.mp.cordova.plugins.logon --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add com.sap.mp.cordova.plugins.settings --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add com.sap.mp.cordova.plugins.odata --searchpath ~/SAP/Plugins/smp-plugins-dist-3.8.0-20150410.210038-225/plugins
    cordova plugins add org.apache.cordova.network-information
    cordova platform add ios

The packager also builds single app (non launchpad) versions too.  Add `--singleApp <app id>` to the command line.  You need to specify the app details in the config.json as before.

## Usage

    Usage:
    --verbose, -d      Verbose output                        false          
    --version, -v      Version of Packager                                  
    --targetDir, -t    Target directory                                     
    --config, -f       Config File                           config.json    
    --singleApp, -a    Single App (no Launchpad)                            
    --username, -u     Front End Server username                            
    --password, -p     Front End Server password                            
    --host, -H         Front End Server hostname                            
    --port, -P         Front End Server port                                
    --https, -S        Front End Server uses https or not                   
    --force, -F        Force Overwrite of existing target    false          
    --help, -h         Display help                          false          

## Basics

The Packager ideally works with a FES that has the following features:

* REST API to return information about a Fiori Component
* Fiori Components deployed to FES with manifest.json and resources.json files

Te REST API returns information about a component:

* the URL used as a base to fetch component artefacts (e.g. manifest.json and actual JavaScript and view definitions)
* dependent libraries (also present in the manifest.json file)

Packager starts by retrieving the details of an application and then extracting the manifest and resources files.  It then extracts the actual artefacts required for the application (using the resources.json) and also obtains a list of all required libraries.  Once all applications are queried and resource sdownloaded, the SAP UI5 components are downloaded.

## Config.json

This contains the app definition used to download the content and set up the launchpad properly. This includes the component ID for the app, and some details used to create the tile. If the FES supports the app_index API call, then there is no need to specify any addtional details; if the FES does not, then you need to include the remote path to find the app, and dependent libs and resources. 

The Packager assumes that all apps listed will be exposed as tiles (unless you specifiy `--singleApp` in which case no launch pad is created, and only one app should be specified).

Config.json also optionally contains the Front End Server definitions (overridable by command line options).  Also included are SMP connection and setup details, including the defining requests and whether to have an offline DB or not (if no offline DB, defining requests are ignored).

Here is an example of a config which works with a FES suporting the app_index API:

```
{
    "smp": {
	"serviceRoot": "/sap/opu/odata/sap/CRM_BUPA_ODATA/",
	"server": "mo-a1c4fd27e.mo.sap.corp",
	"port": 8081,
	"https": true,
	"appid": "CRMMyContacts",
	"offline": false,
	"definingRequests": {
            "custtitle" : "/CustomizingTitleCollection",
            "acatitle"  : "/CustomizingAcademicTitleCollection",
            "rating"    : "/CustomizingRatingCollection",
            "country"   : "/CustomizingCountryCollection",
            "region"    : "/CustomizingRegionCollection",
            "accounts"  : "/AccountCollection/?$filter=isMyAccount%20eq%20true&$expand=MainContact,Classification,MainAddress,Logo,AccountFactsheet,ERPCustomer,EmployeeResponsible,EmployeeResponsibleRel,Contacts,Appointments,Attachments,Notes,Leads,Opportunities",
            "contacts"  : "/ContactCollection/?$filter=isMyContact%20eq%20true&$expand=Attachments,Notes,WorkAddress,Account,Account/Addresses,Account/MainAddress,Account/MainContact,Account/MainContact/WorkAddress,Account/Logo,Photo"
	}
    },
    "applications": [
	{
	    "id": "nw.epm.refapps.shop",
	    "definition": {
		"intent": "EPMProduct-shop",
		"additionalInformation": "SAPUI5.Component=nw.epm.refapps.shop",
		"description": "EPM Shop",
		"icon": "sap-icon://Fiori6/F0866"
	    }
	}
    ],
    "libraries": {
        "sap.ui.fl": {}
    },
    "resources": [
	{
            "id": "nw.epm.refapps.lib.reuse",
            "resources": [
		{
                    "name": "library-preload.json"
		},
		{
                    "name": "themes/sap_bluecrystal/library-parameters.json"
		},
		{
                    "name": "themes/sap_bluecrystal/library.css"
		}
            ]
	}
    ]
}
```

In the above example, additional resources (associated with a reuse component) are also specified.  If resources are missing from the FES for some reaosn, additional resources can be specified in the config file, in the `resources` section.  Also, if additonal libraries are needed they can be added in the `libraries` section.

Here is an example where the full details are specified:

```
{
    "smp": {
    	"serviceRoot": "/sap/opu/odata/sap/CRM_BUPA_ODATA/",
    	"server": "mo-a1c4fd27e.mo.sap.corp",
    	"port": 8081,
    	"https": true,
    	"appid": "CRMMyContacts",
    	"offline": true,
    	"definingRequests": {
            "custtitle" : "/CustomizingTitleCollection",
            "acatitle"  : "/CustomizingAcademicTitleCollection",
            "rating"    : "/CustomizingRatingCollection",
            "country"   : "/CustomizingCountryCollection",
            "region"    : "/CustomizingRegionCollection",
            "accounts"  : "/AccountCollection/?$filter=isMyAccount%20eq%20true&$expand=MainContact,Classification,MainAddress,Logo,AccountFactsheet,ERPCustomer,EmployeeResponsible,EmployeeResponsibleRel,Contacts,Appointments,Attachments,Notes,Leads,Opportunities",
            "contacts"  : "/ContactCollection/?$filter=isMyContact%20eq%20true&$expand=Attachments,Notes,WorkAddress,Account,Account/Addresses,Account/MainAddress,Account/MainContact,Account/MainContact/WorkAddress,Account/Logo,Photo"
        }
    },
    "frontEndServer": {
	    "username": "ff2_off_ahn",
	    "password": "welcome",
	    "host": "ldcigm6.wdf.sap.corp",
	    "port": 44333,
	    "https": true
    },
    "applications": [
	{
	    "id": "cus.crm.myaccounts",
	    "definition": {
		"intent": "Account-MyAccounts",
		"additionalInformation": "SAPUI5.Component=cus.crm.myaccounts",
		"description": "My Accounts",
		"icon": "sap-icon://account"
	    },
	    "url": "/sap/bc/ui5_ui5/sap/crm_myaccounts",
	    "libs": {
		"sap.ca.scfld.md": {},
		"sap.ui.core": {},
		"sap.m": {},
		"sap.ca.ui": {},
		"sap.viz": {}
	    },
	    "resources": [
		{"name": "Component.js"},
		{"name": "Configuration.js"},
		{"name": "Main.controller.js"},
		{"name": "Main.view.xml"},
		{"name": "view/S2.controller.js"},
		{"name": "view/S2.view.xml"},
		{"name": "view/S4Attachments.controller.js"},
		{"name": "view/S4Attachments.view.xml"},
		{"name": "view/S4Notes.controller.js"},
		{"name": "view/S4Notes.view.xml"},
		{"name": "view/S360.controller.js"},
		{"name": "view/S360.view.xml"},
		{"name": "view/search/SearchResult.controller.js"},
		{"name": "view/search/SearchResult.view.xml"},
		{"name": "view/overview/Appointments.controller.js"},
		{"name": "view/overview/Appointments.view.xml"},
		{"name": "view/overview/Attachments.controller.js"},
		{"name": "view/overview/Attachments.view.xml"},
		{"name": "view/overview/Contacts.controller.js"},
		{"name": "view/overview/Contacts.view.xml"},
		{"name": "view/overview/GeneralData.controller.js"},
		{"name": "view/overview/GeneralData.view.xml"},
		{"name": "view/overview/Leads.controller.js"},
		{"name": "view/overview/Leads.view.xml"},
		{"name": "view/overview/MarketingAttributes.controller.js"},
		{"name": "view/overview/MarketingAttributes.view.xml"},
		{"name": "view/overview/Notes.controller.js"},
		{"name": "view/overview/Notes.view.xml"},
		{"name": "view/overview/Opportunities.controller.js"},
		{"name": "view/overview/Opportunities.view.xml"},
		{"name": "view/overview/OverviewPage.controller.js"},
		{"name": "view/overview/OverviewPage.view.xml"},
		{"name": "view/overview/Quickoverview.controller.js"},
		{"name": "view/overview/Quickoverview.view.xml"},
		{"name": "view/overview/Quotations.controller.js"},
		{"name": "view/overview/Quotations.view.xml"},
		{"name": "view/overview/SalesOrders.controller.js"},
		{"name": "view/overview/SalesOrders.view.xml"},
		{"name": "view/overview/Tasks.controller.js"},
		{"name": "view/overview/Tasks.view.xml"},
		{"name": "view/overview/GeneralDataCompany.fragment.xml"},
		{"name": "view/overview/GeneralDataPerson.fragment.xml"},
		{"name": "view/overview/ItemsQuickoverview.fragment.xml"},
		{"name": "view/overview/ProcessTypeDialog.fragment.xml"},
		{"name": "view/maintain/GeneralDataEdit.controller.js"},
		{"name": "view/maintain/GeneralDataEdit.view.xml"},
		{"name": "view/maintain/GeneralDataEditCompany.fragment.xml"},
		{"name": "view/maintain/GeneralDataEditPerson.fragment.xml"},
		{"name": "view/maintain/ValueHelpCountry.fragment.xml"},
		{"name": "view/maintain/ValueHelpEmployeeResponsible.fragment.xml"},
		{"name": "view/maintain/ValueHelpMarketingAttribute.fragment.xml"},
		{"name": "view/maintain/ValueHelpMarketingAttributeSet.fragment.xml"},
		{"name": "view/maintain/ValueHelpRegion.fragment.xml"},
		{"name": "view/maintain/address/DefaultAddress.fragment.xml"},
		{"name": "view/maintain/address/GBAddress.fragment.xml"},
		{"name": "view/maintain/address/JPAddress.fragment.xml"},
		{"name": "view/maintain/address/USAddress.fragment.xml"},
		{"name": "util/ApptListItem.js"},
		{"name": "util/Constants.js"},
		{"name": "util/formatter.js"},
		{"name": "util/Util.js"},
		{"name": "img/home/57_iPhone_Desktop_Launch.png"},
		{"name": "img/home/72_iPad_Desktop_Launch.png"},
		{"name": "img/home/114_iPhone_Retina_Web_Clip.png"},
		{"name": "img/home/114_iPad_Retina_Web_Clip.png"},
		{"name": "img/home/favicon.ico"},
		{"name": "i18n/i18n.properties"},
		{"name": "i18n/i18n_en.properties"},
		{"name": "css/app.css"},
		{"name": "controller/Base360Controller.js"},
		{"name": "controller/SearchController.js"}
	    ]
	}, {
	    "id": "cus.crm.mycontacts",
	    "definition": {
		"intent": "ContactPerson-MyContacts",
		"additionalInformation": "SAPUI5.Component=cus.crm.mycontacts",
		"description": "My Contacts",
		"icon": "sap-icon://contacts"
	    },
	    "url": "/sap/bc/ui5_ui5/sap/crm_mycont",
	    "libs": {
		"sap.ca.scfld.md": {},
		"sap.ui.core": {},
		"sap.m": {},
		"sap.ca.ui": {}
	    },
	    "resources": [
		{"name": "Component.js"},
		{"name": "Configuration.js"},
		{"name": "Main.controller.js"},
		{"name": "Main.view.xml"},
		{"name": "formatter/ReleaseFormatter.js"},
		{"name": "i18n/i18n.properties"},
		{"name": "i18n/i18n_en.properties"},
		{"name": "model/Attachment.json"},
		{"name": "model/Contact.json"},
		{"name": "model/metadata.xml"},
		{"name": "model/Note.json"},
		{"name": "model/s_hr_12204.jpg"},
		{"name": "view/AccountBusinessCard.controller.js"},
		{"name": "view/AccountBusinessCard.view.xml"},
		{"name": "view/ContactDetails.controller.js"},
		{"name": "view/ContactDetails.view.xml"},
		{"name": "view/S2.controller.js"},
		{"name": "view/S2.view.xml"},
		{"name": "view/S3.controller.js"},
		{"name": "view/S3.view.xml"},
		{"name": "view/S4.controller.js"},
		{"name": "view/S4.view.xml"},
		{"name": "view/AccountSelectDialog.fragment.xml"},
		{"name": "util/AppOfflineInterface.js"},
		{"name": "util/Constants.js"},
		{"name": "util/Util.js"}
	    ]
	}
    ]
}
```

In this example, the config details include the bill-of-materials (in the resources property).  Ideally, this will come from the front end server directly (in the `resources.json` file).

Likewise, in this example, the config contains SAP UI5 library dependencies - again, these will eventually come from the front end server (via the `manifest.json` file).

## SAP UI5 Libraries

The Packager currently has a built-in list of all SAP UI5 libraries and their associated components.  This is necessary, because without the component list defined for each library, the Packager would not know what to download for each library from the front end server. Eventually, a `resources.json` approach will be provided that allows the Packager to get the list of components (bill of materials) to be obtained from the front end server for each library.  Until that happens, the Packager needs to determine itself what components need to be downloaded for a specific library.

**TODO: this in-built list is currently only partially setup.  Additional details need to be added for productive use.  See the config.json file in the Packager's config directory.**

The `sap.ui.thirdparty` component is a set of JavaScript and other resources that needs to be downloaded individually - there is no 'library' or packaged version of this.

Currently, the Packager has a set of 'standard' libraries that are always downloaded to support the launchpad; addtional libraries specified by the Applications will be added to the list.  This list is then inserted into the `data-sap-ui-libs` property of the SAP UI5 boot definition; this ensures that the necessary libraries are loaded as 'preload' JSON resources (in addition, the `data-sap-ui-preload` flag is set to true).  See the generated `index.html` for more details.

## Cordova Project Creation

After 'packaging' the project, you probably want to build the project using the Cordova CLI.  Eventually, this will be provided through the Cloud Build service, but until that happens you will need to run the Cordova CLI commands locally.

To do this, install Cordova using NPM.  Then you can run your own cordova commands to add the necessary plugins.

Alternatively, you can use the createCordova script included in the Packager bin directory. This script has options:

```
<packager>/bin/createCordova.sh -h

Usage: <path to script>/createCordova.sh [-v] -k <Kapsel plugin dir>
                 [-h]

-k Kapsel plugin location
-h help
-v verbose
```

Example usage:

```
<packager>/bin/createCordova.sh -k ~/SAP/Plugins/smp-plugins-dist-3.8.0-sap-10/plugins
```

