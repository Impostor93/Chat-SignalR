namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;
    public class RoomMessageSessionRepository : Repository<tblRoomMessageSession>
    {
        public RoomMessageSessionRepository(ChatEntities entity):base(entity){}
        public RoomMessageSessionRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
