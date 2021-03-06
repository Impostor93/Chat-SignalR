﻿/// <reference path="Extensions.js" />
/// <reference path="System.js" />
/// <reference path="ChatEvents.js" />

var Chat = Chat || {};
Chat.Objects = Chat.Objects || {};
Chat.HtmlHalpers = Chat.HtmlHalpers || {};

//Start ChatRoom Object
Chat.Objects.ChatRoom = function ChatRoom(roomIdentifier, roomName, engine) {
	this.roomIdentifier = roomIdentifier;
	this.roomName = this._parseRoomName(roomName);
	this.engine = engine;

	this.conversationPartElement = "";
	this.roomContentElement = "";
	this.roomHeaderElement = "";

	this.chatRoomElement = this._createNewRoomElement();
	this.currentMessageSession = new Chat.Objects.ChatMessageSession(roomIdentifier);

	this.isRoomVisible = true;
	this._hasNotSeenMessages = false;
	this.isRoomOnFocus = false;
}
Chat.Objects.ChatRoom.prototype._createNewRoomElement = function () {
	var sys = Chat.system;
	var chatRoom = this;

	this.roomUnreadedMessageIdentifier = sys.createElement("i");

	this.roomContentElement = sys.createElement("div", "RoomContent", "RoomContent");

	this.roomHeaderElement = sys.createElement("div", undefined, "RoomHeader", undefined, "block")
	this.roomHeaderElement.onclick = function () {
		if (chatRoom.isRoomVisible) {
			chatRoom.minimizeRoom();
		} else {
			chatRoom.maximizeRoom();
		}
	}

	sys.AppendChild(this.roomHeaderElement, this.roomUnreadedMessageIdentifier);
	sys.AppendChild(this.roomHeaderElement, this._definedRoomNameElement(this.getRoomName()));

	var closeButton = sys.createElement("div", undefined, "CloseButton");
	closeButton.onclick = function (event) { event.stopPropagation(); chatRoom.engine.closeRoom(chatRoom.getRoomIdentifier()) };
	sys.AppendChild(this.roomHeaderElement, closeButton)

	sys.AppendChild(this.roomContentElement, this.roomHeaderElement);

	this.conversationPartElement = sys.createElement("div", "ConversationPart", "ConversationPart", undefined, "block");

	this.messageContent = sys.createElement("div", undefined, "MessageContent", undefined, "block");
	var timer = null;
	this.messageContent.onscroll = function () {
		if (this.scrollTop == 0) {
			chatRoom.engine.loadHistory(chatRoom.getRoomIdentifier());
		} else if (chatRoom.isScrollAtTheBottom() && chatRoom.isScrollInTheBufferArea()) {
			chatRoom._removeUnreadSing();
		}
	}

	sys.AppendChild(this.conversationPartElement, this.messageContent);

	this.textAreaOfRoom = sys.createElement("textarea", undefined, "TextBox", undefined, "block", { "rows": "1" })
	this.textAreaOfRoom.onkeydown = function (event) { chatRoom.engine.sendMessage(event, chatRoom.getRoomIdentifier()); };
	this.textAreaOfRoom.onfocus = function () {
		chatRoom.isRoomOnFocus = true;
		if (chatRoom.isScrollInTheBufferArea() && chatRoom.isScrollAtTheBottom())
			chatRoom._removeUnreadSing();
	}
	this.textAreaOfRoom.blur = function () { chatRoom.isRoomOnFocus = false; }

	this.roomFooterElement = sys.createElement("div", "RoomFooter", "RoomFooter");
	sys.AppendChild(this.roomFooterElement, this.textAreaOfRoom);

	sys.AppendChild(this.conversationPartElement, this.roomFooterElement);
	sys.AppendChild(this.roomContentElement, this.conversationPartElement);

	var chatRoomElement = sys.createElement("div", undefined, "ChatRoom", undefined, "block", { "RoomId": this.getRoomIdentifier(), "Visible": true });
	chatRoomElement.onclick = function () { chatRoom.textAreaOfRoom.focus(); }

	sys.AppendChild(chatRoomElement, this.roomContentElement);

	return chatRoomElement;
}

Chat.Objects.ChatRoom.prototype.minimizeRoom = function () {
	this.conversationPartElement.style.display = "none";
	this.isRoomVisible = false;
	this.chatRoomElement.className = this.chatRoomElement.className = this.chatRoomElement.className + " hidenRoom"
}
Chat.Objects.ChatRoom.prototype.maximizeRoom = function () {
	this.conversationPartElement.style.display = "block";
	this.chatRoomElement.className = this.chatRoomElement.className.replace(" hidenRoom", "")

	this._removeUnreadSing();
	this.currentMessageSession.clearUnreadMessage();
	this.scrollToTheBottonOfMessageContent();
	this.isRoomVisible = true;
}
Chat.Objects.ChatRoom.prototype._parseRoomName = function (roomName) {
	var splitedRoomName = roomName.split('|');
	var roomName = ""
	for (var i = 0; i < splitedRoomName.length; i++) {
		if (Chat.Engine.currentUser.getUserName() != splitedRoomName[i]) {
			if (!String.isEmpty(splitedRoomName[i]))
				roomName += (splitedRoomName[i] + ", ")
		}
	}

	return roomName.substring(0, roomName.length - (", ").length);
}
Chat.Objects.ChatRoom.prototype._definedRoomNameElement = function (roomName) {
	var sys = Chat.system;

	var spanElement = sys.createElement("span", undefined, undefined);

	if (roomName.length <= Chat.Objects.ChatRoom.roomNameLength) {
		spanElement.innerHTML = roomName;
		return spanElement;
	} else {
		var link = sys.createElement("a", undefined, "link-with-users-in-room", (roomName.substring(0, Chat.Objects.ChatRoom.roomNameLength) + "..."))
		var room = this;
		var balloonDiv = sys.createElement("div", undefined, undefined, this._createHeaderBalloonWithUserNames(this.getRoomName()))
		balloonDiv.style.display = "none";

		link.onmouseover = function (event) {
			balloonDiv.style.display = "block"
			balloonDiv.style.marginTop = ("-" + (balloonDiv.clientHeight + 20) + "px");
		}
		link.onmouseout = function () {
			balloonDiv.style.display = "none"
		}
		sys.AppendChild(link, balloonDiv)

		return link;
	}
}
Chat.Objects.ChatRoom.prototype._createHeaderBalloonWithUserNames = function (roomName) {
	var sys = Chat.system;
	var roomNames = roomName.split(", ");
	var balloonDiv = Chat.HtmlHalpers.generateCoolPopUpHtml(roomNames);

	return balloonDiv;
}

