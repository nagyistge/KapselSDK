﻿
/**
 * cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Vinicius Linck 2014
 * Copyright (c) 2014, Tlantic
 */
    var scanner = require('kapsel-plugin-barcodescanner.CameraHandler');

 module.exports = {
	scan:function(win, fail) {
		'use strict';

	    try {
	        scanner.start(win, fail);
		} catch(e) {
			fail(e);
		}
	},

	encode:function(win,fail) {
		'use strict';

		fail('Not implemented');
	}

 };

 require('cordova/exec/proxy').add('BarcodeScanner', module.exports);

