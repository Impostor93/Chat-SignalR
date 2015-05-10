using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Web;
using Chat.Common;
using Chat.DAL;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;
using Newtonsoft.Json;

namespace Chat.Infrastructure.ChatObjects.ChatRooms
{
    public class ChatSessions
    {
        private static DataBaseFunctions dataAccessHelper = new DataBaseFunctions();

        public Int32 IdRoom { get; set; }
        public List<Message> RoomMessages { get; private set; }
        public Dictionary<Guid, List<Message>> UnreadMessages { get; private set; }
        public Guid RoomIdentifier { get; set; }
        public DateTime SessionStartDate { get; private set; }
        public DateTime SessionEndDate { get; private set; }

        public ChatSessions()
        {
            RoomIdentifier = Guid.Empty;
            RoomMessages = new List<Message>();
            UnreadMessages = new Dictionary<Guid, List<Message>>();
            SessionStartDate = DateTime.Now;
            SessionEndDate = DateTime.MaxValue;
        }

        public void AddToUnReadMessage(Guid resiverIdentifier, String message, ChatUser senderIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(resiverIdentifier))
                throw new ChatException("ResiverIdentifier in AddToUnReadMessage Is NUll or Empty");

            if (senderIdentifier == null || ChatHelper.IsGuidNullOrEmpty(senderIdentifier.UserIdentifier))
                throw new ChatException("SenderIdentifier in AddToUnReadMessage is Null or Empty");

            if (String.IsNullOrEmpty(message))
                throw new ChatException("Message in AddToUnReadMessage is null or empty");

            if (!UnreadMessages.ContainsKey(resiverIdentifier))
                UnreadMessages.Add(resiverIdentifier, new List<Message>());

            UnreadMessages[resiverIdentifier].Add(new Message(message, senderIdentifier));
        }
        public List<Message> ReadUserMessage(Guid userIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(userIdentifier))
                throw new ChatException("UserIdentifier is null or empty in ReadUserMessage");

            if (!UnreadMessages.ContainsKey(userIdentifier))
                throw new ChatException("UserIdentifier is not in list of users in ReadUserMessage");

            List<Message> messages = new List<Message>(UnreadMessages[userIdentifier]);
            UnreadMessages[userIdentifier].Clear();

            return messages;
        }

        public void AddToMessageList(String message, ChatUser sender)
        {
            if (sender == null || ChatHelper.IsGuidNullOrEmpty(sender.UserIdentifier))
                throw new ChatException("SenderIdentifier in AddToMessageList is Null or Empty");

            if (String.IsNullOrEmpty(message))
                throw new ChatException("Message in AddToGlobalList is null or empty");

            RoomMessages.Add(new Message(message, sender));
        }
        
        public Boolean SaveSession()
        {
            try
            {
                this.SessionEndDate = DateTime.Now;
                var sessionMessages = JsonConvert.SerializeObject(this.RoomMessages);

                dataAccessHelper.InsertChatSession(this.IdRoom, this.SessionStartDate, this.SessionEndDate, sessionMessages, "System");

                this.RoomMessages.Clear();
            }
            catch (ChatSqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "SaveSession");
                return false;
            }
            return true;
        }

        public ChatSessions GetOldSession(DateTime sessionStartDate)
        {
            try
            {
                return FillSessionData(dataAccessHelper.SelectSession(sessionStartDate, IdRoom));
            }
            catch (ChatSqlException Ex)
            {
                SendErrorEmail.SendError(Ex, "GetOldSession");
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
                oldSession.IdRoom = this.IdRoom;
                oldSession.RoomIdentifier = RoomIdentifier;
            }

            return oldSession;
        }

        public Boolean IsEmpty()
        {
            return RoomIdentifier == Guid.Empty &&
             RoomMessages == new List<Message>() &&
             UnreadMessages == new Dictionary<Guid, List<Message>>() &&
             SessionStartDate == DateTime.Now &&
             SessionEndDate == DateTime.MaxValue;
        }
    }
}