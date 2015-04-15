/// <reference path="ChatObjects.js" />
/// <reference path="RequestCreator.js" />
/// <reference path="Extensions.js" />
/// <reference path="System.js" />
var Chat = Chat || {};

var UserTimer = 0;
var RoomTimers = 0;
var MessageTimer = [];
var CurrentUserIdentifier;
var CurrentUserName;
var CurrentUserStatus;
var chatHub = "";

Chat.currentUserIdentifier = "";
Chat.currentUser = {};
Chat.openedRoom = [];

function GetAllUsers(data){
    
    var Users = JSON.parse(data);
    var sys = Chat.system;
    var ListUser = sys.GetElement("UserInList");

    ListUser.innerHTML = '';

    $.each(Users,function(index,Value)
    {
        if (Value.UserStatus.CanMakeOperation) {
            var InnerHtml = "<div id='ListGlobalElment' class='ListGlobalElment'><div id='UserImageContent' class='UserImageContent'></div>"
            InnerHtml += "<div id='UserNameDiv' class='UserNameDiv'><span class='UserNameText'>" + Value.UserName + "</span></div><div id='UserStatusDiv' class='UserStatusDiv'><img style='width:100%;margin-top: 4px;' src='/ChatImage/" + Value.UserStatus.StatusImage + "'/></div></div>"

            var Elment = sys.createElement("li", undefined, "ListElment", InnerHtml, undefined, { "onclick": "StartChat('" + Value.UserIdentifier + "')" });

            sys.AppendChild(ListUser, Elment);
        }
    })
}

function InitializeCurrentUser(data) {

        var currentUserData = JSON.parse(data);
        var sys = Chat.system;
        var chatObject = Chat.Objects;
        
        Chat.currentUser = new chatObject.ChatUser(currentUserData.UserIdentifier, currentUserData.UserName, currentUserData.UserStatus)

        sys.AppendChild(sys.GetElement("Status"), Chat.currentUser.getStatus().getImageElement());
}


Chat.Start = function Start(currentUserIdentifier)
{
    registrateClientEvents($.connection.chatHubs);

    $.connection.hub.start().done(function () {
        chatHub = $.connection.chatHubs;
        registrateServerEvents(chatHub, currentUserIdentifier);
    });
}

function registrateClientEvents(chatHubAsParam)
{
    chatHubAsParam.client.ChangeUserStatus = function (data) { GetAllUsers(data) }
    chatHubAsParam.client.createRoom = function (data) { CheckForRooms(data) }
    chatHubAsParam.client.showingMassages = function (data, idRoom) { showingMassages(data, idRoom) }
}
function registrateServerEvents(chatHubAsParam, currentUserIdentifier) {
    chatHubAsParam.server.connect();
    chatHubAsParam.server.initializeUser(currentUserIdentifier).done(function (Data) { InitializeCurrentUser(Data)})
    chatHubAsParam.server.getAllUsers(currentUserIdentifier).done(function (Data) { GetAllUsers(Data) })
}

function StartChat() {

    var userIdentifiers = arguments == null && arguments == undefined && arguments.length <= 0 ? "" : Array.prototype.slice.call(arguments, 0);

    if (userIdentifiers == "")
        return;

    chatHub.server.openRoom(Chat.currentUser.getUserIdentifier(), userIdentifiers).done(function (Data) {
        onSuccessrStartChat(Data)
    })

}
function onSuccessrStartChat(resultString) {
    try {

        if (resultString == "" || resultString == "[]")
            return;

        var room = JSON.parse(resultString);
        var sys = Chat.system;

        var chatRoom = new Chat.Objects.ChatRoom(room.RoomIdentifier, room.RoomName)

        if (!Chat._isRoomExist(chatRoom)) {
            Chat.openedRoom[chatRoom.getRoomIdentifier()] = chatRoom;

            sys.AppendChild(sys.GetElement("Conteiner"), chatRoom.getRoomHtmlObject(), true);
        }

        SessionNextDate[chatRoom.getRoomIdentifier()] = "";

    } catch (exception) {
        clearInterval(TimerStartShowing);
        sendError(exception.message, "onSuccessrStartChat");
    }
}
Chat._isRoomExist = function (room) {
    var sys = Chat.system;
    return !sys.isNullOrUndefinedOrEmptyObject(Chat.openedRoom[room.getRoomIdentifier()])
}

function showingMassages(data, idRoom) {
    try {

        var sys = Chat.system;

        if (sys.isEmptyObject(data))
            return;

        data = JSON.parse(data);
        var result = data[Chat.currentUser.getUserIdentifier()];

        if (sys.isNull(result))
            return;

        var room = Chat.openedRoom[idRoom];

        for (var i = 0; i < result.length; i++) {

            var messageSenderUser = Chat.currentUser;
            if (messageSenderUser.getUserIdentifier() != result[i].SenderIdentifier)
                messageSenderUser = new Chat.Objects.ChatUser(result[i].SenderIdentifier, result[i].SenderName, result[i].CurrentSendreStatus);

            var chatMessage = new Chat.Objects.ChatMessage(result[i].MessageContent, messageSenderUser);
            room.appendMessageElementToContent(chatMessage)
        }
    }
    catch (exception) {
        sendError(exception.message, "StartShowingMassages");
        return;
    }
}

