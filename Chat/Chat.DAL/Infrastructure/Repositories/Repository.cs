namespace Chat.DAL.Infrastructure.Repository
{
    using System;
    using System.Collections.Generic;
    using System.Data.Entity;
    using System.Linq;
    using System.Linq.Expressions;
    using Chat.DAL.Infrastructure.Repository.Contracts;

    public abstract class Repository<T> : IDisposable, IRepository<T> where T : class
    {
        protected DbContext dbContext;
        protected IDbSet<T> dbSet;

        protected Repository(DbContext dbContext)
        {
            this.dbContext = dbContext;
            this.dbSet = this.dbContext.Set<T>();
        }
        protected Repository(DbContext dbContext, bool doLazyLoading)
        {
            this.dbContext = dbContext;
            this.dbContext.Configuration.LazyLoadingEnabled = doLazyLoading;
            this.dbSet = this.dbContext.Set<T>();
        }

        public int GetCount()
        {
            return dbSet.Count();
        }
        public int GetCount(Expression<Func<T, bool>> predicate)
        {
            return dbSet.Count(predicate);
        }

        #region IRepository<T> Members

        public void Add(T entity)
        {
            this.dbSet.Add(entity);
        }

        public void Delete(T entity)
        {
            this.dbSet.Remove(entity);
        }
        public void Delete(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
        {
            this.dbSet.Remove(this.dbSet.First(predicate));
        }

        public void Update(Func<T, bool> predicate, T entity)
        {
            var entityToUpdate = FindObject(predicate);
            entityToUpdate = entity;
        }
        public void Update(Func<T, bool> predicate, Func<T, T> updateAction)
        {
            var entityToUpdate = FindObject(predicate);
            entityToUpdate = updateAction(entityToUpdate);
        }
        private T FindObject(Func<T, bool> predicate)
        {
            var entityToUpdate = this.dbSet.FirstOrDefault(predicate);

            if (entityToUpdate == null)
                throw new InvalidOperationException("Can not find the entity!");

            return entityToUpdate;
        }

        public IEnumerable<T> SelectAll()
        {
            return this.dbSet;
        }
        public IEnumerable<T> SelectAllAndInclude(params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = this.dbSet;
            if (includes != null)
            {
                query = includes.Aggregate(query,
                          (current, include) => current.Include(include));
            }

            return query;
        }
        public IEnumerable<T> SelectAllAndInclude(IEnumerable<Func<T, bool>> wheres, params Expression<Func<T, object>>[] includes)
        {
            IQueryable<T> query = (IQueryable<T>)SelectAllAndInclude(includes);
            if (wheres != null)
            {
                query = wheres.Aggregate(query, (e, where) => e.Where(where).AsQueryable<T>());
            }

            return query;
        }
        public IEnumerable<T> SelectAllAndInclude(Func<T, bool> wheres, params Expression<Func<T, object>>[] includes)
        {
            var whereList = new List<Func<T, bool>>() { wheres };
            return SelectAllAndInclude(whereList, includes);
        }

        public IEnumerable<T> Get(System.Linq.Expressions.Expression<Func<T, bool>> predicate)
        {
            return this.dbSet.Where(predicate);
        }
        public IEnumerable<T> GetAndOrderBy<TKey>(System.Linq.Expressions.Expression<Func<T, bool>> predicate, Expression<Func<T, TKey>> keySelector, bool isDesc)
        {
            if (isDesc)
                return this.dbSet.Where(predicate).OrderByDescending(keySelector);
            else
                return this.dbSet.Where(predicate).OrderBy(keySelector);
                
        }

        public void Attach(T entity)
        {
            this.dbSet.Attach(entity);
        }
        public void Save()
        {
            dbContext.SaveChanges();
        }
        #endregion

        #region IDisposable Members

        private bool disposed = false;

        protected virtual void Dispose(bool disposing)
        {
            if (!this.disposed)
            {
                if (disposing)
                {
                    dbContext.Dispose();
                }
            }
            this.disposed = true;
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        #endregion

    }
}