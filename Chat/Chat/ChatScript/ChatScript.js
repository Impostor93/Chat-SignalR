/// <reference path="ChatObjects.js" />
/// <reference path="RequestCreator.js" />
/// <reference path="Extensions.js" />
/// <reference path="System.js" />

var Chat = Chat || {};
Chat.Engine = Chat.Engine || {};

Chat.Start = function Start(currentUserIdentifier) {
    var sys = Chat.system;
    Chat.Show();

    this.chatEngine = new Chat.Engine(currentUserIdentifier);
    var chatEngine = this.chatEngine;
}
Chat.Show = function () { var sys = Chat.system; sys.GetElement("Chat").style.display = "block"; }
Chat.Hide = function () { var sys = Chat.system; sys.GetElement("Chat").style.display = "none"; }

//Chat engine
Chat.Engine = function (currentUserIdentifier) {
    var sys = Chat.system;

    this.currentUserIdentifier = currentUserIdentifier;

    var chatEngin = this;
    this.roomContainer = new Chat.Objects.ChatRoomContainer(sys.GetElement("Conteiner"), chatEngin)

    var settings = Chat.Engine.createSettings(this);
    this.listOfUserContainer = new Chat.Objects.ChatUserListContainer(sys.GetElement("UserList"), settings);
    sys.AppendChild(sys.GetElement("Chat"), settings.getHtmlObject())

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
    chatHubAsParam.client.showingMassages = function (data, idRoom) { chatEngin.showingMassages(data, idRoom) }
}
Chat.Engine.prototype._registrateServerEvents = function (currentUserIdentifier, chatEngin) {
    this.chatHub.server.connect(currentUserIdentifier).done(function (rooms) { setTimeout(function () { chatEngin.restoreUserOpendRoom(rooms) }, 100); });
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

    this.listOfUserContainer.clearUserContainer();

    for (var key in users) {
        if (users.hasOwnProperty(key)) {
            userInJsonFormat = users[key]

            if (userInJsonFormat.UserStatus.CanMakeOperation) {
                var userIdentifierToSkip = sys.isNullOrUndefinedOrEmptyObject(Chat.Engine.currentUser) ? currentUserIdentifier : Chat.Engine.currentUser.getUserIdentifier();
                if (userInJsonFormat.UserIdentifier == currentUserIdentifier)
                    continue;
                var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(userInJsonFormat.UserStatus)
                var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, status);

                this.listOfUserContainer.appendUser(user, this);
            }
        }
    }
}

//Because of load history async calling have to call that strange logic
//to be able to load history correct into the correct room
Chat.Engine.prototype.restoreUserOpendRoom = function (data) {
    var opendRooms = JSON.parse(data);
    var index = 0;
    var engine = this;

    this.createRoom(JSON.stringify(opendRooms[index]), function () {
        engine._loadRestoreUserRoom(opendRooms, index)
    });
}
Chat.Engine.prototype._loadRestoreUserRoom = function (roomsInJSON, index) {
    if (roomsInJSON.hasOwnProperty(index)) {
        var engine = this;
        index += 1;
        this.createRoom(JSON.stringify(roomsInJSON[index]), function () {
            engine._loadRestoreUserRoom(roomsInJSON, index)
        })
    }
}

