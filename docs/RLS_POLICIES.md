# Row Level Security (RLS) Policies

## Overview

This document describes the Row Level Security policies implemented in the Smart City B2B Platform to control data access based on user roles and ownership.

## Security Model

### Principle of Least Privilege

Each user can only access data they need for their role:

- **Developers**: Access solutions (all), municipalities (potential clients), integrators (partners)
- **Municipalities**: Access solutions (marketplace), other municipalities (collaboration), integrators (hiring)
- **Integrators**: Access solutions (recommendations), municipalities (clients), other integrators (network)

### Ownership Model

Users have full control over their own data:
- **Create**: Users can create their own profile data
- **Read**: Users can always read their own data + role-based access to others
- **Update**: Users can only update their own data
- **Delete**: Users can only delete their own data

## Helper Functions

### `auth.user_has_role(required_role text)`

Checks if the current user has a specific role.

```sql
SELECT auth.user_has_role('developer');  -- Returns boolean
```

**Performance**: Uses index on `profiles.role` for fast lookups.

### `auth.get_user_role()`

Returns the role of the current user.

```sql
SELECT auth.get_user_role();  -- Returns 'developer', 'municipality', or 'integrator'
```

**Performance**: Uses index on `profiles.id` for fast lookups.

## Table Policies

### profiles

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Public profiles viewable by authenticated | All authenticated users can see profiles for discoverability |
| INSERT | Users can insert own profile | `auth.uid() = id` |
| UPDATE | Users can update own profile | `auth.uid() = id` |
| DELETE | (Inherit from auth.users) | Handled by Supabase Auth |

**Note**: Profiles are intentionally public for platform discoverability. Consider adding a `public_profile` boolean field in future for privacy control.

### smart_solutions

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Role-based solution viewing | Role IN ('developer', 'municipality', 'integrator') |
| INSERT | Developers can insert solutions | `auth.uid() = developer_id` AND role = 'developer' |
| UPDATE | Developers can update own solutions | `auth.uid() = developer_id` |
| DELETE | Developers can delete own solutions | `auth.uid() = developer_id` |

**Rationale**: All platform users need to browse solutions:
- Developers: Browse competitors, find collaboration opportunities
- Municipalities: Find solutions for their needs
- Integrators: Recommend solutions to clients

### municipalities

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Role-based municipality viewing | Own profile OR role IN ('developer', 'municipality', 'integrator') |
| INSERT | Municipality users can insert profile | `auth.uid() = profile_id` AND role = 'municipality' |
| UPDATE | Municipality users can update own | `auth.uid() = profile_id` |
| DELETE | Municipality users can delete own | `auth.uid() = profile_id` |

**Rationale**: Cross-role visibility enables:
- Developers: Find potential clients
- Municipalities: Collaboration and benchmarking
- Integrators: Find service opportunities

### integrators

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Role-based integrator viewing | Own profile OR role IN ('developer', 'municipality', 'integrator') |
| INSERT | Integrator users can insert profile | `auth.uid() = profile_id` AND role = 'integrator' |
| UPDATE | Integrator users can update own | `auth.uid() = profile_id` |
| DELETE | Integrator users can delete own | `auth.uid() = profile_id` |

**Rationale**: Cross-role visibility enables:
- Developers: Find implementation partners
- Municipalities: Hire integrators for projects
- Integrators: Network with peers, subcontracting

### connections

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Users can view their connections | `auth.uid()` IN (initiator_id, recipient_id) |
| INSERT | Users can create connections | `auth.uid() = initiator_id` |
| UPDATE | Recipients can update status | `auth.uid() = recipient_id` |
| DELETE | Users can delete own initiated | `auth.uid() = initiator_id` |

**Rationale**: Users control their own connection requests and can manage received requests.

### projects

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Users can view projects they participate in | Developer OR municipality owner OR assigned integrator |
| INSERT | Developers and municipalities can create | Developer OR municipality role |
| UPDATE | Project participants can update | Developer OR municipality owner OR assigned integrator |
| DELETE | Project participants can delete | Developer OR municipality owner OR assigned integrator |

**Rationale**: All project stakeholders need access to project information and can manage projects they're involved in.

### messages

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Users can view their messages | `auth.uid()` IN (sender_id, recipient_id) |
| INSERT | Users can send messages | `auth.uid() = sender_id` |
| UPDATE | Recipients can update read status | `auth.uid() = recipient_id` |
| DELETE | Users can delete sent messages | `auth.uid() = sender_id` |

**Rationale**: Standard messaging privacy - users see their own conversations and can delete sent messages.

### technology_transfers

| Operation | Policy | Logic |
|-----------|--------|-------|
| SELECT | Project participants can view | Part of the project team |
| INSERT | Project participants can create | Part of the project team |
| UPDATE | Project participants can update | Part of the project team |
| DELETE | Project participants can delete | Part of the project team |

