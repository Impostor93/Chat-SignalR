using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Linq;
using System.Web;

namespace Chat.App_Code
{
    class ChatSqlException:Exception
    {
        public ChatSqlException(String ExceptionText)
            :base(ExceptionText)
        {}
    }
}