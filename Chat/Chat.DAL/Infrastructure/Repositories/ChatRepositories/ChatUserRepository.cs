namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;
    public  class ChatUserRepository : Repository<tblChatUser>
    {
        public ChatUserRepository(ChatEntities entity):base(entity){}
        public ChatUserRepository(ChatEntities entity, bool doLazyLoading) : base(entity,doLazyLoading){}
    }
}
