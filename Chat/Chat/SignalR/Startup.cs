using System.Web.SessionState;
using Microsoft.Owin;
using Owin;

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