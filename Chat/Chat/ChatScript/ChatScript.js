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
    this.roomContainer = new Chat.Objects.ChatRoomContainer(Chat.system.GetElement("Conteiner"), chatEngin)
    
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
    //chatHubAsParam.client.createRoom = function (data) { chatEngin.createRoom(data) }
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
    var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(currentUserData.UserStatus)

    Chat.Engine.currentUser = new chatObject.ChatUser(currentUserData.UserIdentifier, currentUserData.UserName, status)
    sys.AppendChild(sys.GetElement("Status"), status.getImageElement());
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
                var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(userInJsonFormat.UserStatus)
                var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, status);
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
            if (!chatEngine.roomContainer.listOfRoomContains(roomInJsonFormat.RoomIdentifier)) {

                var chatRoom = new Chat.Objects.ChatRoom(roomInJsonFormat.RoomIdentifier, roomInJsonFormat.RoomName, chatEngine)
                chatEngine.roomContainer.addRoom(chatRoom);
            }

            Chat.Engine.SessionNextDate[roomInJsonFormat.RoomIdentifier] = "";

        } catch (exception) {
            sys.logError(exception.message + " - openRoomChat");
        }
    })
}
Chat.Engine.prototype.closeRoom = function (roomIdentifier)
{
    var engine = this;

    this.chatHub.server.closeRoom(roomIdentifier.trim(), Chat.Engine.currentUser.getUserIdentifier()).done(function () {
        var sys = Chat.system;

        if (engine.roomContainer.listOfRoomContains(roomIdentifier)) {
            engine.roomContainer.removeRoom(engine.roomContainer.getRoomByIdentifier(roomIdentifier));
        }
    })
}
Chat.Engine.prototype.createRoom = function (data) {
    var sys = Chat.system;
    try {
        if (sys.isEmptyObject(data))
            return;

        var result = JSON.parse(data);
        result = (sys.isNullOrUndefined(result.room) ? result : result.room);
        
        if (!this.roomContainer.listOfRoomContains(result.RoomIdentifier)) {

            var room = new Chat.Objects.ChatRoom(result.RoomIdentifier, result.RoomName, this);
            this.roomContainer.addRoom(room);
        }

    } catch (ex) {
        sys.logError(ex.message + " - CheckForRooms");
        return;
    }
}

Chat.Engine.prototype.sendMessage = function (e, idRoom) {
    if (e.keyCode == 13) {

        var sys = Chat.system;
        var chatEngine = this;
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
            var room = chatEngine.roomContainer.getRoomByIdentifier(idRoom);
            if (sys.isNullOrUndefinedOrEmptyObject(room))
                return;

            var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(result.CurrentSendreStatus);
            var chatUser = new Chat.Objects.ChatUser(result.SenderIdentifier, result.SenderName, status)
            var chatMessage = new Chat.Objects.ChatMessage(result.MessageContent, result.DateOfSend, chatUser);

            room.appendMessageElementToContent(chatMessage)
            room.scrollToTheBottonOfMessageContent();
        })

        return false;
    }
}
Chat.Engine.prototype.showingMassages = function (data, room) {

    var sys = Chat.system;

    try {
        if (sys.isEmptyObject(data))
            return;

        if (sys.isEmptyObject(room))
            return;

        var parsedRoomAsJson = JSON.parse(room);
        idRoom = parsedRoomAsJson.RoomIdentifier;
        if (!this.roomContainer.listOfRoomContains(idRoom) && parsedRoomAsJson.UsersInRoom.contains(Chat.Engine.currentUser.getUserIdentifier()))
            this.createRoom(room)

        data = JSON.parse(data);
        var result = data[Chat.Engine.currentUser.getUserIdentifier()];

        if (sys.isNull(result))
            return;

        var isHaveAddedNewMessage = false;
        
        chatRoom = this.roomContainer.getRoomByIdentifier(idRoom);

        for (var i = 0; i < result.length; i++) {

            var currentJSONMessage = result[i];

            var messageSenderUser = Chat.Engine.currentUser;
            if (messageSenderUser.getUserIdentifier() != currentJSONMessage.SenderIdentifier) {
                var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(currentJSONMessage.CurrentSendreStatus);
                messageSenderUser = new Chat.Objects.ChatUser(currentJSONMessage.SenderIdentifier, currentJSONMessage.SenderName, status);
            }

            var chatMessage = new Chat.Objects.ChatMessage(currentJSONMessage.MessageContent, currentJSONMessage.DateOfSend, messageSenderUser);
            chatRoom.appendMessageElementToContent(chatMessage);
            isHaveAddedNewMessage = true;
        }
        
        if (isHaveAddedNewMessage && this.roomContainer.isRoomInHiddenList(chatRoom.getRoomIdentifier()))
            this.roomContainer.showSingForUnreadMessage(chatRoom.getRoomIdentifier());
    }
    catch (exception) {
        sys.logError(exception.message + " - showingMassages");
        return;
    }
}

Chat.Engine.prototype.changeStatus = function (currElement) {

    this.chatHub.server.changUserStatus(currElement.getAttribute("Status"), Chat.Engine.currentUser.getUserIdentifier()).done(function (newStatus) {

        var sys = Chat.system;
        if (sys.isNullOrUndefinedOrEmptyObject(newStatus))
            return;

        newStatus = JSON.parse(newStatus);
        var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(newStatus);

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

        var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(userInJsonFormat.UserStatus)
        var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, status);
        Chat.Engine.users[userInJsonFormat.UserIdentifier] = user;
        sys.AppendChild(listUser, user.createUserListElement(chatEngine));
    }
    if (!sys.isNullOrUndefined(storedUser)) {
        storedUser.changeStatus(userInJsonFormat.UserStatus.IdStaut)
    }
}

Chat.Engine.prototype.loadHistory = function (idRoom) {

    var sys = Chat.system;
    var chatContainer = this.roomContainer;

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

        var room = chatContainer.getRoomByIdentifier(idRoom);
        room.loadHistory(Chat.Objects.ChatMessageSession.parseFromJsonResult(result));

        Chat.Engine.SessionNextDate[idRoom] = result.SessionStartDate;

    });
}

// Chat engine static variables
Chat.Engine.currentUser = {};
Chat.Engine.users = [];
Chat.Engine.openedRoom = [];
Chat.Engine.SessionNextDate = [];

