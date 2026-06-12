# 🚀 MediFlow OPD — Deploy Now (3 Options)

## Option 1: One-Click Deploy to Render (Easiest) ★ RECOMMENDED

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/YOUR_USERNAME/mediflow-opd)

**Steps:**
1. Fork this repo to your GitHub account
2. Click the **"Deploy to Render"** button above
3. Render will auto-detect `render.yaml` and deploy everything
4. Your app will be live in ~3 minutes at `https://mediflow-opd.onrender.com`

---

## Option 2: Manual Deploy to Render

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "MediFlow OPD v3.1"
git remote add origin https://github.com/YOUR_USERNAME/mediflow-opd.git
git push -u origin main
```

### Step 2: Create Web Service
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Sign up with GitHub
3. Click **New → Web Service**
4. Connect your `mediflow-opd` repo

### Step 3: Configure
| Setting | Value |
|---------|-------|
| **Name** | mediflow-opd |
| **Environment** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free |

### Step 4: Add Environment Variables
```
NODE_ENV=production
PORT=4000
JWT_SECRET=your-super-secret-key-here
```

### Step 5: Add PostgreSQL Database
1. Click **New → PostgreSQL**
2. Name: `mediflow-db`
3. Instance Type: **Free**
4. Copy the **Internal Database URL**
5. Add as `DATABASE_URL` in your Web Service env vars

### Step 6: Deploy
Click **Deploy Web Service** — wait 2-3 minutes.

---

## Option 3: Deploy Locally (Testing)

```bash
# 1. Install dependencies
npm install

# 2. Set up local PostgreSQL (or use the mock server)
# If you don't have PostgreSQL, the server.js has mock endpoints for testing

# 3. Start the server
npm start

# 4. Open browser
# http://localhost:4000
```

---

## ⚠️ Free Tier Limitations (2026)

| Limit | Details |
|-------|---------|
| **Spin-down** | After 15 min inactivity → 1 min wake-up time |
| **Database** | Expires after 30 days (14-day grace period) |
| **Instance hours** | 750 hours/month |
| **Storage** | 1 GB PostgreSQL |

**Tip:** Use [UptimeRobot](https://uptimerobot.com) (free) to ping your app every 5 minutes to prevent spin-down.

---

## 🔧 Post-Deployment

### Test Your Live App
```bash
# Health check
curl https://mediflow-opd.onrender.com/api/health

# Login
curl -X POST https://mediflow-opd.onrender.com/api/auth/login   -H "Content-Type: application/json"   -d '{"email":"admin@mediflow.local","password":"admin123"}'
```

### Connect Custom Domain
1. In Render Dashboard → Your Service → Settings → Custom Domains
2. Add: `opd.yourhospital.com`
3. Copy CNAME target
4. Add DNS CNAME record with your domain provider
5. Render auto-provisions SSL

---

## 📁 What Gets Deployed

```
mediflow-opd/
├── server.js              # Express server (entry point)
├── package.json           # Dependencies
├── consultations.js       # API routes
├── render.yaml            # Render Blueprint
├── index.html             # Launcher
├── mediflow-login.html    # Auth
├── mediflow-register.html # Patient registration
├── mediflow-dashboard.html # Queue
├── mediflow-consultation-ui.html # Medical + Dental
├── mediflow-billing.html  # Invoice + Receipt
└── ... (all other files)
```

---

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| "Cannot find module" | Run `npm install` locally, commit `package-lock.json` |
| CORS errors | Add `CORS_ORIGIN` env var with your frontend URL |
| Database fails | Check `DATABASE_URL` format |
| 502 Bad Gateway | Ensure `server.js` uses `process.env.PORT` |
| Build fails | Check Node version ≥ 18 in `package.json` engines |

---

## 🎉 Success!

Your MediFlow OPD system is now live and accessible worldwide!

**Next steps:**
- [ ] Set up monitoring (UptimeRobot)
- [ ] Configure backups (Render auto-backs up PostgreSQL)
- [ ] Add team members to Render dashboard
- [ ] Upgrade to paid tier for production use
