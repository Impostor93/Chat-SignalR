namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;

    public class ChatUserStatusRepository : Repository<tblChatUserStatus>
    {
        public ChatUserStatusRepository(ChatEntities entity):base(entity){}
        public ChatUserStatusRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
