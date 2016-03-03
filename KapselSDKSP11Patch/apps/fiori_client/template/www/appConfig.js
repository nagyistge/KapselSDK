    /**
     * appConfig - This object is loaded from index.html when the client is starting up. It
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
        /**
         * fioriURLIsSMP - Set this to true if your are using SMP.
         * If set to true, the application will perform SMP registration.
         */
        "fioriURLIsSMP": false,

		/*
         * The preference name in config.xml for creating proxy library instance based on the platform class name
         * currently only suppported for iOS platform
		 */
        //"proxyID":"appConnectProxy",

        /*
         * The proxy library url setting
         * currently only supported by iOS platform
         */
        //"proxyURL":"https://pssso.pulsesecuredemo.net",
        /**
		 * certificate - Set the client certificate provider
         * Fiori client has built-in support for afaria certificate provider. 
         *   for SMP registration, specify "afaria" as certificate provider.
         *   for no-SMP registration, specify "com.sap.afaria" as certificate provider.
         *   (On ios, "com.sap.afaria" is supported for both SMP and no-SMP registration).
         *   As afaria seeding data is not supported by fiori client, so the only use of afaria is for client certificate.
         *
         * When third party certificate provider is used, then set this property to the third party certificate provider's ID
         */
         "certificate": "",

        /**
         * autoSelectSingleCert - The property is only supported by iOS, and mainly used for Non-SMP registration.
         * When this property is set to true, if there is only one client certificate existing in application keychain, then
         *    the xmlHttpRequest will automatically select it for any client certificate challenges. 
         * This property is not used by Android client. For Android client, the user must manually select the certificate when 
         *    it is challenged by server at the first time, after that, the application will remember the user's selection and 
         *    automatically provide the selected certificate for the same challenges 
         * Default value is false
         */
         "autoSelectSingleCert": false,
        
         /**
	     * appName - The optional property is used for customizing the Fiori application name showing on logon screen. By default, the app name is "SAP Fiori Client" defined in resource file.
	     */
	     //"appName": "My App",
        
        /**
         * communicatorId - the communicator id for SMP/HCPms registration, default is "REST"
         */
         //"communicatorId" : "REST",
        
        /**
         * registrationServiceVersion - the registration url version for SMP/HCPms registraiton, only needed when default version used by client does not work
         */
         //"registrationServiceVersion" : "latest",
       
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
		  
    	/**
    	 * keysize - this is an optional argument for the AfariaCertificateProvider, to set the bit rate of the public/private keys.
                     If this value is empty, or invalid, it will be defaulted to 2048.
    	 */
    	 "keysize": "",

        /**
         * idpLogonURL - This url is used to reload idp logon with username/passcode passed from SAP authenticator for SSO.
         */
         "idpLogonURL": ""
    };
