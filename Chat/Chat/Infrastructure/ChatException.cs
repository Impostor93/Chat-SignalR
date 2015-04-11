using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace Chat.App_Code
{
    class ChatException:Exception
    {
        public ChatException(String ExceptionText)
            : base(ExceptionText)
        {

        }
    }
}