Chat.Objects.ChatRoom.prototype._appendHistoryToMessageContainerElement = function (chatRoomMessageSession) {
	var idRoom = chatRoomMessageSession.getRoomIdentifier();
	var sys = Chat.system;
	var CObjects = Chat.Objects;

	var lastMessageFromList = chatRoomMessageSession.getListOfMessages().lastOrDefault();

	var senderIndetifier = lastMessageFromList.getMessageSenderIdentifier();
	var messageText = lastMessageFromList.getMessageText();
	var messageSendDate = lastMessageFromList.getSendDate()
	var messageSenderStatus = lastMessageFromList.chatUser.getStatus();
	var messageSenderName = lastMessageFromList.chatUser.getUserName();

	var message = new CObjects.ChatMessage(messageText, messageSendDate, new CObjects.ChatUser(senderIndetifier, messageSenderName, messageSenderStatus))
	var curretnMessageElement = message.getMessageElement();

	for (var i = chatRoomMessageSession.getListOfMessages().length - 2; i >= 0; i--) {
		var currentSessionMessage = chatRoomMessageSession.getMessageAtIndex(i);

		diff = Chat.system.dateDiff.inMinutes(Date.tryToParseFromChatFormatString(message.getSendDate()), Date.tryToParseFromChatFormatString(currentSessionMessage.getSendDate()))

		if (message.getMessageSenderIdentifier() == currentSessionMessage.getMessageSenderIdentifier() && (!sys.isNullOrUndefined(diff) && diff < 1)) {
			message._appendMessageNode(currentSessionMessage, false)
		} else {
			this._appendMessageElementToContent(message, false);

			message = currentSessionMessage;
			curretnMessageElement = message.getMessageElement();
		}
	}

	//Append the last message
	this._appendMessageElementToContent(message, false);
}
Chat.Objects.ChatRoom.prototype._appendMessageElementToContent = function (message, addAtTheEndOfTheContent) {
	var sys = Chat.system;
	addAtTheEndOfTheContent = sys.isNullOrUndefined(addAtTheEndOfTheContent) ? true : addAtTheEndOfTheContent;

	sys.AppendChild(this.messageContent, message.getMessageElement(), addAtTheEndOfTheContent);
	if (addAtTheEndOfTheContent)
		this.currentMessageSession.addToMessageList(message);
	else
		this.currentMessageSession.insertOnTheTopOfMessageList(message);
}

Chat.Objects.ChatRoom.prototype.appendMessageElementToContent = function (message) {
	var sys = Chat.system;

	if (this.messageContent.childNodes.length == 0) {
		this._appendMessageElementToContent(message);
		return;
	}

	var lastUserMessage = this.currentMessageSession.getListOfMessages().lastOrDefault();

	if (sys.isNullOrUndefined(lastUserMessage))
		throw Error("There is no message in the array");

	var diff = Chat.system.dateDiff.inMinutes(Date.tryToParseFromChatFormatString(message.getSendDate()), Date.tryToParseFromChatFormatString(lastUserMessage.getSendDate()))

	if (lastUserMessage.getMessageSenderIdentifier() == message.getMessageSenderIdentifier() && (!sys.isNullOrUndefined(diff) && diff <= 1)) {
		lastUserMessage._appendMessageNode(message);
	} else {
		this._appendMessageElementToContent(message);
	}

	if(!this.isRoomOnFocus || !this.isRoomVisible || !(this.isScrollAtTheBottom() && this.isScrollInTheBufferArea())) 
		this._putUnreadSing();
	else if (this.isRoomOnFocus)
		this.scrollToTheBottonOfMessageContent();		
}
Chat.Objects.ChatRoom.prototype.isScrollAtTheBottom = function () {
	return this.messageContent.scrollHeight > this.messageContent.clientHeight;
}
Chat.Objects.ChatRoom.prototype.isScrollInTheBufferArea = function () {
	return Chat.Objects.ChatRoom.messagesElementScrollBufferArea > (this.messageContent.scrollHeight - this.messageContent.scrollTop - this.messageContent.clientHeight);
}
Chat.Objects.ChatRoom.prototype.hasRoomContentScroll = function () {
	return this.getRoomMessageContentScrollHeight() > this.getRoomMessageContentHeight()
}


Chat.Objects.ChatRoom.prototype._putUnreadSing = function () {
	this.roomUnreadedMessageIdentifier.style.backgroundImage = "url(/ChatImage/unreadedMessageIcon.gif)";
}
Chat.Objects.ChatRoom.prototype._removeUnreadSing = function () {
	this.roomUnreadedMessageIdentifier.style.backgroundImage = "";
}

Chat.Objects.ChatRoom.prototype.scrollToTheBottonOfMessageContent = function () { this.messageContent.scrollTop = this.messageContent.scrollHeight; }

Chat.Objects.ChatRoom.prototype.loadHistory = function (result) {
	var oldScrollHeight = this.messageContent.scrollHeight;
	this._appendHistoryToMessageContainerElement(result)
	this.messageContent.scrollTop = this.messageContent.scrollHeight - oldScrollHeight;
}

// Room getters
Chat.Objects.ChatRoom.prototype.getRoomHtml = function () { return this.chatRoomElement.outerHTML }
Chat.Objects.ChatRoom.prototype.getRoomHtmlObject = function () { return this.chatRoomElement }
Chat.Objects.ChatRoom.prototype.getRoomHeaderNameContainerElement = function () { return this._definedRoomNameElement(this.getRoomName()) }
Chat.Objects.ChatRoom.prototype.getRoomMessageContentScrollHeight = function () { return this.messageContent.scrollHeight; }
Chat.Objects.ChatRoom.prototype.getRoomMessageContentHeight = function () { return this.messageContent.clientHeight; }
Chat.Objects.ChatRoom.prototype.getRoomSession = function () { return this.currentMessageSession }
Chat.Objects.ChatRoom.prototype.hasNotSeenMessages = function (value) { if (!Chat.system.isNullOrUndefined(value)) { this._hasNotSeenMessages = value; } else { return this._hasNotSeenMessages; } }

Chat.Objects.ChatRoom.prototype.getRoomIdentifier = function () { return this.roomIdentifier; }
Chat.Objects.ChatRoom.prototype.getRoomName = function () { return this.roomName; }

