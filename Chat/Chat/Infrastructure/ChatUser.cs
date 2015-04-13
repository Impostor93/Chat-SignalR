using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using Chat.DAL;

namespace Chat.Infrastructure
{
    public class ChatUser
    {
        #region Member
            Int32 idUser;
            Int32 idLogin;
            String userName;
            Guid userIdentifier;
            ChatStatus userStatus;
            Dictionary<Guid, ChatRoom> userRooms;
            DateTime lastLogIn;

        #endregion

        #region Constructor

            public ChatUser()
            {}
            public ChatUser(String Name)
                :this(Name,0,0,new Guid())
            { }

            public ChatUser(String Name, Int32 IdUser) :
                this(Name, IdUser, 0, new Guid())
            {}

            public ChatUser(String Name, Int32 IdUser,Int32 IdLogin,Guid Identifier)
            {
                idUser = IdUser;
                idLogin = IdLogin;
                userName = Name;
                userIdentifier = Identifier;
                userRooms = new Dictionary<Guid, ChatRoom>();
                userStatus = new ChatStatus();
                lastLogIn = DateTime.Now;
            }

        #endregion

        #region Properties

           public int IdUser
            {
                get { return idUser; }
            }
           public String UserName 
            {
                get { return userName; }
            }
           public Guid UserIdentifier
           {
               get { return userIdentifier; }
               set { userIdentifier = value; }
           }
           public ChatStatus UserStatus
           {
               get { return userStatus; }
               set { userStatus = value; }
           }
           public Dictionary<Guid, ChatRoom> UserRooms
           {
               get { return userRooms; }
               set { userRooms = value; }
           }
           public DateTime LastLogIn
           {
               get { return lastLogIn; }
               set { lastLogIn = value; }
           }
           
        #endregion

        #region Methods
        
           #region Public Methods
               public Boolean LoadUserByIdLogin(Int32 IdLogin,String UserName)
               {
                   if (IdLogin <= 0)
                       throw new ChatException("IdLogin is incorrect in LoadUserByIdLogin");

                   if (!GetDataForUserByLogin(IdLogin))
                       return false;

                   if (this.userIdentifier != Guid.Empty)
                       return true;
                   
                   this.userIdentifier = Guid.NewGuid();
                   this.idLogin = IdLogin;
                   this.userName = UserName;
                   this.UserStatus = new ChatStatus();
                   this.userRooms = new Dictionary<Guid, ChatRoom>();
                   this.lastLogIn = DateTime.Now;

                   if (!SaveUserState())
                       return false;

                   if (!GetDataForUserByLogin(IdLogin))
                       return false;

                   return true;
               }
               public Boolean LoadUserByUserIdentifier(Guid UserIdentifier,String UserName)
               {
                   if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                       throw new ChatException("UserIdentifier is incorrect in LoadUserByUserIdentifier");

                   if (!GetDataForUserByUserIdentifier(UserIdentifier))
                       return false;

                   if (this.userIdentifier != Guid.Empty)
                       return true;

                   this.userIdentifier = Guid.NewGuid();
                   this.userName = UserName;
                   this.UserStatus = new ChatStatus();
                   this.userRooms = new Dictionary<Guid, ChatRoom>();
                   this.lastLogIn = DateTime.Now;

                   if (!SaveUserState())
                       return false;

                   if (!GetDataForUserByUserIdentifier(UserIdentifier))
                       return false;

                   return true;
               }

               public ChatRoom FineRoomInUserList(Guid IdRoom)
               {
                   if (IdRoom == null)
                       throw new ArgumentNullException("Parameters IdRoom on CheckInUserRoom method is null");

                   if (userRooms.ContainsKey(IdRoom))
                       return userRooms[IdRoom];
                   else
                       return null;
               }

               public void SetRoomInListOfRoomOfUser(ChatRoom Room)
               {
                   if (Room == null)
                       throw new ArgumentNullException("In SetRoomInListOfRoomOfUser Room is null");

                   if(!userRooms.ContainsKey(Room.RoomIdentifier))
                       userRooms.Add(Room.RoomIdentifier,Room);
               }

