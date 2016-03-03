/**
 * cordova is available under *either* the terms of the modified BSD license *or* the
 * MIT License (2008). See http://opensource.org/licenses/alphabetical for full text.
 *
 * Copyright (c) Vinicius Linck 2014
 * Copyright (c) 2014, Tlantic
 */
 /* Updated for Kapsel */

	var
        // barcode main objects
        zxing,
        sampler,
        element,

        // application  references
        isZxingInit = false,
        isDomReady = false,
        isVisible = false,
        isCancelled = false,
        raiseSuccess,
        raiseError,
		orientationSensor = null,
		captureSettings = null,
		overlay = null,
		overlayWindow = null,
		focusing = false,
		numberOfCamera = 1,
		cameraDirection = 2, //this is the rear camera
		isFlashEnabled = true,
		isSwitchCameraEnabled = true;

	// decoding barcode
	function readCode(decoder, pixels, format) {
		'use strict';

		var result;

		//Check whether pixels contains a not 0 number.
		//If all pixels are 0 then the zxing.decode method throws an IndexOutOfRangeException.
		if (pixels[0] != 0 || pixels[1] != 0 || pixels[2] != 0 || pixels[3] != 0) {
			console.log('- Decoding with ZXing...');
			result = zxing.decode(pixels, decoder.pixelWidth, decoder.pixelHeight, format);
		}

		if (result) {
			console.log('- DECODED: ', result);
			close(result);
		} else if (isCancelled) {
			console.log('- CANCELLED!');
			close({ "cancelled": "true" });
		} else {
			render();
		}
	}

	// decode pixel data
	function decodeBitmapStream(decoder, rawPixels) {
		console.log('- Decoding bitmap stream...');

		var pixels, format, pixelBuffer_U8;

		switch (decoder.bitmapPixelFormat) {

			// RGBA 16
			case Windows.Graphics.Imaging.BitmapPixelFormat.rgba16:
				console.log('- RGBA16 detected...');

				// allocate a typed array with the raw pixel data
				pixelBuffer_U8 = new Uint8Array(rawPixels);

				// Uint16Array provides a typed view into the raw bit pixel data
				pixels = new Uint16Array(pixelBuffer_U8.buffer);

				// defining image format
				format = (decoder.bitmapAlphaMode === Windows.Graphics.Imaging.BitmapAlphaMode.straight ? ZXing.BitmapFormat.rgba32 : ZXing.BitmapFormat.rgb32);
				break;

				// RGBA 8
			case Windows.Graphics.Imaging.BitmapPixelFormat.rgba8:
				console.log('- RGBA8 detected...');

				// for 8 bit pixel, formats, just use returned pixel array.
				pixels = rawPixels;

				// defining image format
				format = (decoder.bitmapAlphaMode === Windows.Graphics.Imaging.BitmapAlphaMode.straight ? ZXing.BitmapFormat.rgba32 : ZXing.BitmapFormat.rgb32);
				break;

				// BGRA 8
			case Windows.Graphics.Imaging.BitmapPixelFormat.bgra8:
				console.log('- BGRA8 detected...');

				// basically, this is still 8 bits...
				pixels = rawPixels;

				// defining image format
				format = (decoder.bitmapAlphaMode === Windows.Graphics.Imaging.BitmapAlphaMode.straight ? ZXing.BitmapFormat.bgra32 : ZXing.BitmapFormat.bgr32);
		}

		// checking barcode
		readCode(decoder, pixels, format);
	}

	//focus click handler
	function focus() {
		if (sampler != null && sampler.videoDeviceController != null) {
			if (sampler.videoDeviceController.focusControl.supported) {
				if (!focusing) {
					focusing = true;
					sampler.videoDeviceController.focusControl.focusAsync().done(function () {
						focusing = false;
					});
				}
			}
		}
	}

	//flash click handler
	function switchTorch() {
		if (sampler.videoDeviceController.torchControl.supported) {
			if (sampler.videoDeviceController.torchControl.enabled) {
				sampler.videoDeviceController.torchControl.enabled = false;
			} else {
				sampler.videoDeviceController.torchControl.enabled = true;
			}
		}
	}

	//switchcamera handler
	function switchCamera() {
		if (numberOfCamera > 1) {
			if (cameraDirection > 1) {
				cameraDirection = 1;
			} else {
				cameraDirection = 2;
			}
			releaseCamera();
			initCapture();
		}
	}

	// loads data stream
	function loadStream(buffer) {
		console.log('- Loading stream...');

		Windows.Graphics.Imaging.BitmapDecoder.createAsync(buffer).done(function (decoder) {
			console.log('- Stream has been loaded!');

			if (decoder) {
				console.log('- Decoding data...');

				decoder.getPixelDataAsync().then(

                    function onSuccess(pixelDataProvider) {
                    	console.log('- Detaching pixel data...');
                    	decodeBitmapStream(decoder, pixelDataProvider.detachPixelData());
                    }, raiseError);
			} else {
				raiseError(new Error('Unable to load camera image'));
			}

		}, raiseError);
	}


	// renders image
	function render() {
		console.log('- Sampling...');

		var frame, canvas = document.createElement('canvas');

		canvas.width = element.videoWidth;
		canvas.height = element.videoHeight;
		canvas.getContext('2d').drawImage(element, 0, 0, canvas.width, canvas.height);

		frame = canvas.msToBlob().msDetachStream();
		loadStream(frame);
	}

	// initialize ZXing
	function initZXing() {
		console.log('- Creating ZXing instance...');

		if (!isZxingInit) {
			console.log('- ZXing instance has been created!');

			isZxingInit = true;
			zxing = new ZXing.BarcodeReader();
		} else {
			console.log('- ZXing instance has been recovered!');
		}
	}

	// initialize MediaCapture
	function initSampler(settings) {
		console.log('- Initializing MediaCapture...');
		sampler = new Windows.Media.Capture.MediaCapture();
		return sampler.initializeAsync(settings);
	}

	// initializes dom element
	function createCameraElement() {
		console.log('- Creating DOM element...');

		if (!isDomReady) {
			isDomReady = true;

			//create video element
			element = document.createElement('video');
			element.style.display = 'none';
			element.style.position = 'absolute';
			element.style.left = '0px';
			element.style.top = '0px';
			element.style.zIndex = "900";
			element.style.width = '100%';
			element.style.height = '100%';

			//create overlay
			overlay = document.createElement('div');
			overlay.style.zIndex = "901";
			overlay.style.position = 'absolute';
			overlay.style.left = '0';
			overlay.style.top = '0';
			overlay.style.bottom = '0';
			overlay.style.right = '0';
			overlay.style.border = "100px rgba(0,0,0,0.5) solid";
			overlay.onclick = focus;

			//create red line to overlay
			var line = document.createElement('div');
			line.style.width = "100%";
			line.style.height = "2px";
			line.style.backgroundColor = "red";
			line.style.margin = "auto";
			line.style.position = "absolute";
			line.style.top = "0";
			line.style.bottom = "0";
			line.style.left = "0";
			line.style.right = "0";
			overlay.appendChild(line);

			//flash button
			if (isFlashEnabled && sampler.videoDeviceController.torchControl.supported) {
				var flashBtn = document.createElement("button");
				flashBtn.innerText = "Flash";
				flashBtn.style.cssText = "position:absolute;bottom: 0; display: inline-block; margin-bottom: -50px; z-order: 1001 ;";
				flashBtn.addEventListener('click', switchTorch, false);
				overlay.appendChild(flashBtn);
			}

			//switch camera button
			if (isSwitchCameraEnabled && (numberOfCamera > 1)) {
				var swBtn = document.createElement("button");
				swBtn.innerText = "Switch Camera";
				swBtn.style.cssText = "position:absolute;bottom:0; display: inline-block; margin-bottom: -50px; z-order: 1001 ;";
				swBtn.addEventListener('click', switchCamera, false);
				overlay.appendChild(swBtn);
			}

		    //cancel button only winrt (phone has back button)
		    // WinJS 4+ doesn't have isPhone, so we check the device type in userAgent
			if (WinJS.Utilities.isPhone == undefined && !(navigator.userAgent.indexOf("Windows Phone") > -1) || WinJS.Utilities.isPhone == false) {
				var cancelBtn = document.createElement("button");
				cancelBtn.innerText = "Cancel";
				cancelBtn.style.cssText = "position:absolute;bottom:0; display: inline-block; margin-bottom: -50px; z-order: 1001 ;";
				cancelBtn.addEventListener('click', cancel, false);
				overlay.appendChild(cancelBtn);
			}

			document.body.appendChild(element);
			document.body.appendChild(overlay);

			var margin = 0;
			if (flashBtn) {
				flashBtn.style.marginLeft = margin + "px";
				margin = margin + flashBtn.offsetWidth + 20;
			}
			if (swBtn) {
				swBtn.style.marginLeft = margin + "px";
				margin = margin + swBtn.offsetWidth + 20;
			}
			if (cancelBtn) {
				cancelBtn.style.marginLeft = margin + "px";
			}

			console.log('- Camera element has been created!');

		} else {
			console.log('- DOM is ready!');
		}
	}

	//change visibility handler
	function handleVisibility() {
		if (document.visibilityState === "hidden") {
			close({ cancelled: true });
		}
	}

	// cancel rendering
	function cancel(e) {
		isCancelled = true;
	}

	// close panel
	function close(result) {
		WinJS.Navigation.history.backStack.pop();
		releaseCamera();
		raiseSuccess(result);
	}

	function releaseCamera() {
		//remove event reciever
		if (orientationSensor != null) {
			orientationSensor.removeEventListener("orientationchanged", orientationChanged);
		}
		document.removeEventListener('msvisibilitychange', handleVisibility);

		//remove DOM
		element.style.display = 'none';
		element.pause();
		element.src = '';
		isVisible = false;
		document.body.removeChild(element);
		isDomReady = false;
		overlay.onclick = null;
		document.body.removeChild(overlay);
		overlay = null;
		if (sampler) {
			sampler.stopRecordAsync();
			sampler = null;
		}
	}

	//orientation change handler
	function orientationChanged(e) {
		var reuiredCaptureRotation = null;
		var frontCamera = numberOfCamera > 1 && cameraDirection == 1;
		if (!Windows.Media.Capture.CameraCaptureUI) {
			//phone
			switch (e.orientation) {
				case Windows.Devices.Sensors.SimpleOrientation.notRotated:
					if (frontCamera) {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise270Degrees;
					} else {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise90Degrees;
					}
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated90DegreesCounterclockwise:
					reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.none;
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated180DegreesCounterclockwise:
					if (frontCamera) {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise90Degrees;
					} else {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise270Degrees;
					}
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated270DegreesCounterclockwise:
					reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise180Degrees;
					break;
			}
		} else {
			switch (e.orientation) {
				case Windows.Devices.Sensors.SimpleOrientation.notRotated:
					reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.none;
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated90DegreesCounterclockwise:
					if (frontCamera) {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise90Degrees;
					} else {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise270Degrees;
					}
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated180DegreesCounterclockwise:
					reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise180Degrees;
					break;
				case Windows.Devices.Sensors.SimpleOrientation.rotated270DegreesCounterclockwise:
					if (!frontCamera) {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise90Degrees;
					} else {
						reuiredCaptureRotation = Windows.Media.Capture.VideoRotation.clockwise270Degrees;
					}
					break;
			}
		}

		if (sampler != null && reuiredCaptureRotation != null) {
			if (sampler.getPreviewRotation() != reuiredCaptureRotation) {
				sampler.setPreviewRotation(reuiredCaptureRotation);
			}
		}
	}

	// show camera panel
	function showPanel() {
		if (!isVisible) {
			isCancelled = false;
			isVisible = true;
			element.style.display = 'block';
			element.msZoom = true;
			element.src = URL.createObjectURL(sampler);
			element.play();
			WinJS.Navigation.history.backStack.push("CameraScreen")
		}
	}

	function initCapture() {
		captureSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
		captureSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.video;
		captureSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.videoPreview;
		// Search for available camera devices
		// This is necessary to detect which camera (front or back) we should use
		var expectedPanel = cameraDirection === 1 ? Windows.Devices.Enumeration.Panel.front : Windows.Devices.Enumeration.Panel.back;
		Windows.Devices.Enumeration.DeviceInformation.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture)
		.done(function (devices) {
			numberOfCamera = devices.length;
			if (devices.length > 0) {
			    devices.forEach(function (currDev) {
			        if (currDev.enclosureLocation) {
			            if (currDev.enclosureLocation.panel && currDev.enclosureLocation.panel == expectedPanel) {
			                captureSettings.videoDeviceId = currDev.id;
			            }
			        } else {
                        // enclosureLocation = null on Windows laptop. Just use the default camera.
			            captureSettings.videoDeviceId = currDev.id;
			        }
				});
			}

			initSampler(captureSettings).done(function () {
				console.log('- MediaCapture has been initialized successfully!');
				orientationSensor = Windows.Devices.Sensors.SimpleOrientationSensor.getDefault();
				if (orientationSensor) {
					orientationSensor.addEventListener("orientationchanged", orientationChanged);
				}

				if (!Windows.Media.Capture.CameraCaptureUI) {
					//phone
					var actualOrientation = orientationSensor.getCurrentOrientation();
					orientationChanged({ orientation: actualOrientation })
				}
				// preparing to show camera preview
				createCameraElement();
				if (!Windows.Media.Capture.CameraCaptureUI) {
					//phone
					if (numberOfCamera === 2 && cameraDirection === 1) {
						sampler.setRecordRotation(Windows.Media.Capture.VideoRotation.clockwise270Degrees);
					}
					if (sampler.videoDeviceController.focusControl.supported) {
						var i = Windows.Media.Devices.FocusSettings();
						i.mode = Windows.Media.Devices.FocusMode.auto;
						i.autoFocusRange = Windows.Media.Devices.AutoFocusRange.macro;
						i.disableDriverFallback = false;
						sampler.videoDeviceController.focusControl.configure(i);
						focusing = false;
					}
				}

				showPanel();
				setTimeout(render, 100);
			});
		}, raiseError);
	}

	//back click handler
	function handleBackClick() {
		if (WinJS.Navigation.history.backStack.length == 1) {
			if (WinJS.Navigation.history.backStack[0] == "CameraScreen") {
				cancel();
				WinJS.Application.removeEventListener("backclick", handleBackClick);
				return true;
			}
		}
		WinJS.Application.removeEventListener("backclick", handleBackClick);
	}

	// starting camera
	exports.start = function (win, fail) {
		console.log('- Starting camera device...');

		// saving references
		raiseSuccess = win;
		raiseError = fail;

		WinJS.Application.addEventListener("backclick", handleBackClick, false);

		// init objects
		initZXing();

		initCapture();
	};


	require('cordova/exec/proxy').add('CameraHandler', exports);


