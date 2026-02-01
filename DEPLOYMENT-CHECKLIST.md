# Deployment Checklist for DevOps Team

## Pre-Deployment Verification

- [ ] EC2 instance created with Ubuntu 20.04+
- [ ] Security Group configured (ports 22, 80, 443 open)
- [ ] Domain name pointing to EC2 IP address
- [ ] SSH access configured

## Files Created for Production

### 1. Environment Configuration
- ✅ `.env.production` - Production environment variables template
- ✅ `client/.env.production` - Frontend environment (auto-detects backend)

### 2. Process Management
- ✅ `ecosystem.config.js` - PM2 configuration for backend process

### 3. Web Server
- ✅ `apache-config.conf` - Apache virtual host configuration
  - Serves static frontend files
  - Proxies WebSocket connections to backend
  - Includes SSL configuration template

### 4. Automation
- ✅ `deploy.sh` - Automated deployment script
- ✅ `DEPLOYMENT.md` - Complete step-by-step deployment guide

### 5. Code Updates
- ✅ `client/vite.config.js` - Production build optimization
- ✅ `client/src/context/SocketContext.jsx` - Dynamic URL detection for production

## Quick Deployment Steps

1. **Server Setup** (see DEPLOYMENT.md for details)
   ```bash
   # Install Node.js, PM2, Apache
   # Enable Apache modules
   ```

2. **Clone & Configure**
   ```bash
   cd /var/www/nlive
   cp .env.production .env
   # Edit .env with your settings
   ```

3. **Run Deployment Script**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Setup SSL**
   ```bash
   sudo certbot --apache -d your-domain.com
   ```

## Key Changes Made

### Backend
- ✅ Added PM2 configuration for process management
- ✅ Production environment template with proper CORS
- ✅ Logging configuration for production
- ✅ Already has rate limiting and security headers

### Frontend
- ✅ Build optimization with code splitting
- ✅ Socket connection auto-detects backend URL (no hardcoding)
- ✅ Works with Apache proxy setup
- ✅ Production build configuration

### Apache Configuration
- ✅ Serves static files from `/var/www/nlive/client/dist`
- ✅ Proxies `/socket.io` to backend on port 3000
- ✅ Proxies `/api` endpoints (if added later)
- ✅ WebSocket support for Socket.io
- ✅ React Router SPA support (rewrite rules)
- ✅ SSL configuration template included

## Important Notes

1. **Backend runs on port 3000** - Apache proxies to it
2. **Frontend is static files** - Served by Apache from `dist` folder
3. **WebSocket connections** - Apache proxies to backend with `mod_proxy_wstunnel`
4. **No hardcoded URLs** - Frontend automatically detects backend location
5. **PM2 manages backend** - Auto-restart on crash, cluster mode ready

## Testing Checklist

After deployment:
- [ ] Visit domain in browser - should see join page
- [ ] Create/join a meeting
- [ ] Test video/audio
- [ ] Test with multiple devices
- [ ] Check backend logs: `pm2 logs nlive-backend`
- [ ] Check Apache logs: `/var/log/apache2/nlive-error.log`
- [ ] Verify WebSocket connection in browser console

## Troubleshooting

If issues occur:
1. Check PM2 status: `pm2 status`
2. View backend logs: `pm2 logs nlive-backend`
3. Check Apache config: `sudo apache2ctl configtest`
4. Verify Apache modules: `sudo apache2ctl -M | grep proxy`
5. Check firewall: `sudo ufw status`
6. Test backend directly: `curl http://localhost:3000`

## Maintenance Commands

```bash
# Restart backend
pm2 restart nlive-backend

# View logs
pm2 logs nlive-backend

# Restart Apache
sudo systemctl restart apache2

# Update application
cd /var/www/nlive
git pull
npm install --production
cd client && npm install && npm run build
pm2 restart nlive-backend
```

## Performance Optimization

- Backend uses PM2 cluster mode (can scale to multiple cores)
- Apache compression enabled
- Static assets cached by browser
- Frontend code split for faster loading

---

**For detailed instructions, see DEPLOYMENT.md**
