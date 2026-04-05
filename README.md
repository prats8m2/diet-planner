# 🥗 Diet Planner

A custom diet planner application built for Dietitian Pooja Singh to create and manage personalized meal plans for clients.

## ✨ Features

- **Client Management** - Add, view, and manage client profiles with metrics
- **Weekly Diet Plans** - Create comprehensive meal plans for each day of the week
- **Customizable Meals** - Track time, food items, portions, calories, and notes
- **PDF Export** - Generate professional PDFs to share with clients
- **Mobile-First Design** - Optimized for mobile devices with touch-friendly interface
- **Offline Support** - Works as a Progressive Web App (PWA) without internet
- **Dark Mode** - Automatic dark mode based on system preference

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## 📱 Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project on [vercel.com](https://vercel.com)
3. Deploy with one click
4. Share URL with Pooja
5. She installs it as an app on her phone

**Cost:** Free forever on Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🏗️ Project Structure

```
diet-planner/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── clients/           # Client pages
│   ├── templates/         # Meal templates
│   └── settings/          # Settings page
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utility functions
│   ├── db.ts             # SQLite database setup
│   └── utils.ts          # Helper functions
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 🛠️ Tech Stack

- **Frontend:** [Next.js 16](https://nextjs.org/) with App Router
- **UI:** [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **Database:** SQLite with better-sqlite3
- **PDF:** jsPDF
- **PWA:** next-pwa

## 📖 Usage

### For Pooja:

1. **Add Client:** Home → Add Client → Enter details
2. **Create Plan:** Clients → Select client → Add meals
3. **Export PDF:** Client page → Export button → Share via WhatsApp
4. **Install App:** Open in browser → Add to Home Screen

### Data Storage:

All data is stored locally on the device. For Vercel deployment, note that data resets on redeploy (v1 limitation).

## 🎨 Customization

The app supports customizable fields for both:
- **Client metrics:** Weight, height, age, blood group, dietary restrictions, health conditions, goals, allergies, notes
- **Meal details:** Time, items, portions, calories, protein, carbs, fats, notes

Additional fields can be added via the settings page in future versions.

## 🔮 Future Enhancements (v2)

- Cloud sync with Supabase
- Multi-user support with authentication
- Advanced nutrition tracking
- Recipe database integration
- AI-powered meal suggestions

## 📄 License

This is a personal project built for Dietitian Pooja Singh.

---

**Built with ❤️ using Next.js and shadcn/ui**
