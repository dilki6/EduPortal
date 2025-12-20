# 🚂 Railway Deployment Guide - EduPortal

## 📋 Overview

Deploy EduPortal to Railway.app - a modern cloud platform that provides:
- ✅ **Free $5 credit** monthly (no credit card required initially)
- ✅ **Automatic deployments** from GitHub
- ✅ **Built-in SSL/HTTPS** certificates
- ✅ **Easy scaling** and monitoring
- ✅ **Persistent volumes** for database and AI models

**Estimated cost:** $7-12/month after free credit

---

## 🎯 Quick Deploy (5 Steps)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project"
3. Sign in with GitHub

### Step 2: Push Code to GitHub
```bash
cd c:\Users\USER\Documents\GitHub\EduPortal

# Add all Docker files
git add .

# Commit
git commit -m "Add production Docker implementation"

# Push to GitHub
git push origin dev-railway
```

### Step 3: Deploy to Railway
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **`dilki6/EduPortal`** repository
4. Select **`dev-railway`** branch
5. Click **"Deploy Now"**

### Step 4: Add Persistent Volume
1. In Railway project, click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Volumes"** section
4. Click **"+ New Volume"**
5. Set:
   - **Mount Path**: `/data`
   - **Size**: Leave default (Railway auto-manages)
6. Click **"Add"**

### Step 5: Configure Environment (Optional)
1. Go to **"Variables"** tab
2. Add these for production:
   ```
   ASPNETCORE_ENVIRONMENT=Production
   TZ=America/New_York
   JwtSettings__SecretKey=YourCustomSecretKey123456789ChangeThis
   ```
3. Click **"Deploy"** to restart with new variables

---

## ⏱️ Deployment Timeline

| Phase | Duration | What's Happening |
|-------|----------|------------------|
| Build | 5-8 minutes | Docker image building (3 stages) |
| Deploy | 1-2 minutes | Container starting, services initializing |
| AI Model | 5-10 minutes | Ollama downloading qwen2.5:3b (~2.3GB) |
| **Total** | **15-20 minutes** | First deployment complete |

**Subsequent deployments:** 3-5 minutes (cached builds)

---

## 🌐 Accessing Your Application

### After Deployment:

1. Railway will generate a URL like:
   ```
   https://eduportal-production-xxxx.up.railway.app
   ```

2. Click the URL or find it in:
   - **Settings** → **Networking** → **Public Networking**

3. Your application will be available at:
   - **Frontend**: https://your-app.up.railway.app
   - **API**: https://your-app.up.railway.app/api
   - **Swagger**: https://your-app.up.railway.app/api/swagger
   - **Health**: https://your-app.up.railway.app/api/health

4. Login with default credentials:
   - **Teacher**: teacher / teacher123
   - **Student**: student / student123

---

## 🔧 Railway Configuration Files

Railway automatically detects the `Dockerfile` and uses it for deployment. No additional Railway-specific files are needed!

### What Railway Detects:
- ✅ `Dockerfile` at root
- ✅ Port 80 exposed
- ✅ Health check configured
- ✅ Volume mount at `/data`

### Automatic Configuration:
- **Build**: Uses `Dockerfile` with multi-stage build
- **Port**: Railway assigns external port, forwards to container port 80
- **SSL**: Automatic HTTPS certificate
- **Domain**: Free `.up.railway.app` subdomain
- **Restart**: Automatic on failure

---

## 📊 Monitoring Your Deployment

### Build Logs
1. Click **"Deployments"** tab
2. Click the active deployment
3. View real-time build logs

**What to expect:**
```
Building Frontend (Stage 1/3)...
  → Installing dependencies...
  → Building production bundle...
  
Building Backend (Stage 2/3)...
  → Restoring packages...
  → Publishing Release build...
  
Creating Runtime (Stage 3/3)...
  → Installing Nginx, Supervisor, Ollama...
  → Configuring services...
  
✓ Build successful (1.2GB)
```

### Runtime Logs
1. Click **"Deployments"** tab
2. Click **"View Logs"**

**What to expect:**
```
[INFO] EduPortal All-in-One Container
[INFO] Initializing data directories...
[OK] Data directories ready
[INFO] Starting Ollama service...
[OK] Ollama service started successfully
[INFO] Checking AI model...
[INFO] Downloading Ollama model (qwen2.5:3b - ~2.3GB)...
[INFO] Starting all services...
```

