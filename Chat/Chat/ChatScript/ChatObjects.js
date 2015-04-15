/// <reference path="Extensions.js" />
/// <reference path="System.js" />

var Chat = Chat || {};
Chat.Objects = Chat.Objects || {}; 

//Start ChatRoom Object
Chat.Objects.ChatRoom = function ChatRoom(roomIdentifier, roomName) {
    this.roomIdentifier = roomIdentifier;
    this.roomName = roomName;
    this.chatRoomElement = this._createNewRoomElement();
}
Chat.Objects.ChatRoom.prototype._createNewRoomElement = function () {
    var sys = Chat.system;

    this.roomContentElement = sys.createElement("div", "RoomContent", "RoomContent");

    this.roomHeaderElements = [];
    this.roomHeaderElements.push(sys.createElement("span", undefined, undefined, this.getRoomName()));
    this.roomHeaderElements.push(sys.createElement("div", undefined, "CloseButton", undefined, "block", { "onclick": "CloseRoom('" + this.getRoomIdentifier() + "')" }));

    var headerHtml = this._convertElementArrayToHtmlString(this.roomHeaderElements)
    this.roomHeaderElement = sys.createElement("div", "RoomHeader" + this.getRoomIdentifier(), "RoomHeader", headerHtml, "block")

    sys.AppendChild(this.roomContentElement, this.roomHeaderElement);

    this.conversationPartElement = sys.createElement("div", "ConversationPart", "ConversationPart", undefined, "block");

    this.messageContent = sys.createElement("div", "MessageContent" + this.getRoomIdentifier(), "MessageContent", undefined, "block",
        { "onscroll": "scrollHandler(this,'" + this.getRoomIdentifier() + "')" });

    sys.AppendChild(this.conversationPartElement, this.messageContent);

    this.textAreaOfRoom = sys.createElement("textarea", "MessageText" + this.getRoomIdentifier(), "TextBox", undefined,
                                            "block", { "rows": "1", "onkeydown": "return TextBoxKeyPress(event,'" + this.getRoomIdentifier() + "')" })

    this.roomFooterElement = sys.createElement("div", "RoomFooter", "RoomFooter", this.textAreaOfRoom.outerHTML);

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
        sys.AppendChild(this.messageContent, message.getMessageElement());
        this._chatRoomMessages.push(message);
        return;
    }

    var lastUserMessage = this._chatRoomMessages.lastOrDefault();
    if (sys.isNull(lastUserMessage))
        throw Error("There is no message in the array");

    var lastMessageElement = lastUserMessage.getMessageElement();

    if (!sys.isNullOrUndefined(lastMessageElement)) {

        if (lastMessageElement.getAttribute("User-Identifier") == message.getMessageSenderIdentifier()) {

            var messageNode = Chat.Objects.ChatMessage.createMessageNodeElement(message.getMessageText());
            sys.AppendChild(lastUserMessage.getTextMessageContainerElement(), messageNode);

        } else {

            sys.AppendChild(this.messageContent, message.getMessageElement());
            this._chatRoomMessages.push(message);
        }
    }
}

    //Start Chat room variables
        Chat.Objects.ChatRoom.prototype._chatRoomMessages = [];
    //End Chat room variables

//End ChatRoom Object

//Start Chat Room Message Session Object

Chat.Objects.ChatMessageSession = function () {
    this._sessionMessage = []
}
Chat.Objects.ChatMessageSession.prototype.addMessageToSession = function(dateTime,messageObject){ 
    this._sessionMessage[dateTime] = messageObject;
}

//End Chat Room Message Session Object

//Start ChatMessage Object
Chat.Objects.ChatMessage = function (messageText,chatUser) {
    this.message = messageText;
    this.chatUser = chatUser;
    this.userMessageElement = this._createMessageElement();
}
Chat.Objects.ChatMessage.prototype._createMessageElement = function () {
    var sys = Chat.system;
    var chatMessageObject = Chat.Objects.ChatMessage;

    var additionalClass = this.chatUser.getUserIdentifier() == Chat.currentUser.getUserIdentifier() ? "ownMassage" : "foreignMassage";

    var userMessageElement = sys.createElement("div", "UserMessages", "UserMessages " + additionalClass, undefined, undefined, { "User-Identifier": this.chatUser.getUserIdentifier() });
    this.imageContentElement = sys.createElement("div", "ImageContainer", "ImageContainer", "<img src'" + this.chatUser.getUserIdentifier() + "_pic.png' class='SenderImg' />");

    this.textMessageContainerElement = sys.createElement("div", "TextMessageContainer", "TextMessageContainer", chatMessageObject.createMessageNodeElement(this.message).outerHTML, "block", { "Container": "true" });
    
    sys.AppendChild(userMessageElement, this.imageContentElement);
    sys.AppendChild(userMessageElement, this.textMessageContainerElement);

    return userMessageElement;
}
Chat.Objects.ChatMessage.prototype.getMessageElement = function () { return this.userMessageElement; }
Chat.Objects.ChatMessage.prototype.getMessageElementHtml = function () { return this.userMessageElement.outerHTML; }
Chat.Objects.ChatMessage.prototype.getMessageSenderIdentifier = function(){ return this.chatUser.getUserIdentifier() }
Chat.Objects.ChatMessage.prototype.getMessageText = function () { return this.message }
Chat.Objects.ChatMessage.prototype.getTextMessageContainerElement = function () { return this.textMessageContainerElement; }
Chat.Objects.ChatMessage.createMessageNodeElement = function (textOfMessage) {
    var sys = Chat.system;
    return sys.createElement("div", undefined, "MessageNode", textOfMessage)
}
//End ChatMessage Object

