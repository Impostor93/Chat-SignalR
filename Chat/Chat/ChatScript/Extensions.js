//String extension
String.isEmpty = function (obj) { return obj == "" }
String.prototype.isEmpty = function () { return this == "" }
String.prototype.trim = function () { return this.replace(/^\s+|\s+$/g, ''); };
String.prototype.ltrim = function () { return this.replace(/^\s+/, ''); };
String.prototype.rtrim = function () { return this.replace(/\s+$/, ''); };
String.prototype.fulltrim = function () { return this.replace(/(?:(?:^|\n)\s+|\s+(?:$|\n))/g, '').replace(/\s+/g, ' '); };
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
