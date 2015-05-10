using System;

namespace Chat.Common
{
    internal class ChatSqlException : Exception
    {
        public ChatSqlException(String ExceptionText)
            : base(ExceptionText)
        { }
    }
}