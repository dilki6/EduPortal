# 🚀 Deploy to Railway Using Container Registry

## Option 1: Docker Hub (Recommended - Easiest)

### Step 1: Build and Tag Your Image Locally

```bash
cd c:\Users\USER\Documents\GitHub\EduPortal

# Build the image
docker build -t eduportal:latest .

# Tag for Docker Hub (replace 'yourusername' with your Docker Hub username)
docker tag eduportal:latest yourusername/eduportal:latest
```

### Step 2: Login and Push to Docker Hub

```bash
# Login to Docker Hub
docker login

# Push the image
docker push yourusername/eduportal:latest
```

### Step 3: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from Docker Image"**
4. Enter: `yourusername/eduportal:latest`
5. Click **"Deploy"**

### Step 4: Add Volume

1. Click on your service
2. Go to **Settings** → **Volumes**
3. Click **"+ New Volume"**
4. Set **Mount Path**: `/data`
5. Click **"Add"**

### Step 5: Configure Port (If Needed)

Railway should auto-detect port 80, but if not:
1. Go to **Settings** → **Networking**
2. Set **Port**: `80`

---

## Option 2: GitHub Container Registry (GHCR)

### Step 1: Create GitHub Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **"Generate new token"**
3. Select scopes: `write:packages`, `read:packages`, `delete:packages`
4. Copy the token

### Step 2: Login to GHCR

```bash
# Login to GitHub Container Registry
echo YOUR_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin
```

### Step 3: Build and Push

```bash
cd c:\Users\USER\Documents\GitHub\EduPortal

# Build and tag for GHCR
docker build -t ghcr.io/dilki6/eduportal:latest .

# Push to GHCR
docker push ghcr.io/dilki6/eduportal:latest
```

### Step 4: Make Package Public (Important!)

1. Go to GitHub → Your profile → Packages
2. Find `eduportal` package
3. Click **Package settings**
4. Scroll to **Danger Zone**
5. Click **"Change visibility"** → **"Public"**

### Step 5: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from Docker Image"**
4. Enter: `ghcr.io/dilki6/eduportal:latest`
5. Click **"Deploy"**

### Step 6: Add Volume

1. Settings → Volumes → **"+ New Volume"**
2. Mount Path: `/data`

---

## Option 3: Railway from GitHub (Auto-build)

If you prefer Railway to build from your Dockerfile:

### Step 1: Push to GitHub

```bash
cd c:\Users\USER\Documents\GitHub\EduPortal

git add .
git commit -m "Production Docker setup"
git push origin dev-railway
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `dilki6/EduPortal`
5. Select branch: `dev-railway`
6. Railway will auto-detect Dockerfile and build

### Step 3: Add Volume

1. Settings → Volumes → Mount Path: `/data`

---

## 🎯 Quick Start Commands

### For Docker Hub:

```powershell
# 1. Build
cd c:\Users\USER\Documents\GitHub\EduPortal
docker build -t eduportal:latest .

# 2. Tag (replace 'yourusername')
docker tag eduportal:latest yourusername/eduportal:latest

# 3. Login
docker login

# 4. Push
docker push yourusername/eduportal:latest

# 5. Deploy on Railway with image: yourusername/eduportal:latest
```

### For GitHub Container Registry:

```powershell
# 1. Login to GHCR
$token = "YOUR_GITHUB_TOKEN"
echo $token | docker login ghcr.io -u dilki6 --password-stdin

# 2. Build and tag
cd c:\Users\USER\Documents\GitHub\EduPortal
docker build -t ghcr.io/dilki6/eduportal:latest .

# 3. Push
docker push ghcr.io/dilki6/eduportal:latest

# 4. Make package public on GitHub

# 5. Deploy on Railway with image: ghcr.io/dilki6/eduportal:latest
```

---

## 📝 Railway Environment Variables (Optional)

After deployment, you can add these in Railway:

```
ASPNETCORE_ENVIRONMENT=Production
TZ=America/New_York
JwtSettings__SecretKey=YourCustomSecretKey123456789
```

Go to: **Variables** tab → Add variable

---

## 🔍 Verify Deployment

After Railway deploys:

1. Check **Deployments** tab for build status
2. Wait for "Deployed" status (2-5 minutes)
3. Click the generated URL
4. You should see your EduPortal frontend
5. Test: `https://your-app.up.railway.app/api/health`

---

## 🐛 Troubleshooting

### Image Pull Failed
- Make sure image is public (Docker Hub or GHCR)
- Verify image name is correct
- Check you pushed latest version

### Container Crashes
- Check **Logs** tab in Railway
- Verify volume is mounted at `/data`
- Ensure port 80 is exposed

### AI Features Not Working
- Check logs for Ollama startup
- Model download takes 5-10 minutes on first run
- Check Railway memory limit (should be 4GB+)

---

## 💰 Cost Comparison

### Docker Hub Deployment
- ✅ Faster deploys (no build time)
- ✅ Lower Railway costs (no build resources)
- ✅ More control over image

### GitHub Auto-build
- ✅ Automatic deployments on git push
- ✅ No external registry needed
- ⚠️ Longer deploy time (5-8 min build)

**Recommended for production**: Docker Hub or GHCR with tagged versions

---

## 📦 Updating Your Deployment

### Update via Registry:

```bash
# 1. Rebuild locally
docker build -t eduportal:latest .

# 2. Tag with version
docker tag eduportal:latest yourusername/eduportal:v1.1

# 3. Push
docker push yourusername/eduportal:v1.1

# 4. In Railway: Settings → Image → Update to yourusername/eduportal:v1.1
# 5. Click "Deploy"
```

### Update via GitHub:

```bash
# 1. Commit changes
git add .
git commit -m "Update feature"
git push origin dev-railway

# 2. Railway auto-deploys
```

---

## ✅ Best Practice: Version Tagging

Always use version tags for production:

```bash
# Tag with version
docker tag eduportal:latest yourusername/eduportal:1.0.0
docker tag eduportal:latest yourusername/eduportal:latest

# Push both
docker push yourusername/eduportal:1.0.0
docker push yourusername/eduportal:latest

# Deploy specific version on Railway
# Image: yourusername/eduportal:1.0.0
```

This allows easy rollback if needed!

---

## 🎓 Complete Workflow Example

```powershell
# === LOCAL TESTING ===
cd c:\Users\USER\Documents\GitHub\EduPortal
docker build -t eduportal:test .
docker run -p 80:80 -v ${PWD}/data:/data eduportal:test
# Test at http://localhost

# === PUSH TO REGISTRY ===
docker tag eduportal:test yourusername/eduportal:1.0.0
docker tag eduportal:test yourusername/eduportal:latest
docker login
docker push yourusername/eduportal:1.0.0
docker push yourusername/eduportal:latest

# === DEPLOY ON RAILWAY ===
# 1. Railway → New Project → Docker Image
# 2. Image: yourusername/eduportal:1.0.0
# 3. Add volume: /data
# 4. Wait for deployment
# 5. Access your app!
```

---

**Choose your method and follow the steps above!** 🚀

**Recommended**: Use Docker Hub for simplicity, or GitHub Container Registry if you prefer keeping everything on GitHub.
