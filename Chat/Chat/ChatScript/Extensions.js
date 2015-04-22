//String extension
String.isEmpty = function (obj) { return obj == "" }
String.prototype.isEmpty = function () { return this == "" }
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); };
String.prototype.ltrim = function () { return this.replace(/^\s+/, ''); };
String.prototype.rtrim = function () { return this.replace(/\s+$/, ''); };
String.prototype.fulltrim = function () { return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); };
String.stringFormat = function () {
    var stringForFormat = arguments[0];
    if (!stringForFormat || typeof(stringForFormat) != "string")
        throw Error("invalid string for format");

    for (var i = 1; i < arguments.length; i++)
    {
        stringForFormat = stringForFormat.replace("{" + (i-1) + "}", arguments[i]);
    }

    return stringForFormat;
}
//Array extension
Array.prototype.lastOrDefault = function () {
    var sys = Chat.system;
    var lastElement = this.length > 0 && !sys.isNullOrUndefinedOrEmptyObject(this) ? this[this.length - 1] : null;

    if (sys.isNullOrUndefined(lastElement)) {
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                var arr = Object.keys(this).map(function (k) { return this[k] });
                return arr.length > 0 && !sys.isNullOrUndefinedOrEmptyObject(arr) ? arr[arr.length - 1] : null;
            }
        }
    } else{
        return lastElement;
    }
}
Array.prototype.firstOrDefault = function () {
    var sys = Chat.system;
    var firstElement = this.length > 0 && !sys.isNullOrUndefinedOrEmptyObject(this) ? this[0] : null;

    if (sys.isNullOrUndefined(firstElement)) {
        for (var key in this) {
            if (this.hasOwnProperty(key)) {
                return this[key];
            }
        }
    } else {
        return firstElement;
    }
}
Array.prototype.contains = function (obj) {
    var sys = Chat.system;
    if (sys.isFunction(this.indexOf)) {
        return this.indexOf(obj) != -1;
    } else {
        for (var i in this)
        {
            if (obj === this[i])
                return true;
        }

        return false;
    }
}
Array.prototype.insert = function (index, item) {
    this.splice(index, 0, item);
};

if (!Object.keys) Object.keys = function(o) {
    if (o !== Object(o))
        throw new TypeError('Object.keys called on a non-object');
    var k=[],p;
    for (p in o) if (Object.prototype.hasOwnProperty.call(o,p)) k.push(p);
    return k;
}
if (!Array.prototype.indexOf) {
    Array.prototype.indexOf = function (obj)
    {
        for (var i = 0; i < this.length; i++) {
            if (obj == this[i])
                return i;
        }
    }
}

//Data time
Date.prototype.chatFormat = function(){
    var date = this.getDate()
    var month = this.getMonth();
    var year = this.getFullYear()

    var hour = this.getHours();
    var minutes = this.getMinutes();

   return String.stringFormat("{0}:{1} - {2}/{3}/{4}", hour, minutes, date, month, year);   
}
Date.tryToParseFromChatFormatString = function(dateTime){
    var parts = dateTime.split("-");
    var hourAndMinutes = parts[0].split(':');
    var date = parts[1].split("/");

    var hour = hourAndMinutes[0]
    var minutes = hourAndMinutes[1]

    var day = date[0];
    var month = date[1];
    var year = date[2];

    return new Date(year, month, day, hour, minutes, 0, 0)
}