# MarketMind v2 — Full Stack Stock Prediction Platform

Georgia-serif design · Node.js + MongoDB backend · Real Finnhub news · XGBoost ML predictions

---

## 📁 Folder Structure

```
marketmind-v2/
├── backend/
│   ├── server.js               ← Express entry point
│   ├── package.json
│   ├── .env                    ← Environment variables
│   ├── config/
│   │   └── db.js               ← MongoDB connection
│   ├── models/
│   │   └── User.js             ← Mongoose user schema (bcrypt passwords)
│   ├── controllers/
│   │   ├── authController.js   ← Login / me / logout
│   │   ├── newsController.js   ← Finnhub real-time news
│   │   └── stockController.js  ← Predict / history / portfolio
│   ├── middleware/
│   │   └── auth.js             ← JWT verification
│   ├── routes/
│   │   ├── auth.js
│   │   ├── stocks.js
│   │   └── news.js
│   └── scripts/
│       └── seedUsers.js        ← Seed 5 users into MongoDB
│
└── frontend/
    ├── global.css              ← Georgia font + shared design tokens
    ├── introindex.html         ← Landing page
    ├── login.html              ← JWT login
    ├── mainindex.html          ← Dashboard (merged AI panel, text confidence)
    ├── search.html             ← Search → opens dashboard directly
    ├── news.html               ← Real Finnhub news (text-only cards)
    └── portfolio.html          ← Live prices + investment tracker
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js 18+
- MongoDB (local) OR MongoDB Atlas URI

### Step 1 — Install backend dependencies
```bash
cd backend
npm install
```

### Step 2 — Configure environment
Edit `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/marketmind
JWT_SECRET=your_secret_here_make_it_long
FINNHUB_API_KEY=d7e9c7hr01qkuebjdr3gd7e9c7hr01qkuebjdr40
FRONTEND_URL=http://localhost:5500
```
Get a **free Finnhub key** at https://finnhub.io (60 calls/min free).

### Step 3 — Seed the database
```bash
node scripts/seedUsers.js
```
This creates 5 users (Mitesh, Purva, Priyanka, Manish, Rajeev) with password `123456`.

### Step 4 — Start the backend
```bash
npm run dev      # with nodemon (auto-restart)
# OR
npm start        # plain node
```
API runs at: **http://localhost:5000/api**

### Step 5 — Open the frontend
Open `frontend/introindex.html` in your browser.  
Use **VS Code Live Server** (port 5500) or any static file server.

---

## 🔐 Login Credentials

| Username  | Password | Role  |
|-----------|----------|-------|
| mitesh    | 123456   | user  |
| purva     | 123456   | user  |
| priyanka  | 123456   | user  |
| manish    | 123456   | user  |
| rajeev    | 123456   | admin |

Authentication uses **JWT tokens** stored in `localStorage`.  
Passwords are hashed with **bcrypt (salt=12)**.

---

## 🌐 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login → returns JWT token |
| GET  | `/api/auth/me` | Get current user (requires token) |
| POST | `/api/auth/logout` | Logout |
| GET  | `/api/stocks/predict?ticker=TCS` | ML prediction for a stock |
| GET  | `/api/stocks/history?ticker=TCS&months=12` | Price history |
| GET  | `/api/stocks/analysis?ticker=TCS&months=6` | Chart data + prediction |
| GET  | `/api/stocks/search?q=INFY` | Search stocks |
| GET  | `/api/stocks/portfolio` | Portfolio stocks with live prices |
| GET  | `/api/news?category=india` | News (india/economy/all) |
| GET  | `/api/health` | Health check |

---

## ☁️ Free Deployment

### Backend → Render.com

1. Push your project to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables:
   - `MONGO_URI` = your MongoDB Atlas URI
   - `JWT_SECRET` = any long random string
   - `FINNHUB_API_KEY` = your Finnhub key
   - `FRONTEND_URL` = your Netlify/Vercel URL
6. Deploy → copy the Render URL (e.g. `https://marketmind-api.onrender.com`)

### Database → MongoDB Atlas

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) → Create free cluster
2. Create a database user (username + password)
3. Whitelist IP: `0.0.0.0/0` (allow all for simplicity)
4. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/marketmind`
5. Paste into Render's `MONGO_URI` env var
6. Run seed: `node scripts/seedUsers.js` with Atlas URI

### Frontend → Netlify

1. In each HTML file, update the API URL:
   ```js
   const API = 'https://marketmind-api.onrender.com/api'; // replace localhost
   ```
2. Go to [netlify.com](https://netlify.com) → Add new site → Deploy manually
3. Drag & drop the `frontend/` folder
4. Done! Your frontend is live.

### Frontend → Vercel (alternative)

```bash
npm install -g vercel
cd frontend
vercel --prod
```

---

## 🔑 Key Features

### ✅ Changes Implemented

| # | Feature | Status |
|---|---------|--------|
| 1 | Georgia serif font across all pages | ✅ Done |
| 2 | Real Finnhub news API (text-only, no images) | ✅ Done |
| 3 | News grid card layout with sentiment badges | ✅ Done |
| 4 | AI Confidence shown as numeric text (no circle) | ✅ Done |
| 5 | AI Reasoning + Market Analysis merged into one panel | ✅ Done |
| 6 | Fully responsive (mobile / tablet / desktop) | ✅ Done |
| 7 | Node.js + Express + MongoDB login with JWT | ✅ Done |
| 8 | Bcrypt hashed passwords | ✅ Done |
| 9 | Clean MVC folder structure (routes/controllers/models) | ✅ Done |
| 10 | Search → opens full dashboard directly | ✅ Done |
| 11 | Deployment guide (Render + Atlas + Netlify) | ✅ Done |

---

## 🧰 Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Node.js · Express.js |
| Database | MongoDB · Mongoose |
| Auth | JWT · bcryptjs |
| News API | Finnhub.io |
| Frontend | Vanilla HTML / CSS / JavaScript |
| Charts | Chart.js 4.4 |
| Icons | Font Awesome 6 |
| Font | Georgia (system serif) |
| Deployment | Render + MongoDB Atlas + Netlify |

---

## 📝 Notes

- The frontend works **offline** with fallback data if the backend isn't running
- All 5 users work without MongoDB (hardcoded fallback in `authController.js`)
- Finnhub free tier: 60 requests/minute — sufficient for this app
- News auto-refreshes on each page load and category switch