//Room constants
Chat.Objects.ChatRoom.roomNameLength = 25;
Chat.Objects.ChatRoom.messagesElementScrollBufferArea = 70;

//End ChatRoom Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatMessage Object
Chat.Objects.ChatMessage = function (messageText, sendDate, chatUser) {
	this.message = messageText;
	this.chatUser = chatUser;
	var sys = Chat.system;

	this.sendDate = new Date(sendDate);

	if (this.sendDate.toString() == "Invalid Date" || sys.isDateInChatFormat(sendDate))
		this.sendDate = Date.tryToParseFromChatFormatString(sendDate)

	this.messageNodes = [];
	this.userMessageElement = this._createMessageElement();
}
Chat.Objects.ChatMessage.prototype._createMessageElement = function () {
	var sys = Chat.system;
	var chatMessageObject = Chat.Objects.ChatMessage;

	var additionalClass = this.chatUser.getUserIdentifier() == Chat.Engine.currentUser.getUserIdentifier() ? "ownMassage" : "foreignMassage";

	var userMessageElement = sys.createElement("div", "UserMessages", "UserMessages " + additionalClass, undefined, undefined, { "User-Identifier": this.chatUser.getUserIdentifier() });
	this.imageContentElement = sys.createElement("div", "ImageContainer", "ImageContainer", "<img src'" + this.chatUser.getUserIdentifier() + "_pic.png' class='SenderImg' />");

	var time = sys.createElement("div", undefined, "TextMessageContainer message-node-timestamp", this.getSendDate());
	this.textMessageContainerElement = sys.createElement("div", "TextMessageContainer", "TextMessageContainer", chatMessageObject.createMessageNodeElement(this, false).outerHTML, "block", { "Container": "true" });

	sys.AppendChild(userMessageElement, this.imageContentElement);
	sys.AppendChild(userMessageElement, time);
	sys.AppendChild(userMessageElement, this.textMessageContainerElement);

	return userMessageElement;
}
Chat.Objects.ChatMessage.prototype._appendMessageNode = function (message, addAtTheEnd) {
	var sys = Chat.system;
	var messageNode = Chat.Objects.ChatMessage.createMessageNodeElement(message, false);

	if (sys.isNullOrUndefined(addAtTheEnd)) {
		addAtTheEnd = true;
	}
	if (addAtTheEnd)
		this.messageNodes.push(message);
	else
		this.messageNodes.insert(message);

	sys.AppendChild(this.getTextMessageContainerElement(), messageNode, addAtTheEnd);
}

//Getters of ChatMessage objects
Chat.Objects.ChatMessage.prototype.getMessageElement = function () { return this.userMessageElement; }
Chat.Objects.ChatMessage.prototype.getMessageElementHtml = function () { return this.userMessageElement.outerHTML; }
Chat.Objects.ChatMessage.prototype.getMessageSenderIdentifier = function () { return this.chatUser.getUserIdentifier() }
Chat.Objects.ChatMessage.prototype.getMessageText = function () { return this.message }
Chat.Objects.ChatMessage.prototype.getTextMessageContainerElement = function () { return this.textMessageContainerElement; }
Chat.Objects.ChatMessage.prototype.getSendDate = function () { return this.sendDate.chatFormat(); }
Chat.Objects.ChatMessage.prototype.getMessageNotes = function () { return this.messageNodes; }

//Static methods
Chat.Objects.ChatMessage.createMessageNodeElement = function (message, appendTimestam) {
	var sys = Chat.system;
	var messageNode = sys.createElement("div", undefined, "MessageNode");

	var time = sys.createElement("div", undefined, "message-node-timestamp", message.getSendDate() + "---" + message.sendDate, appendTimestam ? "" : "none");
	sys.AppendChild(messageNode, time);

	var message = sys.createElement("span", undefined, undefined, message.getMessageText());
	sys.AppendChild(messageNode, message);

	return messageNode;
}

//End ChatMessage Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatMessageSession Object{

Chat.Objects.ChatMessageSession = function (roomIdentifier) {
	this.roomId = ""
	this.listOfMessages = [];
	this.unreadMessages = [];
	this.roomIdentifier = roomIdentifier;
	this.sessionStartDate = "";
	this.sessionEndDate = "";

	this.sessionNextDate = "";
	this.canLoadMoreHistory = true;
}
Chat.Objects.ChatMessageSession.prototype.addToMessageList = function (message) { this.listOfMessages.push(message); }
Chat.Objects.ChatMessageSession.prototype.insertOnTheTopOfMessageList = function (message) {
	if (this.listOfMessages.length == 0)
		this.addToMessageList(message)
	else
		this.listOfMessages.insert(0, message);
}

Chat.Objects.ChatMessageSession.prototype.getMessageAtIndex = function (index) { return this.listOfMessages[index]; }
Chat.Objects.ChatMessageSession.prototype.addUnreadMessage = function (message) { return this.unreadMessages.push(message); }
Chat.Objects.ChatMessageSession.prototype.getUnreadMessageCount = function (message) { return this.unreadMessages.length; }
Chat.Objects.ChatMessageSession.prototype.clearUnreadMessage = function (message) { return this.unreadMessages = []; }

//Setters
Chat.Objects.ChatMessageSession.prototype.setListOfMessages = function (list) { this.listOfMessages = list; }
Chat.Objects.ChatMessageSession.prototype.setIdRoom = function (list) { this.listOfMessages = list; }
Chat.Objects.ChatMessageSession.prototype.setUnreadMessages = function (unreadMessages) { this.unreadMessages = unreadMessages; }
Chat.Objects.ChatMessageSession.prototype.setSessionStartDate = function (sessionStartDate) { this.sessionStartDate = sessionStartDate; }
Chat.Objects.ChatMessageSession.prototype.setSessionEndDate = function (sessionEndDate) { this.sessionEndDate = sessionEndDate; }
Chat.Objects.ChatMessageSession.prototype.setSessionNextDate = function (sessionNextDate) { this.sessionNextDate = sessionNextDate; }
Chat.Objects.ChatMessageSession.prototype.setCanLoadMoreHistory = function (canLoadMoreHistory) { this.canLoadMoreHistory = canLoadMoreHistory; }

