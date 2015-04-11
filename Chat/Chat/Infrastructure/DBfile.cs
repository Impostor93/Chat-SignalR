using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Web;
using Chat.App_Code;

namespace Chat.App_Code
{
     class DBfile
    {
        #region Member
         SqlConnection Connection = null;
#endregion
        
        #region Constructors
             public DBfile()
             {
                 Connection = new SqlConnection(ConfigurationManager.ConnectionStrings["DBConnection"].ToString());

             }

             public DBfile(String ConnectionString)
             {
                 Connection = new SqlConnection(ConnectionString);
             }
        #endregion
        
        #region SELECT
        
        public Boolean SelectRoomByHashIdentifier(Int32 RoomHashIdentifier,ref DataSet dsRooms)
        {
            try
            {
                SqlCommand SelectCommand = new SqlCommand("procSEL_ChatRoomByHashIdentifier", Connection);
                SelectCommand.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlHashId = new SqlParameter("@HashIdentifier", SqlDbType.Int);
                sqlHashId.Value = RoomHashIdentifier;
                
                AddParamToCommand(ref SelectCommand, sqlHashId);

                SqlDataAdapter SelectAdapter = new SqlDataAdapter();

                SelectAdapter.SelectCommand = SelectCommand;

                Connection.Open();

                dsRooms.DataSetName = "tblRoom";
                SelectAdapter.Fill(dsRooms, "tblRoom");

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(String.Format("Exception in DBfile in SelectRoomByHashIdentifier method massage is - {0}", ex.Message), "SelectRooms");
                return false;
            }
            finally
            {
                Connection.Close();
            }
            return true;
        }

        public Boolean SelectSession(DateTime StartDate, int IdRoom, ref DataSet dsRooms)
        {
            try
            {
                if (StartDate == DateTime.MinValue)
                    throw new ChatSqlException("In SelectSession StartDate is incorrect");

                if (IdRoom == 0)
                    throw new ChatSqlException("In SelectSession IdRoom is incorrect");

                Connection.Open();

                SqlCommand SelectCommand = new SqlCommand("procSEL_SessionForRoomByDate", Connection);
                SelectCommand.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlStartDate = new SqlParameter("@SessionStartDate", SqlDbType.DateTime);
                SqlParameter sqlIdRoom = new SqlParameter("@IdRoom", SqlDbType.Int);

                sqlIdRoom.Value = IdRoom;
                sqlStartDate.Value = StartDate;

                AddParamToCommand(ref SelectCommand, sqlIdRoom, sqlStartDate);

                SqlDataAdapter SelectAdapter = new SqlDataAdapter();

                SelectAdapter.SelectCommand = SelectCommand;

                dsRooms.DataSetName = "tblRoomMessage";
                SelectAdapter.Fill(dsRooms, "tblRoomMessage");

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError("Exception in DBfile in SelectRooms method massage is - " + ex.Message, "SelectRooms");
                return false;
            }
            finally
            {
                Connection.Close();
            }

            return true;
        }

        public Boolean SelectChatUsers(ref DataSet dsUsers)
        {
            try
            {
                Connection.Open();

                SqlCommand SelectCommand = new SqlCommand("procSEL_ChatUsers", Connection);
                SelectCommand.CommandType = CommandType.StoredProcedure;

                SqlDataAdapter SelectAdapter = new SqlDataAdapter();

                SelectAdapter.SelectCommand = SelectCommand;

                dsUsers.DataSetName = "tblUsers";
                SelectAdapter.Fill(dsUsers, "tblUsers");

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(String.Format("Exception in DBfile in SelectUsers method massage is - {0}", ex.Message), "SelectUsers");
                return false;
            }
            finally
            {
              Connection.Close();
            }
            return true;
        }

        public Boolean SelectUserLogin(String Username, String Password, ref DataSet dsUserLogin)
        {
            try
            {
                if (String.IsNullOrEmpty(Username))
                    throw new ChatSqlException("In InserNewUserInDb UserName Is Null or Empty");
                if (String.IsNullOrEmpty(Password))
                    throw new ChatSqlException("In InserNewUserInDb Password Is Null or Empty");

                Connection.Open();

                SqlCommand command = new SqlCommand("procSEL_UserLogin", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlUserName = new SqlParameter("@UserName", SqlDbType.NVarChar, 100);
                SqlParameter sqlPassword = new SqlParameter("@PassWord", SqlDbType.NVarChar, 30);

                sqlUserName.Value = Username.Trim();
                sqlPassword.Value = cryptPass(Password.Trim());

                AddParamToCommand(ref command, sqlUserName, sqlPassword);

                SqlDataAdapter LoginAdapter = new SqlDataAdapter();
                LoginAdapter.SelectCommand = command;

                dsUserLogin.DataSetName = "tblUserLogin";

                LoginAdapter.Fill(dsUserLogin, "tblUserLogin");

                Connection.Close();

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "SelectUserLogin");
                return false;
            }
            return true;
        }

