var Chat = Chat || {}
Chat.system = Chat.system || {}

Chat.system.isNullOrEmptyObject = function (object) { return this.isNull(object) || this.isEmptyObject(object); }
Chat.system.isNull = function (object) { return object == null; }
Chat.system.isEmptyObject = function (object) {
	if (!this.isNullOrUndefined(Object.keys) && this.isFunction(Object.keys)) {
		return Object.keys(object).length === 0;
	} else {
		for (var prop in object) {
			if (object.hasOwnProperty(prop))
				return false;
		}
		return true;
	}
}

Chat.system.isUndefined = function (object) { return typeof (object) == "undefined"; }
Chat.system.isNullOrUndefined = function (object) { return this.isNull(object) || this.isUndefined(object); }
Chat.system.isNullOrUndefinedOrEmptyObject = function (object) { return this.isNull(object) || this.isUndefined(object) || this.isEmptyObject(object); }

Chat.system.isFunction = function (object) { return typeof (object) === "function"; }