//Getters
Chat.Objects.ChatMessageSession.prototype.getIdRoom = function () { return this.roomId; }
Chat.Objects.ChatMessageSession.prototype.getListOfMessages = function () { return this.listOfMessages; }
Chat.Objects.ChatMessageSession.prototype.getUnreadMessages = function () { return this.unreadMessages; }
Chat.Objects.ChatMessageSession.prototype.getRoomIdentifier = function () { return this.roomIdentifier; }
Chat.Objects.ChatMessageSession.prototype.getSessionStartDate = function () { return this.sessionStartDate; }
Chat.Objects.ChatMessageSession.prototype.getSessionEndDate = function () { return this.sessionEndDate; }
Chat.Objects.ChatMessageSession.prototype.getSessionNextDate = function () { return this.sessionNextDate; }
Chat.Objects.ChatMessageSession.prototype.getCanLoadMoreHistory = function () { return this.canLoadMoreHistory; }

//Static methods
Chat.Objects.ChatMessageSession.parseFromJsonResult = function (result) {
	var chatMessageSession = new Chat.Objects.ChatMessageSession(result.RoomIdentifier);
	var listOfMessages = []
	for (var i = 0; i < result.RoomMessages.length; i++) {
		var currentMessage = result.RoomMessages[i];
		var status = Chat.Objects.ChatUserStatus.parseStatusFromJson(currentMessage.CurrentSendreStatus)
		var chatUser = new Chat.Objects.ChatUser(currentMessage.SenderIdentifier, currentMessage.SenderName, status);
		listOfMessages.push(new Chat.Objects.ChatMessage(currentMessage.MessageContent, currentMessage.DateOfSend, chatUser));
	}

	chatMessageSession.setListOfMessages(listOfMessages)
	chatMessageSession.setSessionStartDate(result.SessionStartDate)
	chatMessageSession.setSessionEndDate(result.SessionEndDate)

	return chatMessageSession;
}

//End ChatMessageSession Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatUser Object
Chat.Objects.ChatUser = function (userIndentifier, userName, chatStatus) {
	this.chatUserName = userName;
	this.userIndentifier = userIndentifier;
	this.chatUserStatus = chatStatus;
	this.userInListOfUsersHtmlObject = "";
	this.isUserVisible = true;
}
Chat.Objects.ChatUser.prototype.createUserListElement = function (chatEngine) {
	var sys = Chat.system;
	var currentUser = this;

	this.userInListOfUsersHtmlObject = sys.createElement("li", undefined, "ListElment");
	this.userInListOfUsersHtmlObject.onclick = function () { chatEngine.openRoomChat(currentUser.getUserIdentifier()) };

	this.divWrapper = sys.createElement("div", "ListGlobalElment", "ListGlobalElment");
	this.userImageContainer = sys.createElement("div", "UserImageContent", "UserImageContent");
	sys.AppendChild(this.divWrapper, this.userImageContainer);

	this.userNameContainer = sys.createElement("div", "UserNameDiv", "UserNameDiv", "<span class='UserNameText'>" + this.getUserName() + "</span>");
	sys.AppendChild(this.divWrapper, this.userNameContainer);

	this.userStatusContainer = sys.createElement("div", "UserStatusDiv", "UserStatusDiv");

	this.imageElement = this.getStatus().getImageElement();
	this.imageElement.style.margineTop = "4px";
	sys.AppendChild(this.userStatusContainer, this.imageElement);

	sys.AppendChild(this.divWrapper, this.userStatusContainer);

	sys.AppendChild(this.userInListOfUsersHtmlObject, this.divWrapper);

	return this.userInListOfUsersHtmlObject;
}
Chat.Objects.ChatUser.prototype.getUserIdentifier = function () { return this.userIndentifier; }
Chat.Objects.ChatUser.prototype.getUserName = function () { return this.chatUserName; }
Chat.Objects.ChatUser.prototype.getStatus = function () { return this.chatUserStatus; }
Chat.Objects.ChatUser.prototype.changeStatus = function (statusId) {
	this.getStatus().changeStatus(statusId);
	var oldStatusImage = this.imageElement;
	this.imageElement = this.getStatus().getImageElement();

	this.userStatusContainer.replaceChild(this.imageElement, oldStatusImage);
}
Chat.Objects.ChatUser.prototype.getHtmlObject = function () { return this.userInListOfUsersHtmlObject; }

Chat.Objects.ChatUser.prototype.show = function () {
	this.userInListOfUsersHtmlObject.style.display = "";
	this.isUserVisible = true;
}
Chat.Objects.ChatUser.prototype.hide = function () {
	this.userInListOfUsersHtmlObject.style.display = "none";
	this.isUserVisible = false;
}

//End ChatUser Object
//---------------------------------------------------------------------------------------------------------------------------------

// Start Chat status object
Chat.Objects.ChatUserStatus = function () {
	this.statusImage = "offline.png";
	this.statusName = Chat.Objects.ChatUserStatus.statusesName.OffLine;
	this.canMakeOperation = true;
	this.status = Chat.Objects.ChatUserStatus.statuses.OffLine;
}

Chat.Objects.ChatUserStatus.prototype.changeStatus = function (statusId) {
	switch (statusId) {
		case Chat.Objects.ChatUserStatus.statuses.OnLine:
			this.statusImage = Chat.Objects.ChatUserStatus.statusesImages.Online;
			this.statusName = Chat.Objects.ChatUserStatus.statusesName.Online
			this.canMakeOperation = true;
			this.status = Chat.Objects.ChatUserStatus.statuses.OnLine;
			break;
		case Chat.Objects.ChatUserStatus.statuses.OffLine:
			this.statusImage = Chat.Objects.ChatUserStatus.statusesImages.OffLine;
			this.statusName = Chat.Objects.ChatUserStatus.statusesName.OffLine
			this.canMakeOperation = true;
			this.status = Chat.Objects.ChatUserStatus.statuses.OffLine;
			break;
		default:
			this.statusImage = Chat.Objects.ChatUserStatus.statusesImages.OffLine;
			this.statusName = Chat.Objects.ChatUserStatus.statusesName.OffLine
			this.canMakeOperation = true;
			this.status = Chat.Objects.ChatUserStatus.statuses.OffLine;
			break;
	}
}

//Getters
Chat.Objects.ChatUserStatus.prototype.getStatusImage = function () { return this.statusImage; }
Chat.Objects.ChatUserStatus.prototype.getCanMakeOperation = function () { return this.canMakeOperation; }
Chat.Objects.ChatUserStatus.prototype.getStatus = function () { return this.status; }
Chat.Objects.ChatUserStatus.prototype.getStatusName = function () { return this.statusName; }