        public Boolean SelectUserByGuid(Guid UserIdentifier,ref DataSet dsUser)
        {
            try
            {
                if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                    throw new ChatSqlException("UserIdentifier is null or Guid empty");

                Connection.Open();

                SqlCommand SelectCommand = new SqlCommand("procSEL_UserByUniqeIdentifier", Connection);
                SelectCommand.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlUserIdntifier = new SqlParameter("@UserIdentifier", SqlDbType.UniqueIdentifier);

                AddParamToCommand(ref SelectCommand, sqlUserIdntifier);

                SqlDataAdapter SelectAdapter = new SqlDataAdapter();

                SelectAdapter.SelectCommand = SelectCommand;

                dsUser.DataSetName = "tblUser";
                SelectAdapter.Fill(dsUser, "tblUser");
            }
            catch (SqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SelectUserByGuid");
                return false;
            }
            finally
            {
                Connection.Close();
            }
            return true;
        }

        public Boolean SelectUserByIdLogin(Int32 IdLogin, ref DataSet dsUser)
        {
            try
            {
                if (IdLogin == 0)
                    throw new ChatSqlException("IdLogin is incorrect");

                Connection.Open();

                SqlCommand SelectCommand = new SqlCommand("procSEL_ChatUserByLogin", Connection);
                SelectCommand.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlIdLogin = new SqlParameter("@IdLogin", SqlDbType.Int);
                sqlIdLogin.Value = IdLogin;

                AddParamToCommand(ref SelectCommand, sqlIdLogin);

                SqlDataAdapter SelectAdapter = new SqlDataAdapter();

                SelectAdapter.SelectCommand = SelectCommand;

                dsUser.DataSetName = "tblUser";
                SelectAdapter.Fill(dsUser, "tblUser");
            }
            catch (SqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SelectUserByIdLogin");
                return false;
            }
            finally
            {
                Connection.Close();
            }
            return true;
        }
        #endregion

        #region INSERT

