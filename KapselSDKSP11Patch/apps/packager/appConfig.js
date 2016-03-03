    /**
     * appConfig - This object is loaded when the client is starting up. It
     * determines the default values of each of its keys. Once the application
     * has loaded the values at runtime, these values are copied into AppPreferences,
     * where they can be modified by the user. From that point on, any value in AppPreferences
     * will override any value of the same key here.
     */
    fiori_client_appConfig = {
        /**
         * appID - The appID used to identify the application to the data vault.
         * If you are using SMP, this should be consistent with the appID of the
         * target application. Note that this value is distinct from the packageName,
         * which is mainly used to identify your application in app stores.
         */
         "appID": "",        
         //"appID": "EPMRA_SHOP",  //sample code for testing server
        /**
         * appName - The application name to be used in the Cloud Build create step
         */
        "appName": "",
        //"appName": "EPM Shop",   //sample code for testing server
        /**
         * appVersion - The version to be attached to the app at build time
         */
        "appVersion": "",
        //"appVersion": "0.0.1",
        /**
         * bundleID - The app's reverse-domain identifier. eg. com.example.hello
         */
        "bundleID": "",
        /**
         * androidSigningID - Signing ID used by Cloud Build.  This ID is known by Cloud Build and corresponds to
         * a certificate uploaded into Mobile Secure and will be used when a build is triggered
         */
        "androidSigningID": "",
        /**
         * iosSigningID - Signing ID used by Cloud Build.  This ID is known by Cloud Build and corresponds to
         * a certificate/provisioning profile uploaded into Mobile Secure and will be used when a build is triggered
         */
        "iosSigningID": "",
        
        /**
	     * option property to set theme for UI5 library used by Fiori app, the default is "blue_crystal". This property
         * does not affect logon js view theme.
         */
        //"theme":"yourUI5Theme",

        /**
         * fioriURL - The full URL of the target application. If your application does not
         * use SMP, it will navigate directly to this URL once logon is completed. If your app
         * does use SMP, this URL is parsed and used in the following way:
         *   1. The URL scheme (which must be http or https) determines the inital value
         *      of the 'https' flag in the registration dialog. Similarly, the host and port
         *      in the URL determine their corresponding initial values in the registration dialog,
         *      with port defaulting to 443 if it's not specified.
         *   2. The URL suffix (everything after the host and port) is appended to the URL that
         *      the user registers to. Though this is likely to be the same as the scheme, host and
         *      port from 1., the user has the opportunity to change these values. In contrast,
         *      the suffix can't be changed.
         * If you are using SMP, you will ultimately want to specify the scheme, host and port of
         * your SMP server, followed by the suffix of the Fiori endpoint. For example:
         *
         * "https://my.smp.server:8081/sap/bc/ui5_ui5/ui2/ushell/shells/abap/FioriLaunchpad.html"
         */
         "fioriURL": "",
        //"fioriURL": "https://mo-a1c4fd27e.mo.sap.corp:8081",  //sample code for test sever
        /**
         * fioriURLIsSMP - Set this to true if your are using SMP.
         * If set to true, the application will perform SMP registration.
         */
         "fioriURLIsSMP": false,  
         //"fioriURLIsSMP": true,  //sample code for testing server
      
        /**
		 * certificate - Set the client certificate provider
         * for current version, only supports "afaria" as certificate provider. 
         * As afaria seeding data is not supported, so the only use of afaria is for client certificate. 
         */
         "certificate": "",

        /**
         * autoSelectSingleCert - automatically select the client certificate for mutual authentication
         * if only one client certificate is available. (Only supported by iOS)
         * Default value is false
         */
         "autoSelectSingleCert": false,
         
        /**
         * passcodePolicy - Specify the passcodePolicy of the data vault. Note: if you
         * are using SMP, the passcodePolicy is determined by the server.
         * For more information, see documentation of the logon plugin.
         * 
         */
         "passcodePolicy":  {
               "expirationDays":"0",
               "hasDigits":"false",
               "hasLowerCaseLetters":"false",
               "hasSpecialLetters":"false",
               "hasUpperCaseLetters":"false",
               "defaultAllowed":"true",
               "lockTimeout":"300",
               "minLength":"8",
               "minUniqueChars":"0",
               "retryLimit":"10"
          },
          
         
         //configuration for prepackaged fiori app.
         //In addition to the below settings, fioriUrl and appID are also used for prepackaged app
         "prepackaged" : true,
         
         "offline": false,
                  
         "singleApp" : "",
         
         "applications": [],
         /*"applications": [{   //sample code for testing server
		 		"id": "nw.epm.refapps.shop",
		 		"intent": "EPMProduct-shop",
		 		"description": "EPM Shop" 
			}
		 ]*/ 
		 		/**
		* keysize - this is an optional argument for the AfariaCertificateProvider, to set the bit rate of the public/private keys.
					If this value is empty, or invalid, it will be defaulted to 2048.
		*/
		"keysize": ""

    };
