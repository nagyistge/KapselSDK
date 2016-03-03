    module.exports = {

        length: function (success, fail, args) {
            var storageName = args[0];
            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.length().then(function (len) {
                success(len);
            },
            function (err) {
                _handleError(fail, err.message);
            });
        },


        key: function (success, fail, args) {
            var storageName = args[0];
            var index = args[1];


            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.key(index).then(
                function (result) {
                    _filterNullString(success, result);
                },
                function (err) {
                    _handleError(fail, err.message);
                });
        },

        getItem: function (success, fail, args) {
            var storageName = args[0];
            var key = args[1];


            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.getItem(key).then(
                function (result) {
                    _filterNullString(success, result);
                },
                function (err) {
                    _handleError(fail, err.message);
                });

        },

        setItem: function (success, fail, args) {
            var storageName = args[0];
            var key = args[1];
            var value = args[2];

            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.setItem(key, value).then(
                function () {
                    success();
                },
                function (err) {
                    _handleError(fail, err.message);
                });

        },

        removeItem: function (success, fail, args) {
            var storageName = args[0];
            var key = args[1];

            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.removeItem(key).then(
                function () {
                    success();
                },
                function (err) {
                    _handleError(fail, err.message);
                });

        },

        clear: function (success, fail, args) {
            var storageName = args[0];
            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.clear().then(
                function () {
                    success();
                },
                function (err) {
                    _handleError(fail, err.message);
                });

        },

        deleteStore: function (success, fail, args) {
            var storageName = args[0];

            var db = new SAP.EncryptedStorage.StorageDbAsync(storageName);
            db.deleteStore().then(
                function () {
                    success();
                },
                function (err) {
                    _handleError(fail, err.message);
                });

        },

        encryptFile: function (success, fail, args) {
        	var path = args[0];
        	var encryptionKey = args[1];

        	if (!encryptionKey) {
        		_handleError(fail, "Encryption error: Missing encryption key");
        		return;
        	}
        	if (!path) {
        		_handleError(fail, "Encryption error: Missing file path");
        		return;
        	}
        	var fileEncryption = new SAP.EncryptedStorage.FileEncryption();
        	fileEncryption.encryptFile(path, encryptionKey).then(
				function (result) {
					_filterNullString(success, result);
				},
				function (err) {
					_handleError(fail, err);
				});
        },

        decryptFile: function (success, fail, args) {
        	var path = args[0];
        	var encryptionKey = args[1];

        	if (!encryptionKey) {
        		_handleError(fail, "Decryption error: Missing encryption key");
        		return;
        	}
        	if (!path) {
        		_handleError(fail, "Decryption error: Missing file path");
        		return;
        	}
        	var fileEncryption = new SAP.EncryptedStorage.FileEncryption();
        	fileEncryption.decryptFile(path, encryptionKey).then(
				function (result) {
					_filterNullString(success, result);
				},
				function (err) {
					_handleError(fail, err);
				});
        }
    };


    function _handleError(errorCallback, errorMessage) {
        if (errorCallback != null) {
            var errorCode = 0;
            if (errorMessage != null && errorMessage !== undefined) {
                var ERROR_CODE_STR = "error code:";
                var chunks = errorMessage.split(ERROR_CODE_STR);
                if (chunks.length > 1) {
                    errorCode = parseInt(chunks[1]);
                }
            }
            errorCallback(errorCode > 1 ? errorCode : errorMessage);
        }
    }

    function _filterNullString(successCallback, result) {
        // look for null string key and convert it to null
        // since Windows Runtime Time Interface cannot support null string as parameter
        if (successCallback != null) {
            var nullPattern = SAP.EncryptedStorage.StorageDbAsync.nullStringPattern();
            var index = result.indexOf(nullPattern);
            successCallback((index >= 0) ? null : result);
        }
    }

    require("cordova/exec/proxy").add("EncryptedStorage", module.exports);

