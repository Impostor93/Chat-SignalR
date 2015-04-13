
namespace Chat.Models
{
    using Chat.Infrastructure;

    public class HomeModels
    {
        public bool IsAutorized { get; set; }
        public string UserIdentifier { get; set; }
        public ChatUser CurrentUser { get; set; }
    }
}