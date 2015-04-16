namespace Chat.DAL.Infrastructure.Repositories.ChatRepositories
{
    using Chat.DAL.Infrastructure.Repository;

    public class RoomUserRepository : Repository<tblRoomUser>
    {
        public RoomUserRepository(ChatEntities entity):base(entity){}
        public RoomUserRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
