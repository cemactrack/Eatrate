# Supabase Data Verification Guide

## Quick Diagnostic Checklist

### 1. Server Health Checks

Test these endpoints in your browser or Postman:

```
✅ Health: http://localhost:8083/api/health
✅ Env Check: http://localhost:8083/api/debug/env
✅ Restaurants Debug: http://localhost:8083/api/debug/restaurants
```

**Expected Results:**
- `/api/health` → `{ ok: true }`
- `/api/debug/env` → All values should be `true`
- `/api/debug/restaurants` → `{ success: true, count: 4, sample: [...] }`

### 2. Supabase SQL Verification

Run these queries in your Supabase SQL Editor to verify data:

```sql
-- Check if restaurants table exists and has data
SELECT count(*) as total_restaurants FROM public.restaurants;

-- View sample restaurants
SELECT id, name, city, cuisine, rating 
FROM public.restaurants 
LIMIT 5;

-- Check if posts table has data
SELECT count(*) as total_posts FROM public.posts;

-- View sample posts
SELECT id, text, type, created_at 
FROM public.posts 
LIMIT 5;

-- Check if profiles table has data
SELECT count(*) as total_profiles FROM public.profiles;

-- View sample profiles
SELECT id, display_name, created_at 
FROM public.profiles 
LIMIT 5;
```

### 3. Row Level Security (RLS) Policies

Verify that SELECT policies allow public read access:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('restaurants', 'posts', 'profiles');

-- View existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('restaurants', 'posts', 'profiles');
```

### 4. Create/Fix RLS Policies (if needed)

If the above queries show RLS is blocking reads, run these:

```sql
-- Enable RLS on tables
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public SELECT
CREATE POLICY "restaurants_read_all"
ON public.restaurants
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "posts_read_published"
ON public.posts
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "profiles_read_all"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
```

### 5. Verify Table Schemas

Check that tables have the expected columns:

```sql
-- Restaurants table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'restaurants'
ORDER BY ordinal_position;

-- Posts table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'posts'
ORDER BY ordinal_position;

-- Profiles table schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
```

## Troubleshooting

### Issue: "count: 0" in debug endpoint

**Cause**: Tables are empty
**Solution**: 
1. Check if you've seeded data
2. Run: `bun run create-test-post.ts` to add sample data
3. Or manually insert data via Supabase dashboard

### Issue: "RLS blocking access"

**Cause**: Row Level Security policies too restrictive
**Solution**: Run the RLS policy SQL above

### Issue: "Supabase admin client not configured"

**Cause**: Missing environment variables
**Solution**: 
1. Check `.env` file has `SUPABASE_URL` and `SUPABASE_SERVICE_KEY`
2. Restart server with `--clear` flag
3. Verify with `/api/debug/env` endpoint

### Issue: "Failed to fetch restaurants" in app

**Possible Causes**:
1. Wrong API_URL (check it matches server port)
2. CORS blocking requests
3. Network/firewall issues
4. Server not running

**Solution**:
1. Check console logs for actual error
2. Verify API_URL in `.env` matches server port (8083)
3. Test direct Supabase read: `testDirectSupabaseRead()`
4. If direct read works but tRPC fails → server/CORS issue
5. If direct read fails → Supabase credentials/RLS issue

## Client-Side Diagnostics

In your app, check the console for:

```
[Config] { API_URL: http://localhost:8083, SUPABASE_URL: https://..., HAS_ANON: true }
[tRPC] Final API URL: http://localhost:8083/api/trpc
[Direct Supabase Test] SUCCESS: { count: 4, ... }
```

If you see errors, they'll indicate which layer is failing:
- Config errors → Environment variable issue
- tRPC errors → API server/CORS issue  
- Direct Supabase errors → Supabase credentials/RLS issue

## Quick Fix Commands

```powershell
# Test Supabase connection
bun run full-diagnostic.ts

# Create sample data
bun run create-test-post.ts

# Restart server with clean cache
bunx rork start -p xpwqdc41xc47biu2xqpo4 --clear
```

## Success Criteria

✅ `/api/debug/env` shows all `true`
✅ `/api/debug/restaurants` shows `count > 0`
✅ SQL queries return data
✅ RLS policies allow SELECT
✅ App console shows config loaded
✅ App displays restaurants list
✅ No "Failed to load" errors

---

**Last Updated**: 2025-10-02
**Status**: Ready for verification
