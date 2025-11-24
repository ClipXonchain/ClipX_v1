# ClipX VPS Deployment Guide

Complete step-by-step guide to deploy ClipX on your VPS with PM2, Nginx, and SSL.

## Prerequisites
- Ubuntu VPS (20.04 or newer)
- Root or sudo access
- Domain: `clipx0.xyz` and `www.clipx0.xyz` pointed to your VPS IP
- ZIP file of ClipX downloaded from Replit

---

## Step 1: Initial VPS Setup

```bash
# SSH into your VPS
ssh root@YOUR_VPS_IP

# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y git curl build-essential ufw software-properties-common

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## Step 2: Install Node.js v20 (LTS)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x
```

---

## Step 3: Install Python 3 and Dependencies

```bash
# Install Python 3 and pip
sudo apt install -y python3 python3-pip python3-venv

# Verify installation
python3 --version  # Should show Python 3.8+
pip3 --version
```

---

## Step 4: Create Application Directory and Upload Files

```bash
# Create directory
sudo mkdir -p /var/www/clipx
sudo chown -R $USER:$USER /var/www/clipx
cd /var/www/clipx

# Upload your ZIP file using SCP from your local machine:
# scp clipx.zip root@YOUR_VPS_IP:/var/www/clipx/

# Extract the ZIP file
unzip clipx.zip
rm clipx.zip

# Create logs directory
mkdir -p logs
```

---

## Step 5: Configure Environment Variables

```bash
# Your .env file should already be in the ZIP
# Verify it exists and has all required variables
cat .env

# Make sure these are set:
# - DATABASE_URL
# - PRIVY_APP_ID, PRIVY_APP_SECRET
# - TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_BEARER_TOKEN, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET
# - BSC_RPC_URL
# - SESSION_SECRET
# - NODE_ENV=production
# - PORT=5000
```

---

## Step 6: Install Application Dependencies

```bash
# Install Node.js dependencies
npm install --production

# Install Python dependencies
pip3 install tweepy web3 apscheduler psycopg2-binary python-dotenv cryptography
```

---

## Step 7: Build the Application

```bash
# Build frontend and backend
npm run build

# Verify build output
ls -la dist/  # Should see index.js and other compiled files
```

---

## Step 8: Install and Configure PM2

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start applications with PM2
pm2 start ecosystem.config.cjs --env production

# Verify both apps are running
pm2 status
# You should see:
# - clipx-server (status: online)
# - clipx-bot (status: online)

# View logs
pm2 logs clipx-server --lines 50
pm2 logs clipx-bot --lines 50

# Save PM2 process list
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Copy and run the command it outputs (sudo env PATH=...)
pm2 save
```

---

## Step 9: Install and Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx

# Create Nginx configuration file
sudo nano /etc/nginx/sites-available/clipx0.xyz
```

**Paste this configuration:**

```nginx
server {
    listen 80;
    server_name clipx0.xyz www.clipx0.xyz;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/clipx0.xyz /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check Nginx status
sudo systemctl status nginx
```

---

## Step 10: Configure DNS

**On your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):**

1. Add an **A Record**:
   - **Host**: `@`
   - **Value**: `YOUR_VPS_IP_ADDRESS`
   - **TTL**: Automatic or 300

2. Add an **A Record** for www:
   - **Host**: `www`
   - **Value**: `YOUR_VPS_IP_ADDRESS`
   - **TTL**: Automatic or 300

**Wait 5-15 minutes for DNS propagation**, then verify:

```bash
# Check DNS resolution
dig clipx0.xyz +short
dig www.clipx0.xyz +short
# Both should return your VPS IP
```

---

## Step 11: Install SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace email with yours)
sudo certbot --nginx -d clipx0.xyz -d www.clipx0.xyz --email YOUR_EMAIL@example.com --agree-tos --no-eff-email

# Choose option 2 to redirect HTTP to HTTPS

# Verify auto-renewal
sudo certbot renew --dry-run

# Check certificate renewal timer
sudo systemctl status certbot.timer
```

---

## Step 12: Verify Deployment

```bash
# Check PM2 processes
pm2 status

