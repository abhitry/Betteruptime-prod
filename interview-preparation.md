# Database Administrator Interview Preparation

## Project-Specific Questions

### 1. **Tell me about your BetterUptime project architecture**
**Answer:** BetterUptime is a website monitoring system built with a microservices architecture:
- **Frontend**: Next.js application for user interface
- **API**: Express.js backend handling authentication and CRUD operations
- **Database**: PostgreSQL for persistent data storage
- **Cache/Queue**: Redis for stream processing and caching
- **Workers**: Multiple worker services for website monitoring across regions
- **Pusher**: Service that queues monitoring tasks

The system monitors websites from multiple regions (India, USA) and stores response times and status in PostgreSQL.

### 2. **What is your database schema design?**
**Answer:** The schema consists of 4 main entities:
```sql
- Users: Stores user authentication data
- Websites: Stores website URLs and metadata
- Regions: Defines monitoring regions (India, USA)
- WebsiteTicks: Stores monitoring results (response time, status, timestamps)
```

Key relationships:
- User → Websites (1:N)
- Website → WebsiteTicks (1:N) 
- Region → WebsiteTicks (1:N)

### 3. **How do you handle high-frequency data inserts?**
**Answer:** 
- **Batch Processing**: Workers process multiple websites simultaneously
- **Connection Pooling**: Prisma manages database connections efficiently
- **Indexing**: Proper indexes on frequently queried columns (website_id, region_id, createdAt)
- **Partitioning Strategy**: Could implement time-based partitioning for WebsiteTicks table
- **Redis Streams**: Use Redis for queuing to prevent database overload

### 4. **What's your data retention strategy?**
**Answer:**
- **Backup Strategy**: Daily automated backups using Kubernetes CronJobs
- **Data Archival**: Could implement archiving of old WebsiteTicks data (>90 days)
- **Cleanup Jobs**: Automated cleanup of terminated pods and old data
- **Storage Optimization**: Use appropriate data types and compression

## PostgreSQL Specific Questions

### 5. **What are PostgreSQL ACID properties?**
**Answer:**
- **Atomicity**: Transactions are all-or-nothing
- **Consistency**: Database remains in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes persist even after system failure

### 6. **Explain PostgreSQL indexing strategies**
**Answer:**
- **B-tree**: Default index, good for equality and range queries
- **Hash**: Fast equality lookups
- **GIN**: Good for array and full-text search
- **GiST**: Geometric and custom data types
- **Partial Indexes**: Index only subset of rows
- **Composite Indexes**: Multiple columns

In my project:
```sql
CREATE INDEX idx_website_ticks_website_created 
ON WebsiteTick(website_id, createdAt DESC);
```

### 7. **How do you optimize PostgreSQL performance?**
**Answer:**
- **Query Optimization**: Use EXPLAIN ANALYZE
- **Indexing**: Proper index strategy
- **Connection Pooling**: Limit concurrent connections
- **Vacuum and Analyze**: Regular maintenance
- **Configuration Tuning**: shared_buffers, work_mem, etc.
- **Partitioning**: For large tables
- **Read Replicas**: For read-heavy workloads

### 8. **What are PostgreSQL isolation levels?**
**Answer:**
1. **Read Uncommitted**: Lowest isolation, dirty reads possible
2. **Read Committed**: Default, prevents dirty reads
3. **Repeatable Read**: Prevents non-repeatable reads
4. **Serializable**: Highest isolation, prevents phantom reads

### 9. **Explain PostgreSQL WAL (Write-Ahead Logging)**
**Answer:**
- **Purpose**: Ensures data durability and enables point-in-time recovery
- **Process**: Changes logged before data pages are written
- **Benefits**: Crash recovery, replication, backup consistency
- **Configuration**: wal_level, checkpoint_segments, archive_mode

### 10. **How do you handle PostgreSQL backups?**
**Answer:**
- **pg_dump**: Logical backup for smaller databases
- **pg_basebackup**: Physical backup for larger databases
- **Continuous Archiving**: WAL archiving for point-in-time recovery
- **Automated Backups**: Scheduled backups with retention policies

In my project:
```yaml
# Kubernetes CronJob for daily backups
schedule: "0 2 * * *"  # 2 AM daily
```

## Prisma ORM Questions

### 11. **What are the advantages of using Prisma?**
**Answer:**
- **Type Safety**: Auto-generated TypeScript types
- **Database Agnostic**: Works with multiple databases
- **Migration System**: Version-controlled schema changes
- **Query Builder**: Intuitive API for complex queries
- **Connection Pooling**: Built-in connection management
- **Introspection**: Generate schema from existing database

