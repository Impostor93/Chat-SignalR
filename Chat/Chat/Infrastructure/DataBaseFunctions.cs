using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web;
using Chat.Common;
using Chat.DAL;
using Chat.DAL.Infrastructure.Repositories.ChatRepositories;
using Chat.Infrastructure;

namespace Chat.Infrastructure
{
    class DataBaseFunctions
    {


        #region Constructors
        public DataBaseFunctions() { }
        #endregion

        #region SELECT

        public IEnumerable<tblChatRoom> SelectRoomByHashIdentifier(Int32 RoomHashIdentifier)
        {
            try
            {
                IEnumerable<tblChatRoom> room;
                using (var repo = new ChatRoomRepository(new ChatEntities()))
                {
                    room = new List<tblChatRoom>(repo.Get(e => e.HashIdentifier == RoomHashIdentifier));
                }
                return room;
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(String.Format("Exception in DBfile in SelectRoomByHashIdentifier method massage is - {0}", ex.Message), "SelectRooms");
                return null;
            }
        }

        public IEnumerable<tblRoomMessageSession> SelectSession(DateTime startDate, int idRoom, ref DataSet dsRooms)
        {
            try
            {
                if (startDate == DateTime.MinValue)
                    throw new ChatSqlException("In SelectSession StartDate is incorrect");

                if (idRoom == 0)
                    throw new ChatSqlException("In SelectSession IdRoom is incorrect");

                IEnumerable<tblRoomMessageSession> roomMessageSesssion;
                using (var repo = new RoomMessageSessionRepository(new ChatEntities()))
                {
                    roomMessageSesssion = new List<tblRoomMessageSession>(repo.GetAndOrderBy(e => e.IdRoom == idRoom && e.SessionStartDate < startDate,
                        order => order.SessionStartDate, true));
                }

                return roomMessageSesssion;
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError("Exception in DBfile in SelectRooms method massage is - " + ex.Message, "SelectRooms");
                return null;
            }
        }

        public IEnumerable<tblChatUser> SelectChatUsers()
        {
            try
            {
                IEnumerable<tblChatUser> chatUsers;
                using (var repo = new ChatUserRepository(new ChatEntities()))
                {
                    chatUsers = new List<tblChatUser>(repo.SelectAll());
                }

                return chatUsers;
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(String.Format("Exception in DBfile in SelectUsers method massage is - {0}", ex.Message), "SelectUsers");
                return null;
            }
        }

        public tblUserLogin SelectUserLogin(string aspAuthenticationUserId)
        {
            try
            {
                if (aspAuthenticationUserId == String.Empty)
                    throw new ChatSqlException("Empty Asp authentication user identifier!");

                using (var repo = new ChatUserLoginRepository(new ChatEntities()))
                {
                    return repo.SelectAllAndInclude(e => e.AspAuthenticationUserId == aspAuthenticationUserId,c => c.tblChatUsers).FirstOrDefault();
                }
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "SelectUserLogin");
                return null;
            }
        }

        public tblChatUser SelectUserByGuidOrDefault(Guid userIdentifier)
        {
            try
            {
                if (userIdentifier == null || userIdentifier == Guid.Empty)
                    throw new ChatSqlException("UserIdentifier is null or Guid empty");

                using (var repo = new ChatUserRepository(new ChatEntities()))
                {
                    return repo.Get(e => e.ChatUserIdentifier == userIdentifier).FirstOrDefault();
                }
            }
            catch (SqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SelectUserByGuid");
                return null;
            }
        }

        public tblChatUser SelectUserByIdLoginOrDefault(int idLogin)
        {
            try
            {
                if (idLogin == 0)
                    throw new ChatSqlException("IdLogin is incorrect");

                using (var repo = new ChatUserRepository(new ChatEntities()))
                {
                    return repo.Get(e => e.IdLogin == idLogin).FirstOrDefault();
                }
            }
            catch (SqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SelectUserByGuid");
                return null;
            }
        }
        #endregion

        #region INSERT

        public int InsertRoom(Guid roomIdentifier, int roomHashId, string jsonFormatUsers, string creator)
        {
            try
            {
                if (roomIdentifier == null || roomIdentifier == Guid.Empty)
                    throw new ChatSqlException("In InsertRoom RoomIdentifier Is Null or Empty");

                if (roomHashId == 0)
                    throw new ChatSqlException("In InsertRoom RoomHashId is incorrect");

                if (String.IsNullOrEmpty(jsonFormatUsers))
                    throw new ChatSqlException("In InsertRoom JsonFormatUsers Is Null or Empty");

                if (String.IsNullOrEmpty(creator))
                    throw new ChatSqlException("In InsertRoom Creator Is Null or Empty");

                var newRoom = new tblChatRoom()
                {
                    RoomIdentifier = roomIdentifier,
                    HashIdentifier = roomHashId,
                    UserInRoom = jsonFormatUsers,
                    UserCreater = creator,
                    DateCreated = DateTime.Now,
                    DateChanged = DateTime.Now,
                };

                using (var repo = new ChatRoomRepository(new ChatEntities()))
                {
                    repo.Add(newRoom);
                    repo.Save();
                }

                return newRoom.IdRoom;
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertRoom");
                return 0;
            }
        }

