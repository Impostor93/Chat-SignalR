/// <reference path="Extensions.js" />
/// <reference path="System.js" />




function CreateNewRoom(IdRoom,RoomName)
{
    RoomName = RoomName.replace("|"+CurrentUserName, "");
    RoomName = RoomName.replace('|', '');
    
    var sys = Chat.system;
    
    var RoomContent = sys.CreateElement("div", "RoomContent", "RoomContent");

    var HeaderHtml = "<span>" + RoomName + "</span><div class='CloseButton' onclick='CloseRoom(\"" + IdRoom + "\")' ></div></div>"
    var RoomHeader = sys.CreateElement("div", "RoomHeader" + IdRoom, "RoomHeader", HeaderHtml, "block")
    
    sys.AppendChild(RoomContent, RoomHeader);

    var ConversationPart = sys.CreateElement("div", "ConversationPart", "ConversationPart", undefined, "block");

    var attr = [];
    attr["onscroll"] = "ScrollHandler(this,'" + IdRoom + "')";
    var MessageContent = sys.CreateElement("div", "MessageContent" + IdRoom, "MessageContent", undefined, "block", attr);
    
    sys.AppendChild(ConversationPart, MessageContent);

    var HTML = "<textarea rows='1' class='TextBox' Id='MessageText" + IdRoom + "'  onkeydown='return TextBoxKeyPress(event,\"" + IdRoom + "\")'></textarea>"
    var RoomFooter = sys.CreateElement("div", "RoomFooter", "RoomFooter", HTML);

    sys.AppendChild(ConversationPart, RoomFooter);
    sys.AppendChild(RoomContent, ConversationPart);

    var Attr = [];
    Attr["RoomId"] = IdRoom;
    Attr["Visible"] = true;
    var ChatRoom = sys.CreateElement("div", "Chat-" + IdRoom, "ChatRoom", undefined, "block", Attr);

    sys.AppendChild(ChatRoom, RoomContent);

    return ChatRoom;
}
function CreateUserMessageList(SenderIdentifier,Message)
{
    var Attr = [];
    Attr["User-Identifier"] = SenderIdentifier;
    var sys = Chat.system;

    var additionalClass = SenderIdentifier == CurrentUserIdentifier ? "ownMassage" : "foreignMassage";
    
    var GlobalDiv = sys.CreateElement("div", "UserMessages", "UserMessages", undefined, undefined, Attr)
    GlobalDiv.className += (" " + additionalClass)

    var ImageContent = sys.CreateElement("div", "ImageContainer", "ImageContainer", "<img src'" + SenderIdentifier + "_pic.png' class='SenderImg' />")

    var attr = [];
    attr["Container"] = true;
    var TextMessageContainer = sys.CreateElement("div", "TextMessageContainer", "TextMessageContainer", "<div class='MessageNode'>" + Message + "</div>", "block", attr);

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
    
        var MessageNode = sys.CreateElement("div", undefined, "MessageNode", Message);
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
            var MessageNode = sys.CreateElement("div", undefined, "MessageNode", Result.RoomMessages[i].MessageContent);
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

