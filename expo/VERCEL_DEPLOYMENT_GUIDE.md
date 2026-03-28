# Vercel Deployment Guide for Eatrate

## Issue Fixed
**Error:** `Function Runtimes must have a valid version, for example 'now-php@1.0.0'`

**Cause:** The old `vercel.json` was configured for serverless functions, but this is an Expo web app that needs to be deployed as a static site.

## Changes Made

### 1. Updated `vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install",
  "framework": null,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Added Build Scripts to `package.json`
```json
"scripts": {
  "build": "expo export -p web",
  "build:web": "expo export -p web"
}
```

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)** and sign in
2. **Import your GitHub repository**
3. **Configure the project:**
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Add Environment Variables:**
   Go to Settings → Environment Variables and add:
   ```
   EXPO_PUBLIC_API_URL=https://your-app.vercel.app
   EXPO_PUBLIC_SUPABASE_URL=https://wdfukmxvpvytvxrogqiu.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   EXPO_PUBLIC_PROJECT_ID=xpwqdc41xc47biu2xqpo4
   ```

5. **Deploy!** Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Or deploy to production
vercel --prod
```

## Important Notes

### 1. Update API URL After Deployment
After your first deployment, update the `.env` file:
```env
EXPO_PUBLIC_API_URL=https://your-app-name.vercel.app
```

Then commit and push again to update the production URL.

### 2. Environment Variables
Make sure all environment variables are set in Vercel dashboard:
- `EXPO_PUBLIC_API_URL` - Your Vercel app URL
- `EXPO_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon key
- `EXPO_PUBLIC_PROJECT_ID` - Your project ID

### 3. Build Output
The build command `expo export -p web` will:
- Bundle your React Native Web app
- Output to the `dist` directory
- Create optimized static files for production

### 4. Routing
The rewrite rule in `vercel.json` ensures that:
- All routes are handled by your Expo Router
- Deep links work correctly
- The app functions as a Single Page Application (SPA)

## Troubleshooting

### Build Fails with "expo: command not found"
**Solution:** Expo CLI is installed as a dependency. The build command uses `npx expo` which will use the local installation.

### Build Fails with Missing Dependencies
**Solution:** Make sure all dependencies are in `dependencies` (not `devDependencies`) in `package.json`.

### App Shows Blank Page
**Solution:** 
1. Check browser console for errors
2. Verify environment variables are set in Vercel
3. Make sure `EXPO_PUBLIC_API_URL` points to your Vercel URL

### API Calls Failing
**Solution:**
1. Update `EXPO_PUBLIC_API_URL` to your Vercel deployment URL
2. Redeploy after updating environment variables
3. Check that tRPC routes are accessible

## Local Testing Before Deploy

Test the production build locally:

```bash
# Build for web
npm run build

# Serve the dist folder
npx serve dist

# Visit http://localhost:3000
```

## Continuous Deployment

Once set up, Vercel will automatically:
- Deploy on every push to `main` branch
- Create preview deployments for pull requests
- Run the build command and deploy to CDN

## Performance Optimization

For better performance:
1. Enable **Vercel Analytics** in dashboard
2. Use **Vercel Image Optimization** for images
3. Enable **Edge Functions** if needed for API routes

## Custom Domain

To add a custom domain:
1. Go to your project in Vercel dashboard
2. Settings → Domains
3. Add your domain
4. Update DNS records as instructed
5. Update `EXPO_PUBLIC_API_URL` to your custom domain

## Monitoring

Monitor your deployment:
- **Vercel Dashboard** - Build logs, deployment status
- **Vercel Analytics** - Performance metrics
- **Browser DevTools** - Console errors, network requests

## Next Steps

After successful deployment:
1. ✅ Test all features on the deployed URL
2. ✅ Update mobile app to point to production API
3. ✅ Set up custom domain (optional)
4. ✅ Enable analytics and monitoring
5. ✅ Configure CI/CD for automated testing

## Support

If you encounter issues:
- Check [Vercel Documentation](https://vercel.com/docs)
- Check [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- Review build logs in Vercel dashboard