### 12. **How do Prisma migrations work?**
**Answer:**
- **Schema Definition**: Define schema in `schema.prisma`
- **Migration Generation**: `prisma migrate dev` creates SQL files
- **Version Control**: Migrations are versioned and tracked
- **Deployment**: `prisma migrate deploy` applies migrations
- **Rollback**: Manual rollback using previous migration states

### 13. **Explain Prisma Client generation**
**Answer:**
```typescript
// After running: prisma generate
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Type-safe queries
const websites = await prisma.website.findMany({
  include: {
    ticks: {
      orderBy: { createdAt: 'desc' },
      take: 10
    }
  }
})
```

### 14. **How do you handle database connections in Prisma?**
**Answer:**
- **Connection Pooling**: Prisma manages connection pool automatically
- **Configuration**: Set in DATABASE_URL or prisma schema
- **Best Practices**: Single PrismaClient instance, proper cleanup
- **Monitoring**: Track connection usage and performance

## General Database Questions

### 15. **What is database normalization?**
**Answer:**
- **1NF**: Eliminate repeating groups
- **2NF**: Remove partial dependencies
- **3NF**: Remove transitive dependencies
- **BCNF**: Boyce-Codd Normal Form
- **Benefits**: Reduces redundancy, improves data integrity
- **Trade-offs**: May require more joins, can impact performance

### 16. **Explain CAP Theorem**
**Answer:**
- **Consistency**: All nodes see same data simultaneously
- **Availability**: System remains operational
- **Partition Tolerance**: System continues despite network failures
- **Trade-off**: Can only guarantee 2 out of 3 properties
- **PostgreSQL**: CP system (Consistency + Partition tolerance)

### 17. **What are database transactions?**
**Answer:**
- **Definition**: Group of operations treated as single unit
- **ACID Properties**: Atomicity, Consistency, Isolation, Durability
- **States**: Active, Partially Committed, Committed, Failed, Aborted
- **Concurrency Control**: Locking, timestamps, optimistic/pessimistic

### 18. **Explain different types of database locks**
**Answer:**
- **Shared Lock**: Multiple readers allowed
- **Exclusive Lock**: Single writer, no readers
- **Row-level**: Lock specific rows
- **Table-level**: Lock entire table
- **Deadlock**: Circular wait condition
- **Prevention**: Lock ordering, timeouts

### 19. **What is database replication?**
**Answer:**
- **Master-Slave**: One write node, multiple read nodes
- **Master-Master**: Multiple write nodes
- **Synchronous**: Wait for replica confirmation
- **Asynchronous**: Don't wait for replica
- **Use Cases**: Load distribution, disaster recovery, geographic distribution

### 20. **How do you monitor database performance?**
**Answer:**
- **Metrics**: CPU, memory, disk I/O, connection count
- **Query Performance**: Slow query logs, execution plans
- **Tools**: pg_stat_statements, pgAdmin, monitoring dashboards
- **Alerts**: Set thresholds for critical metrics
- **Regular Reviews**: Analyze trends and optimize

## Redis Questions

### 21. **Why did you choose Redis in your project?**
**Answer:**
- **Stream Processing**: Redis Streams for job queuing
- **Performance**: In-memory storage for fast access
- **Pub/Sub**: Real-time communication between services
- **Data Structures**: Rich data types (streams, lists, sets)
- **Persistence**: Optional durability with RDB/AOF

### 22. **Explain Redis Streams in your project**
**Answer:**
```javascript
// Adding to stream
await client.xAdd('betteruptime:website', '*', {
  url: 'https://example.com',
  id: 'website-123'
});

// Consumer groups for different regions
await client.xReadGroup('india-region', 'worker-1', 
  [{ key: 'betteruptime:website', id: '>' }]
);
```

### 23. **How do you ensure Redis high availability?**
**Answer:**
- **Redis Sentinel**: Automatic failover
- **Redis Cluster**: Horizontal scaling
- **Persistence**: RDB snapshots + AOF logs
- **Monitoring**: Memory usage, connection count
- **Backup Strategy**: Regular data exports

## Kubernetes & DevOps Database Questions

### 24. **How do you manage databases in Kubernetes?**
**Answer:**
- **StatefulSets**: For stateful applications like databases
- **Persistent Volumes**: Durable storage
- **Secrets**: Secure credential management
- **ConfigMaps**: Configuration management
- **Init Containers**: Database initialization
- **Health Checks**: Readiness and liveness probes

### 25. **What's your database backup strategy in production?**
**Answer:**
```yaml
# Automated backup CronJob
apiVersion: batch/v1
kind: CronJob
metadata:
  name: postgres-backup
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: postgres-backup
            image: postgres:15
            command: ["pg_dump", "-h", "postgres", "-U", "postgres", "mydb"]
```

