using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.Infrastructure;

namespace Chat.Infrastructure
{
    class ChatRoomManager
    {
        #region Member
        public static Dictionary<Guid, ChatRoom> listOfRooms = new Dictionary<Guid, ChatRoom>();
        #endregion

        #region Proparties
        #endregion

        #region Constructors
        #endregion

        #region Methods
        public static void SendMessage(String Message, Guid SenderIdentifier, Guid roomIdentifier)
        {
            try
            {
                if (!listOfRooms.ContainsKey(roomIdentifier))
                    return;

                foreach (var userInRoom in listOfRooms[roomIdentifier].UsersInRoom)
                {
                    var user = ChatUserManager.ListOfUsers[userInRoom];
                    if (!user.UserRooms.ContainsKey(roomIdentifier))
                        user.SetRoomInListOfRoomOfUser(listOfRooms[roomIdentifier]);
                }

                lock (listOfRooms)
                {
                    listOfRooms[roomIdentifier].AddMessage(Message, ChatUserManager.FindUser(SenderIdentifier), ChatUserManager.ListOfUsers);
                }
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "SendMessage");
                return;
            }
        }
        public static List<Message> GetUserMessage(Guid UserIdentifier, Guid RoomIdentifier)
        {
            try
            {
                if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                    throw new ArgumentException("UserIdentifier in GetUserMessage is empty or null");

                return listOfRooms[RoomIdentifier].GetUserUnReadMessages(UserIdentifier);
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "GetUserMessage");
                return null;
            }
        }

        public static ChatRoom OpenChatRoom(Guid RoomCreatorIdentifier, params ChatUser[] Users)
        {
            try
            {
                if(RoomCreatorIdentifier == Guid.Empty)
                    throw new ArgumentException("Incorrect RoomCreatorIdentifier is Guid Empty in StartChat");

                var room = new ChatRoom(ChatUserManager.FindUser(RoomCreatorIdentifier));
                var listOfUser = Users.ToList<ChatUser>();
                listOfUser.Add(ChatUserManager.FindUser(RoomCreatorIdentifier));

                if (!room.LoadRoom(listOfUser, ChatUserManager.ListOfUsers))
                    return null;

                if (!listOfRooms.ContainsKey(room.RoomIdentifier))
                    listOfRooms.Add(room.RoomIdentifier, room);

                return room;
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "StartChat");
                return null;
            }
        }

        public static Boolean CloseRoom(Guid RoomIdentifier,Guid UserIdentifier)
        {
            try
            {
                ChatUserManager.FindUser(UserIdentifier).RemoveRoomFromList(RoomIdentifier);
                
                if(ChatRoomManager.listOfRooms.ContainsKey(RoomIdentifier))
                    ChatRoomManager.listOfRooms[RoomIdentifier].CloseCurrentSession();
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "RemoveRoom");
                return false;
            }
            return true;
        }

        public static ChatSessions LoadHistory(Guid IdRoom, DateTime SesstionFrom)
        {
            ChatSessions oldSession = new ChatSessions();
            try
            {
                oldSession = listOfRooms[IdRoom].GetRoomOldMessages(SesstionFrom);
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "LoadHistory");
                return null;
            }
            return oldSession;
        }

        #endregion
    }
}