Chat.Objects.ChatUserStatus.prototype.getImageElement = function () {
	var sys = Chat.system;
	var imgStatus = sys.createElement("img");
	imgStatus.src = this.getStatusImage();
	imgStatus.style.width = "100%";

	return imgStatus;
}
Chat.Objects.ChatUserStatus.prototype.getImageElementAsHtml = function () { return this.getImageElement().outerHTML; }

//Setters
Chat.Objects.ChatUserStatus.prototype.setStatusImage = function (statusImage) { this.statusImage = statusImage; }

//Chat user status static methods
Chat.Objects.ChatUserStatus.parseStatusFromJson = function (jsonStatus) {
	var status = new Chat.Objects.ChatUserStatus();
	status.changeStatus(jsonStatus.IdStaut)

	return status;
}

//Chat user status static variables
Chat.Objects.ChatUserStatus.statuses = { "OnLine": 1, "OffLine": 2 };
Chat.Objects.ChatUserStatus.statusesImages = { "Online": "/ChatImage/online.png", "OffLine": "/ChatImage/offline.png" };
Chat.Objects.ChatUserStatus.statusesName = { "Online": "OnLine", "OffLine": "OffLine" };

// End Chat status object
//---------------------------------------------------------------------------------------------------------------------------------

//Start Chat Room Container object
Chat.Objects.ChatRoomContainer = function (containerElement, engine) {
	this.chatRoomContainer = containerElement;
	this.chatEngine = engine;
	this.roomCount = 0;
	this.isRoomListVisible = false;
	this.openedRoom = [];

	this.maxVisibleRoomsCount = 1; this.calculateMaximumVisibleRoom();

	this.spanCountOfInvisibleRoom = "";
	this.hiddenListOfRoomsHtmlObject = this._createListOfHiddenRoom();
	this.listContainer = "";

	this.visibleRoomsIdentifiers = [];
	this.hiddenRoomsIdentifiers = [];
}
Chat.Objects.ChatRoomContainer.prototype._createListOfHiddenRoom = function () {
	var sys = Chat.system;
	var roomContainer = this;

	var hiddenListOfRoomsHtmlObject = sys.createElement("div", undefined, "hidden-list-room-menu", undefined, "none");

	this.menuButton = sys.createElement("a", "menuButton", "list-menu-button");
	var clickOnBody = function () {
		roomContainer._minimizeHiddenList();
		Chat.system.removeEventListener(document, "click", clickOnBody, false);
	}
	this.menuButton.onclick = function (event) {
		event.stopPropagation();

		if (roomContainer.isRoomListVisible) {
			clickOnBody();
		} else {
			roomContainer._maximizeHiddenList();
			Chat.system.addEventListener(document, "click", clickOnBody, false);
		}
	}

	var iPicture = sys.createElement("i");
	this.spanCountOfInvisibleRoom = sys.createElement("span", undefined, undefined, this.roomCount - this.maxVisibleRoomsCount)

	sys.AppendChild(this.menuButton, iPicture);
	sys.AppendChild(this.menuButton, this.spanCountOfInvisibleRoom);

	this.listContainerWrapper = sys.createElement("div", undefined, "list-container-hidden-wrapper", undefined, "none");
	var scrollableWrapper = sys.createElement("div", undefined, "scrollable-wrapper");

	sys.AppendChild(this.listContainerWrapper, scrollableWrapper);

	this.listContainer = sys.createElement("div", undefined, "list-container-hidden");
	var menuWrapper = sys.createElement("div", undefined, "menu-wrapper");
	var menu = sys.createElement("div", undefined, "menu");

	sys.AppendChild(this.listContainer, menuWrapper);
	sys.AppendChild(menuWrapper, menu);

	this.listOfHiddenRoomElement = sys.createElement("ul", undefined, "list-hidden-rooms");

	sys.AppendChild(menu, this.listOfHiddenRoomElement);
	sys.AppendChild(scrollableWrapper, this.listContainer);

	sys.AppendChild(hiddenListOfRoomsHtmlObject, this.menuButton);
	sys.AppendChild(hiddenListOfRoomsHtmlObject, this.listContainerWrapper);

	sys.AppendChild(this.chatRoomContainer, hiddenListOfRoomsHtmlObject)

	return hiddenListOfRoomsHtmlObject;
}
Chat.Objects.ChatRoomContainer.prototype._appendHiddenRoom = function (room) {
	var sys = Chat.system;
	var chatEngine = this.chatEngine;
	var currentContainer = this;

	var listItem = sys.createElement("li", undefined, "hidden-room-list-element", undefined, undefined, { "id": room.getRoomIdentifier() });
	listItem.onclick = function (event) {
		currentContainer._showHiddenRoomAndHideLastVisibleRoom(room, this);
		currentContainer._minimizeHiddenList();
	}

	var aTag = sys.createElement("a", undefined, "hidden-room-list-item", undefined, undefined, { "href": "javascript:;" });
	var span = sys.createElement("span", undefined, "span-wrapper");
	var divClearFix = sys.createElement("div", undefined, "clear-fix");

	var closeButtonLabel = sys.createElement("label", undefined, "close-button-label");
	var closeButton = sys.createElement("input", undefined, "close-button", undefined, undefined, { "type": "button" });

	closeButton.onclick = function (event) {
		event.stopPropagation();
		sys.RemoveElmenet(currentContainer.listOfHiddenRoomElement, listItem);
		chatEngine.closeRoom(room.getRoomIdentifier());
	}

	sys.AppendChild(closeButtonLabel, closeButton);
	sys.AppendChild(divClearFix, closeButtonLabel);

	var divRoomNameWrapper = sys.createElement("div", undefined, "room-name-wrapper");

	var roomName = room.getRoomName();
	roomName = roomName.length > (Chat.Objects.ChatRoom.roomNameLength - 3) ? (roomName.substring(0, Chat.Objects.ChatRoom.roomNameLength) + "...") : roomName;
	var spanRoomName = sys.createElement("span", undefined, "room-name", roomName);

	sys.AppendChild(divRoomNameWrapper, spanRoomName);
	sys.AppendChild(divClearFix, divRoomNameWrapper);

	sys.AppendChild(span, divClearFix);
	sys.AppendChild(aTag, span);
	sys.AppendChild(listItem, aTag);

	sys.AppendChild(this.listOfHiddenRoomElement, listItem);
}

