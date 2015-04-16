/// <reference path="ChatObjects.js" />
/// <reference path="RequestCreator.js" />
/// <reference path="Extensions.js" />
/// <reference path="System.js" />

var Chat = Chat || {};
Chat.Engine = Chat.Engine || {};

Chat.Start = function Start(currentUserIdentifier)
{

    var sys = Chat.system;
    Chat.Show();

    this.chatEngine = new Chat.Engine(currentUserIdentifier);
    var chatEngine = this.chatEngine;

    var statusElements = sys.getElementsByAttribute("status");
    for (var i = 0; i < statusElements.length; i++)
        statusElements[i].onclick = function () { chatEngine.changeStatus(this) }
    
}
Chat.Show = function () { var sys = Chat.system; sys.GetElement("Chat").style.display = "block"; }
Chat.Hide = function () { var sys = Chat.system; sys.GetElement("Chat").style.display = "none"; }

//Chat engine
Chat.Engine = function (currentUserIdentifier)
{
    var chatEngin = this;
    
    chatEngin._registrateClientEvents($.connection.chatHubs, chatEngin, currentUserIdentifier);

    $.connection.hub.start().done(function () {
        chatEngin.chatHub = $.connection.chatHubs;
        chatEngin._registrateServerEvents(currentUserIdentifier, chatEngin);
    });
}
Chat.Engine.prototype.chatHub = "";
Chat.Engine.prototype._registrateClientEvents = function (chatHubAsParam, chatEngin, currentUserIdentifier) {

    chatHubAsParam.client.getAllUsers = function (data) { chatEngin.loadAllUserList(data, currentUserIdentifier) }
    chatHubAsParam.client.ChangeUserStatus = function (data) { chatEngin.chageStatusToUser(data) }
    chatHubAsParam.client.createRoom = function (data) { chatEngin.createRoom(data) }
    chatHubAsParam.client.showingMassages = function (data, idRoom) { chatEngin.showingMassages(data, idRoom) }
}
Chat.Engine.prototype._registrateServerEvents = function (currentUserIdentifier, chatEngin) {
    this.chatHub.server.connect();
    this.chatHub.server.initializeUser(currentUserIdentifier).done(function (Data) { chatEngin.initializeCurrentUser(Data) })
    this.chatHub.server.getAllUsers(currentUserIdentifier).done(function (Data) { chatEngin.loadAllUserList(Data) })
}

Chat.Engine.prototype.initializeCurrentUser = function (data) {

    var currentUserData = JSON.parse(data);
    var sys = Chat.system;
    var chatObject = Chat.Objects;

    Chat.Engine.currentUser = new chatObject.ChatUser(currentUserData.UserIdentifier, currentUserData.UserName, currentUserData.UserStatus)

    sys.AppendChild(sys.GetElement("Status"), Chat.Engine.currentUser.getStatus().getImageElement());
}
Chat.Engine.prototype.loadAllUserList = function (data, currentUserIdentifier) {

    var chatEngine = this;
    var users = JSON.parse(data);
    var sys = Chat.system;

    var listUser = sys.GetElement("UserInList");
    listUser.innerHTML = '';

    for (var key in users) {
        if (users.hasOwnProperty(key)) {
            userInJsonFormat = users[key]

            if (userInJsonFormat.UserStatus.CanMakeOperation) {

                var userIdentifierToSkip = sys.isNullOrUndefinedOrEmptyObject(Chat.Engine.currentUser) ? currentUserIdentifier : Chat.Engine.currentUser.getUserIdentifier();
                if (userInJsonFormat.UserIdentifier == currentUserIdentifier)
                    continue;

                var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, userInJsonFormat.UserStatus);
                Chat.Engine.users[userInJsonFormat.UserIdentifier] = user;
                sys.AppendChild(listUser, user.createUserListElement(chatEngine));
            }
        }
    }
}

Chat.Engine.prototype.openRoomChat = function ()
{
    var userIdentifiers = arguments == null && arguments == undefined && arguments.length <= 0 ? "" : Array.prototype.slice.call(arguments, 0);
    var sys = Chat.system;
    var chatEngine = this;

    if (String.isEmpty(userIdentifiers))
        return;

    this.chatHub.server.openRoom(Chat.Engine.currentUser.getUserIdentifier(), userIdentifiers).done(function (data) {
        try {
            if (sys.isNullOrUndefinedOrEmptyObject(data))
                return;

            var roomInJsonFormat = JSON.parse(data);
            if (!Chat.Engine._isRoomExist(roomInJsonFormat.RoomIdentifier)) {

                var chatRoom = new Chat.Objects.ChatRoom(roomInJsonFormat.RoomIdentifier, roomInJsonFormat.RoomName, chatEngine)
                Chat.Engine.openedRoom[chatRoom.getRoomIdentifier()] = chatRoom;

                sys.AppendChild(sys.GetElement("Conteiner"), chatRoom.getRoomHtmlObject(), true);
            }

            Chat.Engine.SessionNextDate[chatRoom.getRoomIdentifier()] = "";

        } catch (exception) {
            sys.logError(exception.message + " - openRoomChat");
        }
    })
}
Chat.Engine.prototype.closeRoom = function (roomIdentifier)
{
    this.chatHub.server.closeRoom(roomIdentifier.trim(), Chat.Engine.currentUser.getUserIdentifier()).done(function () {
        var sys = Chat.system;

        var room = Chat.Engine.openedRoom[roomIdentifier];
        delete Chat.Engine.openedRoom[roomIdentifier];
        sys.RemoveElmenet(sys.GetElement("Conteiner"), room.getRoomHtmlObject());
    })
}
Chat.Engine.prototype.createRoom = function (data) {
    var sys = Chat.system;
    try {
        if (sys.isEmptyObject(data))
            return;

        var result = JSON.parse(data);
        
        if (!Chat.Engine._isRoomExist(result.RoomIdentifier)) {

            var room = new Chat.Objects.ChatRoom(result.RoomIdentifier, result.RoomName, this);
            sys.AppendChild(sys.GetElement("Conteiner"), room.getRoomHtmlObject(), true);
            Chat.Engine.openedRoom[result.RoomIdentifier] = room;
        }

    } catch (ex) {
        sys.logError(ex.message + " - CheckForRooms");
        return;
    }
}