Chat.Engine.prototype.openRoomChat = function () {
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

            var room = chatEngine.roomContainer.getRoomByIdentifier(roomInJsonFormat.RoomIdentifier);
            room.getRoomSession().setSessionNextDate("");
            chatEngine.loadHistory(room.getRoomIdentifier(), true);
        } catch (exception) {
            sys.logError(exception.message + " - openRoomChat");
        }
    })
}
Chat.Engine.prototype.closeRoom = function (roomIdentifier) {
    var engine = this;

    this.chatHub.server.closeRoom(roomIdentifier.trim(), Chat.Engine.currentUser.getUserIdentifier()).done(function () {
        var sys = Chat.system;

        if (engine.roomContainer.listOfRoomContains(roomIdentifier)) {
            engine.roomContainer.removeRoom(engine.roomContainer.getRoomByIdentifier(roomIdentifier));
        }
    })
}
Chat.Engine.prototype.createRoom = function (data, onFinishLoadingRoomHistory) {
    var sys = Chat.system;
    try {
        if (sys.isEmptyObject(data))
            return;

        var result = JSON.parse(data);
        result = (sys.isNullOrUndefined(result.room) ? result : result.room);

        if (!this.roomContainer.listOfRoomContains(result.RoomIdentifier)) {
            var room = new Chat.Objects.ChatRoom(result.RoomIdentifier, result.RoomName, this);
            this.roomContainer.addRoom(room);
            this.loadHistory(room.getRoomIdentifier(), true, onFinishLoadingRoomHistory);
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
        if (!this.roomContainer.listOfRoomContains(idRoom) && parsedRoomAsJson.UsersInRoom.contains(Chat.Engine.currentUser.getUserIdentifier())) {
            this.createRoom(room)
            return;
        }

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
    var storedUser = this.listOfUserContainer.getUserByIdentifier(userInJsonFormat.UserIdentifier);
    if (sys.isNullOrUndefined(storedUser) && Chat.Engine.currentUser.getUserIdentifier() != userInJsonFormat.UserIdentifier) {
        var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(userInJsonFormat.UserStatus)
        var user = new Chat.Objects.ChatUser(userInJsonFormat.UserIdentifier, userInJsonFormat.UserName, status);

        this.listOfUserContainer.appendUser(user, this);
    }
    if (!sys.isNullOrUndefined(storedUser)) {
        storedUser.changeStatus(userInJsonFormat.UserStatus.IdStaut)
    }
}

Chat.Engine.prototype.loadHistory = function (idRoom, isTrigerOnOpenRoom, onFinishLoadingRoomHistory) {
    var sys = Chat.system;
    var chatContainer = this.roomContainer;
    var chatEngin = this;

    var callBack = function () { if (!sys.isNullOrUndefined(onFinishLoadingRoomHistory)) onFinishLoadingRoomHistory(); }

    room = chatContainer.getRoomByIdentifier(idRoom);

    if (!sys.isNullOrUndefined(room.getRoomSession()) && sys.isNullOrUndefinedOrEmptyObject(room.getRoomSession().getSessionNextDate()))
        room.getRoomSession().setSessionNextDate("");

    if (!room.getRoomSession().getCanLoadMoreHistory()) {
        callBack();
        return;
    }

    this.chatHub.server.loadHistory(idRoom, room.getRoomSession().getSessionNextDate()).done(function (result) {
        result = JSON.parse(result);

        if (sys.isNullOrUndefinedOrEmptyObject(result))
            return;

        if (result.IdRoom == 0) {
            room.getRoomSession().setCanLoadMoreHistory(false);
            callBack();
            return;
        }

        room.loadHistory(Chat.Objects.ChatMessageSession.parseFromJsonResult(result));
        room.getRoomSession().setSessionNextDate(result.SessionEndDate);

        if (!sys.isNullOrUndefined(isTrigerOnOpenRoom) && isTrigerOnOpenRoom) {
            if (!room.getRoomSession().getCanLoadMoreHistory() || room.getRoomMessageContentScrollHeight() > room.getRoomMessageContentHeight()) {
                callBack();
                return;
            }
            chatEngin.loadHistory(idRoom, true, onFinishLoadingRoomHistory)
        }
    });
}

// Chat engine static variables
Chat.Engine.currentUser = {};

// Chat engine static methods
Chat.Engine.createSettings = function (chatEngine) {
    var sys = Chat.system;

    var settings = new Chat.Objects.ChatSettings();
    settings.addSettings(Chat.Engine._createStatusSetting(settings, chatEngine));
    settings.addSettings(Chat.Engine._createStartConference(settings, chatEngine));

    settings.createSettings();

    return settings;
}
Chat.Engine._createStatusSetting = function (settings, chatEngine) {
    var statusOptions = new Chat.Objects.ChatSetting("ChatStatusSettings")

    var offline = new Chat.Objects.ChatSettingOption("Off-line", "onclick", function () { settings.minimizeSettings(); chatEngine.changeStatus(this); })
    offline.setAttribute("status", "2")
    offline.createHtmlElement(Chat.Engine._createStatusOptionContent("/ChatImage/offline.png", offline.getName()))

    var online = new Chat.Objects.ChatSettingOption("On-line", "onclick", function () { settings.minimizeSettings(); chatEngine.changeStatus(this); })
    online.setAttribute("status", "1")
    online.createHtmlElement(Chat.Engine._createStatusOptionContent("/ChatImage/online.png", online.getName()))

    statusOptions.addOption(offline);
    statusOptions.addOption(online);

    return statusOptions;
}
Chat.Engine._createStatusOptionContent = function (imgUrl, statusName) {
    var sys = Chat.system;

    var div = sys.createElement("div");
    var spanStatusName = sys.createElement("span", undefined, undefined, statusName);
    var statusImage = sys.createElement("img", undefined, undefined, undefined, undefined, { "src": imgUrl, "style": "width: 15px;" });

    sys.AppendChild(div, spanStatusName);
    sys.AppendChild(div, statusImage);

    return div;
}
Chat.Engine._createStartConference = function (settings, engine) {
    var sys = Chat.system;

    var statusOptions = new Chat.Objects.ChatSetting("StartConference")

    var conference = new Chat.Objects.ChatSettingOption("Conference", "onclick", function () {
        settings.minimizeSettings();
        var popUp = new Chat.ConferencePopup();

        var apply = sys.createElement("button", undefined, "button-apply", "Apply");
        var cancel = sys.createElement("button", undefined, "button-cancel", "Cancel");

        cancel.onclick = function () { popUp.closeModalPopUp(); delete popUp; }

        var divSelectedUserList = sys.createElement("div", undefined, "UserListContent-style");
        var selectedListUsers = new Chat.Objects.ChatUserListContainer(divSelectedUserList, new Chat.Objects.ChatSettings());
        selectedListUsers.hideSettingsButton();

        apply.onclick = function () {
            var users = selectedListUsers.getUsers();
            var userIdentifiers = [];

            for (var i in users) {
                if (users.hasOwnProperty(i)) {
                    userIdentifiers.push(users[i].getUserIdentifier());
                }
            }

            engine.openRoomChat.apply(engine, userIdentifiers);
            popUp.closeModalPopUp();
            delete popUp;
        }

        popUp.creatPopup("Begin Conference", function (parent) {
            var divUserList = sys.createElement("div", undefined, "UserListContent-style");
            var listUsers = new Chat.Objects.ChatUserListContainer(divUserList, new Chat.Objects.ChatSettings())
            listUsers.hideSettingsButton();
            var users = engine.listOfUserContainer.getUsers();

            var addOnClickToListItem = function (userListItem, user) {
                userListItem.onclick = function (event) {
                    if (listUsers.isContains(user.getUserIdentifier())) {
                        listUsers.removeUser(user.getUserIdentifier());
                        selectedListUsers.appendUser(user, engine);
                    } else {
                        selectedListUsers.removeUser(user.getUserIdentifier());
                        listUsers.appendUser(user, engine);
                    }

                    addOnClickToListItem(user.getHtmlObject(), user);
                }
            }

            for (var i in users) {
                if (users.hasOwnProperty(i)) {
                    var user = users[i];
                    listUsers.appendUser(user, engine);
                    var userListItem = user.getHtmlObject();
                    addOnClickToListItem(userListItem, user);
                }
            }

            var listsWrapper = sys.createElement("div", undefined, "");
            sys.AppendChild(listsWrapper, divUserList)
            sys.AppendChild(listsWrapper, divSelectedUserList);

            sys.AppendChild(parent, listsWrapper);
        }, [apply, cancel]);

        popUp.showPopUp();
    })
    conference.createHtmlElement(Chat.Engine._createStatusOptionContent("/ChatImage/add_group-16.png", conference.getName()))

    statusOptions.addOption(conference);

    return statusOptions;
}