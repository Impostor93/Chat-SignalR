﻿/// <reference path="ChatFunctions.js" />
var UserTimer = 0;
var RoomTimers = 0;
var MessageTimer = [];
var CurrentUserIdentifier;
var CurrentUserName;
var CurrentUserStatus;
var chatHub = "";
//var TimerStartShowing = 0;
//var StartShowingInterval = 0;

function GetAllUsers()
{
    $.RequestCreator({
        Methods: "GetAllUsers",
        CreateRequest:function(data)
        {
            var Users = JSON.parse(data.d);
            var ListUser = GetElement("UserInList");
            ListUser.innerHTML = '';

            $.each(Users,function(index,Value)
            {
                var Attributs = [];
                Attributs["onclick"] = "StartChat('" + Value.UserIdentifier + "')";

                if (Value.UserStatus.CanMakeOperation) {
                    var InnerHtml = "<div id='ListGlobalElment' class='ListGlobalElment'><div id='UserImageContent' class='UserImageContent'></div>"
                    InnerHtml += "<div id='UserNameDiv' class='UserNameDiv'><span class='UserNameText'>" + Value.UserName + "</span></div><div id='UserStatusDiv' class='UserStatusDiv'><img style='width:100%;margin-top: 4px;' src='/ChatImage/" + Value.UserStatus.StatusImage + "'/></div></div>"

                    var Elment = CreateElement("li",undefined, "ListElment", InnerHtml, undefined, Attributs);

                    AppendChild(ListUser, Elment);
                }
            })
        },
        Error:function (xhr, status, error) {
            clearInterval(UserTimer);
            sendError(error, "GetAllUsers");
        }

    });
}

function InitializeCurrentUser()
{
    $.RequestCreator({
        Methods: "InitializeUser",
        CreateRequest: function (data) {
            var CurrentUser = JSON.parse(data.d);
            
            CurrentUserIdentifier = CurrentUser.UserIdentifier;
            CurrentUserName = CurrentUser.UserName;
            CurrentUserStatus = CurrentUser.UserStatus;

            var imgStatus = CreateElement("img");
            imgStatus.src = "/ChatImage/" + CurrentUserStatus.StatusImage;
            imgStatus.style.width = "100%";

            AppendChild(GetElement("Status"), imgStatus);
        },
        Error: function (xhr, status, error) {
            clearInterval(UserTimer);
            sendError(error, "GetUsers");
        }

    });
}

$(document).ready(function () {

    InitializeCurrentUser()
    GetAllUsers();

    registrateClientEvents($.connection.chatHubs);

    $.connection.hub.start().done(function () {
        chatHub = $.connection.chatHubs;
        registrateServerEvents(chatHub);
    });

    //RoomTimers = setInterval(function () {
    //    CheckForRooms();
    //}, 10000);
});

function registrateClientEvents(chatHubAsParam)
{
    chatHubAsParam.client.GetAllUsers = function () { GetAllUsers() }
    chatHubAsParam.client.ChangeUserStatus = function () { GetAllUsers() }
    chatHubAsParam.client.createRoom = function (data) { CheckForRooms(data) }
    chatHubAsParam.client.showingMassages = function (data, idRoom) { showingMassages(data, idRoom) }
}
function registrateServerEvents(chatHubAsParam) {
    chatHubAsParam.server.connect();
}

function StartChat() {

    var userIdentifiers = arguments == null && arguments == undefined && arguments.length <= 0 ? "" : Array.prototype.slice.call(arguments, 0);

    if (userIdentifiers == "")
        return;

    chatHub.server.openRoom(CurrentUserIdentifier, userIdentifiers).done(function (Data) {
        onSuccessrStartChat(Data)
    })

}
function onSuccessrStartChat(ResultString) {
    try {

        if (ResultString == "" || ResultString == "[]")
            return;

        var Room = JSON.parse(ResultString);

        var NewRoom = CreateNewRoom(Room.RoomIdentifier, Room.RoomName);

        if (GetElement("Conteiner").querySelectorAll("[RoomId='" + Room.RoomIdentifier + "']").length == 0)
            AppendChild(GetElement("Conteiner"), NewRoom, true);

        SessionNextDate[Room.RoomIdentifier] = "";

    } catch (exception) {
        clearInterval(TimerStartShowing);
        sendError(exception.message, "onSuccessrStartChat");
    }
}

