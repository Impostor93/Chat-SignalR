namespace Chat.DAL.Infrastructure.Repository.Contracts
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Linq.Expressions;

    interface IRepository<T> : IDisposable
    {
        void Add(T entity);
        void Delete(Expression<Func<T, bool>> predicate);
        void Update(Func<T, bool> predicate, T entity);
        void Update(Func<T, bool> predicate, Func<T, T> updateAction);
        IEnumerable<T> SelectAll();
        IEnumerable<T> Get(Expression<Func<T, bool>> predicate);
        void Attach(T entity);
        void Save();
    }
}
