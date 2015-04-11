using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.App_Code;

namespace Chat.App_Code
{
    class ChatUserManager
    {
        #region Member
            static private Dictionary<Guid, ChatUser> listOfUsers = new Dictionary<Guid,ChatUser>();
        #endregion
        
        #region Proparties
            public static Dictionary<Guid, ChatUser> ListOfUsers
            {
                get 
                {
                    if (listOfUsers.Count <= 0)
                    {
                        DBfile Function = new DBfile();
                        DataSet dsUsers = new DataSet();

                        Function.SelectChatUsers(ref dsUsers);

                        if (dsUsers.Tables["tblUsers"].Rows.Count == 0)
                            return new Dictionary<Guid, ChatUser>();

                        else
                            FillListOfUsers(dsUsers.Tables["tblUsers"].Rows);
                    }
                                            
                    return listOfUsers;
                }
            }

        #endregion
        
        #region Constructors
            public ChatUserManager()
            { }
        #endregion

        #region Methods

            public static void RemoveRoom(Guid UserIdentifier,Guid RoomIdentifier)
            {
                try
                {
                    if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                        throw new ChatException("UserIdentifier is empty or null");

                    if (RoomIdentifier == null || RoomIdentifier == Guid.Empty)
                        throw new ChatException("RoomIdentifier is empty or null");

                    lock (ListOfUsers)
                    {
                        if (ListOfUsers[UserIdentifier].UserRooms.ContainsKey(RoomIdentifier))
                            ListOfUsers[UserIdentifier].UserRooms.Remove(RoomIdentifier);
                    }
                }catch(ChatException Ex)
                {
                    SendErrorEmail.SendError(Ex, "RemoveRoom");
                    return;
                }
            }
            public static void AddRoomToUserList(Guid UserIdentifier,ChatRoom Room)
            {
                try
                {
                    if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                        throw new ChatException("UserIdentifier is empty or null");

                    if (Room == null)
                        throw new ChatException("Room is null");
                    lock (ListOfUsers)
                    {
                        if (!ListOfUsers[UserIdentifier].UserRooms.ContainsKey(Room.RoomIdentifier))
                            ListOfUsers[UserIdentifier].UserRooms.Add(Room.RoomIdentifier, Room);
                    }
                }
                catch (ChatException Ex)
                {
                    SendErrorEmail.SendError(Ex, "RemoveRoom");
                    return;
                }
            }
            public static IDictionary<Guid,ChatRoom> GetUserRooms(Guid UserIdentifier)
            {
                if (!listOfUsers.ContainsKey(UserIdentifier))
                    throw new KeyNotFoundException("UserIdentifier in GetUserRooms");

                Dictionary<Guid, ChatRoom> USerRooms = new Dictionary<Guid, ChatRoom>(listOfUsers[UserIdentifier].UserRooms);
                listOfUsers[UserIdentifier].UserRooms.Clear();
               
                return USerRooms;
            }

            public static void AddUserToList(ChatUser UserToAdd)
            {
                if (UserToAdd == null || UserToAdd.UserIdentifier == Guid.Empty)
                    throw new ArgumentException("UserToAdd is incorrect");

                lock (ListOfUsers)
                {
                    if (!ListOfUsers.ContainsKey(UserToAdd.UserIdentifier))
                        ListOfUsers.Add(UserToAdd.UserIdentifier, UserToAdd);
                }
            }
            public static ChatUser FindUser(Guid UserIdentifier)
            {
                if (UserIdentifier == Guid.Empty)
                    throw new ArgumentException("UserIdentifier is incorrect");

                if (ListOfUsers.ContainsKey(UserIdentifier))
                    return ListOfUsers[UserIdentifier];
                else
                    return null;
            }

            private static void FillListOfUsers(DataRowCollection dataRowCollection)
            {
                Dictionary<Guid, ChatUser> TemporaryListChatUser = new Dictionary<Guid, ChatUser>();
                foreach (DataRow Row in dataRowCollection)
                {
                    TemporaryListChatUser.Add(new Guid(Row["ChatUserIdentifier"].ToString()), new ChatUser(Row["ChatUserName"].ToString(), Convert.ToInt32(Row["IdUser"]),
                                                    Convert.ToInt32(Row["IdLogin"]), new Guid(Row["ChatUserIdentifier"].ToString())));
                }
                lock (listOfUsers)
                {
                    listOfUsers = new Dictionary<Guid, ChatUser>(TemporaryListChatUser);
                }
            }

            public static IEnumerable<ChatUser> GetAllUser(Guid CurrentUserIdentifier)
            {
                if(CurrentUserIdentifier == null || CurrentUserIdentifier == Guid.Empty)
                    throw new ArgumentException("CurrentUserIdentifier is null or Empty in CurrentUserIdentifier");

                Dictionary<Guid, ChatUser> AllUsers = new Dictionary<Guid, ChatUser>(listOfUsers);
                AllUsers.Remove(CurrentUserIdentifier);

                return AllUsers.Values;
            }
        #endregion
    }
}