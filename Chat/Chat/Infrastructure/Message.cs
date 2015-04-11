using Chat.App_Code;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Newtonsoft.Json;

namespace Chat.App_Code
{
    [JsonObject]
    public class Message
    {
        #region Member

            String messageContent;
            DateTime dateOfSend;
            Guid senderIdentifier;
            String UserName;

        #endregion

        #region Constructor
            public Message()
            { }

           public Message(String MessageContent, ChatUser Sender)
            {
                if (Sender == null)
                    throw new NullReferenceException("Exception in Message constructor,sender is null");

                if (MessageContent == null)
                    throw new NullReferenceException("Exception in Message constructor,MessageContent is null");

                 messageContent = MessageContent;
                 senderIdentifier = Sender.UserIdentifier;
                 UserName = Sender.UserName;
                 dateOfSend = DateTime.Now;
            }
           public Message(String MessageContent, Guid SenderIdentifier)
           {
               if (SenderIdentifier == null || SenderIdentifier == Guid.Empty)
                   throw new NullReferenceException("Exception in Message constructor,sender identifier is null or empty");

               if (MessageContent == null)
                   throw new NullReferenceException("Exception in Message constructor,MessageContent is null");

               messageContent = MessageContent;
               this.senderIdentifier = SenderIdentifier;
               dateOfSend = DateTime.Now;
           }
            
        #endregion

        #region Proparties

            public String MessageContent
            {
                get { return messageContent; }
                set { messageContent = value; }
            }
            public DateTime DateOfSend
            {
                get { return dateOfSend; }
                set { dateOfSend = value; }
            }
            public Guid SenderIdentifier
            {
                get { return senderIdentifier; }
                set { senderIdentifier = value; }
            }
            public String SenderName
            {
                get { return UserName; }
                set { UserName = value; }
            }

        #endregion
    }
}