function showingMassages(data, idRoom) {
    try {

        if (data == "[]")
            return;

        data = JSON.parse(data);
        var Result = data[CurrentUserIdentifier];

        if (Result == null)
            return;

        for(var i in Result)
            AppendMessage(Result[i].SenderIdentifier, Result[i].MessageContent, idRoom);

    }
    catch (exception) {
        sendError(exception.message, "StartShowingMassages");
        return;
    }
}

function onSuccessSending(ResultString) {
    try {

        var obj = ResultString.split('|');

        if (obj[0] == '' || obj[0] == "[]")
            return;

        var Messages = JSON.parse(obj[0]);

        var ElementNumber = obj[1];
        var HtmlElement = document.getElementById('Content' + ElementNumber);

        if (HtmlElement == undefined)
            return;

        var ResivedMessages = "";

        $.each(Messages, function (index, item) {
            var DateOfSend = new Date(item.DateOfSend);
            ResivedMessages += "<p> " + item.Sender.UserName + " Seid: " + item.MessageContent + " <br/> In " + DateOfSend.format("yyyy-MM-dd h:mm:ss") + "</p>"
        })
        HtmlElement.innerHTML = ResivedMessages
        HtmlElement.scrollTop = HtmlElement.scrollHeight;
    }
    catch (exception) {
        sendError(exception.message, "onSuccessSending");
        return;
    }

}

function TextBoxKeyPress(e, IdRoom)
{
    if(e.keyCode == 13){
        
        var EventElment = e.srcElement ? e.srcElement : e.currentTarget
        var Message = EventElment.value;
        EventElment.value = "";

        if(Message == "")
            return;

        chatHub.server.sendMessages(CurrentUserIdentifier, Message, IdRoom).done(function (data) {
            if (data == "[]")
                return;

            var Result = JSON.parse(data);
            AppendMessage(Result.SenderIdentifier, Result.MessageContent, IdRoom);
        })
        
        return false;
    }
}

function CheckForRooms(data) {
    try
    {
        if (data == "[]")
            return;

        var Result = JSON.parse(data);
        var NewRoom = CreateNewRoom(Result.RoomIdentifier, Result.RoomName);

        if (GetElement("Conteiner").querySelectorAll("[RoomId='" + Result.RoomIdentifier + "']").length == 0)
            AppendChild(GetElement("Conteiner"), NewRoom, true);

    } catch (ex)
    {
        sendError(ex.message, "CheckForRooms");
        return;
    }
}

function CloseRoom(IdRoom)
{
    IdRoom = $.trim(IdRoom)

    chatHub.server.closeRoom(IdRoom,CurrentUserIdentifier).done(function () {
        var Room = GetElement("Chat-" + IdRoom);
        RemoveElmenet(GetElement("Conteiner"), Room);
    })
}

function ChangeStatus(currElement) {

    chatHub.server.changUserStatus(currElement.getAttribute("Status"), CurrentUserIdentifier).done(function (NewStatus) {
        
        if (NewStatus == undefined || NewStatus == null || NewStatus == "[]")
            return;

        NewStatus = JSON.parse(NewStatus);

        var imgStatus = CreateElement("img");
        imgStatus.src = "/ChatImage/" + NewStatus.StatusImage;
        imgStatus.style.width = "100%";

        RemoveElmenet(GetElement("Status"), GetElement("Status").lastChild)
        AppendChild(GetElement("Status"), imgStatus);

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

//error functions 
function error(error) {

    //if (UserTimer != 0) {
    //    clearInterval(UserTimer);
    //    UserTimer = 0;
    //}

    //if (RoomTimer != 0){
    //    clearInterval(RoomTimer);
    //    RoomTimer = 0;
    //    }

    //if (MessageTimer.length > 0) {
    //    for (var i in MessageTimer) {
    //        clearInterval(MessageTimer[i]);
    //        MessageTimer[i] = 0;
    //    }
    //}

    //sendError(error._message, "Requests")
}

function sendError(text, MethodName) {
    $.ajax({
        url: "SendErrorMessagesHandler.ashx?excText=" + text + "&MethodName=" + MethodName,
        contentType: "application/json;",
        data: "{}",
        type: "GET",
        success: function () { },
        error: function () { alert("error") },
    })
}
