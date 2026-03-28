# Debug Supabase Connection Issues

## Step 1: Restart the Development Server

Stop your current Expo server and restart it with:
```bash
npx expo start --clear
```

Look for these log messages in the terminal:
```
[Server] Environment check:
[Server] SUPABASE_URL: SET
[Server] SUPABASE_SERVICE_KEY: SET
[Supabase] Initializing Supabase admin client...
[Supabase] Admin client initialized: SUCCESS
```

## Step 2: Check Environment Variables

If you see `NOT SET` for any Supabase variables, verify your `.env` file contains:
```env
SUPABASE_URL=https://wdfukmxvpvytvxrogqiu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZnVrbXh2cHZ5dHZ4cm9ncWl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1ODMyMzYsImV4cCI6MjA3NDUxOTIzNn0.3KFy9y6YbDrD5--IOPLfshpb-tjraPDdkYYQBubONzo
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkZnVrbXh2cHZ5dHZ4cm9ncWl1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODk0MzIzNiwiZXhwIjoyMDc0NTE5MjM2fQ.g3ukpi5v7CJw_eMZJVrY20Tl3FOJ_J4Csx8NH26qj8M
```

## Step 3: Verify Supabase Tables Exist

Go to your Supabase dashboard: https://wdfukmxvpvytvxrogqiu.supabase.co

Check if these tables exist:
- `restaurants`
- `posts`
- `profiles`
- `comments`

### Create Tables if Missing

If tables don't exist, run this SQL in Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  badges TEXT[],
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT,
  city TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  image_url TEXT,
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  price_range TEXT DEFAULT '$',
  opening_hours JSONB,
  tags TEXT[],
  verified BOOLEAN DEFAULT FALSE,
  claimed BOOLEAN DEFAULT FALSE,
  is_open BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  restaurant_id UUID REFERENCES restaurants(id) ON DELETE SET NULL,
  content TEXT,
  images TEXT[],
  type TEXT DEFAULT 'review',
  status TEXT DEFAULT 'published',
  rating_food NUMERIC,
  rating_service NUMERIC,
  rating_ambiance NUMERIC,
  rating_cleanliness NUMERIC,
  rating_overall NUMERIC,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Public restaurants are viewable by everyone" ON restaurants
  FOR SELECT USING (true);

CREATE POLICY "Public posts are viewable by everyone" ON posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public comments are viewable by everyone" ON comments
  FOR SELECT USING (true);
```

## Step 4: Add Sample Data

After creating tables, add some sample data:

```sql
-- Insert a sample restaurant
INSERT INTO restaurants (name, description, cuisine, city, address, rating, image_url, price_range)
VALUES 
  ('Le Gourmet', 'Fine dining French restaurant', 'French', 'Douala', '123 Main St, Douala', 4.5, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800', '$$$'),
  ('Mama''s Kitchen', 'Authentic African cuisine', 'African', 'Yaoundé', '456 Food Ave, Yaoundé', 4.2, 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800', '$$');

-- Note: You'll need to create a user profile first before adding posts
-- This requires signing up through your app or Supabase Auth
```

## Step 5: Test API Endpoints

Once the server is running, test these endpoints in your browser or Postman:

1. **Health Check**: http://localhost:8082/api
2. **Test Restaurants**: http://localhost:8082/api/trpc/restaurants.list
3. **Test Posts**: http://localhost:8082/api/trpc/posts.list

## Step 6: Check App Logs

In your Expo app, open the developer menu and check the logs for:
- `[tRPC]` messages
- Any error messages from the queries
- Network request failures

## Common Issues

### Issue 1: "Failed to load" errors but no console errors
**Cause**: Tables exist but are empty
**Solution**: Add sample data (see Step 4)

### Issue 2: "Database not available" errors
**Cause**: Supabase client not initialized
**Solution**: Check environment variables (Step 2)

### Issue 3: "Failed to fetch" or network errors
**Cause**: Server not running or wrong API URL
**Solution**: 
- Ensure server is running on port 8082
- Check `app.json` has correct API_URL: `http://localhost:8082`
- Restart Expo with `npx expo start --clear`

### Issue 4: Row Level Security blocking reads
**Cause**: RLS policies too restrictive
**Solution**: Temporarily disable RLS for testing:
```sql
ALTER TABLE restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
```

## Verification Checklist

- [ ] Server logs show "Admin client initialized: SUCCESS"
- [ ] All environment variables show "SET"
- [ ] Supabase tables exist
- [ ] Tables have at least some sample data
- [ ] API endpoints return data when accessed directly
- [ ] App shows data or empty states (not error messages)
