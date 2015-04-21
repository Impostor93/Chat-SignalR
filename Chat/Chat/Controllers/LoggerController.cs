using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Chat.Infrastructure;

namespace Chat.Controllers
{
    public class LoggerController : Controller
    {
        // GET: Logger
        public ActionResult Index()
        {
            try{
                var q = 0;
                var a = 2 / q;
            }catch(Exception ex)
                {
                    ErrorLoger.Log(ex);
            }
            return View();
        }
    }
}