String.isEmpty = function(obj){ return obj == "" }
String.prototype.isEmpty = function () { return this == "" }
Array.prototype.lastOrDefault = function () {
    var sys = Chat.system;
    return this.length > 0 && !sys.isNullOrUndefinedOrEmptyObject(this) ? this[this.length - 1] : null;
}
Array.prototype.firstOrDefault = function () {
    var sys = Chat.system;
    return this.length > 0 && !sys.isNullOrUndefinedOrEmptyObject(this) ? this[0] : null;
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