Chat.Objects.ChatRoomContainer.prototype._updateCounterOfInvisibleRooms = function () {
	this.spanCountOfInvisibleRoom.innerHTML = this.roomCount - this.maxVisibleRoomsCount;
}

Chat.Objects.ChatRoomContainer.prototype._minimizeHiddenList = function () {
	this.listContainerWrapper.style.display = "none"
	this.isRoomListVisible = false;
}
Chat.Objects.ChatRoomContainer.prototype._maximizeHiddenList = function () {
	this.listContainerWrapper.style.display = "block"
	this.isRoomListVisible = true;
}

Chat.Objects.ChatRoomContainer.prototype._showHiddenListOfRoomsMenu = function () { this.hiddenListOfRoomsHtmlObject.style.display = "block" }
Chat.Objects.ChatRoomContainer.prototype._hideHiddenListOfRoomsMenu = function () { this.hiddenListOfRoomsHtmlObject.style.display = "none" }

Chat.Objects.ChatRoomContainer.prototype._deleteRoomIdentifierFromHiddenList = function (roomIdentifier) {
	this.hiddenRoomsIdentifiers.splice(this.hiddenRoomsIdentifiers.indexOf(roomIdentifier), 1);
}
Chat.Objects.ChatRoomContainer.prototype._deleteRoomIdentifierFromVisibleList = function (roomIdentifier) {
	this.visibleRoomsIdentifiers.splice(this.visibleRoomsIdentifiers.indexOf(roomIdentifier), 1);
}

Chat.Objects.ChatRoomContainer.prototype._showHiddenRoomAndHideLastVisibleRoom = function (hiddenRoom, clickedHtmlListItem) {
	var sys = Chat.system;

	sys.RemoveElmenet(this.listOfHiddenRoomElement, clickedHtmlListItem)
	var lastVisibleRoom = this.getRoomByIdentifier(this.visibleRoomsIdentifiers.lastOrDefault())

	this._deleteRoomIdentifierFromHiddenList(hiddenRoom.getRoomIdentifier());
	this._deleteRoomIdentifierFromVisibleList(lastVisibleRoom.getRoomIdentifier())

	this.hiddenRoomsIdentifiers.push(lastVisibleRoom.getRoomIdentifier());

	this._appendHiddenRoom(lastVisibleRoom);
	sys.RemoveElmenet(this.getRoomContainer(), lastVisibleRoom.getRoomHtmlObject());
	this.addRoom(hiddenRoom, true);

	lastVisibleRoom.maximizeRoom();
	hiddenRoom.scrollToTheBottonOfMessageContent();
}

Chat.Objects.ChatRoomContainer.prototype.getRoomContainer = function () { return this.chatRoomContainer; }
Chat.Objects.ChatRoomContainer.prototype.calculateMaximumVisibleRoom = function () {
	var freeSpace = (document.body.clientWidth - Chat.Objects.ChatRoomContainer.userListWidth - Chat.Objects.ChatRoomContainer.hiddenRoomListMenu);
	var count = parseInt(freeSpace / Chat.Objects.ChatRoomContainer.roomWidth);

	return count;
}

Chat.Objects.ChatRoomContainer.prototype.isRoomInHiddenList = function (roomIdentifier) {
	return this.hiddenRoomsIdentifiers.contains(roomIdentifier);
}
Chat.Objects.ChatRoomContainer.prototype.showSingForUnreadMessage = function (roomIdentifier) {
	var sys = Chat.system;
	var roomContainer = this;

	this._addMenuButtonBlinkClass();

	var listElement = sys.getElementsByAttributeAndValueFromElement(this.listOfHiddenRoomElement, "id", roomIdentifier)[0];
	var oldClasses = listElement.className;
	listElement.className = oldClasses + " blink"

	var previousClick = listElement.onclick;
	listElement.onclick = function (event) {
		listElement.className = oldClasses;
		var allRoomWithUnreadMessages = roomContainer.listOfHiddenRoomElement.getElementsByClassName("blink");
		if (sys.isNullOrUndefined(allRoomWithUnreadMessages) || allRoomWithUnreadMessages.length <= 0) {
			roomContainer._removeMenuButtonBlinkClass()
		}

		if (!sys.isNullOrUndefined(previousClick))
			previousClick.apply(this, [event]);
	}
}
Chat.Objects.ChatRoomContainer.prototype._removeMenuButtonBlinkClass = function () {
	this.menuButton.className = this.menuButton.className.replace("blink", "");
}
Chat.Objects.ChatRoomContainer.prototype._addMenuButtonBlinkClass = function () {
	if (this.menuButton.className.indexOf("blink") < 0)
		this.menuButton.className += " blink";
}

Chat.Objects.ChatRoomContainer.prototype.addRoom = function (room, insertAtTheEnd) {
	var sys = Chat.system;

	if (this.visibleRoomsIdentifiers.length < this.maxVisibleRoomsCount) {
		insertBefore = sys.isNullOrUndefined(insertAtTheEnd) ? true : insertAtTheEnd;
		sys.AppendChild(this.chatRoomContainer, room.getRoomHtmlObject(), insertBefore);
		this.visibleRoomsIdentifiers.push(room.getRoomIdentifier())
	} else {
		this._appendHiddenRoom(room);
		this.hiddenRoomsIdentifiers.push(room.getRoomIdentifier())
		this._showHiddenListOfRoomsMenu();
	}

	if (!this.listOfRoomContains(room.getRoomIdentifier())) {
		this.openedRoom[room.getRoomIdentifier()] = room;
		this.roomCount++;
	}
	this._updateCounterOfInvisibleRooms();
}
Chat.Objects.ChatRoomContainer.prototype.removeRoom = function (room) {
	var sys = Chat.system;
	try {
		if (this.visibleRoomsIdentifiers.contains(room.getRoomIdentifier())) {
			sys.RemoveElmenet(this.chatRoomContainer, room.getRoomHtmlObject());
			this._deleteRoomIdentifierFromVisibleList(room.getRoomIdentifier())

			if (this.hiddenRoomsIdentifiers.length > 0) {
				var firstRoomFromHiddenList = this.getRoomByIdentifier(this.hiddenRoomsIdentifiers.firstOrDefault())
				sys.AppendChild(this.chatRoomContainer, firstRoomFromHiddenList.getRoomHtmlObject(), false);
				sys.RemoveElmenet(this.listOfHiddenRoomElement, this.listOfHiddenRoomElement.firstChild);

				this._deleteRoomIdentifierFromHiddenList(firstRoomFromHiddenList.getRoomIdentifier())
				this.visibleRoomsIdentifiers.push(firstRoomFromHiddenList.getRoomIdentifier())
			}
		} else {
			this._deleteRoomIdentifierFromHiddenList(room.getRoomIdentifier())
		}
		this.roomCount--;
		delete this.openedRoom[room.getRoomIdentifier()];
		this._updateCounterOfInvisibleRooms();

		if (0 >= (this.roomCount - this.maxVisibleRoomsCount)) {
			this._minimizeHiddenList();
			this._hideHiddenListOfRoomsMenu()
			this._removeMenuButtonBlinkClass();
		}
	} catch (ex) {
		sys.logError(ex);
	}
}
Chat.Objects.ChatRoomContainer.prototype.listOfRoomContains = function (roomIdentifier) {
	var sys = Chat.system;
	return !sys.isNullOrUndefinedOrEmptyObject(this.openedRoom[roomIdentifier])
}
//Getters
Chat.Objects.ChatRoomContainer.prototype.getMaxVisibleRoomsCount = function () { return this.maxVisibleRoomsCount; }
Chat.Objects.ChatRoomContainer.prototype.getOpenRoomList = function () { return this.openedRoom; }
Chat.Objects.ChatRoomContainer.prototype.getRoomByIdentifier = function (roomIdentifier) { return this.openedRoom[roomIdentifier]; }

