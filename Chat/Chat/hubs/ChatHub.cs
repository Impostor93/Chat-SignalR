using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using System.Web.SessionState;
using Chat.Common;
using Chat.Infrastructure;
using Chat.Infrastructure.ChatObjects.ChatRooms;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;
using Chat.SignalR;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Newtonsoft.Json;

namespace Chat.Hubs
{
    [HubName("chatHubs")]
    public class ChatHub : Hub, IRequiresSessionState
    {
        public String Connect(string userIdentifier)
        {
            Clients.Others.GetAllUsers(JsonConvert.SerializeObject(ChatUserManager.ListOfUsers));
            try
            {
                var rooms = new List<ChatRoom>();
                foreach (var roomIdentifier in ChatUserManager.GetUserRooms(Guid.Parse(userIdentifier)))
                {
                    var room = ChatRoomManager.FindRoom(roomIdentifier);
                    rooms.Add(room);
                }
                return JsonConvert.SerializeObject(rooms);
            }
            catch (Exception ex)
            {
                ErrorLoger.Log(ex);
                return "[]";
            }
        }

        public String OpenRoom(string roomCreator, String[] roomRecipientUserIdentifiers)
        {
            try
            {
                var roomCreatorIdentifier = new Guid();
                if (!Guid.TryParse(roomCreator, out roomCreatorIdentifier))
                    throw new FormatException("Incorrect RoomCreator in OpenRoom");

                var userForRoom = new List<ChatUser>();
                foreach (var roomRecipientUserIdentifier in roomRecipientUserIdentifiers)
                {
                    Guid roomRecipientIdentifier;
                    if (!Guid.TryParse(roomRecipientUserIdentifier, out roomRecipientIdentifier))
                        throw new FormatException("Incorrect RoomRecipient in OpenRoom");

                    userForRoom.Add(ChatUserManager.FindUser(roomRecipientIdentifier));
                }

                ChatRoom Room = ChatRoomManager.OpenChatRoom(ChatUserManager.FindUser(roomCreatorIdentifier), userForRoom.ToArray());

                return Room == null ? "[]" : JsonConvert.SerializeObject(Room);
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "ChatService");
                return "[]";
            }
        }

        public void CloseRoom(String RoomIdentifier, string strCurrentUserIdentifier)
        {
            try
            {
                var currentUserIdentifier = new Guid();
                if (!Guid.TryParse(strCurrentUserIdentifier, out currentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in CloseRoom");

                var closedRoomIdentifier = new Guid();
                if (!Guid.TryParse(RoomIdentifier, out closedRoomIdentifier))
                    throw new FormatException("Incorrect RoomRecipient in CloseRoom");

                ChatRoomManager.CloseRoom(closedRoomIdentifier, currentUserIdentifier);
            }
            catch (Exception ex)
            {
                SendErrorEmail.SendError(ex, "CloseRoom");
                return;
            }
        }

        public String SendMessages(string strCurrentUserIdentifier, String Messages, String roomId)
        {
            try
            {
                if (string.IsNullOrEmpty(strCurrentUserIdentifier))
                    return "[]";

                var currentUserIdentifier = ChatHelper.ConvertStringToGuid(strCurrentUserIdentifier);
                var roomIdentifier = ChatHelper.ConvertStringToGuid(roomId);

                ChatRoomManager.SendMessage(HttpContext.Current.Server.HtmlEncode(Messages), currentUserIdentifier, roomIdentifier);

                var listOfAllMembersOfRoom = new List<string>();
                var keyValuePaireFromIdentifierAndUnreadedMessage = new Dictionary<Guid, List<Message>>();

                foreach (var userIdentifier in ChatRoomManager.FindRoom(roomIdentifier).UsersInRoom)
                {
                    if (!userIdentifier.Equals(strCurrentUserIdentifier))
                    {
                        listOfAllMembersOfRoom.Add(userIdentifier.ToString());
                        keyValuePaireFromIdentifierAndUnreadedMessage.Add(userIdentifier, ChatRoomManager.GetUserMessage(userIdentifier, roomIdentifier));
                        ChatUserManager.FindUser(userIdentifier).AddRoomToList(userIdentifier);
                    }
                }
                foreach (var user in listOfAllMembersOfRoom)
                {
                    Clients.User(user).showingMassages(JsonConvert.SerializeObject(keyValuePaireFromIdentifierAndUnreadedMessage), JsonConvert.SerializeObject(ChatRoomManager.FindRoom(roomIdentifier)));
                }
                return JsonConvert.SerializeObject(new Message(HttpContext.Current.Server.HtmlEncode(Messages), ChatUserManager.FindUser(currentUserIdentifier)));
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "SendMessages");
                return "[]";
            }
        }

        public String GetMessages(String roomId, string strCurrentUserIdentifier)
        {
            try
            {
                var currentUserIdentifier = ChatHelper.ConvertStringToGuid(strCurrentUserIdentifier);
                var roomIdentifier = ChatHelper.ConvertStringToGuid(roomId);

                return JsonConvert.SerializeObject(ChatRoomManager.GetUserMessage(currentUserIdentifier, roomIdentifier));
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "GetMessages");
                return "[]";
            }
        }

