# Deploying to Render

## 📋 Prerequisites
- GitHub account
- Render account (free tier available)
- MongoDB Atlas account (for database)

## 🚀 Step-by-Step Deployment Guide

### 1. Prepare Your Code

#### A. Update .gitignore
Make sure your `.gitignore` includes:
```
node_modules/
.env
*.log
.DS_Store
```

#### B. Push to GitHub
```bash
cd secure-auth-ejs
git init
git add .
git commit -m "Initial commit - Secure Auth EJS"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### 2. Set Up MongoDB Atlas (Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string (looks like):
   ```
   mongodb+srv://username:<password>@cluster0.xxxxx.mongodb.net/secure-auth-ejs?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **Important**: Add `0.0.0.0/0` to IP whitelist (Network Access)

### 3. Deploy to Render

#### A. Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `secure-auth-ejs` repository

#### B. Configure Service
- **Name**: `secure-auth-ejs` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave empty (or `secure-auth-ejs` if in subfolder)
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Plan**: Free

#### C. Add Environment Variables
Click "Advanced" → "Add Environment Variable" and add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_ACCESS_SECRET` | Generate random string (32+ chars) |
| `JWT_REFRESH_SECRET` | Generate random string (32+ chars) |
| `SESSION_SECRET` | Generate random string (32+ chars) |
| `JWT_ACCESS_EXPIRY` | `15m` |
| `JWT_REFRESH_EXPIRY` | `7d` |

**Generate Random Secrets:**
```bash
# In terminal, run:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### D. Deploy
1. Click "Create Web Service"
2. Wait for deployment (3-5 minutes)
3. Your app will be live at: `https://your-app-name.onrender.com`

### 4. Update CORS Settings (if needed)

If you have a frontend on a different domain, update `server.js`:

```javascript
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
```

Add `FRONTEND_URL` environment variable in Render.

### 5. Test Your Deployment

1. Visit your Render URL
2. Register a new account
3. Login and test all features
4. Check Render logs for any errors

## 🔧 Troubleshooting

### App Won't Start
- Check Render logs: Dashboard → Your Service → Logs
- Verify all environment variables are set
- Ensure MongoDB connection string is correct

### Database Connection Failed
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify connection string format
- Check MongoDB Atlas cluster is running

### Session Issues
- Ensure `SESSION_SECRET` is set
- Check cookie settings in production

### Port Issues
Render automatically sets `PORT` environment variable. Your code should use:
```javascript
const PORT = process.env.PORT || 5004;
```

## 📊 Monitoring

### View Logs
```
Dashboard → Your Service → Logs
```

### Check Metrics
```
Dashboard → Your Service → Metrics
```

### Restart Service
```
Dashboard → Your Service → Manual Deploy → Deploy latest commit
```

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render will detect the push and redeploy automatically!

## 💰 Cost

**Free Tier Includes:**
- 750 hours/month
- Automatic SSL
- Custom domains
- Automatic deploys

**Note**: Free tier services spin down after 15 minutes of inactivity. First request after inactivity may take 30-60 seconds.

## 🎯 Production Checklist

- [ ] MongoDB Atlas cluster created
- [ ] IP whitelist configured (0.0.0.0/0)
- [ ] All environment variables set in Render
- [ ] Strong random secrets generated
- [ ] Code pushed to GitHub
- [ ] Render service created and deployed
- [ ] App tested in production
- [ ] Logs checked for errors

## 🔗 Useful Links

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Support

If you encounter issues:
1. Check Render logs
2. Verify environment variables
3. Test MongoDB connection
4. Check GitHub repository settings
5. Contact Render support (support@render.com)

---

**Your app will be live at**: `https://your-app-name.onrender.com` 🚀
