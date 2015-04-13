/// <reference path="Extensions.js" />
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

Chat.system.CreateElement = function (Type, Ids, ClassName, InnerHtml, Visibility, Attributes) {
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
		for (var i in Attributes)
			elment.setAttribute(i, Attributes[i]);
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