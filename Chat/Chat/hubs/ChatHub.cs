using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Security;
using Microsoft.AspNet.SignalR;
using Microsoft.AspNet.SignalR.Hubs;
using Newtonsoft.Json;
using Chat.Infrastructure;
using Chat.SignalR;
using System.Web.SessionState;

namespace Chat.Hubs
{
    [HubName("chatHubs")]
    public class ChatHub : Hub, IRequiresSessionState
    {
        public void Connect()
        {
            Clients.Others.GetAllUsers(JsonConvert.SerializeObject(ChatUserManager.ListOfUsers));
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
                    Guid roomRecipientIdentifier = new Guid();
                    if (!Guid.TryParse(roomRecipientUserIdentifier, out roomRecipientIdentifier))
                        throw new FormatException("Incorrect RoomRecipient in OpenRoom");

                    userForRoom.Add(ChatUserManager.FindUser(roomRecipientIdentifier));
                }

                ChatRoom Room = ChatRoomManager.OpenChatRoom(roomCreatorIdentifier, userForRoom.ToArray());

                return Room == null ? "[]" : JsonConvert.SerializeObject(Room);
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "ChatService");
                return "[]";
            }
        }

        public void CloseRoom(String RoomIdentifier,string strCurrentUserIdentifier)
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

        public String SendMessages(string strCurrentUserIdentifier,String Messages, String roomId)
        {
            try
            {
                if (string.IsNullOrEmpty(strCurrentUserIdentifier))
                    return "[]";

                var currentUserIdentifier = new Guid();
                if (!Guid.TryParse(strCurrentUserIdentifier, out currentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in SendMessages");

                var roomIdentifier = new Guid();
                if (!Guid.TryParse(roomId, out roomIdentifier))
                    throw new FormatException("Incorrect RoomRecipient in SendMessages");

                ChatRoomManager.SendMessage(HttpContext.Current.Server.HtmlEncode(Messages), currentUserIdentifier, roomIdentifier);

                var listOfAllMembersOfRoom = new List<string>();
                var keyValuePaireFromIdentifierAndUnreadedMessage = new Dictionary<Guid, List<Message>>();

                foreach(var userIdentifier in  ChatRoomManager.listOfRooms[roomIdentifier].UsersInRoom)
                {
                    if (!userIdentifier.Equals(strCurrentUserIdentifier))
                    {
                        listOfAllMembersOfRoom.Add(userIdentifier.ToString());
                        keyValuePaireFromIdentifierAndUnreadedMessage.Add(userIdentifier, ChatRoomManager.GetUserMessage(userIdentifier, roomIdentifier));
                    }
                }
                foreach (var user in listOfAllMembersOfRoom)
                {
                    Clients.User(user).createRoom(JsonConvert.SerializeObject(ChatRoomManager.listOfRooms[roomIdentifier]));
                    Clients.User(user).showingMassages(JsonConvert.SerializeObject(keyValuePaireFromIdentifierAndUnreadedMessage), roomIdentifier);
                }
                return JsonConvert.SerializeObject(new Message(HttpContext.Current.Server.HtmlEncode(Messages), ChatUserManager.FindUser(currentUserIdentifier)));
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "SendMessages");
                return "[]";
            }
        }

        public String GetMessages(String RoomId, string strCurrentUserIdentifier)
        {
            try
            {
                Guid currentUserIdentifier = new Guid();
                if (!Guid.TryParse(strCurrentUserIdentifier, out currentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in GetMessages");

                Guid roomIdentifier = new Guid();
                if (!Guid.TryParse(RoomId, out roomIdentifier))
                    throw new FormatException("Incorrect RoomRecipient in GetMessages");

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
                Guid RoomIdentifier = new Guid();
                if (!Guid.TryParse(IdRoom, out RoomIdentifier))
                    throw new FormatException("Incorrect RoomRecipient in LoadHistory");

                DateTime SessionStartDate = DateTime.Now;

                if (SessionFrom != String.Empty)
                    SessionStartDate = Convert.ToDateTime(SessionFrom);

                return JsonConvert.SerializeObject(ChatRoomManager.LoadHistory(RoomIdentifier, SessionStartDate));
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
                Guid currentUserIdentifier = new Guid();
                if (!Guid.TryParse(strCurrentUserIdentifier, out currentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in GetMessages");

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

                Guid CurrentUserIdentifier = new Guid();
                if (!Guid.TryParse(strCurrentUserIdentifier, out CurrentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in GetMessages");

                return JsonConvert.SerializeObject(ChatUserManager.FindUser(CurrentUserIdentifier));
            }
            catch (Exception Ex)
            {
                SendErrorEmail.SendError(Ex, "GetAllUsers");
                return "[]";
            }
        }

        public String ChangUserStatus(String IdNewStatus,string userIdentifier)
        {
            try
            {
                if (string.IsNullOrEmpty(userIdentifier))
                    return "[]";

                Guid CurrentUserIdentifier = new Guid();
                if (!Guid.TryParse(userIdentifier, out CurrentUserIdentifier))
                    throw new FormatException("Incorrect strCurrentUserIdentifier in GetMessages");

                int idNewStatus = 0;
                if (!Int32.TryParse(IdNewStatus, out idNewStatus))
                    return "[]";

                if (idNewStatus > 2)
                    return "[]";

                var user = ChatUserManager.FindUser(CurrentUserIdentifier);
                user.UserStatus.ChangeStatus((IdTypeStatus)idNewStatus);

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