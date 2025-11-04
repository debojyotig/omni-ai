# Database Persistence Strategy

**Document**: Database options and architecture decisions for omni-ai conversation persistence
**Last Updated**: 2025-11-04
**Status**: Implemented (Local file + API routes approach)

---

## Current Implementation

### Architecture
```
Browser (React Component)
    ↓ (HTTP)
Next.js Server (API Routes)
    ↓ (Node.js)
LibSQL Client
    ↓ (File I/O)
SQLite Database (.omni-ai/conversations.db)
```

### Files
- **Database Layer**: [lib/storage/conversation-db-store.ts](../lib/storage/conversation-db-store.ts)
- **API Routes**:
  - `app/api/conversations/load/route.ts` - Load all conversations
  - `app/api/conversations/create/route.ts` - Create new conversation
  - `app/api/conversations/message/route.ts` - Add message
  - `app/api/conversations/delete/route.ts` - Delete conversation
  - `app/api/conversations/title/route.ts` - Update title
- **Client Store**: [lib/stores/conversation-store.ts](../lib/stores/conversation-store.ts)

### Pros ✅
- No external dependencies (just LibSQL)
- Database on local machine
- Works immediately with existing setup
- Cross-browser access on same machine
- Separation of concerns (client/server)

### Cons ❌
- **Cross-device NOT supported** (phone/laptop different databases)
- Manual API route boilerplate (5 endpoints)
- Network latency for each operation (3-83ms)
- No cloud backup
- Harder to scale to distributed deployments

### Performance
- Initial load: 83ms (with compilation), 3-6ms (cached)
- Create conversation: 57-67ms
- Add message: Similar to create
- Scope: Single machine only

---

## Alternative Approaches

### 1. **Turso (Cloud-Hosted LibSQL)** ⭐ Best for Production

**What it is**: Official cloud solution by Turso team. Uses libsql:// protocol to connect to remote database.

**Setup**:
```bash
npm install @libsql/client
```

**Usage** (in browser):
```typescript
import { createClient } from '@libsql/client/web'

const db = createClient({
  url: 'libsql://your-db.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
})

// Direct browser access, no API routes needed!
const result = await db.execute('SELECT * FROM conversations')
```

**Pros** ✅
- Works directly in browser (no API routes needed!)
- Cross-device persistence (phone, laptop, tablet)
- Cloud hosted with backups
- Team collaboration support
- Free tier available
- Officially supported by Turso team
- Better for distributed/production deployments

**Cons** ❌
- External dependency (Turso account)
- Network requests required
- Slightly higher latency than local
- Pricing at scale

**Cost**: Free tier up to 3 databases, $25/month for pro tier

**Migration Effort**: Moderate (remove 5 API routes, update store to use web client directly)

**Recommended For**:
- Production deployments
- Multi-device access (phone, laptop, tablet)
- Team collaboration
- Long-term scalability

---

### 2. **Drizzle ORM** (with current setup or Turso)

**What it is**: Lightweight TypeScript ORM that works with LibSQL.

**Setup**:
```bash
npm install drizzle-orm @libsql/client
npm install -D drizzle-kit
```

**Example**:
```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client/web'

const db = drizzle(createClient({
  url: 'libsql://your-db.turso.io',
  authToken: process.env.TURSO_AUTH_TOKEN,
}))

// Type-safe queries
const conversations = await db.select().from(conversationsTable)
```

**Pros** ✅
- Type-safe SQL queries
- Cleaner code than raw SQL
- Works with current setup or Turso
- Zero overhead (minimal abstraction)
- Can use with migrations
- Better error messages

**Cons** ❌
- Learning curve for ORM concepts
- Additional dependency
- Slightly more code generation

**Migration Effort**: Moderate (rewrite database queries, set up schema)

**Recommended For**:
- Larger applications
- Team wanting type safety
- Projects with complex queries
- Long-term maintenance

---

### 3. **Prisma** (Heavy ORM alternative)

**What it is**: Full-featured ORM with code generation, migrations, and admin UI.

**Setup**:
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

**Pros** ✅
- Most mature ORM
- Auto-generated types
- Built-in migrations
- Prisma Studio (UI for database)
- Great developer experience
- Largest community

**Cons** ❌
- Heavier than Drizzle
- Larger bundle size
- More configuration needed
- Over-engineered for simple apps

**Migration Effort**: High (schema definition, migrations, client generation)

**Recommended For**:
- Large enterprise projects
- Teams unfamiliar with SQL
- Projects needing admin UI
- Complex data models

---

### 4. **Self-Hosted LibSQL Server**

**What it is**: Run LibSQL server locally on your machine.

**Setup**:
```bash
# Install libsql-server globally
npm install -g libsql-server

# Start server
libsql-server --db-path conversations.db
```

**Usage**:
```typescript
const db = createClient({
  url: 'http://localhost:8080',
  authToken: 'local-token'
})
```

**Pros** ✅
- Full control
- No vendor lock-in
- Can run on your servers
- Works like Turso but self-hosted

**Cons** ❌
- Additional infrastructure to maintain
- No automatic backups
- Network setup complexity
- Operational burden

