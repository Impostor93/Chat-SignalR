function GetElement(Id)
{
    return document.getElementById(Id);
}
function CreateElement(Type,Ids, ClassName, InnerHtml, Visibility,Attributes) {
    var elment = document.createElement(Type);

    if (ClassName != undefined)
        elment.className = ClassName;

    if (Ids != undefined)
        elment.id = Ids;

    if (InnerHtml != undefined)
        elment.innerHTML = InnerHtml;

    if (Visibility != undefined)
        elment.style.display = Visibility;

    if (Attributes != undefined)
    {
        for (var i in Attributes)
            elment.setAttribute(i, Attributes[i]);
    }

    return elment;
}
function AppendChild(Parent, Child,InserBefore)
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
function CreateNewRoom(IdRoom,RoomName)
{
    RoomName = RoomName.replace("|"+CurrentUserName, "");
    RoomName = RoomName.replace('|', '');
    
    
    var RoomContent = CreateElement("div", "RoomContent", "RoomContent");

    var HeaderHtml = "<span>" + RoomName + "</span><div class='CloseButton' onclick='CloseRoom(\"" + IdRoom + "\")' ></div></div>"
    var RoomHeader = CreateElement("div", "RoomHeader" + IdRoom, "RoomHeader", HeaderHtml, "block")
    
    AppendChild(RoomContent,RoomHeader);

    var ConversationPart = CreateElement("div", "ConversationPart", "ConversationPart", undefined, "block");

    var attr = [];
    attr["onscroll"] = "ScrollHandler(this,'" + IdRoom + "')";
    var MessageContent = CreateElement("div", "MessageContent"+IdRoom, "MessageContent",undefined,"block",attr);
    
    AppendChild(ConversationPart, MessageContent);

    var HTML = "<textarea rows='1' class='TextBox' Id='MessageText" + IdRoom + "'  onkeydown='return TextBoxKeyPress(event,\"" + IdRoom + "\")'></textarea>"
    var RoomFooter = CreateElement("div", "RoomFooter", "RoomFooter", HTML);

    AppendChild(ConversationPart, RoomFooter);
    AppendChild(RoomContent, ConversationPart);

    var Attr = [];
    Attr["RoomId"] = IdRoom;
    Attr["Visible"] = true;
    var ChatRoom = CreateElement("div", "Chat-" + IdRoom, "ChatRoom", undefined, "block", Attr);

    AppendChild(ChatRoom, RoomContent);

    return ChatRoom;
}
function CreateUserMessageList(SenderIdentifier,Message)
{
    var Attr = [];
    Attr["User-Identifier"] = SenderIdentifier;

    var additionalClass = SenderIdentifier == CurrentUserIdentifier ? "ownMassage" : "foreignMassage";
    
    var GlobalDiv = CreateElement("div", "UserMessages", "UserMessages", undefined, undefined, Attr)
    GlobalDiv.className += (" " + additionalClass)

    var ImageContent = CreateElement("div", "ImageContainer", "ImageContainer", "<img src'" + SenderIdentifier + "_pic.png' class='SenderImg' />")

    var attr = [];
    attr["Container"] = true;
    var TextMessageContainer = CreateElement("div", "TextMessageContainer", "TextMessageContainer", "<div class='MessageNode'>" + Message + "</div>", "block", attr);

    AppendChild(GlobalDiv, ImageContent);
    AppendChild(GlobalDiv, TextMessageContainer);

    return GlobalDiv;
}

function AppendMessage(SenderIdentifier, Message,IdRoom)
{
    var MessageContainer = GetElement("MessageContent" + IdRoom);
    var LastUserMessageList = MessageContainer.querySelectorAll("[User-Identifier]");

    if (LastUserMessageList.length == 0) {
        AppendChild(GetElement("MessageContent" + IdRoom), CreateUserMessageList(SenderIdentifier, Message));
        return;
    }

    if (LastUserMessageList[LastUserMessageList.length-1].getAttribute("User-Identifier") == SenderIdentifier){
    
        var MessageNode = CreateElement("div", undefined, "MessageNode", Message);
        AppendChild(LastUserMessageList[LastUserMessageList.length - 1].querySelectorAll("[Container=true]")[0], MessageNode);
    }
    else
        AppendChild(GetElement("MessageContent" + IdRoom), CreateUserMessageList(SenderIdentifier, Message));
}

function RemoveElmenet(Parent, Child)
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
function ShowSetting(a)
{
    if (GetElement("SettingsDiv").style.display == "block")
        GetElement("SettingsDiv").style.display = "none";
    else {
        GetElement("SettingsDiv").style.display = "block";
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

function StopTimers(IdRoom)
{
    if (UserTimer != 0) {
        clearInterval(UserTimer);
        UserTimer = 0;
    }

    if (RoomTimer != 0) {
        clearInterval(RoomTimer);
        RoomTimer = 0;
    }
    if (MessageTimer[IdRoom] != 0) {
        clearInterval(MessageTimer[IdRoom]);
        MessageTimer[IdRoom] = 0;
    }
}
function StopAllTaimers()
{
    if (UserTimer != 0) {
        clearInterval(UserTimer);
        UserTimer = 0;
    }

    if (RoomTimer != 0){
        clearInterval(RoomTimer);
        RoomTimer = 0;
        }

    if (MessageTimer.length > 0) {
        for (var i in MessageTimer) {
            clearInterval(MessageTimer[i]);
            MessageTimer[i] = 0;
        }
    }
}

function AppendHistory(Result)
{
    var IdRoom = $.trim(Result.RoomIdentifier)
    var FirstElement = CreateUserMessageList(Result.RoomMessages[Result.RoomMessages.length - 1].SenderIdentifier, Result.RoomMessages[Result.RoomMessages.length-1].MessageContent)

    for (var i = Result.RoomMessages.length-2; i >= 0; i--)
    {
        var MessageContainer = GetElement("MessageContent" + IdRoom);

        if (FirstElement.getAttribute("User-Identifier") == Result.RoomMessages[i].SenderIdentifier) {
            var MessageNode = CreateElement("div", undefined, "MessageNode", Result.RoomMessages[i].MessageContent);
            AppendChild(FirstElement.querySelectorAll("[container=true]")[0], MessageNode,false)
        } else
        {
            AppendChild(MessageContainer, FirstElement, false);
            FirstElement = CreateUserMessageList(Result.RoomMessages[i].SenderIdentifier, Result.RoomMessages[i].MessageContent)
        }
    }
    AppendChild(GetElement("MessageContent" + IdRoom), FirstElement, false);
}
function ScrollHandler(currElement, IdRoom)
{
    if (currElement.scrollTop == 0)
        LoadHistory(IdRoom);
}