        public Boolean InsertRoom(Guid RoomIdentifier,Int32 RoomHashId,String JsonFormatUsers,String Creator,ref int ReturnValue)
        {
            try
            {
                if (RoomIdentifier == null || RoomIdentifier == Guid.Empty)
                    throw new ChatSqlException("In InsertRoom RoomIdentifier Is Null or Empty");

                if (RoomHashId == 0)
                    throw new ChatSqlException("In InsertRoom RoomHashId is incorrect");

                if (String.IsNullOrEmpty(JsonFormatUsers))
                    throw new ChatSqlException("In InsertRoom JsonFormatUsers Is Null or Empty");

                if (String.IsNullOrEmpty(Creator))
                    throw new ChatSqlException("In InsertRoom Creator Is Null or Empty");

                SqlCommand command = new SqlCommand("procINS_NewChatRoom", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlRoomIdentifier = new SqlParameter("@RoomIdentifier", SqlDbType.UniqueIdentifier);
                SqlParameter sqlHashIdentifier = new SqlParameter("@HashIdentifier", SqlDbType.Int);
                SqlParameter sqlUserInRoom = new SqlParameter("@UserInRoom", SqlDbType.NVarChar, 4000);
                SqlParameter slqRowCreator = new SqlParameter("@UserCreater", SqlDbType.NVarChar, 50);

                sqlRoomIdentifier.Value = RoomIdentifier;
                sqlHashIdentifier.Value = RoomHashId;
                sqlUserInRoom.Value = JsonFormatUsers;
                slqRowCreator.Value = Creator;

                AddParamToCommand(ref command, sqlHashIdentifier, sqlUserInRoom, slqRowCreator, sqlRoomIdentifier);

                Connection.Open();

                command.ExecuteNonQuery();

                ReturnValue = Convert.ToInt32(command.Parameters["@ReturnValue"].Value);

                if (ReturnValue == -1)
                    return false;

                Connection.Close();

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertRoom");
                return false;
            }
            return true;
        }

        public Boolean InsertNewLogin(String UserName,String Password,ref int ReturnValue)
        {
            try
            {
                if (String.IsNullOrEmpty(UserName))
                    throw new ChatSqlException("In InsertNewLogin UserName Is Null or Empty");

                if (String.IsNullOrEmpty(Password))
                    throw new ChatSqlException("In InsertNewLogin Password Is Null or Empty");

                SqlCommand command = new SqlCommand("procINS_NewLogin", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter Param1 = new SqlParameter("@UserName", SqlDbType.NVarChar, 100);
                SqlParameter Param2 = new SqlParameter("@PassWord", SqlDbType.NVarChar, 200);

                Param1.Value = UserName.Trim();
                Param2.Value = cryptPass(Password.Trim());

                AddParamToCommand(ref command, Param1, Param2);

                Connection.Open();

                command.ExecuteNonQuery();

                ReturnValue = Convert.ToInt32(command.Parameters["@ReturnValue"].Value);

                if (ReturnValue <= 0 && ReturnValue != -2)
                    throw new ChatSqlException("Invalid Operation in UpdateChatUser DBfile"); ;

                Connection.Close();

            }catch(SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertNewLogin");
                return false;
            }
            return true;
        }

        /*
         * [dbo].[procINS_NewChatUser]
            @IdLogin			as int,
            @ChatUserIdentifier as uniqueidentifier,
            @ChatUserName as nvarchar(50),
            @IdChatUserStatus as int,
            @UserName as nvarchar(50)
         */
        public Boolean InsertChatUser(int IdLogin, Guid UserIdentifier, String ChatUserName, 
                                            int IdChatUserStatus,DateTime LastSeen, String Creator,ref int ReturnedValue)
        {
            try
            {
                if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                    throw new ChatSqlException("In InsertChatUser UserIdentifier Is Null or Empty");

                if (String.IsNullOrEmpty(ChatUserName))
                    throw new ChatSqlException("In InsertChatUser ChatUserName Is Null or Empty");

                if (IdChatUserStatus == 0)
                    throw new ChatSqlException("In InsertChatUser IdChatUserStatus Is incorrect");

                if (String.IsNullOrEmpty(Creator))
                    throw new ChatSqlException("In InsertChatUser Creator Is Null or Empty");

                SqlCommand command = new SqlCommand("procINS_NewChatUser", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlIdUserLogin = new SqlParameter("@IdLogin", SqlDbType.Int);
                SqlParameter sqlUserIdentifier = new SqlParameter("@ChatUserIdentifier", SqlDbType.UniqueIdentifier);
                SqlParameter sqlChatUserName = new SqlParameter("@ChatUserName", SqlDbType.NVarChar,100);
                SqlParameter sqlUserStatus = new SqlParameter("@IdChatUserStatus", SqlDbType.Int);
                SqlParameter sqlLastSeen = new SqlParameter("@LastSeen", SqlDbType.DateTime);
                SqlParameter slqRowCreator = new SqlParameter("@UserName", SqlDbType.NVarChar, 50);

                sqlIdUserLogin.Value = IdLogin;
                sqlUserIdentifier.Value = UserIdentifier;
                sqlChatUserName.Value = ChatUserName;
                sqlUserStatus.Value = IdChatUserStatus;
                sqlLastSeen.Value = LastSeen;
                slqRowCreator.Value = Creator;

                AddParamToCommand(ref command, sqlIdUserLogin, sqlUserIdentifier, sqlChatUserName, sqlUserStatus, sqlLastSeen, slqRowCreator);

                Connection.Open();

                command.ExecuteNonQuery();
                ReturnedValue = Convert.ToInt32(command.Parameters["@ReturnValue"].Value);

                if (ReturnedValue <= 0)
                    throw new ChatSqlException("Invalid Operation in UpdateChatUser DBfile");

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertChatUser");
                return false;
            }
            finally
            {
                Connection.Close();
            }
            return true;
        }

        /*
        * [procINS_RoomSession]
            @IdRoom as int,
            @SessionStartDate as datetime,
            @SessionEndDate as datetime,
            @SessionMessages as ntext,
            @UserName as varchar(50)
        */
        public Boolean InsertChatSession(int IdRoom, DateTime SessionStartDate, DateTime SessionEndDate, String SessionMessages, String Creator)
        {
            try
            {
                if (IdRoom == 0)
                    throw new ChatSqlException("In InsertChatSession IdRoom Is Null or Empty");

                if (SessionStartDate == DateTime.MinValue || SessionStartDate == null)
                    throw new ChatSqlException("In InsertChatSession SessionStartDate Is incorrect or null");

                if (SessionEndDate == DateTime.MaxValue || SessionEndDate == null)
                    throw new ChatSqlException("In InsertChatSession SessionEndDate Is incorrect or null");

                if (String.IsNullOrEmpty(SessionMessages))
                    throw new ChatSqlException("In InsertChatSession SessionMessages Is Null or Empty");

                if (String.IsNullOrEmpty(Creator))
                    throw new ChatSqlException("In InsertChatSession Creator Is Null or Empty");

                SqlCommand command = new SqlCommand("procINS_RoomSession", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlIdRoom = new SqlParameter("@IdRoom", SqlDbType.Int);
                SqlParameter sqlSessionStart = new SqlParameter("@SessionStartDate", SqlDbType.DateTime);
                SqlParameter sqlSessionEnd = new SqlParameter("@SessionEndDate", SqlDbType.DateTime, 100);
                SqlParameter sqlSessionMessages = new SqlParameter("@SessionMessages", SqlDbType.NText);
                SqlParameter slqRowCreator = new SqlParameter("@UserName", SqlDbType.NVarChar, 50);

                sqlIdRoom.Value = IdRoom;
                sqlSessionStart.Value = SessionStartDate;
                sqlSessionEnd.Value = SessionEndDate;
                sqlSessionMessages.Value = SessionMessages;
                slqRowCreator.Value = Creator;

                AddParamToCommand(ref command, sqlIdRoom, sqlSessionStart, sqlSessionEnd, sqlSessionMessages, slqRowCreator);

                Connection.Open();

                command.ExecuteNonQuery();
                int ReturnValue = Convert.ToInt32(command.Parameters["@ReturnValue"].Value);

                if (ReturnValue == -1)
                    throw new ChatSqlException("Invalid Operation in UpdateChatUser DBfile");

            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertChatSession");
                return false;
            }
            finally
            {
                Connection.Close();
            }
            return true;
        }
        #endregion

        #region UPDATE
        /*[procUPD_ChatUser]
            @IdUser as int,
            @ChatUserName as nvarchar(50),
            @IdChatUserStatus as nvarchar(50),
         *  @UserName as nvarchar(50)
         */
        public Boolean UpdateChatUser(int IdUser,String ChatUserName,int IdChatUserStatus,DateTime LastSeen,String UserName)
        {
            try
            {
                if (IdUser == 0)
                    throw new ChatSqlException("In UpdateChatUser IdUser Is incorrect");

                if (String.IsNullOrEmpty(ChatUserName))
                    throw new ChatSqlException("In UpdateChatUser ChatUserName Is Null or Empty");

                if (IdChatUserStatus == 0)
                    throw new ChatSqlException("In UpdateChatUser IdChatUserStatus Is incorrect");

                if (String.IsNullOrEmpty(UserName))
                    throw new ChatSqlException("In UpdateChatUser UserName Is Null or Empty");

                Connection.Open();

                SqlCommand command = new SqlCommand("procUPD_ChatUser", Connection);
                command.CommandType = CommandType.StoredProcedure;

                SqlParameter sqlIdUser = new SqlParameter("@IdUser", SqlDbType.Int);
                SqlParameter sqlChatUserName = new SqlParameter("@ChatUserName", SqlDbType.NVarChar, 200);
                SqlParameter sqlIdChatUserStatus = new SqlParameter("@IdChatUserStatus", SqlDbType.Int);
                SqlParameter slqCreater = new SqlParameter("@UserName", SqlDbType.NVarChar, 200);
                SqlParameter sqlLastSeen = new SqlParameter("@LastSeen", SqlDbType.DateTime);

                sqlIdUser.Value = IdUser;
                sqlChatUserName.Value = ChatUserName.Trim();
                sqlIdChatUserStatus.Value = IdChatUserStatus;
                slqCreater.Value = UserName.Trim();
                sqlLastSeen.Value = LastSeen;

                AddParamToCommand(ref command, sqlIdUser, sqlChatUserName, sqlIdChatUserStatus,sqlLastSeen, slqCreater);

                int ReturnValue;
                ReturnValue = command.ExecuteNonQuery();

                if (ReturnValue < 0)
                    throw new ChatSqlException("Invalid Operation in UpdateChatUser DBfile");
            }
            catch (SqlException ex)
            {
                SendErrorEmail.SendError(ex, "InsertNewLogin");
                return false;
            }
            finally
            {
                Connection.Close();
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

        public static String cryptPass(String Pass)
        {
            string SecretWord = ConfigurationManager.AppSettings["SecretWord"];
            String EncryptedPass = EncryptAndDecrypt.Encrypt(Pass, SecretWord);
            

            return EncryptedPass;
        }

        private void AddParamToCommand(ref SqlCommand Commands,params SqlParameter[] Parameter)
         {
             if (Commands == null)
                 throw new ChatSqlException("In AddParamToCommand, Command Is Null");

             SqlParameter sqlOutputParam = new SqlParameter("@ReturnValue",SqlDbType.Int);
             sqlOutputParam.Direction = ParameterDirection.ReturnValue;

             foreach (SqlParameter Param in Parameter)
             {
                 if (Param.Value == null || Convert.IsDBNull(Param.Value))
                     throw new ChatSqlException(String.Format("In AddParamToCommand have incorrect parameter {0}", Param.ParameterName));

                 Commands.Parameters.Add(Param);
             }
             Commands.Parameters.Add(sqlOutputParam);
         }
    }
}