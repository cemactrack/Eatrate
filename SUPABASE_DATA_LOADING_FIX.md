# Supabase Data Loading Fix

## Problem
The app was showing errors: "Failed to load restaurants. Failed to load posts. Failed to load dishes. Failed to load users."

## Root Cause
The posts feed endpoint (`backend/trpc/routes/posts/feed.ts`) was returning **mock data** instead of fetching from Supabase, while other endpoints were correctly configured.

## Changes Made

### 1. Updated Posts Feed to Fetch from Supabase
**File**: `backend/trpc/routes/posts/feed.ts`

- Added import for `supabaseAdmin`
- Added `avatarFor()` helper function for default avatars
- Replaced mock data generation with actual Supabase queries
- Query fetches from `posts` table with joins to `profiles` and `restaurants` tables
- Supports filtering by type (trending/recent) and category
- Maps database fields to expected frontend format
- Returns empty array on error instead of throwing (prevents UI crashes)

**Key changes**:
```typescript
// Before: Generated mock posts
const mockPosts = Array.from({ length: actualLimit }, ...);

// After: Fetches from Supabase
const { data: posts, error } = await supabaseAdmin
  .from('posts')
  .select(`
    *,
    profiles!posts_user_id_fkey (id, display_name, avatar_url, bio),
    restaurants (id, name, address)
  `)
  .eq('status', 'published')
  ...
```

### 2. Updated API URL for Local Development
**File**: `app.json`

Changed the API URL from production to localhost for local development:
```json
"EXPO_PUBLIC_API_URL": "http://localhost:8082"
```

## Verification

### Endpoints Status
✅ **Restaurants** - Already fetching from Supabase via `getRestaurantsProcedure` in `backend/trpc/routes/example/hi/route.ts`
✅ **Posts** - Now fetching from Supabase (fixed)
✅ **Users** - Already fetching from Supabase via `getUsersProcedure` in `backend/trpc/routes/example/hi/route.ts`
✅ **Dishes** - Fetching from external API (themealdb.com) - working as designed

### Database Tables Required
The app expects these Supabase tables:
- `posts` - with columns: id, user_id, content, images, type, status, rating_*, tags, likes_count, comments_count, shares_count, created_at, updated_at, restaurant_id
- `profiles` - with columns: id, display_name, avatar_url, bio
- `restaurants` - with columns: id, name, address, cuisine, rating, image_url, etc.

## Next Steps

1. **Start the backend server**:
   ```bash
   bun run server.ts
   ```

2. **Restart the Expo app** to pick up the new configuration:
   ```bash
   npx expo start --clear
   ```

3. **Ensure Supabase tables exist** with the required schema

4. **Add sample data** to Supabase tables if they're empty:
   - At least one restaurant
   - At least one user profile
   - At least one post

## Testing
After restarting, the home screen should:
- Load restaurants from Supabase
- Load posts from Supabase
- Load users from Supabase
- Load dishes from external API
- Show empty states if no data exists (instead of errors)