Chat.Engine.prototype.sendMessage = function (e, idRoom) {
    var sys = Chat.system;
    if (e.keyCode == 13) {
        e.preventDefault();

        var EventElment = e.srcElement ? e.srcElement : e.currentTarget
        var message = EventElment.value;
        EventElment.value = "";

        if (String.isEmpty(message))
            return;

        this.chatHub.server.sendMessages(Chat.Engine.currentUser.getUserIdentifier(), message, idRoom).done(function (data) {
            if (sys.isEmptyObject(data))
                return;

            var result = JSON.parse(data);
            var room = Chat.Engine.openedRoom[idRoom];
            if (sys.isNullOrUndefinedOrEmptyObject(room))
                return;

            var chatUser = new Chat.Objects.ChatUser(result.SenderIdentifier, result.SenderName, result.CurrentSendreStatus)
            var chatMessage = new Chat.Objects.ChatMessage(result.MessageContent, result.DateOfSend, chatUser);
            room.appendMessageElementToContent(chatMessage)
        })

        return false;
    }
}
Chat.Engine.prototype.showingMassages = function (data, idRoom) {

    var sys = Chat.system;

    try {
        if (sys.isEmptyObject(data))
            return;

        data = JSON.parse(data);
        var result = data[Chat.Engine.currentUser.getUserIdentifier()];

        if (sys.isNull(result))
            return;

        var room = Chat.Engine.openedRoom[idRoom];

        for (var i = 0; i < result.length; i++) {

            var currentJSONMessage = result[i];

            var messageSenderUser = Chat.Engine.currentUser;
            if (messageSenderUser.getUserIdentifier() != currentJSONMessage.SenderIdentifier)
                messageSenderUser = new Chat.Objects.ChatUser(currentJSONMessage.SenderIdentifier, currentJSONMessage.SenderName, currentJSONMessage.CurrentSendreStatus);

            var chatMessage = new Chat.Objects.ChatMessage(currentJSONMessage.MessageContent, currentJSONMessage.DateOfSend, messageSenderUser);
            room.appendMessageElementToContent(chatMessage)
        }
    }
    catch (exception) {
        sys.logError(exception.message + " - showingMassages");
        return;
    }
}

Chat.Engine.prototype.loadHistory = function (idRoom) {

    var sys = Chat.system;

    if (sys.isUndefined(Chat.Engine.SessionNextDate[idRoom]))
        Chat.Engine.SessionNextDate[idRoom] = "";

    if (Chat.Engine.SessionNextDate[idRoom] == "false")
        return;

    this.chatHub.server.loadHistory(idRoom, Chat.Engine.SessionNextDate[idRoom]).done(function (result) {
        result = JSON.parse(result);

        if (sys.isNullOrUndefinedOrEmptyObject(result))
            return;

        if (result.IdRoom == 0) {
            Chat.Engine.SessionNextDate[idRoom] = "false";
            return;
        }

        var room = Chat.Engine.openedRoom[idRoom];
        room.loadHistory(Chat.Objects.ChatMessageSession.parseFromJsonResult(result));

        Chat.Engine.SessionNextDate[idRoom] = result.SessionStartDate;

    });
}

Chat.Engine.prototype.changeStatus = function (currElement) {

    this.chatHub.server.changUserStatus(currElement.getAttribute("Status"), Chat.Engine.currentUser.getUserIdentifier()).done(function (newStatus) {

        var sys = Chat.system;
        if (sys.isNullOrUndefinedOrEmptyObject(newStatus))
            return;

        newStatus = JSON.parse(newStatus);
        var status = new Chat.Objects.ChatUserStatus(newStatus.StatusImage)

        sys.RemoveElmenet(sys.GetElement("Status"), sys.GetElement("Status").lastChild)
        sys.AppendChild(sys.GetElement("Status"), status.getImageElement());

    });
}

Chat.Engine.prototype.chageStatusToUser = function (data) {
    var sys = Chat.system;
    if (sys.isNullOrUndefined(data))
        return;

    var userInJsonFormat = data;
    var storedUser = Chat.Engine.users[userInJsonFormat.UserIdentifier];
    if (sys.isNullOrUndefined(storedUser) && Chat.Engine.currentUser.getUserIdentifier() != userInJsonFormat.UserIdentifier) {

        var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, userInJsonFormat.UserStatus);
        Chat.Engine.users[userInJsonFormat.UserIdentifier] = user;
        sys.AppendChild(listUser, user.createUserListElement(chatEngine));
    }
    if (!sys.isNullOrUndefined(storedUser)) {
        storedUser.changeStatus(userInJsonFormat.UserStatus.StatusImage)
    }
}

Chat.Engine._isRoomExist = function (roomIdentifier) {
    var sys = Chat.system;
    return !sys.isNullOrUndefinedOrEmptyObject(Chat.Engine.openedRoom[roomIdentifier])
}

// Chat engine static variables
Chat.Engine.currentUser = {};
Chat.Engine.users = [];
Chat.Engine.openedRoom = [];
Chat.Engine.SessionNextDate = [];


//TODO: to be delete
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