**Rationale**: Technology transfer data is scoped to projects and accessible by all project participants.

## Performance Optimizations

### Indexes

```sql
-- Fast role lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- Fast user ID lookups
CREATE INDEX idx_profiles_id ON profiles(id);
```

### Helper Functions

Instead of repeating role checks in every policy:

```sql
-- ❌ Slow (repeated subqueries)
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'developer'))

-- ✅ Fast (cached function)
USING (auth.user_has_role('developer'))
```

## Security Best Practices

### 1. Always Use Parameterized Queries

```typescript
// ❌ BAD - SQL injection risk
.or(`initiator_id.eq.${userId}`)

// ✅ GOOD - Parameterized
.eq('initiator_id', userId)
```

### 2. Test Policies Thoroughly

```sql
-- Test as different users
SET LOCAL role = 'authenticated';
SET LOCAL request.jwt.claim.sub = '<user-id>';

-- Verify access
SELECT COUNT(*) FROM smart_solutions;
DELETE FROM municipalities WHERE id = '<municipality-id>';
```

### 3. Monitor Policy Performance

```sql
-- Check query plans
EXPLAIN ANALYZE SELECT * FROM smart_solutions;

-- Look for sequential scans - add indexes if found
```

### 4. Audit Policy Changes

- Always test in development first
- Document rationale for policy changes
- Consider impact on existing users
- Have rollback plan ready

## Testing Guide

### Test Scenarios

#### 1. Developer User

```typescript
// Should succeed
const { data: solutions } = await supabase.from('smart_solutions').select('*');
const { data: municipalities } = await supabase.from('municipalities').select('*');
const { data: integrators } = await supabase.from('integrators').select('*');

// Should succeed (own data)
await supabase.from('smart_solutions').insert({ developer_id: myId, ... });
await supabase.from('smart_solutions').update({ ... }).eq('developer_id', myId);
await supabase.from('smart_solutions').delete().eq('developer_id', myId);

// Should fail (other's data)
await supabase.from('smart_solutions').update({ ... }).eq('developer_id', otherId);
```

#### 2. Municipality User

```typescript
// Should succeed
const { data: solutions } = await supabase.from('smart_solutions').select('*');
const { data: municipalities } = await supabase.from('municipalities').select('*');

// Should succeed (own profile)
await supabase.from('municipalities').update({ ... }).eq('profile_id', myId);

// Should fail (other's profile)
await supabase.from('municipalities').update({ ... }).eq('profile_id', otherId);
```

#### 3. Integrator User

```typescript
// Should succeed
const { data: solutions } = await supabase.from('smart_solutions').select('*');
const { data: municipalities } = await supabase.from('municipalities').select('*');

// Should succeed (own profile)
await supabase.from('integrators').update({ ... }).eq('profile_id', myId);

// Should fail (other's profile)
await supabase.from('integrators').update({ ... }).eq('profile_id', otherId);
```

## Migration History

### 20251018195919 - Initial RLS Setup
- Created basic RLS policies
- Overly permissive `USING (true)` for most SELECT policies
- Missing DELETE policies

### 20251119000001 - Improved RLS Policies
- ✅ Replaced `USING (true)` with role-based access
- ✅ Added missing DELETE policies for:
  - municipalities
  - integrators
  - projects
  - messages
  - technology_transfers
- ✅ Added helper functions for performance
- ✅ Added indexes for fast lookups

## Troubleshooting

### Issue: "Row level security policy violation"

**Cause**: User doesn't have permission for the operation.

**Solution**:
1. Check user's role: `SELECT auth.get_user_role()`
2. Verify ownership: Check if user owns the record
3. Review policy logic: Ensure policy covers the use case

### Issue: Slow queries after RLS

**Cause**: Missing indexes or complex policy logic.

**Solution**:
1. Run `EXPLAIN ANALYZE` on the query
2. Add indexes on filtered columns
3. Use helper functions to cache role checks
4. Consider materialized views for complex checks

### Issue: Can't delete own data

**Cause**: Missing or incorrect DELETE policy.

**Solution**:
1. Check if DELETE policy exists: `\d+ table_name` in psql
2. Verify policy logic matches ownership
3. Test with SQL: `DELETE FROM table WHERE id = auth.uid()`

## Future Improvements

### Privacy Controls
- Add `public_profile` boolean to profiles
- Add `visibility` field to solutions (public/private/draft)
- Add data redaction for sensitive fields

### Advanced Policies
- Time-based access (e.g., view archived projects)
- IP-based restrictions
- Rate limiting at database level

### Audit Logging
- Track policy violations
- Log all DELETE operations
- Monitor unusual access patterns

## Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [RLS Performance Best Practices](https://supabase.com/docs/guides/database/postgres/row-level-security#performance)