        public String LoadHistory(String IdRoom, String SessionFrom)
        {
            try
            {
                var RoomIdentifier = ChatHelper.ConvertStringToGuid(IdRoom);
                DateTime SessionStartDate = DateTime.Now;

                if (SessionFrom != String.Empty)
                    SessionStartDate = Convert.ToDateTime(SessionFrom);

                var lastDBStoretSession = ChatRoomManager.LoadHistory(RoomIdentifier, SessionStartDate);

                if (SessionFrom == string.Empty)
                {
                    var room = ChatRoomManager.FindRoom(RoomIdentifier);
                    foreach (var message in room.CurrentRoomSession.RoomMessages)
                        lastDBStoretSession.RoomMessages.Add(message);
                }

                return JsonConvert.SerializeObject(lastDBStoretSession);
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "LoadHistory");
                return "[]";
            }
        }

        public String GetAllUsers(string strCurrentUserIdentifier)
        {
            try
            {
                var currentUserIdentifier = ChatHelper.ConvertStringToGuid(strCurrentUserIdentifier);

                Dictionary<Guid, ChatUser> AllUser = new Dictionary<Guid, ChatUser>(ChatUserManager.ListOfUsers);
                AllUser.Remove(currentUserIdentifier);

                return JsonConvert.SerializeObject(AllUser.Values);
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "GetAllUsers");
                return "[]";
            }
        }

        public String InitializeUser(string strCurrentUserIdentifier)
        {
            try
            {
                if (string.IsNullOrEmpty(strCurrentUserIdentifier))
                    return "[]";

                var currentUserIdentifier = ChatHelper.ConvertStringToGuid(strCurrentUserIdentifier);

                return JsonConvert.SerializeObject(ChatUserManager.FindUser(currentUserIdentifier));
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "GetAllUsers");
                return "[]";
            }
        }

        public String ChangUserStatus(String idStatus, string userIdentifier)
        {
            try
            {
                if (string.IsNullOrEmpty(userIdentifier))
                    return "[]";

                var currentUserIdentifier = ChatHelper.ConvertStringToGuid(userIdentifier);

                int idNewStatus = 0;
                if (!Int32.TryParse(idStatus, out idNewStatus))
                    return "[]";

                if (idNewStatus > 2)
                    return "[]";

                var user = ChatUserManager.FindUser(currentUserIdentifier);
                user.UserStatus.ChangeStatus((TypeStatus)idNewStatus);

                Clients.Others.ChangeUserStatus(user);

                return JsonConvert.SerializeObject(user.UserStatus);
            }
            catch (Exception ex)
            {
                SendErrorEmail.SendError(ex, "ChangUserStatus");
                return "[]";
            }
        }
    }
}