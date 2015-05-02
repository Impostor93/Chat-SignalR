using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.DAL;
using Newtonsoft.Json;

namespace Chat.Infrastructure
{
    public class ChatRoom
    {
        #region Member

            Int32 _IdRoom;
            Guid roomIdentifier;
            Int32 roomHashIdentifier;
            String roomName;
            ChatUser roomCreator;
            ChatUser roomRecipient;
            Boolean _IsOpened;
            DateTime dateCreate;
            HashSet<Guid> userInRoom;
            ChatSessions currentRoomSession;

        #endregion
        
        #region Propaties
            public Int32 IdRoom 
            {
                get { return _IdRoom; }
                set { _IdRoom = value; }
            }
            public Guid RoomIdentifier
            {
                get { return roomIdentifier; }
                set { roomIdentifier = value; }
            }
            public String RoomName
            {
                get { return roomName; }
                set { roomName = value; }
            }
            //public ChatUser RoomCreator
            //{
            //    get { return roomCreator; }
            //    set { roomCreator = value; }
            //}
            public ChatUser RoomRecipient
            {
                get { return roomRecipient; }
                set { roomRecipient = value; }
            }
            public Boolean IsOpend
            {
                get { return _IsOpened; }
                set { _IsOpened = value; }
            }
            public DateTime DateCreate
            {
                get { return dateCreate; }
                set { dateCreate = value; }
            }
            public HashSet<Guid> UsersInRoom
            {
                get { return userInRoom; }
                set { userInRoom = value; }
            }
            public ChatSessions CurrentRoomSession
            {
                get { return currentRoomSession; }
                set { currentRoomSession = value; }
            }
            
            #endregion

        #region Constructor

            public ChatRoom(ChatUser RoomCreator)
            {
                roomIdentifier = Guid.NewGuid();
                roomName = String.Empty;
                roomCreator = RoomCreator;
                roomRecipient = new ChatUser();
                _IsOpened = true;
                dateCreate = DateTime.Now;
                currentRoomSession = new ChatSessions();
                userInRoom = new HashSet<Guid>();//new Dictionary<Guid, ChatUser>();

                userInRoom.Add(RoomCreator.UserIdentifier);
            }
            public ChatRoom(ChatUser RoomCreator,ChatUser RoomRecipient)
            {
                roomIdentifier = Guid.NewGuid();
                roomName = String.Empty;
                roomCreator = RoomCreator;
                roomRecipient = RoomRecipient;
                _IsOpened = true;
                dateCreate = DateTime.Now;
                currentRoomSession = new ChatSessions();
                userInRoom = new HashSet<Guid>();// new Dictionary<Guid, ChatUser>();

                userInRoom.Add(RoomCreator.UserIdentifier);
                userInRoom.Add(RoomRecipient.UserIdentifier);
            }
            public ChatRoom(ChatUser RoomCreator, params ChatUser[] RoomUsers)
            {
                roomIdentifier = Guid.NewGuid();
                roomName = String.Empty;
                roomCreator = RoomCreator;
                roomRecipient = RoomRecipient;
                _IsOpened = true;
                dateCreate = DateTime.Now;
                currentRoomSession = new ChatSessions();
                userInRoom = new HashSet<Guid>(); //new Dictionary<Guid, ChatUser>();

                foreach (ChatUser User in RoomUsers)
                    userInRoom.Add(User.UserIdentifier);
            }

        #endregion

        #region Methods

            #region Public Method

            public Boolean AddMessage(String messageContent, ChatUser sender,Dictionary<Guid,ChatUser> listOfUsers)
            {
                try
                {
                    if (messageContent == null)
                        throw new NullReferenceException("MessageContent is null in addMessage in ChatRoom class");

                    if (sender == null)
                        throw new NullReferenceException("Sender is null in addMessage in ChatRoom class");

                    foreach (Guid UserInRoom in UsersInRoom)
                    {       
                        if (UserInRoom.Equals(sender.UserIdentifier))
                            continue;

                        currentRoomSession.AddToUnReadMessage(UserInRoom, messageContent, sender);
                    }

                    currentRoomSession.AddToGlobalList(messageContent, sender);
                }
                catch (ChatException ex)
                {
                    SendErrorEmail.SendError(ex, "addMessage");
                    return false;
                }
                return true;
            }

            public List<Message> GetUserUnReadMessages(Guid UserIdentifier)
            {
                return this.currentRoomSession.ReadUserMessage(UserIdentifier);
            }

