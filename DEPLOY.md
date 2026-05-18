# Master Liquors — Cloudflare Deployment Guide

This project is split into two parts:
- **Frontend** → Cloudflare Pages (React static build)
- **Backend** → Railway / Render / Fly.io (FastAPI + MongoDB)

---

## Step 1: Deploy the Backend

The Python/FastAPI backend cannot run on Cloudflare Workers. Deploy it to one of these free options:

### Option A: Railway (recommended, free tier)
1. Go to https://railway.app and create an account
2. New Project → Deploy from GitHub (or drag the `backend/` folder)
3. Set these environment variables in Railway dashboard:
   ```
   MONGO_URL=mongodb+srv://...    ← from MongoDB Atlas (see Step 2)
   DB_NAME=masterliquors
   JWT_SECRET=<random 64-char string>
   ADMIN_EMAIL=admin@masterliquors.my
   ADMIN_PASSWORD=<your strong password>
   CORS_ORIGINS=https://masterliquors.pages.dev,https://yourdomain.com
   COOKIE_SECURE=true
   WHATSAPP_NUMBER=60123456789
   BANK_NAME=MAYBANK
   BANK_ACCOUNT_NAME=MASTER LIQUORS SDN BHD
   BANK_ACCOUNT_NUMBER=5141-2345-6789
   ```
4. Railway will auto-detect the `Procfile` and deploy. Note your URL (e.g. `https://masterliquors-api.up.railway.app`)

### Option B: Render (free tier)
1. Go to https://render.com → New Web Service
2. Connect GitHub repo, set Root Directory to `backend/`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
5. Add same environment variables as above

---

## Step 2: Set up MongoDB Atlas (free)
1. Go to https://cloud.mongodb.com → Create free M0 cluster
2. Database Access → Add a user with password
3. Network Access → Allow access from anywhere (0.0.0.0/0) for Railway/Render
4. Connect → Drivers → Copy the connection string
5. Replace `<password>` and set as `MONGO_URL` in your backend host

---

## Step 3: Deploy Frontend to Cloudflare Pages

1. Push your code to GitHub (or use Cloudflare's direct upload)
2. Go to https://dash.cloudflare.com → Pages → Create a project
3. Connect your GitHub repo
4. Configure the build:
   - **Root directory**: `frontend`
   - **Build command**: `yarn install && yarn build`
   - **Build output directory**: `build`
5. Add environment variable:
   - `REACT_APP_BACKEND_URL` = your backend URL from Step 1
     (e.g. `https://masterliquors-api.up.railway.app`)
6. Deploy!

> **Note**: The `frontend/public/_redirects` file is already included — it handles React SPA routing on Cloudflare Pages.

---

## Step 4: Custom Domain (optional)
- In Cloudflare Pages → Custom Domains → Add your domain
- Update `CORS_ORIGINS` in your backend to include the new domain

---

## Default Admin Credentials
Set via environment variables. Defaults (change these!):
- Email: `admin@masterliquors.my`
- Password: `Neon@2026`

---

## Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env   # fill in your values
uvicorn server:app --reload --port 8001

# Frontend
cd frontend
yarn install
cp .env.example .env   # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```
