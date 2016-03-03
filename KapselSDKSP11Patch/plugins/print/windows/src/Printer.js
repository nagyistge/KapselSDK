var successCallback = null;
var printOptions = {};
var Params = [];

/*
* The manager asks for a print task to be scheduled. The user has to manually invoke
* the print charm after this function is executed.
* printEvent's type="Windows.Graphics.Printing.PrintTaskRequest"
* printEvent is the event containing the print task request object.
*/
var onPrintTaskRequested = function (printEvent) {
    var printTask = printEvent.request.createPrintTask("Print Manager", function (args) {
        printOptions = { //needed to be initialized here, not to crash fiori on Phone 8.1 (namespace protection in attachmentviewer is not satisfactory for this purpose)
            "binding": Windows.Graphics.Printing.StandardPrintTaskOptions.binding,
            "collation": Windows.Graphics.Printing.StandardPrintTaskOptions.collation,
            "colorMode": Windows.Graphics.Printing.StandardPrintTaskOptions.colorMode,
            "copies": Windows.Graphics.Printing.StandardPrintTaskOptions.copies,
            "duplex": Windows.Graphics.Printing.StandardPrintTaskOptions.duplex,
            "holePunch": Windows.Graphics.Printing.StandardPrintTaskOptions.holePunch,
            "inputBin": Windows.Graphics.Printing.StandardPrintTaskOptions.inputBin,
            "mediaSize": Windows.Graphics.Printing.StandardPrintTaskOptions.mediaSize,
            "mediaType": Windows.Graphics.Printing.StandardPrintTaskOptions.mediaType,
            "nup": Windows.Graphics.Printing.StandardPrintTaskOptions.nup,
            "orientation": Windows.Graphics.Printing.StandardPrintTaskOptions.orientation,
            "printQuality": Windows.Graphics.Printing.StandardPrintTaskOptions.printQuality,
            "staple": Windows.Graphics.Printing.StandardPrintTaskOptions.staple
        };
        //on tablet/desktop (win 8.1) the API is sync, phone(win 10) uses async
        try {
            args.setSource(MSApp.getHtmlPrintDocumentSource(document));
        } catch (e) {
            var promise = MSApp.getHtmlPrintDocumentSourceAsync(document);
            promise.then(function (source) {
                args.setSource(source);
            });
        }
        printTask.options.displayedOptions.clear();
        var param = null;
        for (param in Params) {
            printTask.options.displayedOptions.append(printOptions[Params[param]]);
        }

        // Completion event
        // param name="printTaskCompletionEvent" type="Windows.Graphics.Printing.PrintTaskCompleted"
        printTask.oncompleted = function (printTaskCompletionEvent) {
            // Notify the user about the failure
            if (printTaskCompletionEvent.completion === Windows.Graphics.Printing.PrintTaskCompletion.failed || Windows.Graphics.Printing.PrintTaskCompletion.abandoned) {
                WinJS.log && WinJS.log("Failed to print.", "printing", "error");
            }
            else if (printTaskCompletionEvent.completion === Windows.Graphics.Printing.PrintTaskCompletion.submitted) {
                //print task is submitted so we can say printing was successfull
                successCallback && successCallback();
            }
        }
    });
};

module.exports = {

    /* Print function, this initiates the flow and pops up the printing UI.(Charm)
    *
    * @param {Function?} successCallBack
    *      A callback function
    *      
    * @param {Array?} params
    *      Options for the print job. Params can be any of Windows.Graphics.Printing.StandardPrintTaskOptions' option properties.
    *      Overwrites all the default print options if used.
    *
    * @example
    *     window.Printer.print(function () {
    *           alert('print done.'); }, ["staple", "orientation"]);
    */
    print: function (successCallBack, page, params) {
        //Pre and post printing events
        //window.document.body.onbeforeprint = beforePrint;
        //window.document.body.onafterprint = afterPrint;
        successCallback = successCallBack;

        Params = params;

        //Show the print UI and start flow
        Windows.Graphics.Printing.PrintManager.showPrintUIAsync();
    },

    /*We must register every page on which we want to provide print functionality.
        * @example
        *     window.Printer.registerForPrintContract();
        */
    registerForPrintContract: function () {
        var printManager = Windows.Graphics.Printing.PrintManager.getForCurrentView();
        printManager.onprinttaskrequested = onPrintTaskRequested;
    }

};

require("cordova/exec/proxy").add("WinPrinter", module.exports);