function onSuccessSending(resultString) {
    try {
        debugger;
        var obj = resultString.split('|');

        if (obj[0] == '' || obj[0] == "[]")
            return;

        var Messages = JSON.parse(obj[0]);
        var sys = Chat.system;

        var ElementNumber = obj[1];
        var HtmlElement = sys.GetElement('Content' + ElementNumber);

        if (HtmlElement == undefined)
            return;

        var ResivedMessages = "";

        $.each(Messages, function (index, item) {
            var DateOfSend = new Date(item.DateOfSend);
            ResivedMessages += "<p> " + item.Sender.UserName + " Said: " + item.MessageContent + " <br/> In " + DateOfSend.format("yyyy-MM-dd h:mm:ss") + "</p>"
        })
        HtmlElement.innerHTML = ResivedMessages
        HtmlElement.scrollTop = HtmlElement.scrollHeight;
    }
    catch (exception) {
        sendError(exception.message, "onSuccessSending");
        return;
    }

}

function TextBoxKeyPress(e, idRoom)
{
    var sys = Chat.system;

    if(e.keyCode == 13){
        
        var EventElment = e.srcElement ? e.srcElement : e.currentTarget
        var message = EventElment.value;
        EventElment.value = "";

        if(String.isEmpty(message))
            return;

        chatHub.server.sendMessages(Chat.currentUser.getUserIdentifier(), message, idRoom).done(function (data) {
            if (sys.isEmptyObject(data))
                return;

            var result = JSON.parse(data);
            var room = Chat.openedRoom[idRoom];
            if (sys.isNullOrUndefinedOrEmptyObject(room))
                return;

            var chatUser = new Chat.Objects.ChatUser(result.SenderIdentifier,result.SenderName,result.CurrentSendreStatus)
            var chatMessage = new Chat.Objects.ChatMessage(result.MessageContent, chatUser);
            room.appendMessageElementToContent(chatMessage)
        })
        
        return false;
    }
}

function CheckForRooms(data) {
    var sys = Chat.system;
    try
    {
        if (sys.isEmptyObject(data))
            return;

        var result = JSON.parse(data);
        var room = new Chat.Objects.ChatRoom(result.RoomIdentifier, result.RoomName)

        if (!Chat._isRoomExist(room)) {
            sys.AppendChild(sys.GetElement("Conteiner"), room.getRoomHtmlObject(), true);
            Chat.openedRoom[result.RoomIdentifier] = room;
        }

    } catch (ex)
    {
        sys.logError(ex.message +" - CheckForRooms");
        return;
    }
}

function CloseRoom(IdRoom)
{
    IdRoom = $.trim(IdRoom)

    chatHub.server.closeRoom(IdRoom, Chat.currentUser.getUserIdentifier()).done(function () {
        var sys = Chat.system;

        var room = Chat.openedRoom[IdRoom];
        delete Chat.openedRoom[IdRoom];
        sys.RemoveElmenet(sys.GetElement("Conteiner"), room.getRoomHtmlObject());
    })
}

function ChangeStatus(currElement) {

    chatHub.server.changUserStatus(currElement.getAttribute("Status"), Chat.currentUser.getUserIdentifier()).done(function (newStatus) {

        var sys = Chat.system;
        if (sys.isNullOrUndefinedOrEmptyObject(newStatus))
            return;

        newStatus = JSON.parse(newStatus);
        var status = new Chat.Objects.ChatUserStatus(newStatus.StatusImage)

        sys.RemoveElmenet(sys.GetElement("Status"), sys.GetElement("Status").lastChild)
        sys.AppendChild(sys.GetElement("Status"), status.getImageElement());

    });
}

var SessionNextDate = [];
function LoadHistory(IdRoom) {

    if(SessionNextDate[IdRoom] == undefined)
        SessionNextDate[IdRoom] = "";

    if (SessionNextDate[IdRoom] == "false")
        return;

    var params = [];
    params["IdRoom"] = IdRoom;
    params["SessionFrom"] = SessionNextDate[IdRoom];

    $.RequestCreator({
        Methods: "LoadHistory",
        Params: params,
        async: false,
        CreateRequest: function (Result) {

            if (Result == undefined || Result == null || Result == "[]")
                return;

            if (Result.IdRoom == 0)
            {
                SessionNextDate[IdRoom] = "false";
                return;
            }

            Result = JSON.parse(Result.d);
            AppendHistory(Result);
            SessionNextDate[IdRoom] = Result.SessionStartDate;
            
        },
        Error: error,

    })
}

function sendError(text, MethodName) {
    //$.ajax({
    //    url: "SendErrorMessagesHandler.ashx?excText=" + text + "&MethodName=" + MethodName,
    //    contentType: "application/json;",
    //    data: "{}",
    //    type: "GET",
    //    success: function () { },
    //    error: function () { alert("error") },
    //})
    console.log(text + "--" + MethodName);
}

