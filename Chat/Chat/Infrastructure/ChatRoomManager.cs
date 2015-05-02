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
                    if (!user.UserRooms.Contains(roomIdentifier))
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

        public static ChatRoom OpenChatRoom(ChatUser roomCreator, params ChatUser[] Users)
        {
            try
            {
                if (roomCreator == null)
                    throw new ArgumentNullException("Incorrect RoomCreator is null in StartChat");

                var room = new ChatRoom(roomCreator);
                var listOfUser = Users.ToList<ChatUser>();
                listOfUser.Add(roomCreator);

                if (!room.LoadRoom(listOfUser, ChatUserManager.ListOfUsers))
                    return null;

                if (!listOfRooms.ContainsKey(room.RoomIdentifier))
                    listOfRooms.Add(room.RoomIdentifier, room);


                if (!roomCreator.UserRooms.Contains(room.RoomIdentifier))
                    roomCreator.UserRooms.Add(room.RoomIdentifier);

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
