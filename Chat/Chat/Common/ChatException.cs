using System;

namespace Chat.Common
{
    internal class ChatException : Exception
    {
        public ChatException(String ExceptionText)
            : base(ExceptionText)
        {
        }
    }
}