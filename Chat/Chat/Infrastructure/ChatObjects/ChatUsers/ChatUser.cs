using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Security.Principal;
using System.Text;
using Chat.Common;
using Chat.DAL;
using Chat.Infrastructure.ChatObjects.ChatRooms;
using Chat.Services;

namespace Chat.Infrastructure.ChatObjects.ChatUsers
{
    public class ChatUser
    {
        private static DataBaseFunctions dataAccessHeper = new DataBaseFunctions();

        public int IdUser { get; private set; }
        public int IdLogin { get; private set; }

        public Guid UserIdentifier { get; private set; }
        public string UserName { get; private set; }
        public ChatStatus UserStatus { get; private set; }

        public HashSet<Guid> UserRooms { get; private set; }
        public DateTime LastLogIn { get; private set; }

        public ChatUser()
            : this(string.Empty, 0, 0, Guid.Empty)
        { }

        public ChatUser(String name, Int32 idUser, Int32 idLogin, Guid identifier)
        {
            InitializeUser(name, idUser, idLogin, identifier);
        }
        private void InitializeUser(String name, Int32 idUser, Int32 idLogin, Guid identifier)
        {
            this.IdUser = idUser;
            IdLogin = idLogin;
            UserName = name;
            UserIdentifier = identifier;
            UserRooms = new HashSet<Guid>();
            UserStatus = new ChatStatus();
            LastLogIn = DateTime.Now;
        }

        public override int GetHashCode()
        {
            return UserIdentifier.GetHashCode();
        }

        public void LoadUserByIdLogin(Int32 idLogin, String userName)
        {
            if (idLogin <= 0)
                throw new ChatException("IdLogin is incorrect in LoadUserByIdLogin");

            TryToLoadUserDataByLogin(idLogin);

            if (!ChatHelper.IsGuidNullOrEmpty(this.UserIdentifier))
                return;

            InitializeUser(userName, idLogin, 0, Guid.NewGuid());

            if (!SaveUserState())
                return;

            TryToLoadUserDataByLogin(idLogin);
        }
        public void LoadUserByUserIdentifierOrCreateNew(Guid userIdentifier, String userName)
        {
            if (ChatHelper.IsGuidNullOrEmpty(userIdentifier))
                throw new ChatException("UserIdentifier is incorrect in LoadUserByUserIdentifier");

            TryGetUserDataByUserIdentifier(userIdentifier);

            if (!ChatHelper.IsGuidNullOrEmpty(this.UserIdentifier))
                return;

            InitializeUser(userName, 0, 0, Guid.NewGuid());

            if (!SaveUserState())
                return;

            TryGetUserDataByUserIdentifier(userIdentifier);
        }

        public Boolean SaveUserState()
        {
            try
            {
                if (IdLogin <= 0)
                    throw new ChatException("IdLogin is incorrect or not fill in SaveUserState");

                if (ChatHelper.IsGuidNullOrEmpty(UserIdentifier))
                    throw new ChatException("UserIdentifier is Empty in SaveUserState");

                if (string.IsNullOrEmpty(UserName))
                    throw new ChatException("UserName is null or empty in SaveUserState");

                if (UserStatus == null)
                    throw new ArgumentNullException("UserStatus is null in SaveUserState");

                if (IdUser == 0)
                    IdUser = dataAccessHeper.InsertChatUser(IdLogin,UserIdentifier , UserName, UserStatus.IdStaut, LastLogIn, UserName);
                else
                    dataAccessHeper.UpdateChatUser(IdUser, UserName, UserStatus.IdStaut, LastLogIn, "System");
            }
            catch (ChatSqlException ex)
            {
                SendErrorEmail.SendError(ex, "SaveUserState");
                return false;
            }
            return true;
        }

        public void AddRoomToList(Guid roomIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(roomIdentifier))
                throw new ChatException("RoomIdentifier in function RemoveRoomFromList is null or empty");

            if (this.UserRooms.Contains(roomIdentifier))
                this.UserRooms.Add(roomIdentifier);
        }
        public void RemoveRoomFromList(Guid roomIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(roomIdentifier))
                throw new ChatException("RoomIdentifier in function RemoveRoomFromList is null or empty");

            if (this.UserRooms.Contains(roomIdentifier))
                this.UserRooms.Remove(roomIdentifier);
        }
        public bool UserRoomsContains(Guid roomIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(roomIdentifier))
                throw new ArgumentNullException("Parameters IdRoom on CheckInUserRoom method is null");

            return UserRooms.Contains(roomIdentifier);
        }

        protected Boolean TryToLoadUserDataByLogin(int IdLogin)
        {
            try
            {
                var user = dataAccessHeper.SelectUserByIdLoginOrDefault(IdLogin);
                if (user != null)
                {
                    FillData(user);
                    return true;
                }

                return false;
            }
            catch (ChatSqlException ex)
            {
                SendErrorEmail.SendError(ex, "TryToLoadUserDataByLogin");
                return false;
            }
        }

        protected Boolean TryGetUserDataByUserIdentifier(Guid UserIdentifier)
        {
            try
            {
                var user = dataAccessHeper.SelectUserByGuidOrDefault(UserIdentifier);
                if (user != null)
                {
                    FillData(user);
                    return true;
                }

                return false;
            }
            catch (ChatSqlException ex)
            {
                SendErrorEmail.SendError(ex, "TryGetUserDataByUserIdentifier");
                return false;
            }
        }

        protected void FillData(tblChatUser user)
        {
            this.IdUser = user.IdUser;
            this.IdLogin = user.IdLogin;
            this.UserIdentifier = user.ChatUserIdentifier;
            this.UserName = user.ChatUserName;
            this.UserStatus = new ChatStatus((TypeStatus)user.IdChatUserStatus);
        }
    }
}