using System;
using log4net;

namespace Chat.Services
{
    public static class ErrorLoger
    {
        private static ILog logger;

        static ErrorLoger()
        {
            logger = LogManager.GetLogger("Chat.Infrastructure.ErrorLoger");
        }

        public static void Log(Exception ex)
        {
            logger.Error(ex.Message, ex);
        }

        public static void InitializeLogger()
        {
            log4net.Config.XmlConfigurator.Configure();
        }
    }
}