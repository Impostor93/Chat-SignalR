using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using log4net;

namespace Chat.Infrastructure
{
    public static class ErrorLoger
    {
        static ILog logger;
        static ErrorLoger(){
            logger = LogManager.GetLogger("Chat.Infrastructure.ErrorLoger");
        }
        public static void Log(Exception ex)
        {
            logger.Error(ex.Message,ex);
        }
        public static void InitializeLogger(){
            log4net.Config.XmlConfigurator.Configure();
        }
    }
}
