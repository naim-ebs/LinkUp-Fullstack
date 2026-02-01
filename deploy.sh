#!/bin/bash

# nLive Deployment Script for AWS/Apache
# Run this script after completing manual server setup

set -e  # Exit on error

echo "========================================="
echo "nLive Deployment Script"
echo "========================================="
echo ""

# Check if running as correct user
if [ "$EUID" -eq 0 ]; then 
   echo "Please do not run as root"
   exit 1
fi

# Configuration
APP_DIR="/var/www/nlive"
DOMAIN=""

# Get domain name
read -p "Enter your domain name (e.g., example.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo "Domain name is required!"
    exit 1
fi

echo ""
echo "Starting deployment to domain: $DOMAIN"
echo "Application directory: $APP_DIR"
echo ""

# Step 1: Install dependencies
echo "[1/7] Installing backend dependencies..."
cd "$APP_DIR"
npm install --production

# Step 2: Setup environment
echo "[2/7] Setting up environment..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "Created .env file. Please edit it with your settings."
fi

# Step 3: Create logs directory
echo "[3/7] Creating logs directory..."
mkdir -p "$APP_DIR/logs"

# Step 4: Build frontend
echo "[4/7] Building frontend..."
cd "$APP_DIR/client"
npm install
npm run build

# Step 5: Configure Apache
echo "[5/7] Configuring Apache..."
sudo cp "$APP_DIR/apache-config.conf" "/etc/apache2/sites-available/nlive.conf"
sudo sed -i "s/your-domain.com/$DOMAIN/g" /etc/apache2/sites-available/nlive.conf

# Enable site
sudo a2ensite nlive.conf
sudo a2dissite 000-default.conf || true

# Test configuration
echo "Testing Apache configuration..."
sudo apache2ctl configtest

# Step 6: Set permissions
echo "[6/7] Setting permissions..."
sudo chown -R www-data:www-data "$APP_DIR/client/dist"
sudo chmod -R 755 "$APP_DIR/client/dist"

# Step 7: Start backend with PM2
echo "[7/7] Starting backend with PM2..."
cd "$APP_DIR"
pm2 delete nlive-backend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Reload Apache
echo "Reloading Apache..."
sudo systemctl reload apache2

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo ""
echo "Your application should now be accessible at:"
echo "  http://$DOMAIN"
echo ""
echo "Next steps:"
echo "1. Update DNS records to point to this server"
echo "2. Setup SSL certificate:"
echo "   sudo certbot --apache -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "Check status:"
echo "  pm2 status"
echo "  pm2 logs nlive-backend"
echo "  sudo systemctl status apache2"
echo ""
echo "View logs:"
echo "  pm2 logs nlive-backend"
echo "  sudo tail -f /var/log/apache2/nlive-error.log"
echo ""
