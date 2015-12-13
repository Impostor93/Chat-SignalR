using System;
using System.Collections.Generic;
using System.Linq;
using Chat.Common;
using Chat.Infrastructure;
using Chat.Infrastructure.ChatObjects.ChatRooms;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;

namespace Chat.Infrastructure
{
    public class ChatRoomManager
    {
        

        public static ChatRoom OpenChatRoom(ChatUser roomCreator, params ChatUser[] users)
        {
            try
            {
                if (roomCreator == null)
                    throw new ArgumentNullException("Incorrect RoomCreator is null in StartChat");

                var room = new ChatRoom(roomCreator);
                var listOfUser = new List<ChatUser>(users);
                listOfUser.Add(roomCreator);

                if (!room.LoadRoom(listOfUser, ChatUserManager.ListOfUsers))
                    return null;

                AddToListOfRooms(room.RoomIdentifier, room);

                roomCreator.AddRoomToList(room.RoomIdentifier);

                return room;
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "StartChat");
                return null;
            }
        }

        public static ChatSessions LoadHistory(Guid roomIdentifier, DateTime sesstionFrom)
        {
            try
            {
                return FindRoom(roomIdentifier).GetRoomOldMessages(sesstionFrom);
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "LoadHistory");
                return null;
            }
        }

        public static List<Message> GetUserMessage(Guid userIdentifier, Guid roomIdentifier)
        {
            try
            {
                return FindRoom(roomIdentifier).GetUserUnReadMessages(userIdentifier);
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "GetUserMessage");
                return null;
            }
        }

        public static void SendMessage(String message, Guid senderIdentifier, Guid roomIdentifier)
        {
            try
            {
                if (!listOfRooms.ContainsKey(roomIdentifier))
                    return;

                foreach (var userInRoom in FindRoom(roomIdentifier).UsersInRoom)
                {
                    var user = ChatUserManager.ListOfUsers[userInRoom];
                    if (!user.UserRoomIdentifiers.Contains(roomIdentifier))
                        user.AddRoomToList(roomIdentifier);
                }

                lock (listOfRooms)
                {
                    FindRoom(roomIdentifier).AddMessage(message, ChatUserManager.FindUser(senderIdentifier));
                }
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "SendMessage");
                return;
            }
        }

        public static Boolean CloseRoom(Guid roomIdentifier, Guid userIdentifier)
        {
            try
            {
                ChatUserManager.FindUser(userIdentifier).RemoveRoomFromList(roomIdentifier);

                if (listOfRooms.ContainsKey(roomIdentifier))
                    FindRoom(roomIdentifier).CloseCurrentSession();
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "RemoveRoom");
                return false;
            }
            return true;
        }

        public static ChatRoom FindRoom(Guid roomIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(roomIdentifier))
                throw new ArgumentException("Room identifier is null or empty please provide correct identifier");

            lock (listOfRooms)
            {
                if (listOfRooms.ContainsKey(roomIdentifier))
                    return listOfRooms[roomIdentifier];
                else
                    return null;
            }
        }
        public static void AddToListOfRooms(Guid identifier, ChatRoom room)
        {
            if (!listOfRooms.ContainsKey(room.RoomIdentifier))
                listOfRooms.Add(room.RoomIdentifier, room);
        }
        public static void RemoveToListOfRooms(Guid identifier)
        {
            if (!listOfRooms.ContainsKey(identifier))
                listOfRooms.Remove(identifier);
        }

        private static Dictionary<Guid, ChatRoom> listOfRooms = new Dictionary<Guid, ChatRoom>();
    }
}