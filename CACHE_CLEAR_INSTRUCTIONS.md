# Clear Cache and Reload Instructions

## The Problem
Your browser and Metro bundler have cached the old Supabase client code. Even after fixing the code, the app is still using the old cached version without the `apikey` header.

## Solution: Complete Cache Clear

### Step 1: Stop Everything
1. In your Expo terminal, press `Ctrl + C`
2. Close the browser tab with your app

### Step 2: Clear Metro Bundler Cache
In your terminal, run:
```powershell
cd C:\Users\Nashbat\OneDrive\Documentos\Eatrate
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
```

### Step 3: Restart Expo with Cache Clear
```powershell
bun start -- --clear
```

Wait for Metro to finish bundling (it will take longer than usual).

### Step 4: Open Browser in Incognito/Private Mode
- **Chrome**: Press `Ctrl + Shift + N`
- **Edge**: Press `Ctrl + Shift + P`
- **Firefox**: Press `Ctrl + Shift + P`

Then navigate to: `http://localhost:8081`

### Step 5: Check Console Logs
In the browser console (F12), you should see:
```
[supabase] Initializing client with URL: https://wdfukmxvpvytvxrogqiu...
[supabase] Key length: 208
[supabase] Adding apikey header to global config
[supabase] Client initialized successfully
```

If you see these logs, the fix is applied!

### Step 6: Try Login Again
Use your credentials: `padebayo236@gmail.com`

## Alternative: Nuclear Option

If the above doesn't work:

```powershell
# Stop Expo (Ctrl+C)

# Clear ALL caches
Remove-Item -Recurse -Force node_modules\.cache -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .expo -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\metro-* -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\haste-map-* -ErrorAction SilentlyContinue

# Reinstall dependencies
bun install

# Start fresh
bun start -- --clear --reset-cache
```

## Why This Happens

Metro bundler caches transformed JavaScript files for faster rebuilds. When you change a file, it should detect the change and rebuild, but sometimes:
1. The cache doesn't invalidate properly
2. Browser caches the bundle
3. Service workers cache assets

The `--clear` flag forces Metro to rebuild everything from scratch.

## Verification

After clearing cache, in the browser console, run:
```javascript
// Check if Supabase client has the header
console.log('Testing Supabase...');
```

You should NOT see "Invalid API key" errors anymore.

---

**Last Resort**: If nothing works, the Supabase keys themselves might actually be invalid. In that case, you'd need to regenerate them from the Supabase dashboard.
