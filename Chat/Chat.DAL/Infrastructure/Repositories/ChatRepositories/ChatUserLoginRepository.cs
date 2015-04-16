namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;

    public class ChatUserLoginRepository : Repository<tblUserLogin>
    {
        public ChatUserLoginRepository(ChatEntities entity):base(entity){}
        public ChatUserLoginRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
