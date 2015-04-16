/// <reference path="Extensions.js" />
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
	this.chatRoomElement = this._createNewRoomElement();
	this.currentMessageSession = new Chat.Objects.ChatMessageSession(roomIdentifier);
}
Chat.Objects.ChatRoom.prototype._parseRoomName = function (roomName) {
    var splitedRoomName = roomName.split('|');
    var roomName = ""
    for (var i = 0; i < splitedRoomName.length;i++)
    {
        if (Chat.Engine.currentUser.getUserName() != splitedRoomName[i]) {
            if (!String.isEmpty(splitedRoomName[i]))
                roomName += (splitedRoomName[i] + ", ")
        }
    }

    return roomName.substring(0, roomName.length - (", ").length);
}
Chat.Objects.ChatRoom.prototype._definedRoomNameElement = function (roomName)
{
    var sys = Chat.system;

    var spanElement = sys.createElement("span", undefined, undefined);

    if (roomName.length <= Chat.Objects.ChatRoom.roomNameLength){
        spanElement.innerText = roomName;
        return spanElement;
    } else {
        var link = sys.createElement("a", undefined, "link-with-users-in-room", (roomName.substring(0, Chat.Objects.ChatRoom.roomNameLength) + "..."))
        var room = this;
        var balloonDiv = sys.createElement("div",undefined,undefined, this._createHeaderBalloonWithUserNames(this.getRoomName()))
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
Chat.Objects.ChatRoom.prototype._createNewRoomElement = function () {
	var sys = Chat.system;
	var chatRoom = this;

	this.roomContentElement = sys.createElement("div", "RoomContent", "RoomContent");

	this.roomHeaderElement = sys.createElement("div", "RoomHeader" + this.getRoomIdentifier(), "RoomHeader", undefined, "block")
	sys.AppendChild(this.roomHeaderElement, this._definedRoomNameElement(this.getRoomName()));
	
	var closeButton = sys.createElement("div", undefined, "CloseButton");
	closeButton.onclick = function () { chatRoom.engine.closeRoom(chatRoom.getRoomIdentifier()) };
	sys.AppendChild(this.roomHeaderElement,closeButton)
	
	sys.AppendChild(this.roomContentElement, this.roomHeaderElement);

	this.conversationPartElement = sys.createElement("div", "ConversationPart", "ConversationPart", undefined, "block");

	this.messageContent = sys.createElement("div", "MessageContent" + this.getRoomIdentifier(), "MessageContent", undefined, "block");
	this.messageContent.onscroll = function () { if (this.scrollTop == 0) chatRoom.engine.loadHistory(chatRoom.getRoomIdentifier()); }

	sys.AppendChild(this.conversationPartElement, this.messageContent);

	this.textAreaOfRoom = sys.createElement("textarea", "MessageText" + this.getRoomIdentifier(), "TextBox", undefined, "block", { "rows": "1" })
	this.textAreaOfRoom.onkeydown = function (event) { chatRoom.engine.sendMessage(event, chatRoom.getRoomIdentifier());};

	this.roomFooterElement = sys.createElement("div", "RoomFooter", "RoomFooter");
	sys.AppendChild(this.roomFooterElement, this.textAreaOfRoom);

	sys.AppendChild(this.conversationPartElement, this.roomFooterElement);
	sys.AppendChild(this.roomContentElement, this.conversationPartElement);

	var chatRoomElement = sys.createElement("div", "Chat-" + this.getRoomIdentifier(), "ChatRoom", undefined, "block", { "RoomId": this.getRoomIdentifier(), "Visible": true });

	sys.AppendChild(chatRoomElement, this.roomContentElement);

	return chatRoomElement;
}

Chat.Objects.ChatRoom.prototype.getRoomHtml = function () { return this.chatRoomElement.outerHTML }
Chat.Objects.ChatRoom.prototype.getRoomHtmlObject = function () { return this.chatRoomElement }

Chat.Objects.ChatRoom.prototype.getRoomIdentifier = function () { return this.roomIdentifier; }
Chat.Objects.ChatRoom.prototype.getRoomName = function () { return this.roomName; }

Chat.Objects.ChatRoom.prototype._convertElementArrayToHtmlString = function (arr) {
	var html = "";
	var sys = Chat.system;

	for (var i = 0; i < arr.length;i++ )
	{
		if (!sys.isNullOrUndefined(arr[i]))
			html += arr[i].outerHTML;
	}

	return html;
}
Chat.Objects.ChatRoom.prototype.appendMessageElementToContent = function(message)
{
	var sys = Chat.system;

	if (this.messageContent.childNodes.length == 0) {

		this._appendMessageElementToContent(message);
		return;
	}

	var lastUserMessage = this.currentMessageSession.getListOfMessages().lastOrDefault();

	if (sys.isNullOrUndefined(lastUserMessage))
		throw Error("There is no message in the array");

	if (lastUserMessage.getMessageSenderIdentifier() == message.getMessageSenderIdentifier()) {
		lastUserMessage._appendMessageNode(message.getMessageText())

	} else {
		this._appendMessageElementToContent(message);
	}
}
Chat.Objects.ChatRoom.prototype.loadHistory = function (result) {
	this._appendHistoryToMessageContainerElement(result)
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

		if (message.getMessageSenderIdentifier() == currentSessionMessage.getMessageSenderIdentifier()) {

			message._appendMessageNode(currentSessionMessage.getMessageText(), false)

		} else {

			this._appendMessageElementToContent(message, false);

			message = currentSessionMessage;
			curretnMessageElement = message.getMessageElement();
		}
	}

	//Append the last message
	this._appendMessageElementToContent(message, false);
}
Chat.Objects.ChatRoom.prototype._appendMessageElementToContent = function (message, addAtTheEndOfTheContent)
{
	var sys = Chat.system;
	addAtTheEndOfTheContent = sys.isNullOrUndefined(addAtTheEndOfTheContent) ? true : addAtTheEndOfTheContent;

	sys.AppendChild(this.messageContent, message.getMessageElement(), addAtTheEndOfTheContent);
	if (addAtTheEndOfTheContent)
		this.currentMessageSession.addToMessageList(message);
	else
		this.currentMessageSession.insertOnTheTopOfMessageList(message);
}

//Room constants
Chat.Objects.ChatRoom.roomNameLength = 25;

//End ChatRoom Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatMessage Object
Chat.Objects.ChatMessage = function (messageText, sendDate, chatUser) {
	this.message = messageText;
	this.chatUser = chatUser;
	this.userMessageElement = this._createMessageElement();
	this.sendDate = sendDate;
	this.messageNodes = [];
}
Chat.Objects.ChatMessage.prototype._createMessageElement = function () {
	var sys = Chat.system;
	var chatMessageObject = Chat.Objects.ChatMessage;

	var additionalClass = this.chatUser.getUserIdentifier() == Chat.Engine.currentUser.getUserIdentifier() ? "ownMassage" : "foreignMassage";

	var userMessageElement = sys.createElement("div", "UserMessages", "UserMessages " + additionalClass, undefined, undefined, { "User-Identifier": this.chatUser.getUserIdentifier() });
	this.imageContentElement = sys.createElement("div", "ImageContainer", "ImageContainer", "<img src'" + this.chatUser.getUserIdentifier() + "_pic.png' class='SenderImg' />");

	this.textMessageContainerElement = sys.createElement("div", "TextMessageContainer", "TextMessageContainer", chatMessageObject.createMessageNodeElement(this.message).outerHTML, "block", { "Container": "true" });
	
	sys.AppendChild(userMessageElement, this.imageContentElement);
	sys.AppendChild(userMessageElement, this.textMessageContainerElement);

	return userMessageElement;
}
Chat.Objects.ChatMessage.prototype._appendMessageNode = function (text, addAtTheEnd)
{
	var sys = Chat.system;
	var messageNode = Chat.Objects.ChatMessage.createMessageNodeElement(text);
	this.messageNodes.push(text);

	sys.AppendChild(this.getTextMessageContainerElement(), messageNode, sys.isNullOrUndefined(addAtTheEnd) ? true : addAtTheEnd);
}

//Getters of ChatMessage objects
Chat.Objects.ChatMessage.prototype.getMessageElement = function () { return this.userMessageElement; }
Chat.Objects.ChatMessage.prototype.getMessageElementHtml = function () { return this.userMessageElement.outerHTML; }
Chat.Objects.ChatMessage.prototype.getMessageSenderIdentifier = function(){ return this.chatUser.getUserIdentifier() }
Chat.Objects.ChatMessage.prototype.getMessageText = function () { return this.message }
Chat.Objects.ChatMessage.prototype.getTextMessageContainerElement = function () { return this.textMessageContainerElement; }
Chat.Objects.ChatMessage.prototype.getSendDate = function () { return this.sendDate; }

//Static methods 
Chat.Objects.ChatMessage.createMessageNodeElement = function (textOfMessage) {
	var sys = Chat.system;
	return sys.createElement("div", undefined, "MessageNode", textOfMessage)
}

//End ChatMessage Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatMessageSession Object

Chat.Objects.ChatMessageSession = function (roomIdentifier)
{
	this.roomId = ""
	this.listOfMessages = [];
	this.unreadMessages = {};
	this.roomIdentifier = roomIdentifier;
	this.sessionStartDate = "";
	this.sessionEndDate = "";
}
Chat.Objects.ChatMessageSession.prototype.addToMessageList = function (message) { this.listOfMessages.push(message); }
Chat.Objects.ChatMessageSession.prototype.insertOnTheTopOfMessageList = function (message) {
	if (this.listOfMessages.length == 0)
		this.addToMessageList(message)
	else
		this.listOfMessages.insert(0, message);
}

Chat.Objects.ChatMessageSession.parseFromJsonResult = function(result){

	var chatMessageSession = new Chat.Objects.ChatMessageSession(result.RoomIdentifier);
	var listOfMessages = []
	for (var i = 0; i < result.RoomMessages.length; i++) {
		var currentMessage = result.RoomMessages[i];
		var chatUser = new Chat.Objects.ChatUser(currentMessage.SenderIdentifier, currentMessage.SenderName, currentMessage.CurrentSendreStatus);
		listOfMessages.push(new Chat.Objects.ChatMessage(currentMessage.MessageContent, currentMessage.DateOfSend, chatUser));
	}

	chatMessageSession.setListOfMessages(listOfMessages)
	chatMessageSession.setUnreadMessages(result.UnreadMessages)
	chatMessageSession.setSessionStartDate(result.SessionStartDate)
	chatMessageSession.setSessionEndDate(result.SessionEndDate)

	return chatMessageSession;
}

Chat.Objects.ChatMessageSession.prototype.setListOfMessages = function (list) { this.listOfMessages = list; }
Chat.Objects.ChatMessageSession.prototype.setIdRoom = function (list) { this.listOfMessages = list; }
Chat.Objects.ChatMessageSession.prototype.setUnreadMessages = function (unreadMessages) { this.unreadMessages = unreadMessages; }
Chat.Objects.ChatMessageSession.prototype.setSessionStartDate = function (sessionStartDate) { this.sessionStartDate = sessionStartDate; }
Chat.Objects.ChatMessageSession.prototype.setSessionEndDate = function (sessionEndDate) { this.sessionEndDate = sessionEndDate; }

Chat.Objects.ChatMessageSession.prototype.getIdRoom = function () { return this.roomId; }
Chat.Objects.ChatMessageSession.prototype.getListOfMessages = function () { return this.listOfMessages; }
Chat.Objects.ChatMessageSession.prototype.getUnreadMessages = function () { return this.unreadMessages; }
Chat.Objects.ChatMessageSession.prototype.getRoomIdentifier = function () { return this.roomIdentifier; }
Chat.Objects.ChatMessageSession.prototype.getSessionStartDate = function () { return this.sessionStartDate; }
Chat.Objects.ChatMessageSession.prototype.getSessionEndDate = function () { return this.sessionEndDate; }

Chat.Objects.ChatMessageSession.prototype.getMessageAtIndex = function (index) { return this.listOfMessages[index]; }

//End ChatMessageSession Object
//---------------------------------------------------------------------------------------------------------------------------------

//Start ChatUser Object
Chat.Objects.ChatUser = function (userIndentifier, userName, currentUserStatus)
{
	this.chatUserName = userName;
	this.userIndentifier = userIndentifier;
	this.chatUserStatus = new Chat.Objects.ChatUserStatus(currentUserStatus.StatusImage);
	this.userInListOfUsersHtmlObject = "";
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
Chat.Objects.ChatUser.prototype.getUserIdentifier = function(){ return this.userIndentifier;}
Chat.Objects.ChatUser.prototype.getUserName = function () { return this.chatUserName; }
Chat.Objects.ChatUser.prototype.getStatus = function () { return this.chatUserStatus; }
Chat.Objects.ChatUser.prototype.changeStatus = function (statusImage) {
	this.imageElement.src = ("/ChatImage/" + statusImage);
	this.getStatus().setStatusImage(statusImage);
}

//End ChatUser Object
//---------------------------------------------------------------------------------------------------------------------------------

// Start Chat status object
Chat.Objects.ChatUserStatus = function (statusImage) {
	this.statusImage = statusImage;
}
Chat.Objects.ChatUserStatus.prototype.getStatusImage = function () { return this.statusImage; }
Chat.Objects.ChatUserStatus.prototype.getImageElement = function () {
	var sys = Chat.system;
	var imgStatus = sys.createElement("img");
	imgStatus.src = "/ChatImage/" + this.getStatusImage();
	imgStatus.style.width = "100%";

	return imgStatus;
}
Chat.Objects.ChatUserStatus.prototype.getImageElementAsHtml = function () { return this.getImageElement().outerHTML; }
Chat.Objects.ChatUserStatus.prototype.setStatusImage = function(statusImage){ this.statusImage = statusImage; }

// End Chat status object
//---------------------------------------------------------------------------------------------------------------------------------

function ShowSetting(a)
{
	var sys = Chat.system;

	if (sys.GetElement("SettingsDiv").style.display == "block")
		sys.GetElement("SettingsDiv").style.display = "none";
	else {
		sys.GetElement("SettingsDiv").style.display = "block";
		a.focus()
	}
}
function TextAreaOnFocus(currElement)
{
	currElement.value = "";
}
function TextAreaOnBlur(currElement)
{
	currElement.value = "Search";
}

function SettingDivOnBlur(currElement)
{
	alert("GootTry")
	if (currElement.style.display == "block")
		currElement.style.display = "none";
}

function scrollHandler(currElement, IdRoom)
{
	if (currElement.scrollTop == 0)
		LoadHistory(IdRoom);
}

Chat.HtmlHalpers.generateCoolPopUpHtml = function (userNames) {
    var bodyOfPopUp = "";
    for(var i = 0; i < userNames.length;i++)
    {
        bodyOfPopUp += '<div><div>'+ userNames[i] +'</div></div>'
    }

    var popUp = '<div class="uiContextualLayerPositioner uiLayer" style="width: 70%;top: 8px; left: 10px;">' +
        '<div class="uiContextualLayer uiContextualLayerAboveLeft" style="bottom: 0px;">'+
            '<div class="uiTooltipX">'+
                '<div class="tooltipContent">'+
                    '<div>'+
                        '<div>'+
                            bodyOfPopUp+
                        '</div>'+
                    '</div>'+
                '</div><i class="arrow"></i>'+
            '</div>'+
        '</div>'+
    '</div>'

    return popUp;
}