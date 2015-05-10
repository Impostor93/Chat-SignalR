using System;
using System.Collections.Generic;
using System.Linq;
using Chat.Common;
using Chat.DAL;
using Chat.Infrastructure.ChatObjects.ChatRooms;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;

namespace Chat.Infrastructure
{
    internal class ChatUserManager
    {
        static private Dictionary<Guid, ChatUser> listOfUsers = new Dictionary<Guid, ChatUser>();
        private static DataBaseFunctions dataAccessHelper = new DataBaseFunctions();

        public static ChatUser InitializrChatUserByAspNetAuthenticationToken(string aspNetAuthenticationToken)
        {
            try
            {
                var userLogin = dataAccessHelper.SelectUserLogin(aspNetAuthenticationToken);

                var chatUser = new ChatUser();

                if (userLogin != null && userLogin.tblChatUsers != null && userLogin.tblChatUsers.Count > 0)
                {
                    if (ListOfUsers.ContainsKey(userLogin.tblChatUsers.First().ChatUserIdentifier))
                    {
                        chatUser = FindUser(userLogin.tblChatUsers.First().ChatUserIdentifier);
                        chatUser.UserStatus.ChangeStatus((TypeStatus)userLogin.tblChatUsers.First().IdChatUserStatus);
                    }
                }
                else
                {
                    chatUser.LoadUserByIdLogin(userLogin.IdLogin, userLogin.UserName);

                    AddUserToListOfUsers(chatUser);
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

        public static void AddUserToListOfUsers(ChatUser userToAdd)
        {
            if (userToAdd == null || ChatHelper.IsGuidNullOrEmpty(userToAdd.UserIdentifier))
                throw new ArgumentException("UserToAdd is incorrect");

            lock (ListOfUsers)
            {
                if (!ListOfUsers.ContainsKey(userToAdd.UserIdentifier))
                    ListOfUsers.Add(userToAdd.UserIdentifier, userToAdd);
            }
        }
        public static IEnumerable<ChatUser> GetAllUser(Guid currentUserIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(currentUserIdentifier))
                throw new ArgumentException("CurrentUserIdentifier is null or Empty in CurrentUserIdentifier");

            var allUsers = new Dictionary<Guid, ChatUser>(listOfUsers);
            allUsers.Remove(currentUserIdentifier);

            return allUsers.Values;
        }

        public static Dictionary<Guid, ChatUser> ListOfUsers
        {
            get
            {
                if (listOfUsers.Count <= 0)
                {
                    var users = dataAccessHelper.SelectChatUsers();

                    if (users == null || users.Count() == 0)
                        return new Dictionary<Guid, ChatUser>();
                    else
                        FillListOfUsers(users);
                }

                return listOfUsers;
            }
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

        public static void AddRoomToUserList(Guid userIdentifier, ChatRoom room)
        {
            try
            {
                if (ChatHelper.IsGuidNullOrEmpty(userIdentifier))
                    throw new ArgumentException("UserIdentifier is empty or null");

                if (room == null)
                    throw new ArgumentNullException("Room is null");

                lock (ListOfUsers)
                {
                    var user = FindUser(userIdentifier);
                    user.AddRoomToList(room.RoomIdentifier);
                }
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "RemoveRoom");
                return;
            }
        }
        public static HashSet<Guid> GetUserRooms(Guid userIdentifier)
        {
            if (!listOfUsers.ContainsKey(userIdentifier))
                throw new KeyNotFoundException("UserIdentifier in GetUserRooms");

            return new HashSet<Guid>(listOfUsers[userIdentifier].UserRooms);
        }
        public static void RemoveRoomFromUserList(Guid userIdentifier, Guid roomIdentifier)
        {
            try
            {
                if (ChatHelper.IsGuidNullOrEmpty(userIdentifier))
                    throw new ChatException("UserIdentifier is empty or null");

                if (ChatHelper.IsGuidNullOrEmpty(roomIdentifier))
                    throw new ChatException("RoomIdentifier is empty or null");

                lock (ListOfUsers)
                {
                    var user = FindUser(userIdentifier);
                    user.RemoveRoomFromList(roomIdentifier);
                }
            }
            catch (ChatException Ex)
            {
                SendErrorEmail.SendError(Ex, "RemoveRoom");
                return;
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
    }
}