### Health Check
```bash
curl https://your-app.up.railway.app/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-12-20T10:30:00Z",
  "version": "1.0",
  "services": {
    "api": "running",
    "database": "connected"
  }
}
```

---

## 💾 Data Persistence

### Volume Configuration
Railway volume at `/data` contains:
```
/data/
├── db/
│   └── eduportal.db          # SQLite database (persistent)
├── ollama/
│   └── models/
│       └── qwen2.5-3b/       # AI model (~2.3GB, persistent)
└── backups/
    └── eduportal_*.db        # Auto-backups
```

### Important Notes:
- ✅ Volume survives deployments and restarts
- ✅ Database persists across updates
- ✅ AI model downloads once, reused forever
- ⚠️ Deleting volume = losing all data
- ⚠️ No volume = database recreated on every deploy

---

## 🔐 Security Configuration

### 1. Change Default Credentials
After first login, **immediately change**:
- Navigate to user profile/settings
- Update passwords for teacher and student accounts

### 2. Set Custom JWT Secret
1. In Railway, go to **"Variables"** tab
2. Add:
   ```
   JwtSettings__SecretKey=Your-Super-Secret-Key-Min-32-Chars-123456789
   ```
3. Use a strong random string (minimum 32 characters)
4. Click **"Deploy"** to apply

### 3. Configure CORS (if needed)
If using a custom domain, update CORS origins:

1. Edit `docker-configs/appsettings.Docker.json`
2. Add your domain:
   ```json
   {
     "CorsOrigins": [
       "https://your-custom-domain.com",
       "https://*.up.railway.app",
       "https://*.railway.app"
     ]
   }
   ```
3. Commit and push:
   ```bash
   git add docker-configs/appsettings.Docker.json
   git commit -m "Update CORS for custom domain"
   git push origin dev-railway
   ```

Railway will auto-deploy the changes.

---

## 🚀 Custom Domain (Optional)

### Add Your Own Domain

1. In Railway, click your service
2. Go to **"Settings"** → **"Networking"**
3. Click **"+ Add Domain"**
4. Enter your domain: `eduportal.yourdomain.com`
5. Railway shows DNS records to add

### Add DNS Records at Your Registrar

**Option 1: CNAME (Recommended)**
```
Type: CNAME
Name: eduportal
Value: your-app.up.railway.app
TTL: 3600
```

**Option 2: A Record**
```
Type: A
Name: eduportal
Value: [IP provided by Railway]
TTL: 3600
```

### SSL Certificate
- ✅ Automatic via Let's Encrypt
- ✅ Auto-renewal every 90 days
- ✅ No configuration needed

**Wait 5-10 minutes for DNS propagation**

---

## 💰 Cost Estimation

### Railway Pricing

**Free Tier:**
- $5 free credit per month
- No credit card required initially
- Perfect for testing

**Paid Usage:**
- ~$0.000231 per GB-hour (memory)
- ~$0.000463 per vCPU-hour
- ~$0.25 per GB (storage)

### EduPortal Estimated Costs

**Resources:**
- Memory: 4GB
- CPU: 2 vCPU (shared)
- Storage: 5GB (database + AI model)
- Running: 24/7

**Monthly Cost Breakdown:**
```
Memory:  4GB × 720 hours × $0.000231 = ~$0.67
CPU:     2 vCPU × 720 hours × $0.000463 = ~$0.67
Storage: 5GB × $0.25 = ~$1.25
Network: Minimal (~$0.10)

Total: ~$2.70/month
With overhead: ~$5-7/month
```

**After $5 free credit:** ~$0-2/month out of pocket

### Cost Optimization Tips

1. **Stop during non-use:**
   - Railway → Settings → Sleep on idle
   - Saves CPU/memory costs

2. **Reduce resources:**
   - Settings → Resource limits
   - Lower memory to 2GB if possible

3. **Monitor usage:**
   - Dashboard → Usage tab
   - Set budget alerts

---

## 🔄 Updates and Deployments

### Automatic Deployment

Railway automatically deploys when you push to GitHub:

```bash
# Make changes to your code
git add .
git commit -m "Update feature X"
git push origin dev-railway
```

Railway will:
1. ✅ Detect the push
2. ✅ Build new Docker image
3. ✅ Deploy with zero downtime
4. ✅ Preserve volume data

### Manual Deployment

In Railway dashboard:
1. Click **"Deployments"** tab
2. Click **"Redeploy"** on any previous deployment
3. Or click **"Deploy"** button

