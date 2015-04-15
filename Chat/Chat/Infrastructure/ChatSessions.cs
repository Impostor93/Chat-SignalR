using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using Chat.DAL;
using Newtonsoft.Json;

namespace Chat.Infrastructure
{
    public class ChatSessions
    {
        #region Member
            Int32 idRoom;
            Guid roomIdentifier;
            List<Message> roomMessages;
            Dictionary<Guid, List<Message>> unreadMessages;
            DateTime sessionStartDate;
            DateTime sessionEndDate;
        #endregion

        #region Properties
            public Int32 IdRoom
            {
                get { return idRoom; }
                set { idRoom = value; }
            }
            public List<Message> RoomMessages
            {
                get { return roomMessages; }
                set { roomMessages = value; }
            }
            public Dictionary<Guid, List<Message>> UnreadMessages
            {
                get { return unreadMessages; }
                set { unreadMessages = value; }
            }
            public Guid RoomIdentifier
            {
                get { return roomIdentifier; }
                set { roomIdentifier = value; }
            }
            public DateTime SessionStartDate
            {
                get { return sessionStartDate; }
                set { sessionStartDate = value; }
            }
            public DateTime SessionEndDate
            {
                get { return sessionEndDate; }
                set { sessionEndDate = value; }
            }
        #endregion

        #region Constructors

            public ChatSessions()
            {
                roomIdentifier = Guid.Empty;
                roomMessages = new List<Message>();
                unreadMessages = new Dictionary<Guid, List<Message>>();
                SessionStartDate = DateTime.Now;
                SessionEndDate = DateTime.MaxValue;
            }
        
        #endregion

        #region Methods
            public void AddToUnReadMessage(Guid ResiverIdentifier,String Message,ChatUser SenderIdentifier)
            {
                if (ResiverIdentifier == null || ResiverIdentifier == Guid.Empty)
                    throw new ChatException("ResiverIdentifier in AddToUnReadMessage Is NUll or Empty");

                if (SenderIdentifier == null || SenderIdentifier.UserIdentifier == Guid.Empty)
                    throw new ChatException("SenderIdentifier in AddToUnReadMessage is Null or Empty");

                if (String.IsNullOrEmpty(Message))
                    throw new ChatException("Message in AddToUnReadMessage is null or empty");

                if (!unreadMessages.ContainsKey(ResiverIdentifier))
                    unreadMessages.Add(ResiverIdentifier, new List<Message>());

                unreadMessages[ResiverIdentifier].Add(new Message(Message, SenderIdentifier));
            }

            public void AddToGlobalList(String Message, ChatUser Sender)
            {
                if (Sender == null || Sender.UserIdentifier == Guid.Empty)
                    throw new ChatException("SenderIdentifier in AddToGlobalList is Null or Empty");

                if (String.IsNullOrEmpty(Message))
                    throw new ChatException("Message in AddToGlobalList is null or empty");

                roomMessages.Add(new Message(Message, Sender));
            }

            public List<Message> ReadUserMessage(Guid UserIdentifier)
            {
                if (UserIdentifier == null || UserIdentifier == Guid.Empty)
                    throw new ChatException("UserIdentifier is null or empty in ReadUserMessage");

                if (!unreadMessages.ContainsKey(UserIdentifier))
                    throw new ChatException("UserIdentifier is not in list of users in ReadUserMessage");

                List<Message> Messages = new List<Message>(unreadMessages[UserIdentifier]);
                unreadMessages[UserIdentifier].Clear();

                return Messages;
            }

            public Boolean SaveSession()
            {
                try
                {
                    this.SessionEndDate = DateTime.Now;

                    DataBaseFunctions Function = new DataBaseFunctions();
                    if (Function == null)
                        throw new ChatException("Function in SaveSession is null");

                    String SessionMessages = JsonConvert.SerializeObject(this.roomMessages);

                    Function.InsertChatSession(this.IdRoom, this.SessionStartDate, this.SessionEndDate, SessionMessages, "System");
                    
                    this.roomMessages.Clear();
                }
                catch (ChatSqlException Ex)
                {
                    SendErrorEmail.SendError(Ex, "SaveSession");
                    return false;
                }
                return true;
            }

            public ChatSessions GetOldSession(DateTime SessionStartDate)
            {
                try
                {
                    DataBaseFunctions Function = new DataBaseFunctions();
                    if (Function == null)
                        throw new ChatException("Function in GetSession is null");
                    
                    return FillSessionData(Function.SelectSession(SessionStartDate, this.IdRoom));
                }
                catch (ChatSqlException Ex)
                {
                    SendErrorEmail.SendError(Ex, "GetSession");
                    return null;
                }
            }

            private ChatSessions FillSessionData(IEnumerable<tblRoomMessageSession> chatSession)
            {
                var oldSession = new ChatSessions();
                if (chatSession.Count() > 0)
                {
                    var firstChatSession = chatSession.First();

                    List<Message> sessionMessages = JsonConvert.DeserializeObject<List<Message>>(firstChatSession.SessionMessages);
                    oldSession.RoomMessages.AddRange(sessionMessages);

                    oldSession.SessionStartDate = firstChatSession.SessionStartDate;
                    oldSession.SessionEndDate = firstChatSession.SessionEndDate;
                    oldSession.IdRoom = this.idRoom;
                    oldSession.RoomIdentifier = this.roomIdentifier;
                }

                return oldSession;
            }

            public Boolean IsEmpty() 
            {
               return roomIdentifier == Guid.Empty &&
                roomMessages == new List<Message>() &&
                unreadMessages == new Dictionary<Guid, List<Message>>() &&
                SessionStartDate == DateTime.Now &&
                SessionEndDate == DateTime.MaxValue;
            }

      #endregion
    }
}