        public int InsertChatUser(int idLogin, Guid userIdentifier, string chatUserName,
                                            int idChatUserStatus, DateTime lastSeen, string creator)
        {
            try
            {
                if (userIdentifier == null || userIdentifier == Guid.Empty)
                    throw new ChatSqlException("In InsertChatUser UserIdentifier Is Null or Empty");

                if (String.IsNullOrEmpty(chatUserName))
                    throw new ChatSqlException("In InsertChatUser ChatUserName Is Null or Empty");

                if (idChatUserStatus == 0)
                    throw new ChatSqlException("In InsertChatUser IdChatUserStatus Is incorrect");

                if (String.IsNullOrEmpty(creator))
                    throw new ChatSqlException("In InsertChatUser Creator Is Null or Empty");

                var newUser = new tblChatUser()
                {
                    IdLogin = idLogin,
                    ChatUserIdentifier = userIdentifier,
                    ChatUserName = chatUserName,
                    IdChatUserStatus = idChatUserStatus,
                    LastSeen = lastSeen,
                    DateCreated = DateTime.Now,
                    DateChange = DateTime.Now,
                    UserName = creator
                };

                using (var repo = new ChatUserRepository(new ChatEntities()))
                {
                    repo.Add(newUser);
                    repo.Save();
                }

                return newUser.IdUser;
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertChatUser");
                return 0;
            }
        }

        public void InsertChatSession(int idRoom, DateTime sessionStartDate, DateTime sessionEndDate, string sessionMessages, string creator)
        {
            try
            {
                if (idRoom == 0)
                    throw new ChatSqlException("In InsertChatSession IdRoom Is Null or Empty");

                if (sessionStartDate == DateTime.MinValue || sessionStartDate == null)
                    throw new ChatSqlException("In InsertChatSession SessionStartDate Is incorrect or null");

                if (sessionEndDate == DateTime.MaxValue || sessionEndDate == null)
                    throw new ChatSqlException("In InsertChatSession SessionEndDate Is incorrect or null");

                if (String.IsNullOrEmpty(sessionMessages))
                    throw new ChatSqlException("In InsertChatSession SessionMessages Is Null or Empty");

                if (String.IsNullOrEmpty(creator))
                    throw new ChatSqlException("In InsertChatSession Creator Is Null or Empty");

                using (var repo = new RoomMessageSessionRepository(new ChatEntities()))
                {
                    repo.Add(new tblRoomMessageSession()
                    {
                        IdRoom = idRoom,
                        SessionStartDate = sessionStartDate,
                        SessionEndDate = sessionEndDate,
                        SessionMessages = sessionMessages,
                        DateChanged = DateTime.Now,
                        DateCreated = DateTime.Now,
                        UserName = creator
                    });
                    repo.Save();
                }

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertChatSession");
            }
        }
        #endregion

        #region UPDATE
        public Boolean UpdateChatUser(int idUser, string chatUserName, int idChatUserStatus, DateTime lastSeen, string userName)
        {
            try
            {
                if (idUser == 0)
                    throw new ChatSqlException("In UpdateChatUser IdUser Is incorrect");

                if (string.IsNullOrEmpty(chatUserName))
                    throw new ChatSqlException("In UpdateChatUser ChatUserName Is Null or Empty");

                if (idChatUserStatus == 0)
                    throw new ChatSqlException("In UpdateChatUser IdChatUserStatus Is incorrect");

                if (string.IsNullOrEmpty(userName))
                    throw new ChatSqlException("In UpdateChatUser UserName Is Null or Empty");

                using (var repo = new ChatUserRepository(new ChatEntities()))
                {
                    repo.Update(e => e.IdUser == idUser, (entity) =>
                    {
                        entity.ChatUserName = chatUserName.Trim();
                        entity.IdChatUserStatus = idChatUserStatus;
                        entity.UserName = userName;
                        entity.LastSeen = lastSeen;

                        return entity;
                    });

                    repo.Save();
                }
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertNewLogin");
                return false;
            }
            return true;
        }
        #endregion

        #region Good But not useful for this moment
        //public Boolean InsertNewRooms(DataTable dtTable)
        //{
        //    try
        //    {
        //        DataTable dtNewRoom = new DataTable();
        //        dtNewRoom = dtTable;