### Rollback

1. Click **"Deployments"** tab
2. Find a previous successful deployment
3. Click **"•••"** → **"Redeploy"**
4. Previous version goes live (data persists)

---

## 📊 Monitoring and Logs

### View Real-Time Logs

**Method 1: Railway Dashboard**
1. Click your service
2. Click **"Deployments"** tab
3. Click **"View Logs"**

**Method 2: Railway CLI**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# View logs
railway logs
```

### Monitor Resources

1. Click your service
2. Click **"Metrics"** tab
3. View:
   - CPU usage
   - Memory usage
   - Network traffic
   - Request count

### Set Up Alerts

1. Settings → **"Notifications"**
2. Add webhook or email
3. Configure:
   - Deployment failures
   - High resource usage
   - Crash alerts

---

## 🐛 Troubleshooting

### Build Fails

**Check logs:**
1. Deployments → Click failed deployment
2. Review build logs

**Common issues:**
- **Out of memory**: Increase build timeout in Settings
- **Dependency errors**: Clear build cache and redeploy
- **Dockerfile syntax**: Validate locally first

**Solution:**
```bash
# Test build locally first
docker build -t eduportal:test .

# If successful, push to trigger Railway build
git push origin dev-railway
```

### Application Won't Start

**Check deployment logs:**
```bash
railway logs
```

**Common issues:**
- Missing volume: Add `/data` volume in Settings
- Port conflict: Ensure Dockerfile exposes port 80
- Environment variables: Check Variables tab

**Quick fix:**
1. Settings → Volumes → Add `/data`
2. Redeploy

### Database Not Persisting

**Symptom:** Database resets on every deployment

**Cause:** No volume configured

**Fix:**
1. Settings → Volumes
2. Add volume: Mount Path = `/data`
3. Redeploy

### AI Model Not Working

**Check logs for:**
```
[INFO] Downloading Ollama model...
```

**If stuck:**
1. Volume might be full (check usage)
2. Download timeout (wait 15 minutes)
3. Network issues (redeploy)

**Manual fix via Railway CLI:**
```bash
railway run bash
# Inside container:
ollama pull qwen2.5:3b
```

### High Memory Usage

**Normal usage:** 4-6GB (with AI active)

**If exceeding:**
1. Metrics → Check actual usage
2. Settings → Increase memory limit
3. Or optimize: Use smaller AI model

### Application Slow

**Check:**
1. Metrics → CPU usage (should be <80%)
2. Metrics → Memory (should have headroom)
3. Logs → Look for errors

**Solutions:**
- Increase resources in Settings
- Use Railway's auto-scaling
- Check database queries (add indexes)

### Custom Domain Not Working

**Check:**
1. DNS propagation (can take 24-48 hours)
2. DNS records correct:
   ```bash
   nslookup eduportal.yourdomain.com
   ```
3. Railway shows "Active" status

**Force refresh:**
1. Settings → Networking
2. Remove domain
3. Wait 5 minutes
4. Re-add domain

---

## 🛠️ Advanced Configuration

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `ASPNETCORE_ENVIRONMENT` | Production | Environment mode |
| `ASPNETCORE_URLS` | http://+:5000 | Backend binding |
| `TZ` | UTC | Timezone |
| `ConnectionStrings__DefaultConnection` | /data/db/eduportal.db | Database path |
| `JwtSettings__SecretKey` | (from config) | JWT secret |
| `JwtSettings__ExpiryInMinutes` | 1440 | Token expiry (24h) |
| `Ollama__Url` | http://localhost:11434 | Ollama endpoint |
| `Ollama__Model` | qwen2.5:3b | AI model name |

### Custom Startup Command

If you need to override the startup:

1. Settings → **"Deploy"** section
2. **Start Command**: `/entrypoint.sh`
3. Save and redeploy

### Resource Limits

Settings → **"Resources"**:
```
Memory: 4GB (recommended minimum)
CPU: 2 vCPU shared (sufficient)
```

For heavy usage:
```
Memory: 8GB
CPU: 4 vCPU dedicated
```

### Multiple Environments

**Setup staging environment:**

1. Create new Railway project: "EduPortal Staging"
2. Connect to same GitHub repo
3. Select branch: `dev-railway`
4. Configure separate volume
5. Add environment variable:
   ```
   ASPNETCORE_ENVIRONMENT=Staging
   ```

**Production:**
- Branch: `main`
- Environment: `Production`
- Resource limits: Higher

**Staging:**
- Branch: `dev-railway`
- Environment: `Staging`
- Resource limits: Lower

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Code pushed to GitHub
- [ ] Dockerfile tested locally
- [ ] Environment variables prepared
- [ ] Custom domain DNS ready (if using)

### During Deployment
- [ ] Railway project created
- [ ] GitHub repo connected
- [ ] Branch selected (`dev-railway`)
- [ ] Volume added (`/data`)
- [ ] Environment variables set
- [ ] Build completed successfully

### Post-Deployment
- [ ] Application accessible via Railway URL
- [ ] Health check returns success
- [ ] Login with default credentials works
- [ ] Database persists after restart test
- [ ] AI evaluation feature works
- [ ] Default passwords changed
- [ ] JWT secret updated
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring alerts set up

---

## 🚀 Production Best Practices

### 1. Security
- ✅ Change default credentials immediately
- ✅ Set strong JWT secret (32+ chars)
- ✅ Use environment variables for secrets
- ✅ Enable Railway's built-in security features
- ✅ Regular security updates (redeploy)

### 2. Backups
```bash
# Manual database backup via Railway CLI
railway run bash
cp /data/db/eduportal.db /data/backups/manual-$(date +%Y%m%d).db
exit

