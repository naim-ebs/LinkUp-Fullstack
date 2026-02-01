# nLive - AWS Apache Deployment Guide

## Prerequisites
- AWS EC2 instance (Ubuntu 20.04 LTS or newer recommended)
- Domain name pointed to EC2 instance
- SSH access to the server
- Root or sudo privileges

## Server Requirements
- Node.js 18.x or newer
- Apache 2.4 or newer
- PM2 (Node.js process manager)
- Git

---

## Step 1: Initial Server Setup

### 1.1 Connect to EC2 Instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip-address
```

### 1.2 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

### 1.4 Install PM2
```bash
sudo npm install -g pm2
pm2 startup systemd  # Follow the instructions provided
```

### 1.5 Install Apache
```bash
sudo apt install -y apache2
sudo systemctl start apache2
sudo systemctl enable apache2
```

### 1.6 Enable Required Apache Modules
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_wstunnel
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
sudo systemctl restart apache2
```

---

## Step 2: Clone and Setup Application

### 2.1 Create Application Directory
```bash
sudo mkdir -p /var/www/nlive
sudo chown -R $USER:$USER /var/www/nlive
cd /var/www/nlive
```

### 2.2 Clone Repository
```bash
git clone <your-repository-url> .
# OR upload files via SCP/SFTP
```

### 2.3 Setup Backend
```bash
cd /var/www/nlive
npm install --production
```

### 2.4 Configure Environment Variables
```bash
# Copy and edit production environment file
cp .env.production .env
nano .env
```

Update `.env` with your production values:
```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=*
MAX_PARTICIPANTS_PER_ROOM=10
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2.5 Create Logs Directory
```bash
mkdir -p /var/www/nlive/logs
```

### 2.6 Build Frontend
```bash
cd /var/www/nlive/client
npm install
npm run build
```
This creates optimized static files in `/var/www/nlive/client/dist`

---

## Step 3: Configure Apache

### 3.1 Create Apache Configuration
```bash
sudo nano /etc/apache2/sites-available/nlive.conf
```

Copy the content from `apache-config.conf` file in the project root.

**Important:** Replace `your-domain.com` with your actual domain name.

### 3.2 Enable Site
```bash
sudo a2ensite nlive.conf
sudo a2dissite 000-default.conf  # Disable default site
sudo apache2ctl configtest  # Test configuration
sudo systemctl reload apache2
```

---

## Step 4: Start Backend with PM2

### 4.1 Start Application
```bash
cd /var/www/nlive
pm2 start ecosystem.config.js
```

### 4.2 Save PM2 Process List
```bash
pm2 save
```

### 4.3 Verify Backend is Running
```bash
pm2 status
pm2 logs nlive-backend
curl http://localhost:3000  # Should respond
```

---

## Step 5: Configure Firewall (AWS Security Group)

### 5.1 Open Required Ports in AWS Security Group:
- **Port 80** (HTTP) - Inbound from 0.0.0.0/0
- **Port 443** (HTTPS) - Inbound from 0.0.0.0/0
- **Port 22** (SSH) - Inbound from your IP only

### 5.2 Ubuntu Firewall (UFW) - Optional
```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Step 6: SSL Certificate Setup (Recommended)

### 6.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-apache
```

### 6.2 Obtain SSL Certificate
```bash
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

Follow the prompts to:
- Enter email address
- Agree to terms
- Choose to redirect HTTP to HTTPS (recommended: Yes)

### 6.3 Test Auto-Renewal
```bash
sudo certbot renew --dry-run
```

Certbot will automatically renew certificates before expiry.

---

## Step 7: Verify Deployment

### 7.1 Check Services
```bash
# Check Apache
sudo systemctl status apache2

# Check Backend
pm2 status
pm2 logs nlive-backend

# Check if port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### 7.2 Test Application
1. Open browser: `http://your-domain.com`
2. Try to join a meeting
3. Check browser console for errors
4. Test with multiple devices

---

## Step 8: Monitoring & Maintenance

### 8.1 View Logs
```bash
# Backend logs
pm2 logs nlive-backend

# Apache logs
sudo tail -f /var/log/apache2/nlive-access.log
sudo tail -f /var/log/apache2/nlive-error.log
```

### 8.2 Restart Services
```bash
# Restart backend
pm2 restart nlive-backend

# Restart Apache
sudo systemctl restart apache2
```

### 8.3 Update Application
```bash
cd /var/www/nlive

# Pull latest code
git pull

# Update backend
npm install --production
pm2 restart nlive-backend

# Update frontend
cd client
npm install
npm run build
```

---

## Troubleshooting

### Backend Not Starting
```bash
pm2 logs nlive-backend
# Check for Node.js errors or missing dependencies
```

### WebSocket Connection Failed
- Verify Apache modules: `sudo apache2ctl -M | grep proxy`
- Check Apache error logs: `sudo tail -f /var/log/apache2/nlive-error.log`
- Ensure port 3000 is not blocked by firewall

### Static Files Not Loading
```bash
# Check permissions
ls -la /var/www/nlive/client/dist
sudo chown -R www-data:www-data /var/www/nlive/client/dist
```

### High Memory Usage
```bash
# Check PM2 memory
pm2 monit

# Restart if needed
pm2 restart nlive-backend
```

---

## Performance Optimization

### Enable Apache Caching
Add to Apache config:
```apache
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### PM2 Cluster Mode
Edit `ecosystem.config.js`:
```javascript
instances: 'max'  // Use all CPU cores
```

---

## Security Best Practices

1. **Keep System Updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Configure Rate Limiting** (Already included in backend)

3. **Use Strong Passwords** for server access

4. **Regular Backups**
   ```bash
   # Backup command (setup with cron)
   tar -czf /backup/nlive-$(date +%Y%m%d).tar.gz /var/www/nlive
   ```

5. **Monitor Logs** regularly for suspicious activity

---

## Quick Commands Reference

```bash
# Start backend
pm2 start ecosystem.config.js

# Stop backend
pm2 stop nlive-backend

# Restart backend
pm2 restart nlive-backend

# View logs
pm2 logs nlive-backend

# Restart Apache
sudo systemctl restart apache2

# Test Apache config
sudo apache2ctl configtest

# Build frontend
cd /var/www/nlive/client && npm run build
```

---

## Support

For issues or questions, check:
1. Backend logs: `pm2 logs nlive-backend`
2. Apache logs: `/var/log/apache2/nlive-error.log`
3. Browser console for frontend errors
4. Verify all services are running: `pm2 status && sudo systemctl status apache2`

---

**Deployment completed!** Your nLive application should now be accessible at your domain.