            public void AddUserToRoom(Guid UserIdentifier,ChatUser RoomNewUser)
            {
                if (UserIdentifier == Guid.Empty)
                    throw new ChatException("UserIdentifier in AddUserToRoom is Guid Empty");

                if (RoomNewUser == null)
                    throw new ChatException("Chat User in AddUserToRoom is null");

                if(!userInRoom.Contains(UserIdentifier))
                    userInRoom.Add(UserIdentifier);
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

            public Boolean LoadRoom(IEnumerable<ChatUser> Users,Dictionary<Guid,ChatUser> ListOfUsers)
            {
                try
                {
                    int HashIdentifier = GetHashIdentifier(Users);

                    if (!GetDataForRoom(HashIdentifier, ListOfUsers))
                        return false;

                    if (this.roomIdentifier != Guid.Empty)
                    {
                        this.currentRoomSession.IdRoom = this._IdRoom;
                        this.currentRoomSession.RoomIdentifier = this.roomIdentifier;

                        return true;
                    }
                    this.roomIdentifier = Guid.NewGuid();
                    this.roomHashIdentifier = HashIdentifier;

                    this.roomName = String.Empty;
                    foreach (ChatUser User in Users)
                        this.roomName += String.Format("|{0}", User.UserName);
                    this.roomName.TrimStart('|');

                    this.dateCreate = DateTime.Now;
                    this._IsOpened = true;

                    foreach (ChatUser User in Users)
                        AddUserToRoom(User.UserIdentifier, User);

                    if (!SaveRoomState(ref this._IdRoom))
                        return false;

                    if (this._IdRoom == 0)
                        return false;

                    this.currentRoomSession.IdRoom = this._IdRoom;
                    this.currentRoomSession.RoomIdentifier = this.roomIdentifier;

                }
                catch (ChatException Ex)
                {
                    SendErrorEmail.SendError(Ex, "");
                    return false;
                }
                return true;
            }

            public Boolean SaveRoomCurrentSession()
            {
                return this.currentRoomSession.SaveSession();
            }

            public ChatSessions GetRoomOldMessages(DateTime FromDate)
            {
                if (FromDate == DateTime.MaxValue || FromDate == DateTime.MinValue)
                    throw new ChatException("Incorrect date in GetRoomOldMessages");

                return currentRoomSession.GetOldSession(FromDate);
            }

            public void CloseCurrentSession()
            {
                if (currentRoomSession.RoomMessages.Count <= 0)
                    return;

                currentRoomSession.SaveSession();
            }

            #endregion

        #region Protected Method

            protected Boolean GetDataForRoom(Int32 HashCode,Dictionary<Guid,ChatUser> ListOfUsers)
            {
                try
                {
                    DataBaseFunctions Function = new DataBaseFunctions();
                    if (Function == null)
                        throw new NullReferenceException("Function is null in GetDataForRoom");
                    
                    var room = Function.SelectRoomByHashIdentifier(HashCode);

                    FillRoomData(room, ListOfUsers);

                }
                catch (ChatSqlException ex)
                {
                    SendErrorEmail.SendError(ex, "GetDataForRoom");
                    return false;
                }
                return true;
            }

            protected void FillRoomData(IEnumerable<tblChatRoom> rooms, Dictionary<Guid, ChatUser> ListOfUsers)
            {
                if (rooms.Count() == 1)
                {
                    FillRoom(rooms.First(), ListOfUsers);
                }
                else if (rooms.Count() > 1)
                {
                    foreach (var room in rooms)
                    {
                        var roomsUsers = JsonConvert.DeserializeObject<HashSet<Guid>>(room.UserInRoom.ToString());
                        if (!roomsUsers.Equals(this.userInRoom))
                            continue;

                        FillRoom(room, ListOfUsers);
                    }
                }
                else
                    FillRoom(0, Guid.Empty, 0);
                
            }
            private void FillRoom(tblChatRoom room, IDictionary<Guid,ChatUser> listOfUsers)
            {
                FillRoom(room.IdRoom, room.RoomIdentifier, room.HashIdentifier.Value);

                var listOfUsersInRoom = JsonConvert.DeserializeObject<HashSet<Guid>>(room.UserInRoom);

                this.roomName = string.Empty;
                foreach (var User in listOfUsersInRoom)
                {
                    this.roomName += String.Format("|{0}", listOfUsers[User].UserName);
                    if (!this.UsersInRoom.Contains(User))
                        this.UsersInRoom.Add(User);
                }
                this.roomName.TrimStart('|');
            }
            private void FillRoom(int idRoom,Guid roomIdentifier,int roomHashIdentifier)
            {
                this._IdRoom = idRoom;
                this.roomIdentifier = roomIdentifier;
                this.roomHashIdentifier = roomHashIdentifier;
            }

            protected Boolean SaveRoomState(ref int ReturnValue)
            {
                try
                {
                    DataBaseFunctions Function = new DataBaseFunctions();
                    
                    if (Function == null)
                        throw new ChatException("Function is null in SaveRoomState()");

                    ReturnValue = Function.InsertRoom(this.roomIdentifier, this.roomHashIdentifier, 
                                            JsonConvert.SerializeObject(this.userInRoom), this.roomCreator.UserName);
                }
                catch (ChatSqlException Ex)
                {
                    SendErrorEmail.SendError(Ex, "SaveRoomState()");
                    return false;
                }
                
                return true;
            }

        #endregion

        #endregion
    }
}