# Download backup to local
railway run cat /data/db/eduportal.db > backup.db
```

**Automated backups:**
- Railway volumes are automatically backed up
- Snapshot before major deployments

### 3. Monitoring
- Set up deployment notifications
- Enable resource usage alerts
- Monitor error logs daily
- Track response times

### 4. Scaling
- Start with 4GB RAM, 2 vCPU
- Monitor metrics for 1 week
- Scale up if consistently >80% usage
- Consider horizontal scaling for >1000 users

---

## 🎓 Common Workflows

### First Deployment
```bash
# 1. Commit Docker files
git add .
git commit -m "Production Docker setup"
git push origin dev-railway

# 2. Deploy on Railway (via dashboard)
# 3. Add /data volume
# 4. Wait 15-20 minutes
# 5. Access your app!
```

### Update Application
```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin dev-railway

# Railway auto-deploys
# Wait 3-5 minutes
# Changes live!
```

### Database Backup
```bash
# Via Railway CLI
railway run bash
cp /data/db/eduportal.db /data/backups/backup-$(date +%Y%m%d).db

# Download to local
railway run cat /data/db/eduportal.db > local-backup.db
```

### Rollback Deployment
```bash
# In Railway dashboard:
# Deployments → Previous version → "•••" → Redeploy

# Or via CLI:
railway rollback
```

---

## 📞 Support Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### EduPortal Resources
- [Docker Guide](DOCKER_GUIDE.md)
- [Implementation Details](DOCKER_IMPLEMENTATION.md)
- [Quick Reference](DOCKER_QUICK_REFERENCE.md)

### Getting Help
1. Check deployment logs in Railway
2. Review [Troubleshooting](#troubleshooting) section
3. Test locally with `deploy.bat` / `deploy.sh`
4. Open GitHub issue

---

## ✅ Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors (5-8 minutes)
- ✅ Application starts (check logs for "Services Starting")
- ✅ Health check returns HTTP 200: `curl https://your-app.up.railway.app/api/health`
- ✅ Frontend loads in browser
- ✅ Login works with teacher/teacher123
- ✅ Database persists after restart
- ✅ AI evaluation responds (may take 2-5 seconds)

---

## 🎉 You're Live!

Congratulations! Your EduPortal is now running on Railway with:

- ✅ **Automatic HTTPS** - Secure by default
- ✅ **Auto-deployments** - Push to deploy
- ✅ **Persistent storage** - Data survives updates
- ✅ **Built-in monitoring** - Logs and metrics
- ✅ **Easy scaling** - Adjust resources anytime
- ✅ **99.9% uptime** - Railway's infrastructure

**Your app:** `https://eduportal-production-xxxx.up.railway.app`

**Next steps:**
1. Change default passwords
2. Set custom JWT secret
3. Add custom domain (optional)
4. Share with users!

---

**Need help?** Check [DOCKER_GUIDE.md](DOCKER_GUIDE.md) or [DOCKER_QUICK_REFERENCE.md](DOCKER_QUICK_REFERENCE.md)

**Built with ❤️ for easy Railway deployment**
