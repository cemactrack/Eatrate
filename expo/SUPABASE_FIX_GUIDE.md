# Supabase Data Fetching Fix Guide

## Issues Fixed ✅

### 1. **API URL Mismatch** (CRITICAL)
- **Problem**: `.env` had `http://localhost:8081` but `app.json` had `http://localhost:8083`
- **Fix**: Updated `app.json` to use port `8081` to match `.env`
- **Impact**: Client can now connect to the correct server port

### 2. **Server Not Running** (CRITICAL)
- **Problem**: Backend server wasn't actually starting - just exporting the app
- **Fix**: Added `Bun.serve()` in `server.ts` to start HTTP server on port 8081
- **Impact**: tRPC endpoints are now accessible

### 3. **Missing Server Commands** (HIGH)
- **Problem**: No npm/bun scripts to start the backend
- **Fix**: Added scripts to `package.json`:
  - `bun run server` - Start backend server
  - `bun run server:dev` - Start with auto-reload
  - `bun run test:api` - Test API endpoints
  - `bun run test:supabase` - Test Supabase connection

### 4. **TypeScript Errors** (MEDIUM)
- **Problem**: Missing `@types/bun` causing TypeScript errors
- **Fix**: Added `@types/bun` to devDependencies

## 🚀 How to Start the App

### Step 1: Install Dependencies (if needed)
```bash
bun install
```

### Step 2: Start Backend Server (REQUIRED)
Open a **new terminal** and run:
```bash
bun run server
```

You should see:
```
[Server] 🚀 Server running on http://localhost:8081
[Server] 📡 tRPC endpoint: http://localhost:8081/api/trpc
[Server] 🏥 Health check: http://localhost:8081/api
```

### Step 3: Start Expo App
In a **separate terminal**, run:
```bash
bun run start
```

## 🧪 Testing the Fix

### Test 1: Check Server Health
```bash
curl http://localhost:8081/api
```

Expected response:
```json
{
  "status": "ok",
  "message": "EatRate API is running",
  "endpoints": {...}
}
```

### Test 2: Test tRPC Health Check
```bash
curl "http://localhost:8081/api/trpc/healthCheck"
```

### Test 3: Test Supabase Connection
```bash
bun run test:supabase
```

### Test 4: Check Restaurants Data
```bash
curl http://localhost:8081/api/debug/restaurants
```

## ⚠️ Remaining Issues to Monitor

### 1. **Supabase JWT Timestamps** (POTENTIAL ISSUE)
Your Supabase keys have unusual timestamps (`iat: 1758943236` and `iat: 1758583236`). These appear to be in the future relative to standard Unix timestamps.

**If you still have connection issues:**
1. Go to your Supabase dashboard: https://app.supabase.com/project/wdfukmxvpvytvxrogqiu/settings/api
2. Copy fresh `anon` and `service_role` keys
3. Update both `.env` and `app.json`

### 2. **ANON Key Mismatch**
Lines 5 and 10 in `.env` have different ANON keys:
- Line 5 (client): `...iat:1758943236...`
- Line 10 (server): `...iat:1758583236...`

They should be identical. Use the one from your Supabase dashboard.

## 📝 Environment Variable Checklist

Verify these are set correctly:

**Client-side (.env + app.json):**
- ✅ `EXPO_PUBLIC_API_URL=http://localhost:8081`
- ✅ `EXPO_PUBLIC_SUPABASE_URL=https://wdfukmxvpvytvxrogqiu.supabase.co`
- ⚠️ `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Verify from Supabase dashboard

**Server-side (.env only):**
- ✅ `SUPABASE_URL=https://wdfukmxvpvytvxrogqiu.supabase.co`
- ⚠️ `SUPABASE_ANON_KEY` - Should match client key
- ⚠️ `SUPABASE_SERVICE_KEY` - Verify from Supabase dashboard

## 🔍 Debugging Tips

### If data still doesn't load:

1. **Check server logs** - Look for errors in the terminal running `bun run server`

2. **Check client logs** - Look for tRPC errors in Expo dev tools

3. **Verify environment loading**:
   ```typescript
   // Add to your app temporarily
   console.log('API_URL:', process.env.EXPO_PUBLIC_API_URL);
   console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
   ```

4. **Test direct Supabase connection**:
   ```bash
   bun run test-supabase.ts
   ```

5. **Check network requests** - Open browser DevTools Network tab and look for failed requests to `localhost:8081`

## 🎯 Expected Behavior After Fix

1. Backend server starts on port 8081
2. Expo app connects to backend via tRPC
3. Backend fetches data from Supabase
4. Data flows to your React components via tRPC hooks
5. You see restaurants, posts, and user data in the app

## 📞 Next Steps if Still Broken

If data still doesn't load after following this guide:

1. Share the **server terminal output** (from `bun run server`)
2. Share any **error messages** from Expo dev tools
3. Run `bun run test:supabase` and share the output
4. Check if you can access http://localhost:8081/api in your browser

---

**Last Updated**: 2025-10-05
**Fixed Issues**: API URL mismatch, server not running, missing scripts
**Remaining**: Verify Supabase keys are valid