               public override int GetHashCode()
               {
                   return userIdentifier.GetHashCode();
               }

               public Boolean SaveUserState()
               {
                   try
                   {
                       DataBaseFunctions Function = new DataBaseFunctions();

                       if (Function == null)
                           throw new NullReferenceException("Function in SaveUser is null");

                       if (this.idLogin <= 0)
                           throw new ChatException("IdLogin is incorrect or not fill in SaveUserState");

                       if (this.userIdentifier == Guid.Empty)
                           throw new ChatException("UserIdentifier is Empty in SaveUserState");

                       if (String.IsNullOrEmpty(this.userName))
                           throw new ChatException("UserName is null or empty in SaveUserState");

                       if (this.userStatus == null)
                           throw new ChatException("UserStatus is null in SaveUserState");

                       //TODO:Remove this Dataset
                       DataSet dsUser = new DataSet();
                       if (this.IdUser == 0)
                           this.idUser = Function.InsertChatUser(this.idLogin, this.userIdentifier, this.userName, this.userStatus.IdStaut, this.lastLogIn, this.userName);
                       else
                           Function.UpdateChatUser(this.IdUser, this.userName, this.userStatus.IdStaut,this.LastLogIn, "System");
                   }
                   catch (ChatSqlException ex)
                   {
                       SendErrorEmail.SendError(ex, "SaveUserState");
                       return false;
                   }
                   return true;
               }

               public Boolean SaveUser(int IdLogin,Guid UserIdentifier,String UserName,IdTypeStatus UserStatus)
               {
                   try
                   {
                       DataBaseFunctions Function = new DataBaseFunctions();

                       if (Function == null)
                           throw new NullReferenceException("Function in SaveUser is null");

                       DataSet dsUser = new DataSet();
                       this.idUser = Function.InsertChatUser(IdLogin, UserIdentifier, UserName, (int)UserStatus, this.lastLogIn, UserName);
                   }
                   catch (ChatSqlException ex)
                   {
                       SendErrorEmail.SendError(ex, "SaveUser");
                       return false;
                   }
                   return true;
               }

               public void RemoveRoomFromList(Guid RoomIdentifier)
               {
                   if (RoomIdentifier == null || RoomIdentifier == Guid.Empty)
                       throw new ChatException("RoomIdentifier in function RemoveRoomFromList is null or empty");

                   if (this.userRooms.ContainsKey(RoomIdentifier)) 
                        this.userRooms.Remove(RoomIdentifier);
               }

           #endregion

           #region Protected Method

            protected Boolean GetDataForUserByLogin(int IdLogin)
            {
                try
                {
                    DataBaseFunctions Function = new DataBaseFunctions();
                    FillData(Function.SelectUserByIdLoginOrDefault(IdLogin));
                }
                catch (ChatSqlException ex)
                {
                    SendErrorEmail.SendError(ex, "FillData");
                    return false;
                }
                return true;
            }

            protected Boolean GetDataForUserByUserIdentifier(Guid UserIdentifier)
            {
                try
                {
                    DataBaseFunctions Function = new DataBaseFunctions();

                    if (Function == null)
                        throw new NullReferenceException("Function in GetDataForUserByUserIdentifier is null");

                    FillData(Function.SelectUserByGuidOrDefault(UserIdentifier));
                }
                catch (ChatSqlException ex)
                {
                    SendErrorEmail.SendError(ex, "FillData");
                    return false;
                }
                return true;
            }

            protected void FillData(tblChatUser user)
            {
                if(user != null)
                {
                    this.idUser = user.IdUser;
                    this.idLogin = user.IdLogin;
                    this.userIdentifier = user.ChatUserIdentifier;
                    this.userName = user.ChatUserName;
                    this.userStatus = new ChatStatus((IdTypeStatus)user.IdChatUserStatus);
                }
                else
                {
                    this.idUser = 0;
                    this.idLogin = 0;
                    this.userIdentifier = Guid.Empty;
                    this.userName = String.Empty;
                    this.userStatus = new ChatStatus();
                }
            }

            #endregion

        #endregion

    }
}
