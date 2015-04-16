namespace Chat.DAL.Infrastructure.Repositories.AuthenticationRepositories
{
    using Chat.DAL.Infrastructure.Repository;
    public class AspLoginRepository : Repository<AspNetUser>
    {
        public AspLoginRepository(ChatEntities entity) : base(entity) { }
        public AspLoginRepository(ChatEntities entity, bool doLazyLoading) : base(entity, doLazyLoading) { }
    }
}
