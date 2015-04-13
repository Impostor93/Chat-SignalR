using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Chat.Models;

namespace Chat.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            HomeModels model = new HomeModels();

            model.IsAutorized = User.Identity.IsAuthenticated;
            if (model.IsAutorized)
                model.UserIdentifier = Session["UserIdentifier"].ToString();

            return View(model);
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}