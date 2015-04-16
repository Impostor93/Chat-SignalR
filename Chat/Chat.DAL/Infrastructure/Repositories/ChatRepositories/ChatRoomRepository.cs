namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;
    public class ChatRoomRepository : Repository<tblChatRoom>
    {
        public ChatRoomRepository(ChatEntities entity):base(entity){}
        public ChatRoomRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