        //        if (dtNewRoom == null)
        //            throw new ArgumentNullException("In InsertNewRooms  dtNewRoom is null");


        //        if (dtNewRoom.Rows.Count == 0)
        //            return true;

        //        using (SqlBulkCopy InsertNewRooms = new SqlBulkCopy(Connection.ConnectionString))
        //        {
        //            InsertNewRooms.DestinationTableName = dtNewRoom.TableName;

        //            // Number of records to be processed in one go
        //            InsertNewRooms.BatchSize = 2;

        //            // Map the Source Column from DataTabel to the Destination Columns in SQL Server 2005 Person Table
        //            foreach (DataColumn Cul in dtNewRoom.Columns)
        //                InsertNewRooms.ColumnMappings.Add(Cul.ColumnName, Cul.ColumnName);

        //            // Number of records after which client has to be notified about its status
        //            InsertNewRooms.NotifyAfter = dtNewRoom.Rows.Count;

        //            // Finally write to server
        //            InsertNewRooms.WriteToServer(dtNewRoom);
        //            InsertNewRooms.Close();
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Exception in DBfile in InsertNewRooms method massage is - " + ex.Message);
        //    }
        //    return true;
        //}
        //public DataTable GeneratDataTableFromRooms(List<ChatRoom> Rooms, DateTime LastInsert)
        //{
        //    try
        //    {

        //        if (Rooms == null)
        //            throw new ArgumentNullException("In GeneratDataTableFromRoomMassages Rooms is null");

        //        if (LastInsert == null)
        //            throw new ArgumentNullException("In GeneratDataTableFromRoomMassages LastInsert is null");

        //        DataTable dtRooms = new DataTable();

        //        dtRooms.TableName = "tblRooms";

        //        dtRooms.Columns.Add("IdRoom", typeof(String));
        //        dtRooms.Columns.Add("RoomName", typeof(String));
        //        dtRooms.Columns.Add("DateCreated", typeof(DateTime));
        //        dtRooms.Columns.Add("FirstUserId", typeof(int));
        //        dtRooms.Columns.Add("SecondUserId", typeof(int));

        //        DataRow row = null;

        //        foreach (ChatRoom Room in Rooms)
        //        {
        //            if (LastInsert > Room.DateCreate)
        //                continue;

        //            row = dtRooms.NewRow();

        //            row["IdRoom"] = Room.RoomIdentifier;
        //            row["RoomName"] = Room.RoomName;
        //            row["FirstUserId"] = Room.Sender.IdUser;
        //            row["SecondUserId"] = Room.Resiver.IdUser;
        //            row["DateCreated"] = Room.DateCreate;

        //            dtRooms.Rows.Add(row);
        //        }
        //        return dtRooms;
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Exception in DBfile in GeneratDataTableFromRooms method massage is - " + ex.Message);
        //    }
        //}
        //public DataTable GeneratDataTableFromRoomMassages(List<ChatRoom> Rooms, DateTime LastInsert)
        //{
        //    try
        //    {
        //        if(Rooms == null)
        //            throw new ArgumentNullException("In GeneratDataTableFromRoomMassages Rooms is null");

        //        if(LastInsert == null)
        //            throw new ArgumentNullException("In GeneratDataTableFromRoomMassages LastInsert is null");

        //        DataTable dtRooms = new DataTable();

        //        dtRooms.TableName = "tblMassages";

        //        dtRooms.Columns.Add("IdRoom", typeof(String));
        //        dtRooms.Columns.Add("IdUser", typeof(int));
        //        dtRooms.Columns.Add("Massage", typeof(string));
        //        dtRooms.Columns.Add("DateSend", typeof(DateTime));
        //        dtRooms.Columns.Add("UserName", typeof(string));

        //        DataRow row = null;

        //        foreach (ChatRoom Room in Rooms)
        //        {

        //            foreach (Message RoomMassages in Room.getRoomMessages())
        //            {
        //                if (LastInsert > RoomMassages.DateOfSend)
        //                    continue;
        //                if (Room.getRoomMessages().Count <= 0)
        //                    continue;

        //                row = dtRooms.NewRow();

        //                row["IdRoom"] = Room.IdRoom;
        //                row["IdUser"] = RoomMassages.Sender.IdUser;
        //                row["Massage"] = RoomMassages.MessageContent;
        //                row["DateSend"] = RoomMassages.DateOfSend;
        //                row["UserName"] = RoomMassages.Sender.UserName;

        //                dtRooms.Rows.Add(row);
        //            }
        //        }
        //        return dtRooms;
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception("Exception in DBfile in GeneratDataTableFromRoomMassages method massage is - " + ex.Message);
        //    }
        //}
        #endregion
    }
}