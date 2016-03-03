// 3.11.4-SNAPSHOT

//PhoneGap Calendar plugin(v4.4.4) - https://github.com/EddyVerbruggen/Calendar-PhoneGap-Plugin
//Eddy Verbruggen - The MIT License (MIT)

"use strict";

function Calendar() {
}


/**
 * Create an event in Default Calendar
 * 
 * @param {String} title event title
 * @param {String} location event location
 * @param {String} notes event notes/description
 * @param {Date} startDate event start date
 * @param {Date} endDate event end date
 * @param {function} successCallback Callback function called when the event has been successfully created.
 * @param {function} errorCallback Callback function called when an error occurs while creating the event.
 * 
 * @example
 * var startDate = new Date(2014,8,17,18,30,0,0,0); // caution!!: month 0 = january, 11 = december
 * var endDate = new Date(2014,8,17,19,30,0,0,0);
 * var title = "My school event";
 * var mylocation = "school";
 * var notes = "Some notes about this event.";
 * var success = function(message) { alert("Success: " + JSON.stringify(message)); };
 * var error = function(message) { alert("Error: " + JSON.stringify(message)); };
 *
 * window.plugins.calendar.createEvent(title,mylocation,notes,startDate,endDate,success,error);      
 */               
Calendar.prototype.createEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
    if (!( (Object.prototype.toString.call(startDate) === '[object Date]') && (Object.prototype.toString.call(endDate) === '[object Date]') ) ) {
        errorCallback("startDate and endDate must be JavaScript Date Objects");
    } else {
        cordova.exec(successCallback, errorCallback, "Calendar", "createEventInDefaultCalendar", [{
                                                                                            "title": title,
                                                                                            "location": location,
                                                                                            "notes": notes,
                                                                                            "startTime": startDate.getTime(),
                                                                                            "endTime": endDate.getTime()
                                                                                            }])
    }
};
               

/**
 * delete an event in Default Calendar
 *
 * @param {String} title event title
 * @param {String} location event location
 * @param {String} notes event notes/description
 * @param {Date} startDate event start date
 * @param {Date} endDate event end date
 * @param {function} successCallback Callback function called when the event has been successfully deleted.
 * @param {function} errorCallback Callback function called when an error occurs while deleting the event.
 * 
 * @example
 * var startDate = new Date(2014,8,17,18,30,0,0,0); // caution!!: month 0 = january, 11 = december
 * var endDate = new Date(2014,8,17,19,30,0,0,0);
 * var title = "My school event";
 * var mylocation = "school";
 * var notes = "Some notes about this event.";
 * var success = function(message) { alert("Success: " + JSON.stringify(message)); };
 * var error = function(message) { alert("Error: " + JSON.stringify(message)); };
 *
 * window.plugins.calendar.deleteEvent(newTitle,mylocation,notes,startDate,endDate,success,error);
 */ 
Calendar.prototype.deleteEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
    if (!( (Object.prototype.toString.call(startDate) === '[object Date]') && (Object.prototype.toString.call(endDate) === '[object Date]') ) ) {
        errorCallback("startDate and endDate must be JavaScript Date Objects");
    } else {
        cordova.exec(successCallback, errorCallback, "Calendar", "deleteEvent", [{
            "title": title,
            "location": location,
            "notes": notes,
            "startTime": startDate.getTime(),
            "endTime": endDate.getTime()
        }])
    }

    
};


/**
 * find an event in Default Calendar
 *
 * @param {String} title event title
 * @param {String} location event location
 * @param {String} notes event notes/description
 * @param {Date} startDate event start date
 * @param {Date} endDate event end date
 * @param {function} successCallback Callback function called when the event has been successfully found.
 * @param {function} errorCallback Callback function called when an error occurs while finding the event.
 * 
 * @example
 * var startDate = new Date(2014,8,17,18,30,0,0,0); // caution!!: month 0 = january, 11 = december
 * var endDate = new Date(2014,8,17,19,30,0,0,0);
 * var title = "My school event";
 * var mylocation = "school";
 * var notes = "Some notes about this event.";
 * var success = function(message) { alert("Success: " + JSON.stringify(message)); };
 * var error = function(message) { alert("Error: " + JSON.stringify(message)); };
 *
 * window.plugins.calendar.findEvent(title,mylocation,notes,startDate,endDate,success,error);
 */ 
Calendar.prototype.findEvent = function (title, location, notes, startDate, endDate, successCallback, errorCallback) {
    if (!( (Object.prototype.toString.call(startDate) === '[object Date]') && (Object.prototype.toString.call(endDate) === '[object Date]') ) ) {
        errorCallback("startDate and endDate must be JavaScript Date Objects");
    } else {
        cordova.exec(successCallback, errorCallback, "Calendar", "findEvent", [{
            "title": title,
            "location": location,
            "notes": notes,
            "startTime": startDate.getTime(),
            "endTime": endDate.getTime()
        }])
    }
};



Calendar.install = function () {
  if (!window.plugins) {
    window.plugins = {};
  }

  window.plugins.calendar = new Calendar();
  return window.plugins.calendar;
};

cordova.addConstructor(Calendar.install);

