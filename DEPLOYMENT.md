# MarketMind Deployment Guide

## 🚀 Production Deployment on Render

This guide walks you through deploying the complete MarketMind application on Render's free tier.

---

## 📋 Architecture Overview

The application consists of 3 services:

1. **Frontend** (Static Site) - HTML/CSS/JS
2. **Backend API** (Node.js/Express) - REST API + Authentication
3. **AI Service** (Python/Flask) - ML Predictions

---

## 🛠️ Prerequisites

- GitHub account with the project pushed
- Render account (free tier)
- MongoDB Atlas account (free tier)
- Finnhub API key (free)

---

## 📦 Step 1: Prepare Repository

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Update `render.yaml`:**
   ```yaml
   repo: https://github.com/YOUR_USERNAME/marketmind-v2
   ```

---

## 🗄️ Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Create free cluster
3. Create database user
4. Get connection string:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/marketmind
   ```

---

## 🔑 Step 3: Get API Keys

1. **Finnhub API:**
   - Go to [finnhub.io](https://finnhub.io)
   - Sign up for free account
   - Get API key (60 calls/min free)

---

## 🚀 Step 4: Deploy Services

### Service 1: Backend API

1. **Create Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect GitHub repository
   - **Root Directory:** `backend`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

2. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/marketmind
   JWT_SECRET=your_long_random_secret_here
   FINNHUB_API_KEY=your_finnhub_key
   FRONTEND_URL=https://marketmind-frontend.onrender.com
   AI_SERVICE_URL=https://marketmind-ai.onrender.com
   ```

### Service 2: AI Service

1. **Create Web Service:**
   - **Root Directory:** `ai-service`
   - **Environment:** Python
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app`

2. **Environment Variables:**
   ```
   PYTHON_VERSION=3.9.0
   PORT=5001
   FLASK_ENV=production
   ```

### Service 3: Frontend

1. **Create Static Site:**
   - **Root Directory:** `frontend`
   - **Publish Directory:** `.`
   - **Build Command:** (leave empty)

---

## 🧪 Step 5: Test Deployment

### Check Service Health

1. **Backend Health:**
   ```
   https://marketmind-backend.onrender.com/api/health
   ```

2. **AI Service Health:**
   ```
   https://marketmind-ai.onrender.com/health
   ```

3. **Frontend:**
   ```
   https://marketmind-frontend.onrender.com
   ```

### Test Complete Flow

1. **Open Frontend:** Navigate to frontend URL
2. **Test Login:** Use demo credentials (mitesh/123456)
3. **Test Signup:** Create new account
4. **Test Dashboard:** Select stocks, run predictions
5. **Test AI:** Verify AI predictions are working

---

## 🔧 Step 6: Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check `FRONTEND_URL` in backend env vars
   - Verify CORS origins in `server.js`

2. **Database Connection:**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist (0.0.0.0/0)

3. **AI Service Not Responding:**
   - Check `AI_SERVICE_URL` in backend env vars
   - Verify AI service is running

4. **Frontend Not Loading:**
   - Check API URLs in frontend files
   - Verify static site deployment

### Debug Commands

```bash
# Check backend logs
curl https://marketmind-backend.onrender.com/api/health

# Check AI service logs
curl https://marketmind-ai.onrender.com/health

# Test AI prediction
curl -X POST https://marketmind-ai.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"ticker":"TCS"}'
```

---

## 📊 Service URLs (After Deployment)

Replace with your actual URLs:

- **Frontend:** `https://marketmind-frontend.onrender.com`
- **Backend API:** `https://marketmind-backend.onrender.com`
- **AI Service:** `https://marketmind-ai.onrender.com`

---

## 🔐 Security Notes

1. **Environment Variables:**
   - Never commit secrets to git
   - Use Render's environment variables
   - Rotate keys regularly

2. **Database Security:**
   - Use MongoDB Atlas (cloud-based)
   - Enable IP whitelisting
   - Use strong passwords

3. **API Security:**
   - Rate limiting enabled
   - CORS properly configured
   - JWT tokens for authentication

---

## 📈 Performance Optimization

1. **Backend:**
   - Rate limiting (200 req/15min)
   - Efficient error handling
   - Graceful AI service fallback

2. **Frontend:**
   - Static site for fast loading
   - API URL switching (local/production)
   - Minimal console logs in production

3. **AI Service:**
   - Lightweight Flask app
   - Deterministic predictions
   - Fast response times

---

## 🔄 CI/CD Pipeline

Render automatically:
- Deploys on git push
- Runs build commands
- Restarts on failures
- Provides health checks

---

## 💡 Next Steps

1. **Monitor Performance:** Use Render's dashboard
2. **Scale Up:** Upgrade plans as needed
3. **Add Features:** Extend AI models
4. **Optimize:** Cache API responses
5. **Backup:** Regular database backups

---

## 📞 Support

- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://docs.mongodb.com/atlas
- **Finnhub API:** https://finnhub.io/docs/api

---

**🎉 Your MarketMind application is now live on Render!**