**Migration Effort**: Low (similar to current, but over HTTP instead of file)

**Recommended For**:
- Self-hosted deployments
- On-premises requirements
- High data sensitivity

---

### 5. **Better-SQLite3** (Node.js Server Only)

**What it is**: Native Node.js SQLite driver (faster than LibSQL for server-side).

**Setup**:
```bash
npm install better-sqlite3
```

**Usage** (server-side only):
```typescript
import Database from 'better-sqlite3'

const db = new Database('.omni-ai/conversations.db')
const stmt = db.prepare('SELECT * FROM conversations')
const conversations = stmt.all()
```

**Pros** ✅
- Faster than LibSQL for server ops
- Synchronous API (simpler code)
- Zero overhead
- Great for simple CRUD

**Cons** ❌
- Server-side only (no browser access)
- Still needs API routes
- Not a solution, just optimization

**Use Case**: Optimization if keeping current API route approach

---

## Decision Matrix

| Factor | Current (File + API) | Turso | Drizzle | Prisma | Self-Hosted | Better-SQLite3 |
|--------|----------------------|-------|---------|--------|-------------|-----------------|
| **Cross-device** | ❌ No | ✅ Yes | ✅ Yes* | ✅ Yes* | ✅ Yes | ❌ No |
| **Type Safety** | ❌ No | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Partial |
| **Ease of Setup** | ✅ Easy | ✅ Easy | ⚠️ Medium | ❌ Complex | ⚠️ Medium | ✅ Easy |
| **API Routes Needed** | ✅ Yes (5) | ❌ No | ❌ No | ❌ No | ✅ Yes | ✅ Yes |
| **Production Ready** | ⚠️ Local only | ✅ Yes | ✅ Yes | ✅ Yes | ⚠️ Complex | ⚠️ Local only |
| **Cloud Backup** | ❌ No | ✅ Yes | ✅ Yes* | ✅ Yes* | ❌ Manual | ❌ No |
| **Cost** | Free | Free tier | Free | Free | Free | Free |
| **Migration Effort** | - | Moderate | Moderate | High | Low | Low |

*With Turso or other cloud provider

---

## Recommended Upgrade Path

### Phase 1 (Current - ✅ Done)
- **Approach**: Local file + API routes
- **Scope**: Single machine, multi-browser
- **Timeline**: Implement immediately

### Phase 2 (When scaling)
- **Approach**: Migrate to Turso
- **Scope**: Cross-device, team collaboration
- **Changes**:
  1. Sign up for Turso (free tier)
  2. Create database at https://turso.tech
  3. Install Turso client: `npm install @libsql/client`
  4. Remove 5 API routes
  5. Update `conversation-store.ts` to use web client directly
  6. Set TURSO_CONNECTION_URL and TURSO_AUTH_TOKEN env vars

### Phase 3 (Enterprise)
- **Approach**: Add Drizzle ORM + Turso
- **Benefits**: Type safety, migrations, better DX
- **Effort**: ~2 days refactoring

---

## Environment Variables

### Current (Local)
```env
# No env vars needed - uses .omni-ai/conversations.db
```

### Turso (When upgrading)
```env
TURSO_CONNECTION_URL=libsql://your-db-<random>.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

### Self-Hosted LibSQL
```env
LIBSQL_URL=http://localhost:8080
LIBSQL_AUTH_TOKEN=your-token
```

---

## Testing Strategy

### Current Implementation
```bash
# Test locally
npm run dev

# Test cross-browser (same machine)
# Open http://localhost:3000 in:
# - Chrome
# - Firefox
# - Safari
# Verify conversations persist across browsers

# Test performance
# Monitor Network tab in DevTools
# Expected: 3-6ms per operation (cached)
```

### After Turso Migration
```bash
# Test cross-device
# Open on phone and laptop simultaneously
# Create conversation on phone
# Refresh on laptop
# Verify conversation appears
```

---

## Known Limitations (Current Approach)

1. **No cross-device sync** - Phone can't access laptop's database
2. **No real-time collaboration** - Other users see stale data
3. **No backup** - Database lost if .omni-ai/ folder deleted
4. **No authentication** - No user isolation
5. **Not scalable** - Can't run in serverless (Lambda, Vercel, etc.)

---

## Related Documentation

- [Turso Official Docs](https://docs.turso.tech)
- [LibSQL Web Documentation](https://docs.turso.tech/features/libsql-cli#connect-using-libsql-web)
- [Drizzle ORM with LibSQL](https://orm.drizzle.team/docs/get-started-sqlite)
- [Prisma SQLite Guide](https://www.prisma.io/docs/orm/overview/databases/sqlite)

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2025-11-04 | Implement local file + API routes | Simple, works immediately, no external dependencies |
| TBD | Migrate to Turso | When cross-device support needed |
| TBD | Add Drizzle ORM | When codebase grows or type safety becomes priority |

---

## Contact / Questions

If considering a database migration:
1. Check current performance metrics (see logs)
2. Estimate user base and usage patterns
3. Review upgrade path above
4. Plan migration in phases
5. Test thoroughly on staging first

