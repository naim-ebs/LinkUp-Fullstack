# Quick Start Guide for DevOps

## TL;DR - Deploy in 10 Minutes

### 1. SSH into your EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-server-ip
```

### 2. Install prerequisites
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup systemd

# Install and configure Apache
sudo apt install -y apache2
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
sudo systemctl restart apache2
```

### 3. Deploy application
```bash
# Create directory and upload files
sudo mkdir -p /var/www/nlive
sudo chown -R $USER:$USER /var/www/nlive
cd /var/www/nlive

# Upload your code here (git clone or scp)
# Then:
chmod +x deploy.sh
./deploy.sh
```

### 4. Setup SSL (Optional but recommended)
```bash
sudo apt install -y certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com -d www.your-domain.com
```

### Done! 🎉

Visit your domain: `https://your-domain.com`

---

## What the deploy.sh script does:

1. Installs backend dependencies (`npm install`)
2. Creates `.env` file from template
3. Builds frontend (`npm run build` in client/)
4. Configures Apache with your domain
5. Sets proper file permissions
6. Starts backend with PM2
7. Reloads Apache

---

## Useful Commands

```bash
# Check status
pm2 status
sudo systemctl status apache2

# View logs
pm2 logs nlive-backend
sudo tail -f /var/log/apache2/nlive-error.log

# Restart services
pm2 restart nlive-backend
sudo systemctl restart apache2

# Update app
cd /var/www/nlive
git pull
npm install --production
cd client && npm install && npm run build
pm2 restart nlive-backend
```

---

## Architecture Overview

```
Internet
    ↓
AWS Security Group (ports 80, 443)
    ↓
Apache Web Server
    ├── Static Files (/var/www/nlive/client/dist) → React App
    └── Proxy (/socket.io) → Backend on localhost:3000
            ↓
        PM2 Process Manager
            ↓
        Node.js Backend (Socket.io + Express)
```

---

## Files You Need to Know About

- **`DEPLOYMENT.md`** - Complete detailed guide
- **`DEPLOYMENT-CHECKLIST.md`** - Step-by-step checklist
- **`apache-config.conf`** - Apache virtual host config
- **`ecosystem.config.js`** - PM2 configuration
- **`deploy.sh`** - Automated deployment script
- **`.env.production`** - Production environment template

---

## Troubleshooting Quick Fixes

**Can't connect to backend?**
```bash
pm2 logs nlive-backend
# Make sure port 3000 is listening
sudo netstat -tlnp | grep 3000
```

**Apache errors?**
```bash
sudo apache2ctl configtest
sudo tail -f /var/log/apache2/nlive-error.log
```

**WebSocket not connecting?**
```bash
# Check if proxy modules are enabled
sudo apache2ctl -M | grep proxy
```

**Frontend not loading?**
```bash
# Check if build exists
ls -la /var/www/nlive/client/dist
# Rebuild if needed
cd /var/www/nlive/client && npm run build
```

---

## Support

For detailed instructions: Read **`DEPLOYMENT.md`**

For step-by-step checklist: Read **`DEPLOYMENT-CHECKLIST.md`**
