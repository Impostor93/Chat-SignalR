using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Optimization;
using System.Web.Routing;
using Chat.Common;
using Chat.Infrastructure;
using Chat.Infrastructure.ChatObjects.ChatUsers;
using Chat.Services;

namespace Chat
{
    public class MvcApplication : System.Web.HttpApplication
    {
        protected void Application_Start()
        {
            AreaRegistration.RegisterAllAreas();
            FilterConfig.RegisterGlobalFilters(GlobalFilters.Filters);
            RouteConfig.RegisterRoutes(RouteTable.Routes);
            BundleConfig.RegisterBundles(BundleTable.Bundles);
            ErrorLoger.InitializeLogger();
        }

        protected void Session_Start(object sender, EventArgs e)
        {
            Session.Timeout = Convert.ToInt32(ConfigurationManager.AppSettings["SessionTimout"]);
        }

        protected void Application_BeginRequest(object sender, EventArgs e)
        {
        }

        protected void Application_AuthenticateRequest(object sender, EventArgs e)
        {
        }

        protected void Application_Error(object sender, EventArgs e)
        {
            ErrorLoger.Log(Context.Error.InnerException);
            System.Web.Security.FormsAuthentication.SignOut();
            //return RedirectToAction("Index", "Home");
        }

        protected void Session_End(object sender, EventArgs e)
        {
            var UserId = new Guid(Session["UserIdentifier"].ToString());

            var user = ChatUserManager.FindUser(UserId);
            user.SaveUserState();
            user.UserStatus.ChangeStatus(TypeStatus.OffLine);
            foreach (var roomIdentifiers in user.UserRooms)
            {
                ChatRoomManager.CloseRoom(roomIdentifiers, user.UserIdentifier);
            }
        }

        protected void Application_End(object sender, EventArgs e)
        {
            Guid UserId = new Guid(Session["UserIdentifier"].ToString());
            ChatUserManager.FindUser(UserId).SaveUserState();
            ChatUserManager.FindUser(UserId).UserStatus.ChangeStatus(TypeStatus.OffLine);
            //FormsAuthentication.SignOut();
        }
    }
}