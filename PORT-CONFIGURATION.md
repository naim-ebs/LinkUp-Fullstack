# Frontend-Backend Communication Guide

## How It Works

### Architecture Overview
```
Frontend (React) ←→ Socket.io Client ←→ Backend (Node.js + Socket.io)
```

The frontend communicates with the backend using **Socket.io** (WebSocket + HTTP polling fallback).

---

## Port Configuration

### 1. Backend Port

**File:** `.env` (in project root)

```env
PORT=3000
```

**To change backend port:**
1. Edit `.env` file
2. Change `PORT=3000` to your desired port (e.g., `PORT=8080`)
3. Restart backend: `pm2 restart nlive-backend`

**Also update these locations:**

#### a) Apache Configuration
**File:** `apache-config.conf` (or `/etc/apache2/sites-available/nlive.conf` on server)

Find and replace all instances of port 3000:
```apache
# Change these lines:
RewriteRule /socket.io/(.*)  ws://localhost:3000/socket.io/$1 [P,L]
ProxyPass /socket.io http://localhost:3000/socket.io
ProxyPassReverse /socket.io http://localhost:3000/socket.io
ProxyPass /api http://localhost:3000/api
ProxyPassReverse /api http://localhost:3000/api

# To your new port (e.g., 8080):
RewriteRule /socket.io/(.*)  ws://localhost:8080/socket.io/$1 [P,L]
ProxyPass /socket.io http://localhost:8080/socket.io
ProxyPassReverse /socket.io http://localhost:8080/socket.io
ProxyPass /api http://localhost:8080/api
ProxyPassReverse /api http://localhost:8080/api
```

After changing, reload Apache:
```bash
sudo systemctl reload apache2
```

---

## Frontend Auto-Detection (No Configuration Needed!)

**File:** `client/src/context/SocketContext.jsx`

The frontend **automatically detects** the backend URL:

### Development (localhost)
```javascript
// When running on localhost:5173
// Frontend connects to: http://localhost:3000
```

### Production (with Apache)
```javascript
// When running on example.com
// Frontend connects to: https://example.com (Apache proxies to localhost:3000)
```

### Network Testing (IP address)
```javascript
// When running on 192.168.1.100:5173
// Frontend connects to: http://192.168.1.100:3000
```

---

## Changing Frontend Development Port

**File:** `client/package.json`

The frontend development server runs on port 5173 by default.

To change it:
```json
{
  "scripts": {
    "dev": "vite --host --port 8080"
  }
}
```

Then restart: `npm run dev`

---

## Manual Override (if needed)

If DevOps needs to **manually specify** the backend URL instead of auto-detection:

**File:** `client/.env` (for development) or `client/.env.production` (for production)

```env
VITE_BACKEND_URL=http://your-backend-url:port
```

Then update `client/src/App.jsx`:
```jsx
<SocketProvider serverUrl={import.meta.env.VITE_BACKEND_URL}>
```

**Note:** Currently this is NOT needed because auto-detection works perfectly!

---

## Production Setup Scenarios

### Scenario 1: Standard Setup (Recommended)
- **Backend**: Port 3000 (internal, not exposed)
- **Apache**: Ports 80/443 (exposed to internet)
- **Frontend**: Static files served by Apache
- **Communication**: Apache proxies `/socket.io` → `localhost:3000`

**No frontend configuration needed!** ✅

### Scenario 2: Different Backend Port
- **Backend**: Port 8080 (instead of 3000)
- **Change in:**
  1. `.env` → `PORT=8080`
  2. `apache-config.conf` → Update all `localhost:3000` to `localhost:8080`
  3. Restart both: `pm2 restart nlive-backend && sudo systemctl reload apache2`

**No frontend configuration needed!** ✅

### Scenario 3: Backend on Different Server
- **Backend**: `backend-server.com:3000`
- **Frontend**: `frontend-server.com`

**Change Apache config** to proxy to external backend:
```apache
RewriteRule /socket.io/(.*)  ws://backend-server.com:3000/socket.io/$1 [P,L]
ProxyPass /socket.io http://backend-server.com:3000/socket.io
ProxyPassReverse /socket.io http://backend-server.com:3000/socket.io
```

**Or manually set** in `client/.env.production`:
```env
VITE_BACKEND_URL=http://backend-server.com:3000
```

---

## Quick Reference for DevOps

### Change Backend Port
```bash
# 1. Edit .env
nano /var/www/nlive/.env
# Change PORT=3000 to PORT=8080

# 2. Edit Apache config
sudo nano /etc/apache2/sites-available/nlive.conf
# Replace all localhost:3000 with localhost:8080

# 3. Restart services
pm2 restart nlive-backend
sudo systemctl reload apache2
```

### Check Current Ports
```bash
# Backend port
pm2 info nlive-backend | grep -i port
# Or check .env file
cat /var/www/nlive/.env | grep PORT

# Frontend dev port
# Check package.json scripts

# Apache listening ports
sudo netstat -tlnp | grep apache2
```

### Verify Connection
```bash
# Check if backend is listening
sudo netstat -tlnp | grep 3000

# Test backend directly
curl http://localhost:3000

# Check Apache proxy
curl http://localhost/socket.io/

# View logs
pm2 logs nlive-backend
sudo tail -f /var/log/apache2/nlive-error.log
```

---

## Environment-Specific Configuration

### Development (.env)
```env
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173,https://localhost:5173
```

### Production (.env.production → .env on server)
```env
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
```

**Note:** Update `CORS_ORIGIN` to your actual domain in production for better security:
```env
CORS_ORIGIN=https://your-domain.com,https://www.your-domain.com
```

---

## Communication Flow

### Development
```
Browser (https://localhost:5173)
    ↓
Frontend (React)
    ↓ Socket.io connection
Backend (http://localhost:3000)
```

### Production
```
Browser (https://your-domain.com)
    ↓
Apache (ports 80/443)
    ↓ Serve static files
Frontend (React from /client/dist)
    ↓ Socket.io to same origin
Apache
    ↓ Proxy /socket.io
Backend (localhost:3000)
```

---

## Troubleshooting Connection Issues

### Frontend can't connect to backend

1. **Check backend is running:**
   ```bash
   pm2 status
   curl http://localhost:3000
   ```

2. **Check ports:**
   ```bash
   sudo netstat -tlnp | grep 3000
   ```

3. **Check CORS:**
   - Development: Update CORS_ORIGIN in `.env`
   - Production: Should be `*` or your domain

4. **Check browser console:**
   - Look for Socket.io connection errors
   - Check the URL it's trying to connect to

5. **Check Apache proxy (production):**
   ```bash
   sudo apache2ctl -M | grep proxy
   sudo tail -f /var/log/apache2/nlive-error.log
   ```

---

## Summary for DevOps

✅ **Backend Port:** Configured in `.env` file  
✅ **Frontend Auto-Detects:** No configuration needed in most cases  
✅ **Apache Proxy:** Must match backend port  
✅ **Change Port:** Update 3 places (`.env`, `apache-config.conf`, restart services)  
✅ **Manual Override:** Use `VITE_BACKEND_URL` environment variable if needed  

**The system is designed to work with minimal configuration!**
