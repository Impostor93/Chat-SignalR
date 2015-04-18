using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Routing;
using System.Web.SessionState;
using Microsoft.AspNet.SignalR;
using Microsoft.Owin;
using Owin;
using Chat.SignalR;
using Chat.Infrastructure;

[assembly: OwinStartup(typeof(Chat.SignalR.Startup))]
namespace Chat.SignalR
{
    public class Startup : IRequiresSessionState
    {
        public void Configuration(IAppBuilder app)
        {
            app.MapSignalR();
            var startUp = new Chat.Startup();
            startUp.ConfigureAuth(app);
        }
    }
}