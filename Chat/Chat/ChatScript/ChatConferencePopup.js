var Chat = Chat || {}

Chat.ConferencePopup = function () {
    this.smoothBackground = "";
    this.popupDiv = "";
    this.onCloseCallback;
}
Chat.ConferencePopup.prototype.creatPopup = function (headerText, renderBodyCallback, buttons) {
    var sys = Chat.system;
    var popup = this;

    this.smoothBackground = sys.createElement("div", "SmoothBackground", "SmoothBackground");
    sys.AppendChild(document.body.parentElement, this.smoothBackground, false);

    this.popupDiv = sys.createElement("div", "PopUp", "PopUp");
    this.popupDiv.style.opacity = "0";
    this.popupDiv.style.filter = "alpha(opacity=0)";

    var Header = sys.createElement("div", "PopUpHeder", "PopUpHeder");

    var PopUpCloseButton = sys.createElement("img", "PopUpCloseButton", "PopUpCloseButton", undefined, undefined, {"src" : "/ChatImage/button-x.png"});
    PopUpCloseButton.onclick = function () { popup.closeModalPopUp(); if (!sys.isNullOrUndefined(popup.onCloseCallback)) { popup.onCloseCallback(); } };

    var headerInnerHtml = ("<div style='display:table;margin:0 auto;'>" + (headerText != undefined ? headerText : '') + "</div>");
    var PopUpTitle = sys.createElement("div", "popUpHeaderText", "popUpHeaderText", headerInnerHtml);

    var PanelContent = sys.createElement("div", "PanelContent", "PanelContent");
    renderBodyCallback(PanelContent);

    this.TextContainer = sys.createElement("div", "TextContainer", "TextContainer")

    var buttonWrapper = sys.createElement("div", "button-wrapper", "button-wrapper");
    var buttonsDiv = sys.createElement("div", "buttons", "buttons");

    for (var i in buttons) {
        if (buttons.hasOwnProperty(i)) {
            sys.AppendChild(buttonsDiv, buttons[i]);
        }
    }
    sys.AppendChild(buttonWrapper, buttonsDiv);
   
    sys.AppendChild(PanelContent, buttonWrapper);

    sys.AppendChild(PanelContent, this.TextContainer);

    sys.AppendChild(Header, PopUpCloseButton);
    sys.AppendChild(Header, PopUpTitle);
    sys.AppendChild(this.popupDiv, Header);
    sys.AppendChild(this.popupDiv, PanelContent);
    var Parent = document.body;
    sys.AppendChild(Parent, this.popupDiv);

}
Chat.ConferencePopup.prototype.closeModalPopUp = function () {

    document.body.removeChild(this.popupDiv);
    document.body.parentElement.removeChild(this.smoothBackground);
}
Chat.ConferencePopup.prototype.showPopUp = function () {
    var i = 0;
    var j = 0;
    this.popupDiv.style.left = ((document.documentElement.clientWidth / 2) - (this.popupDiv.clientWidth / 2)) + "px";
    this.popupDiv.style.top = ((document.documentElement.clientHeight / 2) - (this.popupDiv.clientHeight / 2)) + "px";

    var popUpObject = this;

    var ShowInterval = setInterval(function () {
        if (i >= 100 || j >= 1)
            clearInterval(ShowInterval);

        popUpObject.popupDiv.style.opacity = j;
        popUpObject.popupDiv.style.filter = i;

        i++;
        j += 0.03;
    }, 1)
}
//Chat.ConferencePopup.prototype.ClosePopUp = function () {
//    var idValueCollection = getPopUpInputData("PanelContent");

//    this.closeModalPopUp();

//    restoreDataInOriginalContainer(idValueCollection);
//}
//PopUp = function (Target, HeaderText, callback) {

//    this.Target = Target;
    

//    this.CreatePopUp = function ( callback ) {
        

//    }

    

//    this.CreatePopUp(callback);
//    this.ShowPopUp();

//    this.ClosePopUp = function () {
//        var idValueCollection = getPopUpInputData("PanelContent");

//        closeModalPopUp();

//        restoreDataInOriginalContainer(idValueCollection);
//    }
//    this.getTargetId = function () { return this.Target; }
//    this.appendUsers = function (user) { Chat.system.AppendChild(this.TextContainer, user.getHtmlObject()) }
//}
//function getPopUpInputData(popUpConatainerId)
//{
//    var popUpConatainerId = document.getElementById(popUpConatainerId);
//    var idValueCollection = [];
    
//    var allFormInputs = popUpConatainerId.getElementsByTagName("input");
//    idValueCollection = fillCollection(allFormInputs, idValueCollection);

//    var allFormTextArea = popUpConatainerId.getElementsByTagName("textarea");
//    idValueCollection = fillCollection(allFormTextArea, idValueCollection);

//    return idValueCollection;
//}
//function fillCollection(input,output)
//{
//    for (var i = 0; i < input.length; i++) {
//        var id = input[i].id;
//        var value = input[i].value;

//        output.push({ "id": id, "value": value });
//    }

//    return output;
//}
//function restoreDataInOriginalContainer(idValueCollection)
//{
//    for (var j = 0; j < idValueCollection.length;j++)
//    document.getElementById(idValueCollection[j].id).value = idValueCollection[j].value;
//}