//Chat room container static variables
Chat.Objects.ChatRoomContainer.roomWidth = 275;
Chat.Objects.ChatRoomContainer.userListWidth = 240;
Chat.Objects.ChatRoomContainer.hiddenRoomListMenu = 42;

//End Chat Room Container object

//Start Chat user list container
Chat.Objects.ChatUserListContainer = function (container, settings) {
	this.listContainer = container;
	this.userList = "";
	this.listOfUserContainerFooter = "";
	this.searchUserTextArea = "";

	this.settingsDiv = settings;

	var sys = Chat.system;
	this.listContainerOfUserList = this._createListContainerOfUserList();
	sys.AppendChild(this.listContainer, this.listContainerOfUserList);
	this._createListContainerFooter();
	sys.AppendChild(this.listContainer, this.listOfUserContainerFooter);

	this.users = [];
}
Chat.Objects.ChatUserListContainer.prototype._createListContainerOfUserList = function () {
	var sys = Chat.system;

	var listContainer = sys.createElement("div", "listContent")
	listContainer.style.setProperty("float", "left");
	listContainer.style.setProperty("padding-top", "15px");
	listContainer.style.setProperty("max-height", "588px");

	this.userList = sys.createElement("ul", "UserInList", "UserInList");
	this.userList.style.setProperty("max-height", "593px");

	sys.AppendChild(listContainer, this.userList);

	return listContainer;
}
Chat.Objects.ChatUserListContainer.prototype._createListContainerFooter = function () {
	var sys = Chat.system;
	var chatUserListContainer = this;

	this.listOfUserContainerFooter = sys.createElement("div", undefined, "ListUserFooter");
	var textAreaWrapper = sys.createElement("div");

	this.searchUserTextArea = sys.createElement("textarea", undefined, "SearchUser", "Search", undefined, { "rows": "2" });
	this.searchUserTextArea.onfocus = function () { this.value = "" };
	this.searchUserTextArea.onblur = function () { this.value = "Search"; setTimeout(function () { chatUserListContainer.showAllUsers() }, 100) };
	this.searchUserTextArea.onkeyup = function () { if (this.value != "Search") { chatUserListContainer._filterUsers(this.value); } };

	sys.AppendChild(textAreaWrapper, this.searchUserTextArea);
	sys.AppendChild(this.listOfUserContainerFooter, textAreaWrapper);

	this.settingsButton = sys.createElement("div", "Settings", "Status");
	this.settingsButton.style.setProperty("background-image", "url(/ChatImage/settingsButton.png)");
	this.settingsButton.style.setProperty("background-repeat", "no-repeat");
	this.settingsButton.style.setProperty("background-size", "contain");

	var clickOnBody = function () {
		chatUserListContainer.settingsDiv.minimizeSettings();
		Chat.system.removeEventListener(document, "click", clickOnBody, false);
	}
	this.settingsButton.onclick = function (event) {
		event.stopPropagation();
		if (chatUserListContainer.settingsDiv.isSettingDivExpand) {
			clickOnBody();
		}
		else {
			chatUserListContainer.settingsDiv.maximizeSettings();
			Chat.system.addEventListener(document, "click", clickOnBody, false);
		}
	}

	sys.AppendChild(this.listOfUserContainerFooter, this.settingsButton);

	var statusImageWrapper = sys.createElement("div", "Status", "Status")
	sys.AppendChild(this.listOfUserContainerFooter, statusImageWrapper);
}
Chat.Objects.ChatUserListContainer.prototype._filterUsers = function (val) {
	for (var i in this.users) {
		if (this.users.hasOwnProperty(i)) {
			var iterationUser = this.users[i];
			if (iterationUser.getUserName().toLowerCase().startWith(val.toLowerCase())) {
				iterationUser.show();
			} else {
				iterationUser.hide();
			}
		}
	}
}
Chat.Objects.ChatUserListContainer.prototype.showAllUsers = function () {
	for (var i in this.users) {
		if (this.users.hasOwnProperty(i))
			this.users[i].show();
	}
}

Chat.Objects.ChatUserListContainer.prototype.getHtmlObject = function () { return this.listContainer; }
Chat.Objects.ChatUserListContainer.prototype.addUsers = function (user) { this.users[user.getUserIdentifier()] = user; }
Chat.Objects.ChatUserListContainer.prototype.isContains = function (userIdentifier) { return this.users.contains(userIdentifier) }
Chat.Objects.ChatUserListContainer.prototype.appendUser = function (user, engine) {
	var sys = Chat.system;

	if (!this.isContains(user.getUserIdentifier())) {
		sys.AppendChild(this.userList, user.createUserListElement(engine));
		this.addUsers(user)
	}
}
Chat.Objects.ChatUserListContainer.prototype.clearUserContainer = function () { this.userList.innerHTML = ""; this.users = []; }
Chat.Objects.ChatUserListContainer.prototype.hideSettingsButton = function () { this.settingsButton.style.display = "none" }
Chat.Objects.ChatUserListContainer.prototype.showSettingsButton = function () { this.settingsButton.style.display = "" }
Chat.Objects.ChatUserListContainer.prototype.removeUser = function (userIdentifier) {
	if (this.isContains(userIdentifier)) {
		Chat.system.RemoveElmenet(this.userList, this.users[userIdentifier].getHtmlObject());
		delete this.users[userIdentifier];
	}
}

