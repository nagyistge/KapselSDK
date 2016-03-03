(function () {
    // Get the background task details
    var backgroundTask = Windows.UI.WebUI.WebUIBackgroundTaskInstance.current;
    var settings = Windows.Storage.ApplicationData.current.localSettings;
    var taskName = backgroundTask.task.name;

    console.log("Background task \"" + taskName + "\" starting...");

    // Store the content received from the notification so it can be retrieved
    // from the UI.
    var notificationDetails = backgroundTask.triggerDetails;
    settings.values[taskName] =  notificationDetails.content;

    console.log("Background \"" + taskName + "\" completed!");

    // Close the instance running the task
    close();
    
})();