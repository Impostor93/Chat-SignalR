namespace Chat.DAL.Infrastructure
{
    using System;
    using System.Data.Entity;
    using Chat.DAL.Infrastructure.Repository.Contracts;

    public class EFDbContext : DbContext, IUnitOfWork
    {
        public EFDbContext(string connectionString)
            : base(connectionString) { }

        public override int SaveChanges()
        {
            return base.SaveChanges();
        }
    }
}
