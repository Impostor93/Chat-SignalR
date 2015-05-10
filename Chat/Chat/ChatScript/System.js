/// <reference path="Extensions.js" />
var Chat = Chat || {}
Chat.system = Chat.system || {}

Chat.system.isNullOrEmptyObject = function (object) { return this.isNull(object) || this.isEmptyObject(object); }
Chat.system.isNull = function (object) { return object == null; }
Chat.system.isEmptyObject = function (object) {
    if (object == null) return true;

    if (object.length > 0) return false;
    if (object.length === 0 || object === "[]" || object === "{}") return true;

    for (var key in object) {
        if (hasOwnProperty.call(object, key)) return false;
    }

    return true;
}

Chat.system.isUndefined = function (object) { return typeof (object) == "undefined"; }
Chat.system.isNullOrUndefined = function (object) { return this.isNull(object) || this.isUndefined(object); }
Chat.system.isNullOrUndefinedOrEmptyObject = function (object) { return this.isNull(object) || this.isUndefined(object) || this.isEmptyObject(object); }

Chat.system.isFunction = function (object) { return typeof (object) === "function"; }

Chat.system.createElement = function (Type, Ids, ClassName, InnerHtml, Visibility, Attributes) {
    var elment = document.createElement(Type);

    if (ClassName != undefined)
        elment.className = ClassName;

    if (Ids != undefined)
        elment.id = Ids;

    if (InnerHtml != undefined)
        elment.innerHTML = InnerHtml;

    if (Visibility != undefined)
        elment.style.display = Visibility;

    if (Attributes != undefined) {
        for (var key in Attributes) {
            if (Attributes.hasOwnProperty(key)) {
                elment.setAttribute(key, Attributes[key]);
            }
        }
    }

    return elment;
}
Chat.system.RemoveElmenet = function (Parent, Child) {
    var parentElment;
    var childElment;

    if (typeof Parent == "string")
        parentElment = GetElement(Parent);
    else if (typeof Parent == "object")
        parentElment = Parent;

    if (typeof Child == "string")
        childElment = GetElement(Child);
    else if (typeof Child == "object")
        childElment = Child;
    try {
        parentElment.removeChild(Child);
    } catch (ex) {
        debugger;
    }
}
Chat.system.GetElement = function (Id) {
    return document.getElementById(Id);
}
Chat.system.getElementsByAttribute = function (attributeName) {
    return document.querySelectorAll("[" + attributeName + "]");
}
Chat.system.getElementsByAttributeFromElement = function (element, attributeName) {
    return element.querySelectorAll("[" + attributeName + "]");
}
Chat.system.getElementsByAttributeAndValue = function (attributeName, value) {
    return document.querySelectorAll("[" + attributeName + "='" + value + "']");
}
Chat.system.getElementsByAttributeAndValueFromElement = function (element, attributeName, value) {
    return element.querySelectorAll("[" + attributeName + "='" + value + "']");
}
Chat.system.AppendChild = function (Parent, Child, InserBefore) {
    var parentElment;
    var childElment;

    if (typeof Parent == "string")
        parentElment = this.GetElement(Parent);
    else if (typeof Parent == "object")
        parentElment = Parent;

    if (typeof Child == "string")
        childElment = this.GetElement(Child);
    else if (typeof Child == "object")
        childElment = Child;

    if (InserBefore != undefined && InserBefore == true) {
        parentElment.appendChild(childElment)
        parentElment.insertBefore(childElment, parentElment.lastChild)
    } if (InserBefore != undefined && InserBefore == false) {
        parentElment.appendChild(childElment)
        parentElment.insertBefore(childElment, parentElment.firstChild)
    }
    else
        parentElment.appendChild(childElment);
}

Chat.system.addEventListener = function (element, event, funk, useCapture) {
    if (this.isNullOrUndefined(element.addEventListener)) {
        element.attachEvent("on" + event, funk);
    } else {
        element.addEventListener(event, funk, this.isNullOrUndefined(useCapture) ? false : useCapture);
    }
}
Chat.system.removeEventListener = function (element, event, funk, useCapture) {
    if (this.isNullOrUndefined(element.removeEventListener)) {
        element.detachEvent("on" + event, funk);
    } else {
        element.removeEventListener(event, funk, this.isNullOrUndefined(useCapture) ? false : useCapture);
    }
}

Chat.system.isDateInChatFormat = function (date) {
    if (this.isNullOrUndefined(date))
        return false;

    var hoursAndDate = date.split("-");
    if (this.isNullOrUndefined(hoursAndDate) || hoursAndDate.length != 2)
        return false;

    if (this.isNullOrUndefined(hoursAndDate[0]))
        return false;

    var minuteAndHour = hoursAndDate[0].split(":");
    if (this.isNullOrUndefined(minuteAndHour) || minuteAndHour.length != 2)
        return false;

    if (this.isNullOrUndefined(hoursAndDate[1]))
        return false;

    var dateParts = hoursAndDate[1].split("/");

    if (this.isNullOrUndefined(dateParts) || dateParts.length != 3)
        return false;

    return true;
}

Chat.system.logError = function (error) {
    console.log(error);
    //alert(error);
    //debugger;
}
Chat.system.debugLog = function (error) {
    this.logError(error);
}

Chat.system.dateDiff = {
    inMinutes: function (d1, d2) {
        var diffMs = (d1 - d2);
        return Math.round(((diffMs % 86400000) % 3600000) / 60000); // minutes
    },
    inHours: function (d1, d2) {
        var diffMs = (d1 - d2);
        return Math.round((diffMs % 86400000) / 3600000); // hours
    },
    inDays: function (d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2 - t1) / (24 * 3600 * 1000));
    },

    inWeeks: function (d1, d2) {
        var t2 = d2.getTime();
        var t1 = d1.getTime();

        return parseInt((t2 - t1) / (24 * 3600 * 1000 * 7));
    },

    inMonths: function (d1, d2) {
        var d1Y = d1.getFullYear();
        var d2Y = d2.getFullYear();
        var d1M = d1.getMonth();
        var d2M = d2.getMonth();

        return (d2M + 12 * d2Y) - (d1M + 12 * d1Y);
    },

    inYears: function (d1, d2) {
        return d2.getFullYear() - d1.getFullYear();
    }
}