//Getters
Chat.Objects.ChatUserListContainer.prototype.getUsers = function () { return this.users; }
Chat.Objects.ChatUserListContainer.prototype.getUserByIdentifier = function (userIdentifier) { return this.users[userIdentifier]; }

//End Chat user list container

//Start Chat settings
Chat.Objects.ChatSettings = function () {
	this.settings = [];

	this.settingContainer = "";
	this.isSettingDivExpand = false;
}
Chat.Objects.ChatSettings.prototype.addSettings = function (setting) {
	this.settings[setting.getName()] = setting;
}
Chat.Objects.ChatSettings.prototype.getSettingByName = function (name) {
	return this.settings[name];
}

Chat.Objects.ChatSettings.prototype.createSettings = function () {
	var sys = Chat.system;

	this.settingContainer = sys.createElement("div", "SettingsDiv", "SettingsDiv", undefined, "none");
	for (var i in this.settings) {
		if (this.settings.hasOwnProperty(i)) {
			this.settings[i].createSettingHtmlElement()
			sys.AppendChild(this.settingContainer, this.settings[i].getHtmlObject());
		}
	}
}

Chat.Objects.ChatSettings.prototype.minimizeSettings = function () { this.settingContainer.style.display = "none"; this.isSettingDivExpand = false; }
Chat.Objects.ChatSettings.prototype.maximizeSettings = function () { this.settingContainer.style.display = ""; this.isSettingDivExpand = true }
Chat.Objects.ChatSettings.prototype.getHtmlObject = function () { return this.settingContainer; }

// Chat setting
Chat.Objects.ChatSetting = function (name) {
	this.settingsName = name;
	this.optionsOfTheSetting = [];

	this.settingContainer = "";
}
Chat.Objects.ChatSetting.prototype.getName = function () { return this.settingsName; };

Chat.Objects.ChatSetting.prototype.addOption = function (option) {
	this.optionsOfTheSetting[option.getName()] = option;
}
Chat.Objects.ChatSetting.prototype.getSettingByName = function (name) {
	return this.optionsOfTheSetting[option.getName()];
}

Chat.Objects.ChatSetting.prototype.createSettingHtmlElement = function () {
	var sys = Chat.system;
	this.settingContainer = sys.createElement("ul", undefined, "settingsContent");
	for (var i in this.optionsOfTheSetting) {
		if (this.optionsOfTheSetting.hasOwnProperty(i)) {
			var option = this.optionsOfTheSetting[i];
			sys.AppendChild(this.settingContainer, option.getHtmlElement());
		}
	}
}
Chat.Objects.ChatSetting.prototype.getHtmlObject = function () { return this.settingContainer; }

//Chat options
Chat.Objects.ChatSettingOption = function (name, eventName, callback) {
	this.name = name;
	this.events = [];
	this.events[eventName] = [callback];

	this.attributes = [];

	this.listElement = "";
	this.divContainer = "";
}
Chat.Objects.ChatSettingOption.prototype.getName = function () { return this.name; }
Chat.Objects.ChatSettingOption.prototype.setEventToOption = function (eventName, callback) {
	var sys = Chat.system;

	if (sys.isNullOrUndefinedOrEmptyObject(this.events[eventName]))
		this.events[eventName] = [callback];
	else
		this.events[eventName].push(callback);
}
Chat.Objects.ChatSettingOption.prototype.removeEvent = function (eventName) {
	if (!sys.isNullOrUndefinedOrEmptyObject(this.events[eventName]))
		delete this.events[eventName];
}
Chat.Objects.ChatSettingOption.prototype.getEventsByName = function (eventName) {
	return this.events[eventName];
}
Chat.Objects.ChatSettingOption.prototype.setAttribute = function (name, value) { this.attributes[name] = value; }
Chat.Objects.ChatSettingOption.prototype.getAttribute = function (name) { return this.attributes[name]; }
Chat.Objects.ChatSettingOption.prototype.getHtmlElement = function () { return this.listElement; }

Chat.Objects.ChatSettingOption.prototype.createHtmlElement = function (contentElement) {
	var sys = Chat.system;

	this.listElement = sys.createElement("li", undefined, "SettigsElment");

	this.divContainer = sys.createElement("div");
	for (var i in this.attributes) {
		if (this.attributes.hasOwnProperty(i)) {
			this.divContainer.setAttribute(i, this.attributes[i])
		}
	}
	for (var funcName in this.events) {
		if (this.events.hasOwnProperty(funcName)) {
			var iterationEvents = this.events[funcName];
			var eventName = funcName.startWith("on") ? funcName.substring(2, funcName.length) : funcName;
			for (var funcIndex in iterationEvents) {
				if (iterationEvents.hasOwnProperty(funcIndex)) {
					if (sys.isNullOrUndefined(this.divContainer["on" + eventName]))
						this.divContainer["on" + eventName] = iterationEvents[funcIndex];
					else
						sys.addEventListener(this.divContainer, eventName, iterationEvents[funcIndex]);
				}
			}
		}
	}

	sys.AppendChild(this.divContainer, contentElement);
	sys.AppendChild(this.listElement, this.divContainer);
}
//End Chat settings

Chat.HtmlHalpers.generateCoolPopUpHtml = function (userNames) {
	var bodyOfPopUp = "";
	for (var i = 0; i < userNames.length; i++) {
		bodyOfPopUp += '<div><div>' + userNames[i] + '</div></div>'
	}

	var popUp = '<div class="uiContextualLayerPositioner uiLayer" style="width: 70%;top: 8px; left: 10px;">' +
		'<div class="uiContextualLayer uiContextualLayerAboveLeft" style="bottom: 0px;">' +
			'<div class="uiTooltipX">' +
				'<div class="tooltipContent">' +
					'<div>' +
						'<div>' +
							bodyOfPopUp +
						'</div>' +
					'</div>' +
				'</div><i class="arrow"></i>' +
			'</div>' +
		'</div>' +
	'</div>'

	return popUp;
}