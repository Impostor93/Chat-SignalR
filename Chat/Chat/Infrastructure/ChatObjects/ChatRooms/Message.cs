using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using Chat.Common;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;
using Newtonsoft.Json;

namespace Chat.Infrastructure.ChatObjects.ChatRooms
{
    [JsonObject]
    public class Message
    {

        public Message()
        { }

        public Message(String messageContent, ChatUser sender)
        {
            if (sender == null)
                throw new NullReferenceException("Exception in Message constructor,sender is null");

            if (messageContent == null)
                throw new NullReferenceException("Exception in Message constructor,MessageContent is null");

            MessageContent = messageContent;
            SenderIdentifier = sender.UserIdentifier;
            UserName = sender.UserName;
            DateOfSend = DateTime.Now;
            CurrentSendreStatus = sender.UserStatus;
        }

        public Message(String messageContent, Guid senderIdentifier)
        {
            if (ChatHelper.IsGuidNullOrEmpty(senderIdentifier))
                throw new NullReferenceException("Exception in Message constructor,sender identifier is null or empty");

            if (messageContent == null)
                throw new NullReferenceException("Exception in Message constructor,MessageContent is null");

            MessageContent = messageContent;
            SenderIdentifier = senderIdentifier;
            DateOfSend = DateTime.Now;
        }

        public String MessageContent{get; set;}

        public DateTime DateOfSend{get;  set;}

        public Guid SenderIdentifier{get; set;}

        public String SenderName{get; set;}

        public ChatStatus CurrentSendreStatus { get; set; }

        public string UserName { get;  set; }

    }
}