## Performance & Scaling Questions

### 26. **How would you scale your database for 1M+ websites?**
**Answer:**
- **Read Replicas**: Distribute read load
- **Partitioning**: Time-based partitioning for WebsiteTicks
- **Sharding**: Distribute data across multiple databases
- **Caching**: Redis for frequently accessed data
- **Connection Pooling**: PgBouncer for connection management
- **Archival**: Move old data to cheaper storage

### 27. **How do you handle database migrations in production?**
**Answer:**
- **Blue-Green Deployment**: Zero-downtime migrations
- **Backward Compatibility**: Ensure old code works with new schema
- **Rollback Plan**: Always have rollback strategy
- **Testing**: Test migrations on staging environment
- **Monitoring**: Monitor performance during migration
- **Maintenance Windows**: Schedule during low-traffic periods

## Security Questions

### 28. **How do you secure your database?**
**Answer:**
- **Authentication**: Strong passwords, certificate-based auth
- **Authorization**: Role-based access control (RBAC)
- **Encryption**: TLS in transit, encryption at rest
- **Network Security**: VPC, firewall rules, private subnets
- **Secrets Management**: Kubernetes secrets, external secret managers
- **Auditing**: Log all database access and changes
- **Regular Updates**: Keep database software updated

### 29. **Explain your approach to database access control**
**Answer:**
```sql
-- Create roles with specific permissions
CREATE ROLE app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_reader;

CREATE ROLE app_writer;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_writer;

-- Create users and assign roles
CREATE USER api_service WITH PASSWORD 'secure_password';
GRANT app_writer TO api_service;
```

## Troubleshooting Questions

### 30. **How would you troubleshoot slow database queries?**
**Answer:**
1. **Identify Slow Queries**: Enable slow query log
2. **Analyze Execution Plans**: Use EXPLAIN ANALYZE
3. **Check Indexes**: Ensure proper indexing
4. **Review Statistics**: Update table statistics
5. **Monitor Resources**: Check CPU, memory, I/O
6. **Optimize Queries**: Rewrite inefficient queries
7. **Consider Caching**: Add caching layer if needed

### 31. **What would you do if database connections are exhausted?**
**Answer:**
1. **Immediate**: Increase max_connections temporarily
2. **Investigate**: Find queries holding connections
3. **Kill Long-Running**: Terminate problematic queries
4. **Implement Pooling**: Add connection pooler (PgBouncer)
5. **Code Review**: Fix connection leaks in application
6. **Monitor**: Set up connection monitoring and alerts

## Sample Technical Scenarios

### 32. **Your monitoring system shows high database CPU. How do you investigate?**
**Answer:**
1. **Check Active Queries**: `SELECT * FROM pg_stat_activity;`
2. **Identify Expensive Queries**: Use pg_stat_statements
3. **Analyze Query Plans**: EXPLAIN ANALYZE slow queries
4. **Check for Lock Contention**: Monitor pg_locks
5. **Review Recent Changes**: Check recent deployments
6. **Scale Resources**: Consider vertical/horizontal scaling
7. **Optimize**: Add indexes, rewrite queries, partition tables

### 33. **How would you implement real-time monitoring for your database?**
**Answer:**
- **Metrics Collection**: Prometheus + PostgreSQL exporter
- **Visualization**: Grafana dashboards
- **Alerting**: Alert on high CPU, memory, connection count
- **Log Analysis**: Centralized logging with ELK stack
- **Health Checks**: Kubernetes readiness/liveness probes
- **Custom Metrics**: Application-specific monitoring

## Best Practices Summary

### Database Design
- Normalize appropriately (usually 3NF)
- Use appropriate data types
- Implement proper constraints
- Plan for scalability

### Performance
- Index frequently queried columns
- Monitor and optimize slow queries
- Use connection pooling
- Implement caching strategies

### Security
- Use strong authentication
- Implement least privilege access
- Encrypt sensitive data
- Regular security audits

### Operations
- Automated backups with testing
- Version-controlled migrations
- Monitoring and alerting
- Disaster recovery planning

## Questions to Ask the Interviewer

1. What's the current database infrastructure and scale?
2. What are the main performance challenges you're facing?
3. How do you handle database migrations and deployments?
4. What monitoring and alerting tools do you use?
5. What's the disaster recovery strategy?
6. How is the database team structured?
7. What are the upcoming projects or challenges?

---

**Good luck with your interview! Remember to:**
- Relate answers back to your project experience
- Ask clarifying questions
- Discuss trade-offs and alternatives
- Show enthusiasm for database technologies
- Prepare specific examples from your BetterUptime project