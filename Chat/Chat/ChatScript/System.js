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
Chat.system.RemoveElmenet = function (Parent, Child)
{
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

	parentElment.removeChild(Child);
}
Chat.system.GetElement = function (Id) {
    return document.getElementById(Id);
}
Chat.system.getElementsByAttribute = function (attributeName) {
    return document.querySelectorAll("[" + attributeName + "]");
}
Chat.system.getElementsByAttributeFromElement = function (element,attributeName) {
    return element.querySelectorAll("[" + attributeName + "]");
}
Chat.system.getElementsByAttributeAndValue = function (attributeName,value) {
    return document.querySelectorAll("[" + attributeName + "='" + value + "']");
}
Chat.system.getElementsByAttributeAndValueFromElement = function (element,attributeName, value) {
    return element.querySelectorAll("[" + attributeName + "='" + value + "']");
}
Chat.system.AppendChild = function(Parent, Child, InserBefore) {
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

Chat.system.logError = function (error) {
    console.log(error);
    //alert(error);
    //debugger;
}