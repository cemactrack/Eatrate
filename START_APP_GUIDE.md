# 🚀 How to Start Your EatRate App

## ✅ Fixed Issues
1. **Port conflict resolved** - Backend now runs on port 3000, Expo on port 8081
2. **Server startup fixed** - Created `start-server.ts` to avoid React Native import errors
3. **Environment variables aligned** - `.env` and `app.json` now match

---

## 📋 Prerequisites
Make sure you have installed dependencies:
```bash
bun install
```

---

## 🎯 Starting the App (2 Terminals Required)

### Terminal 1: Start Backend API Server
```bash
bun run server
```

**Expected output:**
```
[Server] 🚀 Server running on http://localhost:3000
[Server] 📡 tRPC endpoint: http://localhost:3000/api/trpc
[Server] 🏥 Health check: http://localhost:3000/api
```

**Keep this terminal running!**

---

### Terminal 2: Start Expo App
```bash
bun run start
```

Then press `w` to open in web browser, or scan QR code with Expo Go app.

---

## 🧪 Quick Health Check

Once the backend server is running, test it:

```bash
# Test 1: Server health
curl http://localhost:3000/api

# Test 2: tRPC health check  
curl "http://localhost:3000/api/trpc/healthCheck"

# Test 3: Supabase connection
curl http://localhost:3000/api/debug/env

# Test 4: Fetch restaurants
curl http://localhost:3000/api/debug/restaurants
```

---

## 🔧 Troubleshooting

### Issue: "Port 3000 already in use"
**Solution:** Kill the process using port 3000:
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### Issue: "Cannot find module"
**Solution:** Reinstall dependencies:
```bash
bun install
```

### Issue: Data not loading in app
**Checklist:**
1. ✅ Backend server is running on port 3000
2. ✅ Expo app is running on port 8081
3. ✅ No errors in backend terminal
4. ✅ Test `curl http://localhost:3000/api` returns JSON

### Issue: Supabase errors
**Solution:** Verify your Supabase keys are valid:
1. Go to https://app.supabase.com/project/wdfukmxvpvytvxrogqiu/settings/api
2. Copy fresh `anon` and `service_role` keys
3. Update `.env` and `app.json`

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│  Expo App (React Native)                │
│  Port: 8081                             │
│  - UI Components                        │
│  - tRPC Client                          │
└──────────────┬──────────────────────────┘
               │
               │ HTTP Requests
               │ (to localhost:3000/api/trpc)
               ▼
┌─────────────────────────────────────────┐
│  Backend API Server (Hono + tRPC)       │
│  Port: 3000                             │
│  - tRPC Routes                          │
│  - Business Logic                       │
└──────────────┬──────────────────────────┘
               │
               │ Supabase Client
               │
               ▼
┌─────────────────────────────────────────┐
│  Supabase Database                      │
│  - PostgreSQL                           │
│  - Authentication                       │
│  - Real-time subscriptions              │
└─────────────────────────────────────────┘
```

---

## 🎉 Success Indicators

When everything is working correctly, you should see:

1. **Backend Terminal:**
   - Server running messages
   - No error logs
   - Request logs when app makes API calls

2. **Expo Terminal:**
   - Metro bundler running
   - No tRPC connection errors
   - Successful data fetching logs

3. **App UI:**
   - Restaurants loading
   - Posts displaying
   - User data showing
   - No "loading forever" spinners

---

## 📝 Development Workflow

### Daily Startup
1. Open Terminal 1 → `bun run server`
2. Open Terminal 2 → `bun run start`
3. Wait for both to start
4. Open app in browser/device

### Making Changes
- **Backend changes**: Server auto-reloads with `bun run server:dev`
- **Frontend changes**: Expo auto-reloads automatically

### Stopping
- Press `Ctrl+C` in both terminals

---

## 🔍 Debugging Commands

```bash
# Check what's running on ports
netstat -ano | findstr :3000
netstat -ano | findstr :8081

# Test Supabase connection
bun run test:supabase

# Test API endpoints
bun run test:api

# View backend logs
# (Just watch Terminal 1 where server is running)
```

---

**Last Updated:** 2025-10-05  
**Status:** ✅ Ready to use  
**Backend Port:** 3000  
**Frontend Port:** 8081
