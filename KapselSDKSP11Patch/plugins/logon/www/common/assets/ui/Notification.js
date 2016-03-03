if (!window.sap) {
    window.sap = {};
}

if (!sap.logon) {
    sap.logon = {};
}

sap.logon.Notification = function (onActionCallback) {

    var show = function (notificationKey,notificationMessage,notificationTitle,extraInfo) {
        jQuery.sap.require("sap.m.MessageBox");
        var message = null;
        var title = null;
        if (notificationKey){
           message = getLocalizedString(notificationKey + '_MSG');
           title = getLocalizedString(notificationKey + '_TITLE');
        }
        
        if( message == null || message.trim().length == 0 ) {
            message = notificationMessage != null ? notificationMessage : '';
        }
        
        if( title == null || title.trim().length == 0 ) {
            title = notificationTitle != null ? notificationTitle : '';
        }
        sap.m.MessageBox.show(
                message,
                sap.m.MessageBox.Icon.NONE,
                title,
                [sap.m.MessageBox.Action.OK],
                function(oResponse) {
                    if (oResponse === sap.m.MessageBox.Action.OK) {
                        onActionCallback('ERRORACK', JSON.stringify({'key':notificationKey, 'extraInfo':extraInfo}));
                        setTimeout(function(){$('#BTN_SUBMIT').focus()}, 150);
                    }
                }
            );
    }    

    this.show = show;
}
