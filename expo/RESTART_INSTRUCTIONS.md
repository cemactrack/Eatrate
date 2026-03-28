# How to Restart and Test Your App

## 🔄 Step 1: Restart the Expo Server

The code changes have been applied. Now restart your server:

```powershell
# Stop any running processes first
# Then start fresh:
bunx rork start -p xpwqdc41xc47biu2xqpo4 --clear
```

## 🧪 Step 2: Verify the Fixes

### Check Server Logs

When the server starts, you should see:
```
[Server] Environment check:
[Server] SUPABASE_URL: SET
[Server] SUPABASE_SERVICE_KEY: SET
[Supabase] Initializing Supabase admin client...
[Supabase] Admin client initialized: SUCCESS
```

### Check the App

1. **Restaurants Section**: Should show 4 restaurants ✅
2. **Posts Section**: Will show empty state (no posts yet)
3. **Users Section**: Will show empty state (no users yet)
4. **Dishes Section**: Should show dishes from external API ✅

**No more "Failed to load" errors!** 🎉

## 📱 Step 3: Add Your First Data

### Create Your Account

1. In the app, tap **Sign Up**
2. Enter your email and password
3. Sign up
4. This automatically creates your profile in the database

### Create Your First Post

1. Go to the home screen
2. Tap the **+** button (or create post button)
3. Write something like: "Testing my first post!"
4. Submit

### See Your Data

- Your post will now appear in the feed
- Your profile will show in the users section
- Everything will work perfectly!

## ✅ Expected Behavior

### Before Adding Data
- Restaurants: ✅ Shows 4 restaurants
- Posts: Empty state (no error)
- Users: Empty state (no error)
- Dishes: ✅ Shows dishes

### After Creating Account & Post
- Restaurants: ✅ Shows 4 restaurants
- Posts: ✅ Shows your post(s)
- Users: ✅ Shows your profile
- Dishes: ✅ Shows dishes

## 🐛 If You Still See Errors

1. **Check server logs** for any error messages
2. **Run diagnostic**:
   ```powershell
   bun run full-diagnostic.ts
   ```
3. **Clear app cache**:
   ```powershell
   bunx rork start -p xpwqdc41xc47biu2xqpo4 --clear
   ```

## 📊 Monitor Server Logs

Watch for these messages:
- `[tRPC] getPostFeedProcedure called` - Posts being fetched
- `[tRPC] restaurants.list` - Restaurants being fetched
- `[tRPC] users.list` - Users being fetched

If you see errors, they'll be logged with details.

## 🎯 Success Criteria

✅ Server starts without errors
✅ Restaurants load and display
✅ No "Failed to load" error messages
✅ Empty states show instead of errors
✅ Can sign up successfully
✅ Can create posts successfully
✅ Posts appear in the feed

---

**You're all set!** The app is now properly configured and ready to use. Just restart the server and start using it! 🚀