# View server logs
pm2 logs clipx-server --lines 100

# View bot logs
pm2 logs clipx-bot --lines 100

# Check Nginx
sudo systemctl status nginx

# Test HTTPS
curl -I https://clipx0.xyz
curl -I https://www.clipx0.xyz
```

**Open in browser:**
- https://clipx0.xyz
- https://www.clipx0.xyz

Both should load your ClipX application with HTTPS! 🎉

---

## Useful PM2 Commands

```bash
# Monitor in real-time
pm2 monit

# View logs
pm2 logs
pm2 logs clipx-server
pm2 logs clipx-bot

# Restart applications
pm2 restart all
pm2 restart clipx-server
pm2 restart clipx-bot

# Stop applications
pm2 stop all
pm2 stop clipx-server

# Reload with zero downtime
pm2 reload all

# Delete from PM2
pm2 delete clipx-server
pm2 delete clipx-bot

# Show detailed info
pm2 info clipx-server
```

---

## Updating Your Application

When you make changes to your code:

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP
cd /var/www/clipx

# Pull changes or upload new ZIP
# ... upload/extract new files ...

# Install any new dependencies
npm install --production
pip3 install -r requirements.txt  # If you create one

# Rebuild
npm run build

# Reload PM2 (zero downtime)
pm2 reload all

# Or restart (brief downtime)
pm2 restart all
```

---

## Troubleshooting

### App won't start
```bash
# Check logs
pm2 logs clipx-server --lines 200
pm2 logs clipx-bot --lines 200

# Check .env file
cat .env

# Rebuild
npm run build
pm2 restart all
```

### Nginx 502 Bad Gateway
```bash
# Ensure PM2 apps are running
pm2 status

# Check if port 5000 is listening
sudo lsof -i :5000

# Restart everything
pm2 restart all
sudo systemctl restart nginx
```

### Domain not resolving
```bash
# Check DNS
dig clipx0.xyz +short

# Wait up to 24 hours for full DNS propagation
# Usually takes 5-30 minutes
```

### SSL certificate issues
```bash
# Renew manually
sudo certbot renew

# Check Nginx config
sudo nginx -t

# Check certificate expiry
sudo certbot certificates
```

### Python bot not working
```bash
# Check Python path
which python3

# Check dependencies
pip3 list | grep -E "tweepy|web3|apscheduler"

# Test bot manually
python3 bot/twitter_bot.py

# Check logs
pm2 logs clipx-bot --lines 200
```

---

## Security Best Practices

```bash
# Disable password authentication (use SSH keys only)
sudo nano /etc/ssh/sshd_config
# Set: PasswordAuthentication no
sudo systemctl restart sshd

# Install Fail2ban (prevents brute-force attacks)
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Keep system updated
sudo apt update && sudo apt upgrade -y
```

---

## Monitoring

```bash
# Check system resources
htop  # Install with: sudo apt install htop

# Check disk usage
df -h

# Check PM2 resource usage
pm2 monit

# View all logs
tail -f logs/*.log
```

---

## Production Checklist

- [x] VPS setup with Ubuntu
- [x] Node.js v20 installed
- [x] Python 3 installed
- [x] Application files uploaded and extracted
- [x] `.env` file configured with production credentials
- [x] Dependencies installed (npm + pip)
- [x] Application built (`npm run build`)
- [x] PM2 installed and configured
- [x] Both apps running (server + bot)
- [x] PM2 startup enabled
- [x] Nginx installed and configured
- [x] DNS records pointing to VPS
- [x] SSL certificate installed
- [x] HTTPS redirect enabled
- [x] Application accessible via https://clipx0.xyz

---

## Your Application is Live! 🚀

**URL**: https://clipx0.xyz and https://www.clipx0.xyz

- ✅ Node.js Express server running on PM2
- ✅ Python Twitter bot running on PM2
- ✅ Nginx reverse proxy
- ✅ SSL/HTTPS enabled
- ✅ Auto-restart on crashes
- ✅ Auto-start on server reboot
- ✅ Production-ready and scalable

Need help? Check the logs with `pm2 logs` or review the troubleshooting section above.