//Start ChatUser Object
Chat.Objects.ChatUser = function (userIndentifier, userName, currentUserStatus)
{
    this.chatUserName = userName;
    this.userIndentifier = userIndentifier;
    this.chatUserStatus = new Chat.Objects.ChatUserStatus(currentUserStatus.StatusImage)
}
Chat.Objects.ChatUser.prototype.getUserIdentifier = function(){ return this.userIndentifier;}
Chat.Objects.ChatUser.prototype.getUserName = function () { return this.userName; }
Chat.Objects.ChatUser.prototype.getStatus = function () { return this.chatUserStatus; }

//End ChatUser Object

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

// End Chat status object

function CreateNewRoom(IdRoom,RoomName)
{
    RoomName = RoomName.replace("|"+CurrentUserName, "");
    RoomName = RoomName.replace('|', '');
    
    var sys = Chat.system;
    
    var RoomContent = sys.createElement("div", "RoomContent", "RoomContent");

    var HeaderHtml = "<span>" + RoomName + "</span><div class='CloseButton' onclick='CloseRoom(\"" + IdRoom + "\")' ></div></div>"
    var RoomHeader = sys.createElement("div", "RoomHeader" + IdRoom, "RoomHeader", HeaderHtml, "block")
    
    sys.AppendChild(RoomContent, RoomHeader);

    var ConversationPart = sys.createElement("div", "ConversationPart", "ConversationPart", undefined, "block");

    var attr = [];
    attr["onscroll"] = "scrollHandler(this,'" + IdRoom + "')";
    var MessageContent = sys.createElement("div", "MessageContent" + IdRoom, "MessageContent", undefined, "block", attr);
    
    sys.AppendChild(ConversationPart, MessageContent);

    var HTML = "<textarea rows='1' class='TextBox' Id='MessageText" + IdRoom + "'  onkeydown='return TextBoxKeyPress(event,\"" + IdRoom + "\")'></textarea>"
    var RoomFooter = sys.createElement("div", "RoomFooter", "RoomFooter", HTML);

    sys.AppendChild(ConversationPart, RoomFooter);
    sys.AppendChild(RoomContent, ConversationPart);

    var Attr = [];
    Attr["RoomId"] = IdRoom;
    Attr["Visible"] = true;
    var ChatRoom = sys.createElement("div", "Chat-" + IdRoom, "ChatRoom", undefined, "block", Attr);

    sys.AppendChild(ChatRoom, RoomContent);

    return ChatRoom;
}

function CreateUserMessageList(SenderIdentifier,Message)
{
    var Attr = [];
    Attr["User-Identifier"] = SenderIdentifier;
    var sys = Chat.system;

    var additionalClass = SenderIdentifier == CurrentUserIdentifier ? "ownMassage" : "foreignMassage";
    
    var GlobalDiv = sys.createElement("div", "UserMessages", "UserMessages", undefined, undefined, Attr)
    GlobalDiv.className += (" " + additionalClass)

    var ImageContent = sys.createElement("div", "ImageContainer", "ImageContainer", "<img src'" + SenderIdentifier + "_pic.png' class='SenderImg' />")

    var attr = [];
    attr["Container"] = true;
    var TextMessageContainer = sys.createElement("div", "TextMessageContainer", "TextMessageContainer", "<div class='MessageNode'>" + Message + "</div>", "block", attr);

    sys.AppendChild(GlobalDiv, ImageContent);
    sys.AppendChild(GlobalDiv, TextMessageContainer);

    return GlobalDiv;
}

function AppendMessage(SenderIdentifier, Message,IdRoom)
{
    var sys = Chat.system;
    var MessageContainer = sys.GetElement("MessageContent" + IdRoom);
    var LastUserMessageList = MessageContainer.querySelectorAll("[User-Identifier]");

    if (LastUserMessageList.length == 0) {
        sys.AppendChild(sys.GetElement("MessageContent" + IdRoom), CreateUserMessageList(SenderIdentifier, Message));
        return;
    }

    if (LastUserMessageList[LastUserMessageList.length-1].getAttribute("User-Identifier") == SenderIdentifier){
    
        var MessageNode = sys.createElement("div", undefined, "MessageNode", Message);
        sys.AppendChild(LastUserMessageList[LastUserMessageList.length - 1].querySelectorAll("[Container=true]")[0], MessageNode);
    }
    else
        sys.AppendChild(sys.GetElement("MessageContent" + IdRoom), CreateUserMessageList(SenderIdentifier, Message));
}

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

function AppendHistory(Result)
{
    var IdRoom = $.trim(Result.RoomIdentifier)
    var FirstElement = CreateUserMessageList(Result.RoomMessages[Result.RoomMessages.length - 1].SenderIdentifier, Result.RoomMessages[Result.RoomMessages.length-1].MessageContent)
    var sys = Chat.system;

    for (var i = Result.RoomMessages.length-2; i >= 0; i--)
    {
        var MessageContainer = GetElement("MessageContent" + IdRoom);

        if (FirstElement.getAttribute("User-Identifier") == Result.RoomMessages[i].SenderIdentifier) {
            var MessageNode = sys.createElement("div", undefined, "MessageNode", Result.RoomMessages[i].MessageContent);
            AppendChild(FirstElement.querySelectorAll("[container=true]")[0], MessageNode,false)
        } else
        {
            AppendChild(MessageContainer, FirstElement, false);
            FirstElement = CreateUserMessageList(Result.RoomMessages[i].SenderIdentifier, Result.RoomMessages[i].MessageContent)
        }
    }
    AppendChild(GetElement("MessageContent" + IdRoom), FirstElement, false);
}
function scrollHandler(currElement, IdRoom)
{
    if (currElement.scrollTop == 0)
        LoadHistory(IdRoom);
}

