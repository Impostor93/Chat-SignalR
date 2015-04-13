using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.DAL;
using Chat.Infrastructure;

namespace Chat.Infrastructure
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
                        DataBaseFunctions Function = new DataBaseFunctions();
                        var users = Function.SelectChatUsers();

                        if (users.Count() == 0)
                            return new Dictionary<Guid, ChatUser>();
                        else
                            FillListOfUsers(users);
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

            public static ChatUser InitializrChatUserByAspNetAuthenticationToken(string aspNetAuthenticationToken)
            {
                try
                {
                    var Function = new DataBaseFunctions();
                    var userLogin = Function.SelectUserLogin(aspNetAuthenticationToken);

                    ChatUser chatUser = new ChatUser();

                    if (userLogin != null && userLogin.tblChatUsers != null && userLogin.tblChatUsers.Count > 0)
                    {
                        if (ChatUserManager.ListOfUsers.ContainsKey(userLogin.tblChatUsers.First().ChatUserIdentifier))
                        {
                            chatUser = ChatUserManager.FindUser(userLogin.tblChatUsers.First().ChatUserIdentifier);
                            chatUser.UserStatus.ChangeStatus((IdTypeStatus)userLogin.tblChatUsers.First().IdChatUserStatus);
                        }
                    }
                    else
                    {
                        chatUser.LoadUserByIdLogin(userLogin.IdLogin, userLogin.UserName);

                        if (!ChatUserManager.ListOfUsers.ContainsKey(chatUser.UserIdentifier))
                            ChatUserManager.AddUserToList(chatUser);
                    }

                    return chatUser;
                }
                catch (ChatSqlException Ex)
                {
                    SendErrorEmail.SendError(Ex, "InitializrChatUserByAspNetAuthenticationToken");
                    return null;
                }
                catch (ChatException ChatEx)
                {
                    SendErrorEmail.SendError(ChatEx, "InitializrChatUserByAspNetAuthenticationToken");
                    return null;
                }
                catch (Exception ex)
                {
                    SendErrorEmail.SendError(ex, "InitializrChatUserByAspNetAuthenticationToken");
                    return null;
                }
            }

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

            private static void FillListOfUsers(IEnumerable<tblChatUser> users)
            {
                var temporaryListChatUser = new Dictionary<Guid, ChatUser>();
                foreach (var user in users)
                {
                    temporaryListChatUser.Add(user.ChatUserIdentifier,
                        new ChatUser(user.ChatUserName, user.IdUser, user.IdLogin, user.ChatUserIdentifier));
                }

                lock (listOfUsers)
                {
                    listOfUsers = new Dictionary<Guid, ChatUser>(temporaryListChatUser);
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