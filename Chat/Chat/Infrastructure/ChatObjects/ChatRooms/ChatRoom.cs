using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.Common;
using Chat.DAL;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;
using Newtonsoft.Json;

namespace Chat.Infrastructure.ChatObjects.ChatRooms
{
    public class ChatRoom
    {
        private static DataBaseFunctions dataAccessHelper = new DataBaseFunctions();

        public int IdRoom { get; private set; }
        public Guid RoomIdentifier { get; private set; }
        public string RoomName { get; private set; }
        public bool IsOpend { get; private set; }
        public DateTime DateCreate { get; private set; }
        public HashSet<Guid> UsersInRoom { get; private set; }
        public ChatSessions CurrentRoomSession { get; private set; }

        public ChatRoom(ChatUser roomCreator, params ChatUser[] RoomUsers)
        {
            RoomIdentifier = Guid.NewGuid();
            RoomName = String.Empty;
            _roomCreator = roomCreator;
            _isOpened = true;
            DateCreate = DateTime.Now;
            CurrentRoomSession = new ChatSessions();
            UsersInRoom = new HashSet<Guid>();

            foreach (ChatUser User in RoomUsers)
                UsersInRoom.Add(User.UserIdentifier);
        }

        public Boolean LoadRoom(IEnumerable<ChatUser> Users, IDictionary<Guid, ChatUser> listOfUsers)
        {
            try
            {
                int roomHashIdentifier = GetHashIdentifier(Users);

                if (!TryLoadRoomDataByHashIdentifier(roomHashIdentifier, listOfUsers))
                    return false;

                if (!ChatHelper.IsGuidNullOrEmpty(this.RoomIdentifier))
                {
                    CurrentRoomSession.IdRoom = IdRoom;
                    CurrentRoomSession.RoomIdentifier = RoomIdentifier;

                    return true;
                }
                RoomIdentifier = Guid.NewGuid();
                _roomHashIdentifier = roomHashIdentifier;

                RoomName = String.Empty;
                foreach (ChatUser User in Users)
                    RoomName += String.Format("|{0}", User.UserName);
                RoomName.TrimStart('|');

                DateCreate = DateTime.Now;
                _isOpened = true;

                foreach (ChatUser user in Users)
                    AddUserToRoom(user.UserIdentifier, user);

                IdRoom = dataAccessHelper.InsertRoom(RoomIdentifier, _roomHashIdentifier, JsonConvert.SerializeObject(this.UsersInRoom), _roomCreator.UserName);

                if (IdRoom == 0)
                    return false;

                CurrentRoomSession.IdRoom = IdRoom;
                CurrentRoomSession.RoomIdentifier = RoomIdentifier;
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "");
                return false;
            }
            return true;
        }
        protected Boolean TryLoadRoomDataByHashIdentifier(Int32 HashCode, IDictionary<Guid, ChatUser> ListOfUsers)
        {
            try
            {
                var rooms = dataAccessHelper.SelectRoomByHashIdentifier(HashCode);

                if (rooms.Count() == 1)
                {
                    FillRoom(rooms.First(), ListOfUsers);
                }
                else if (rooms.Count() > 1)
                {
                    foreach (var room in rooms)
                    {
                        var roomsUsers = JsonConvert.DeserializeObject<HashSet<Guid>>(room.UserInRoom.ToString());
                        if (!roomsUsers.Equals(this.UsersInRoom))
                            continue;

                        FillRoom(room, ListOfUsers);
                    }
                }
                else
                    FillRoom(0, Guid.Empty, 0);
            }
            catch (ChatSqlException ex)
            {
                SendErrorEmail.SendError(ex, "GetDataForRoom");
                return false;
            }
            return true;
        }
        private void FillRoom(tblChatRoom room, IDictionary<Guid, ChatUser> listOfUsers)
        {
            FillRoom(room.IdRoom, room.RoomIdentifier, room.HashIdentifier.Value);

            var listOfUsersInRoom = JsonConvert.DeserializeObject<HashSet<Guid>>(room.UserInRoom);

            RoomName = string.Empty;
            foreach (var User in listOfUsersInRoom)
            {
                RoomName += String.Format("|{0}", listOfUsers[User].UserName);
                if (!this.UsersInRoom.Contains(User))
                    this.UsersInRoom.Add(User);
            }
            RoomName.TrimStart('|');
        }
        private void FillRoom(int idRoom, Guid roomIdentifier, int roomHashIdentifier)
        {
            IdRoom = idRoom;
            RoomIdentifier = roomIdentifier;
            _roomHashIdentifier = roomHashIdentifier;
        }

        public static Int32 GetHashIdentifier(IEnumerable<ChatUser> Users)
        {
            Int64 SumOfUserHash = 0;
            Int32 SumOfIds = 0;
            Int32 TotalHashChode = 0;
            int Count = 0;

            foreach (ChatUser User in Users)
            {
                SumOfUserHash += User.GetHashCode();
                SumOfIds += User.IdUser;
                Count++;
            }
            TotalHashChode = (Int32)SumOfUserHash / Count;

            if ((TotalHashChode + SumOfIds) == Int32.MaxValue)
                TotalHashChode -= SumOfIds;
            else
                TotalHashChode += SumOfIds;

            return TotalHashChode;
        }
        private Boolean _isOpened;
        private int _roomHashIdentifier;

        public Boolean AddMessage(String messageContent, ChatUser sender)
        {
            try
            {
                if (messageContent == null)
                    throw new NullReferenceException("MessageContent is null in addMessage in ChatRoom class");

                if (sender == null)
                    throw new NullReferenceException("Sender is null in addMessage in ChatRoom class");

                foreach (var userInRoom in UsersInRoom)
                {
                    if (userInRoom.Equals(sender.UserIdentifier))
                        continue;

                    CurrentRoomSession.AddToUnReadMessage(userInRoom, messageContent, sender);
                }

                CurrentRoomSession.AddToMessageList(messageContent, sender);
            }
            catch (ChatException ex)
            {
                SendErrorEmail.SendError(ex, "addMessage");
                return false;
            }
            return true;
        }

        public List<Message> GetUserUnReadMessages(Guid userIdentifier)
        {
            return CurrentRoomSession.ReadUserMessage(userIdentifier);
        }

        public ChatSessions GetRoomOldMessages(DateTime FromDate)
        {
            if (FromDate == DateTime.MaxValue || FromDate == DateTime.MinValue)
                throw new ChatException("Incorrect date in GetRoomOldMessages");

            return CurrentRoomSession.GetOldSession(FromDate);
        }

        public void AddUserToRoom(Guid UserIdentifier, ChatUser RoomNewUser)
        {
            if (ChatHelper.IsGuidNullOrEmpty(UserIdentifier))
                throw new ChatException("UserIdentifier in AddUserToRoom is Guid Empty");

            if (RoomNewUser == null)
                throw new ChatException("Chat User in AddUserToRoom is null");

            if (!UsersInRoom.Contains(UserIdentifier))
                UsersInRoom.Add(UserIdentifier);
        }

        public void CloseCurrentSession()
        {
            if (CurrentRoomSession.RoomMessages.Count <= 0)
                return;

            CurrentRoomSession.SaveSession();
        }
      
        protected int SaveRoomState()
        {
            try
            {
                 return dataAccessHelper.InsertRoom(RoomIdentifier, _roomHashIdentifier,
                                        JsonConvert.SerializeObject(this.UsersInRoom), _roomCreator.UserName);
            }
            catch (ChatSqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SaveRoomState()");
                return 0;
            }
        }
        private ChatUser _roomCreator;
    }
}