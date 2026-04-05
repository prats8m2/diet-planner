# Diet Planner - Deployment Guide

## Overview

This is a custom diet planner app built for Dietitian Pooja Singh. The app allows creating and managing diet plans for clients with full offline support.

**Status:** ✅ Ready to deploy

---

## 🚀 Quick Start (Local Development)

```bash
# Navigate to project directory
cd /Users/prateek.singh/Documents/Practice/diet-planner

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev

# Open in browser
# http://localhost:3000
```

---

## 📱 Deployment Options

### Option 1: Vercel (Recommended - Free & Easiest)

**Pros:**
- Zero cost forever
- Automatic HTTPS
- Custom domain support
- Automatic deployments from Git
- Best PWA support

**Steps:**

1. **Push code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Diet Planner app"
   # Create repo on GitHub first, then:
   git remote add origin https://github.com/YOUR_USERNAME/diet-planner.git
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "Add New Project"
   - Select your `diet-planner` repository
   - Click "Deploy"

3. **Get the URL**
   - Vercel will give you a URL like: `https://diet-planner-xyz.vercel.app`
   - Share this URL with Pooja

4. **Install as PWA on Phone**
   - Open the URL in Safari (iOS) or Chrome (Android)
   - **iOS:** Tap Share → Add to Home Screen
   - **Android:** Tap Menu → Install App / Add to Home Screen

**Cost:** $0/month (Vercel Free Tier)

---

### Option 2: Local Network (If Same WiFi)

**Pros:**
- Completely private
- Works offline immediately
- No internet needed after first load
- No hosting costs

**Cons:**
- Must be on same network
- Your computer needs to be on
- Not accessible outside home

**Steps:**

1. **Find your local IP**
   ```bash
   # On Mac
   ipconfig getifaddr en0

   # Or run the dev server and note the Network URL shown
   npm run dev
   # Will show: Network: http://192.168.x.x:3000
   ```

2. **Share with Pooja**
   - Share the Network URL (e.g., `http://192.168.29.141:3000`)
   - She opens it on her phone (same WiFi)
   - Install as PWA from browser

**Note:** For production use on local network, run `npm run build && npm start` instead of dev mode.

---

### Option 3: Netlify (Free Alternative)

**Steps:**
1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect to GitHub
5. Select repository
6. Deploy settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
   - **Important:** Netlify doesn't support Next.js API routes well, so Vercel is recommended

---

## 🗄️ Database Note

**Important:** This app uses SQLite with **local file storage**.

- In development: Database is in `/data/diet-planner.db`
- On Vercel: Database is **ephemeral** (resets on redeploy)

### For Vercel Deployment:

**Current limitation:** Since Vercel's serverless functions don't persist files, the database resets when you redeploy.

**Solutions:**
1. **For v1 (Current):** Accept that data resets on redeploy. Use export feature to save diet plans as PDFs.
2. **For v2 (Upgrade):** Migrate to Supabase or Turso for persistent cloud database.

**To add persistent storage (v2 upgrade):**
```bash
# Install Supabase client
npm install @supabase/supabase-js

# Update lib/db.ts to use Supabase instead of SQLite
# This would require migration of database schema
```

---

## 📱 Testing on Mobile

1. **From your computer:** Open the dev URL
2. **On your phone:** 
   - Connect to same WiFi
   - Open browser to: `http://YOUR_LOCAL_IP:3000`
   - Or use the Vercel URL after deployment

3. **Install as App:**
   - **iOS Safari:** Share → Add to Home Screen
   - **Android Chrome:** Menu → Install App

4. **Test Offline:**
   - Open the app
   - Turn off WiFi/Data
   - App should still work (PWA)

---

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env.local` file:
```env
# Currently not used, but ready for v2
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Custom Domain (Vercel)

1. Go to Vercel project settings
2. Domains → Add Domain
3. Buy domain or use existing
4. Update DNS records
5. HTTPS is automatic

---

## 📊 Features Implemented

✅ **Core Features:**
- [x] Client management (add, view, edit, delete)
- [x] Weekly diet plan builder
- [x] Meal customization (time, items, portions, calories, notes)
- [x] Client metrics (weight, height, age, blood group, goals, allergies)
- [x] PDF export for diet plans
- [x] Mobile-responsive design
- [x] PWA with offline support
- [x] Meal templates (basic)
- [x] Dark mode support

🔜 **Future v2 Features:**
- [ ] Cloud sync (Supabase)
- [ ] Multi-user support
- [ ] Authentication
- [ ] Advanced nutrition tracking
- [ ] Recipe database integration

---

## 🐛 Troubleshooting

**Issue:** Database errors on Vercel
- **Solution:** This is expected with serverless. Data resets on redeploy. Export PDFs to save work.

**Issue:** PWA not installing
- **Solution:** 
  - Ensure site is served over HTTPS (or localhost)
  - Check browser console for errors
  - Clear site data and try again

**Issue:** Styling broken on mobile
- **Solution:**
  - Clear browser cache
  - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

---

## 📞 Support for Pooja

**Basic Instructions:**

1. **Adding a Client:**
   - Home → Add Client button
   - Enter name and details
   - Click "Add Client"

2. **Creating Diet Plan:**
   - Go to Clients
   - Click on a client
   - Select day of week
   - Click "+" on meal type
   - Enter meal details
   - Save

3. **Exporting PDF:**
   - Open client's diet plan
   - Click "Export" button
   - PDF downloads automatically
   - Share via WhatsApp/Email

4. **Installing App:**
   - Open in Safari (iPhone) or Chrome (Android)
   - Tap Share/Menu
   - "Add to Home Screen" or "Install App"

---

## 🎯 Next Steps

1. **Deploy to Vercel** (recommended for production)
2. **Test with Pooja on her phone**
3. **Gather feedback** for improvements
4. **Plan v2 features** based on usage

---

## 📝 Development Notes

- **Framework:** Next.js 16 with App Router
- **UI Library:** shadcn/ui (Radix UI + Tailwind)
- **Database:** SQLite (better-sqlite3)
- **PDF Generation:** jsPDF
- **PWA:** next-pwa
- **Styling:** Tailwind CSS v4
- **Icons:** Lucide React

---

**Built with ❤️ for Dietitian Pooja Singh**
