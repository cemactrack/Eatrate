# API Error Fix - "Failed to load restaurants, posts, dishes, users"

## Problem
The home screen was showing errors:
- "Failed to load restaurants"
- "Failed to load posts"  
- "Failed to load dishes"
- "Failed to load users"

## Root Cause
The `EXPO_PUBLIC_API_URL` in `.env` was set to `https://eatrate.vercel.app/` which is either:
1. Not deployed yet
2. Not responding
3. Has CORS issues preventing the local app from accessing it

## Solution Applied

### Changed API URL to Localhost
Updated `.env` file line 3:
```env
# Before
EXPO_PUBLIC_API_URL=https://eatrate.vercel.app/

# After  
EXPO_PUBLIC_API_URL=http://localhost:8082
```

This points the API calls to your local development server where the tRPC backend routes are running.

## How to Apply the Fix

### Option 1: Restart the App (Recommended)
1. **Stop the current server**: Press `Ctrl+C` in the terminal running `bun run start`
2. **Restart the server**: Run `bun run start` again
3. **Reload the app**: Press `r` in the terminal or refresh your browser

### Option 2: Force Reload
If the app is already running:
1. Press `r` in the terminal to reload
2. Or refresh your browser (F5 or Cmd+R)

## Why This Works

The Expo app serves both:
1. **Frontend**: React Native app at `http://localhost:8082`
2. **Backend**: tRPC API routes at `http://localhost:8082/api/trpc`

By pointing `EXPO_PUBLIC_API_URL` to `localhost:8082`, the frontend can access the backend API routes that are running in the same server.

## API Routes Structure

Your app has tRPC backend routes in `/backend/trpc/routes/`:
- `restaurants/` - Restaurant data
- `posts/` - Social posts
- `dishes/` - Dish information
- `users/` - User profiles
- And many more...

These routes are accessible at:
```
http://localhost:8082/api/trpc/restaurants.list
http://localhost:8082/api/trpc/posts.feed
http://localhost:8082/api/trpc/dishes.list
http://localhost:8082/api/trpc/users.list
```

## For Production Deployment

When you're ready to deploy:

1. **Deploy the backend** to Vercel or another hosting service
2. **Update `.env`** with the production URL:
   ```env
   EXPO_PUBLIC_API_URL=https://your-deployed-app.vercel.app
   ```
3. **Rebuild and redeploy** the app

## Alternative: Use Mock Data

If you want to develop without a backend, you can use the mock data system:

1. Check `lib/trpc-mock.ts` for mock data structure
2. Update hooks in `hooks/useQueries.ts` to return mock data when API fails
3. This is useful for UI development when backend isn't ready

## Troubleshooting

### If errors persist after restart:

1. **Check if the server is running**:
   - Look for "Metro waiting on http://localhost:8082" in terminal
   - Visit http://localhost:8082 in browser - you should see the app

2. **Check browser console** (F12):
   - Look for network errors
   - Check if API calls are being made to correct URL

3. **Verify environment variables loaded**:
   - Check terminal logs for "[env] Loading environment variables..."
   - Should show API_URL as http://localhost:8082

4. **Clear cache and restart**:
   ```bash
   # Stop the server (Ctrl+C)
   # Clear Metro bundler cache
   bun run start -- --clear
   ```

## Testing the Fix

After restarting, you should see:
- ✅ Featured restaurants loading
- ✅ Trending posts appearing
- ✅ Trending dishes showing
- ✅ Top foodies list populated
- ✅ No error messages at the top

The home screen should display data instead of errors!
