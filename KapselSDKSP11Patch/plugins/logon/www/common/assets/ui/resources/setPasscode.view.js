sap.ui.jsview("setPasscode", {

    getControllerName: function() {
        return null;
    },

    /**
     * 
     * @param oController may be null
     * @returns {sap.ui.cre.Control}
     */
    createContent: function(oController) {
            if (!window.idIterator) {
                window.idIterator = 1;
            }
            var maxRuleWidth = 1;
            var jsView = this;
            var passcodeValid = false;

            var isObjectEmpty = function(object) {
                var key;
                for (key in object) {
                    if (object.hasOwnProperty(key)) {
                        return false;
                    }
                }
                return true;
            }

            var checkBoolean = function(anObject, key) {
                if (anObject && anObject.hasOwnProperty(key) && anObject[key]) {
                    if (typeof anObject[key] == "string") {
                        // It is a string.  If the string is "false" then return false.
                        return anObject[key].toLowerCase() != "false";
                    } else {
                        return true;
                    }
                }
                return false;
            }

            var checkBooleanWithTrueAsDefault = function(anObject, key) {
                if (anObject && anObject.hasOwnProperty(key)) {
                    if (typeof anObject[key] == "string" && anObject[key]) {
                        // It is a string.  If the string is "false" then return false.
                        return anObject[key].toLowerCase() != "false";
                    } else {
                        return anObject[key];
                    }
                }
                return true;
            }

            var isDefaultPolicy = function(passcodePolicy) {
                if (    passcodePolicy.minLength != 8 || 
                        checkBoolean(passcodePolicy,"hasUpperCaseLetters") ||
                        checkBoolean(passcodePolicy,"hasLowerCaseLetters") ||
                        checkBoolean(passcodePolicy,"hasSpecialLetters") ||
                        checkBoolean(passcodePolicy,"hasDigits") ||
                        (passcodePolicy.hasOwnProperty("minUniqueChars") && passcodePolicy.minUniqueChars > 0) ||
                        !checkBooleanWithTrueAsDefault(passcodePolicy,"defaultAllowed") ) {
                    return false;
                }
                return true;
            }

            var getPasscodePolicyInstructions = function(passcodePolicy){
                var panelHBoxes = [];
                console.log("passcode policy: " + JSON.stringify(passcodePolicy));
                if (passcodePolicy == null || isObjectEmpty(passcodePolicy) || isDefaultPolicy(passcodePolicy)) {
                    var defaultRulesText = new sap.m.Text('text' + idIterator++);
                    defaultRulesText.setText(getLocalizedString("SCR_SET_PASSCODE_DEFAULT_RULE"));
                    var defaultRuleHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [defaultRulesText]
                    });
                    panelHBoxes.push(defaultRuleHBox);
                }else{
                    var instructionText = new sap.m.Text('text' + idIterator++);
                    instructionText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_STRING"));
                    var instructionHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [instructionText]
                    });
                    panelHBoxes.push(instructionHBox);
                }
                return panelHBoxes;
            }

            var getPasscodePolicyTextAndChecksHBoxes = function(passcodePolicy, currentPasscode){
                var panelHBoxes = [];
                passcodeValid = true;
                if (passcodePolicy == null || isObjectEmpty(passcodePolicy)) {
                    return panelHBoxes;
                }
                var checkMark = "\u2713";
                if (passcodePolicy.hasOwnProperty("minLength")) {
                    var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                        textAlign:sap.ui.core.TextAlign.Leading
                    });
                    var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                    var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                        width: "20px"
                    });
                    var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [placeholderHBox, policyText, policyChecks]
                    });
                    var minLength = passcodePolicy["minLength"];
                    policyText.setText(formatString(getLocalizedString("SCR_SET_PASSCODE_RULE_MINIMUM_CHARACTERS"), minLength));
                    if (currentPasscode.length >= minLength) {
                        policyChecks.setText(checkMark);
                    } else {
                        passcodeValid = false;
                    }
                    panelHBoxes.push(panelHBox);
                }
                if (checkBoolean(passcodePolicy,"hasUpperCaseLetters")) {
                    var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                        textAlign:sap.ui.core.TextAlign.Leading
                    });
                    var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                    var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                        width: "20px"
                    });
                    var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [placeholderHBox, policyText, policyChecks]
                    });
                    policyText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_UPPER_CASE"));
                    if (currentPasscode.match(/[A-Z]/) != null) {
                        policyChecks.setText(checkMark);
                    } else {
                        passcodeValid = false;
                    }
                    panelHBoxes.push(panelHBox);
                }
                if (checkBoolean(passcodePolicy,"hasLowerCaseLetters")) {
                    var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                        textAlign:sap.ui.core.TextAlign.Leading
                    });
                    var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                    var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                        width: "20px"
                    });
                    var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [placeholderHBox, policyText, policyChecks]
                    });
                    policyText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_LOWER_CASE"));
                    if (currentPasscode.match(/[a-z]/) != null) {
                        policyChecks.setText(checkMark);
                    } else {
                        passcodeValid = false;
                    }
                    panelHBoxes.push(panelHBox);
                }
                if (checkBoolean(passcodePolicy,"hasSpecialLetters")) {
                    var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                        textAlign:sap.ui.core.TextAlign.Leading
                    });
                    var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                    var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                        width: "20px"
                    });
                    var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [placeholderHBox, policyText, policyChecks]
                    });
                    policyText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_SPECIAL_CHARACTER"));
                    if (currentPasscode.match(/[^a-zA-Z0-9]/) != null) {
                        policyChecks.setText(checkMark);
                    } else {
                        passcodeValid = false;
                    }
                    panelHBoxes.push(panelHBox);
                }
                if (checkBoolean(passcodePolicy,"hasDigits")) {
                    var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                        textAlign:sap.ui.core.TextAlign.Leading
                    });
                    var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                    var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                        width: "20px"
                    });
                    var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                        items: [placeholderHBox, policyText, policyChecks]
                    });
                    policyText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_DIGITS"));
                    if (currentPasscode.match(/[0-9]/) != null) {
                        policyChecks.setText(checkMark);
                    } else {
                        passcodeValid = false;
                    }
                    panelHBoxes.push(panelHBox);
                }
                if (passcodePolicy.hasOwnProperty("minUniqueChars")) {
                    var minUniqueChars = passcodePolicy["minUniqueChars"];
                    if (minUniqueChars > 0) {
                        var policyText = new sap.m.Text( 'passcode_policy_text' + idIterator++, {
                            textAlign:sap.ui.core.TextAlign.Leading
                        });
                        var policyChecks = new sap.m.Text( 'passcode_policy_checks' + idIterator++, {});
                        var placeholderHBox = new sap.m.HBox( 'placeholder_hbox' + idIterator++, {
                            width: "20px"
                        });
                        var panelHBox = new sap.m.HBox( 'panel_hbox' + idIterator++, {
                            items: [placeholderHBox, policyText, policyChecks]
                        });
                        policyText.setText(getLocalizedString("SCR_SET_PASSCODE_RULE_MINIMUM") + " " + minUniqueChars + " " + getLocalizedString("SCR_SET_PASSCODE_RULE_UNIQUE_CHARACTERS"));
                        var charsAsKeys = {};
                        var actualUniqueChars = 0;
                        for (var i = 0; i < currentPasscode.length; i++ ){
                            var currentChar = currentPasscode.substring(i, i+1);
                            if (!charsAsKeys[currentChar]) {
                                charsAsKeys[currentChar] = true;
                                actualUniqueChars++;
                                if (actualUniqueChars >= minUniqueChars) {
                                    break;
                                }
                            }
                        }
                        if (actualUniqueChars >= minUniqueChars) {
                            policyChecks.setText(checkMark);
                        } else {
                            passcodeValid = false;
                        }
                        panelHBoxes.push(panelHBox);
                    }
                }
                return panelHBoxes;
            }

            var data = window.iab.context;
            if (data.passcode == null) {
                data.passcode = "";
            }
            if (data.passcode_CONFIRM == null) {
                data.passcode_CONFIRM = "";
            }
            if (data.passcodeEnabled == null) {
                data.passcodeEnabled = true;
            }

            // create JSON model instance
            var oModel = new sap.ui.model.json.JSONModel();
            // set the data for the model
            oModel.setData(data);
            // set the model to the core
            sap.ui.getCore().setModel(oModel);

            // This function calculates how wide the vbox containing all the controls should be.
            var calculateDisplayWidth = function(totalWidth) {
                var displayWidth = 0;
                if (totalWidth <= 360) {
                    displayWidth = totalWidth*0.9;
                } else {
                    // On a wide screen, use a little more space
                    displayWidth = 324 + ((totalWidth - 360)*0.1);
                }
                return Math.round(displayWidth);
            }

            var vbox = new sap.m.VBox('setPasscodeScreen');

            var passcodePolicy = window.iab.context.policyContext;

            var inputPassword = new sap.m.Input( 'Password_item', {
                type:sap.m.InputType.Password,
                value:"{/passcode}",
                placeholder:getLocalizedString("SCR_SET_PASSCODE_PLACEHOLDER_PASSCODE"),
                liveChange:function(){
                    inputPasswordConfirm.setValueState(sap.ui.core.ValueState.None);
                    inputPassword.setValueState(sap.ui.core.ValueState.None);
                    var panelHBoxes = getPasscodePolicyTextAndChecksHBoxes(passcodePolicy, this.getValue(), policyText, policyChecks);
                    panelVBox.removeAllItems();
                    panelVBox.addItem(toolbarLabel);
                    var instructionItems = getPasscodePolicyInstructions(passcodePolicy);
                    for(var i=0;i<instructionItems.length;i++) {
                        panelVBox.addItem(instructionItems[i]);
                    }
                    for(var i=0;i<panelHBoxes.length;i++) {
                        panelHBoxes[i].getItems()[0].setWidth(maxRuleWidth + "px");
                        panelVBox.addItem(panelHBoxes[i]);
                    }
                }
            });

            var inputPasswordConfirm = new sap.m.Input( 'Password_confirm_item', {
                type:sap.m.InputType.Password,
                value:"{/passcode_CONFIRM}",
                placeholder:getLocalizedString("SCR_SET_PASSCODE_PLACEHOLDER_CONFIRM_PASSCODE"),
                liveChange:function(){
                    inputPasswordConfirm.setValueState(sap.ui.core.ValueState.None);
                    inputPassword.setValueState(sap.ui.core.ValueState.None);
                }
            });

            var buttonOKPress = function(){
                data.passcode = inputPassword.getValue();
                data.passcode_CONFIRM = inputPasswordConfirm.getValue();
                if (!data.passcodeEnabled) {
                    // The passcode is disabled so don't validate it, just submit.
                    window.iab.triggerEventForJsView("SUBMIT", data);
                } else if (!passcodeValid) {
                    // passcode doesn't meet all the requirements
                    // Do the work in a setTimeout because otherwise the button steals the
                    // focus back (and if the focus is not on the input control then the
                    // value state text is not visible).
                    buttonOK.setEnabled(false);
                    setTimeout(function() {
                        inputPassword.focus();
                        inputPassword.setValueStateText(getLocalizedString("SCR_SET_PASSCODE_REQUIREMENTS_NOT_MET"));
                        inputPassword.setValueState(sap.ui.core.ValueState.Error);
                        buttonOK.setEnabled(true);
                    },500);
                } else if (inputPasswordConfirm.getValue() !== inputPassword.getValue()) {
                    // passcodes do not match
                    // Do the work in a setTimeout because otherwise the button steals the
                    // focus back (and if the focus is not on the input control then the
                    // value state text is not visible).
                    buttonOK.setEnabled(false);
                    setTimeout(function() {
                        inputPasswordConfirm.focus();
                        inputPasswordConfirm.setValueStateText(getLocalizedString("SCR_SET_PASSCODE_MUST_MATCH"));
                        inputPasswordConfirm.setValueState(sap.ui.core.ValueState.Error);
                        buttonOK.setEnabled(true);
                    },500);
                } else {
                    // The passcode is enabled, meets requirements, and matches.  Submit it.
                    window.iab.triggerEventForJsView("SUBMIT", data);
                }
            }
            var buttonOK = new sap.m.Button( 'button_ok', {
                type:sap.m.ButtonType.Emphasized,
                text:getLocalizedString("BUTTON_OK"),
                width:"100%",
                press : buttonOKPress
            });

            var policyText = new sap.m.Text( 'passcode_policy_text', {
                textAlign:sap.ui.core.TextAlign.Leading
            });
            var policyChecks = new sap.m.Text( 'passcode_policy_checks', {});
            var panelHBoxes = getPasscodePolicyTextAndChecksHBoxes(passcodePolicy, inputPassword.getValue());
            //if appName is specified by screencontext, then using it otherwise loading it from resource file
            var appName = window.iab.context.appName;
            if (!appName){
                appName = getLocalizedString("SCH_CHOOSE_DEMO_MODE_TITLE");
            }

            var toolbarLabel = new sap.m.Label( 'passcode_policy_toolbar_label', {
                text: formatString(getLocalizedString("SCR_SET_PASSCODE_INSTRUCTION"), appName),
                design: sap.m.LabelDesign.Bold
            });
            var policyCheckItems = [toolbarLabel];
            var instructionItems = getPasscodePolicyInstructions(passcodePolicy);
            for(var i=0;i<instructionItems.length;i++) {
                policyCheckItems.push(instructionItems[i]);
            }
            for(var i=0;i<panelHBoxes.length;i++) {
                policyCheckItems.push(panelHBoxes[i]);
            }
            var panelVBox = new sap.m.VBox('panel_vbox', {
                items: policyCheckItems
            });
            var panel = new sap.m.Panel( 'passcode_policy_panel', {
                content: [panelVBox]
            });

            var buttonDisable = new sap.m.Button( 'button_disable', {
                text:getLocalizedString("SCR_SET_PASSCODE_DISABLE_PASSCODE"),
                width:"100%",
                visible:checkBooleanWithTrueAsDefault(passcodePolicy,"defaultAllowed"),
                press:function(){
                    data.passcodeEnabled = false;
                    window.iab.triggerEventForJsView("SUBMIT", data);
                }
            });

            var vboxPlaceholder1 = new sap.m.HBox( 'vbox_placeholder1', {
                height:"25px"
            });

            var vboxPlaceholder2 = new sap.m.HBox( 'vbox_placeholder2', {
                height:"10px"
            });

            var vboxPlaceholder3 = new sap.m.HBox( 'vbox_placeholder3', {
                height:"25px"
            });

            vbox.addItem(vboxPlaceholder1);
            vbox.addItem(panel);
            vbox.addItem(vboxPlaceholder2);
            vbox.addItem(inputPassword);
            vbox.addItem(inputPasswordConfirm);
            vbox.addItem(vboxPlaceholder3);
            vbox.addItem(buttonOK);
            vbox.addItem(buttonDisable);

            vboxPageContent = new sap.m.VBox('vbox_content', {
                alignItems:sap.m.FlexAlignItems.Center,
                justifyContent:sap.m.FlexJustifyContent.Start,
                items:[vbox]
            });

            var sapLogo = new sap.m.Image( 'sap_logo', {
                src:"img/sapLogo.png",
                height:"40px"
            });

            var copyright = new sap.m.Text( 'copyright', {
                text:getLocalizedString("COPYRIGHT")
            });

            var footerHBox = new sap.m.HBox('panel_footer_hbox', {
                justifyContent:sap.m.FlexJustifyContent.SpaceBetween,
                width: "90%",
                items: [sapLogo, copyright]
            });

            vboxOuter = new sap.m.FlexBox('vbox_outer', {
                direction:sap.m.FlexDirection.Column,
                justifyContent:sap.m.FlexJustifyContent.SpaceBetween,
                alignItems:sap.m.FlexAlignItems.Center,
                items:[vboxPageContent, footerHBox],
                fitContainer: true
            });

            // If the screen width is available, pre-calculate how wide the vbox should be
            // so that the user can't see it draw as the wrong size then quickly redraw as
            // the correct size.
            if ($(window).width()) {
                vbox.setWidth(calculateDisplayWidth($(window).width()) + "px");
                copyright.setWidth(Math.round($(window).width()/2) + "px");
            }

            sap.ui.core.ResizeHandler.register(vboxOuter, function(e){
                vbox.setWidth(calculateDisplayWidth(e.size.width) + "px");
                copyright.setWidth(Math.round(e.size.width/2) + "px");
                var domRef = jsView.getDomRef();
                if( $(window).height() && $(window).height() > domRef.offsetHeight) {
                    // The view is not taking up the whole screen height, force it.
                    jsView.setHeight($(window).height() + "px");
                }
            });

            vboxOuter.onAfterRendering = function() {
                var inputs = this.$().find(':input');
                inputs.attr('autocapitalize', 'off');
                inputs.attr('autocorrect', 'off');
                inputs.attr('autocomplete', 'off');
                // Do not request focus on the passcode screens.
                // The UI experts don't like it!
                sap.m.FlexBox.prototype.onAfterRendering.apply(this, arguments);
            }
            window.iab.page.setShowHeader(false);
            this.onAfterRendering = function() {
                var domRef = this.getDomRef();
                var newHeight = $(window).height();
                if (window.iab.heightWithoutKeyboard != null) {
                    // If we know the height of the screen without the keyboard, use that
                    // (since the keyboard will affect $(window).height()).
                    newHeight = window.iab.heightWithoutKeyboard;
                }
                if( newHeight && newHeight > domRef.offsetHeight) {
                    // The view is not taking up the whole screen height, force it.
                    this.setHeight(newHeight + "px");
                }
                if (maxRuleWidth == 1) {
                    var items = panelHBoxes;
                    // Iterate through the rules and find the widest one
                    for (var i=0;i<items.length;i++) {
                        var domRef = items[i].getItems()[0].getDomRef();
                        if(domRef != null) {
                            maxRuleWidth = maxRuleWidth < domRef.clientWidth ? domRef.clientWidth : maxRuleWidth;
                        }
                    }
                    // Make all rules as wide as the widest rule.  This way the check
                    // marks will all line up vertically.
                    if (maxRuleWidth > 1) {
                        for (var i=0;i<items.length;i++) {
                            items[i].getItems()[0].setWidth(maxRuleWidth + "px");
                        }
                    }
                }
            }
            
            window.onkeyup = function(e) {
                var key = e.keyCode ? e.keyCode : e.which;

                 if (key == 13) {
                     // GO button pressed on Android keyboard
                     buttonOKPress();
                 }
            }
            
            return vboxOuter;

    }
});
