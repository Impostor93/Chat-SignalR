using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Net.Mail;
using System.Text;

namespace Chat.Infrastructure
{
    class SendErrorEmail
    {
        public static void SendError(Exception Ex, String MethodName)
        {
            try
            {
            #if(debug)
                MailAddress To = new MailAddress("crow_3@abv.bg");
                MailAddress From = new MailAddress("NoReplay@gmail.bg");
                MailMessage Massage = new MailMessage(From, To);

                Massage.Subject = "Error Report";
                Massage.Body = String.Format("{0}\n\n{1}\n\n\n{2}", MethodName, Ex.Message, Ex.StackTrace);

                SmtpClient SmtpServer = new SmtpClient();
                SmtpServer.Credentials = new System.Net.NetworkCredential
                    (ConfigurationManager.AppSettings["MAILGUN_SMTP_LOGIN"], ConfigurationManager.AppSettings["MAILGUN_SMTP_PASSWORD"]);

                SmtpServer.Port = Convert.ToInt32(ConfigurationManager.AppSettings["MAILGUN_SMTP_PORT"]);
                SmtpServer.Host = ConfigurationManager.AppSettings["MAILGUN_SMTP_SERVER"];

                SmtpServer.EnableSsl = true;
                //SmtpServer.Send(Massage);
            #endif
                ErrorLoger.Log(Ex);
            }
            catch (SmtpException ex)
            {
                //WriteErrorOnServer(ex);
                return;
            }
            catch (Exception ex)
            {
                //WriteErrorOnServer(ex);
                return;
            }


        }
        public static void SendError(String Error, String MethodName)
        {
            try
            {
        #if(debug)
                MailAddress To = new MailAddress("crow_3@abv.bg");
                MailAddress From = new MailAddress("NoReplay@gmail.bg");
                MailMessage Massage = new MailMessage(From, To);

                Massage.Subject = "Error Report";
                Massage.Body = String.Format("{0}\n\n{1}", MethodName, Error);

                SmtpClient SmtpServer = new SmtpClient();
                SmtpServer.Credentials = new System.Net.NetworkCredential
                    (ConfigurationManager.AppSettings["MAILGUN_SMTP_LOGIN"], ConfigurationManager.AppSettings["MAILGUN_SMTP_PASSWORD"]);

                SmtpServer.Port = Convert.ToInt32(ConfigurationManager.AppSettings["MAILGUN_SMTP_PORT"]);
                SmtpServer.Host = ConfigurationManager.AppSettings["MAILGUN_SMTP_SERVER"];

                SmtpServer.EnableSsl = true;
                SmtpServer.Send(Massage);
        #endif
                WriteErrorOnServer(new Exception(Error));
            }
            catch (SmtpException ex)
            {
                //WriteErrorOnServer(ex);
                return;
            }
            catch (Exception ex)
            {
                //WriteErrorOnServer(ex);
                return;
            }
        }

        public static void WriteErrorOnServer(Exception ex)
        {
            String path = Path.Combine(@"C:\Errors\", String.Format("{0} - {1}a.{2}", "ErrorOnSendingMail", DateTime.Now.ToString().Replace('.', ' ').Replace(':', '-'), "txt"));
            var content = new List<string>(){ String.Format("{0}\n\n\n{1}", ex.Message, ex.StackTrace) };
            for (var error = ex.InnerException; error != null; error = error.InnerException )
            {
                content.Add(String.Format("{0}\n\n\n{1}", error.Message, error.StackTrace));
            }

                File.WriteAllLines(path, content);
        }
    }
}
