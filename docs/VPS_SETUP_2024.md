# ClipX VPS Setup Guide (Updated November 2024)

**Complete setup for Ubuntu VPS with latest ClipX features**

---

## ✅ What's Included
- Dual-token tipping (BNB + ClipX)
- Web portal with escrow support
- Twitter bot with 16-minute mention checks
- ClipX favicon and branding
- Proper currency displays
- PM2 process management
- Nginx reverse proxy
- SSL certificates

---

## 📋 Prerequisites

- **VPS**: Ubuntu 20.04+ with root/sudo access
- **Domain**: `clipx0.xyz` pointing to your VPS IP
- **Accounts**: Twitter API, Privy, Neon Database
- **Files**: ClipX code downloaded from Replit

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Initial VPS Setup

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP

# Update system
sudo apt update && sudo apt upgrade -y

# Install essentials
sudo apt install -y git curl build-essential ufw nginx certbot python3-certbot-nginx

# Configure firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

---

### Step 2: Install Node.js 20 & Python 3

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Python 3
sudo apt install -y python3 python3-pip python3-venv

# Verify versions
node --version  # v20.x.x
python3 --version  # Python 3.8+
```

---

### Step 3: Upload and Extract ClipX

```bash
# Create app directory
sudo mkdir -p /var/www/clipx
sudo chown -R $USER:$USER /var/www/clipx
cd /var/www/clipx

# From your local machine, upload the ZIP:
# scp clipx.zip root@YOUR_VPS_IP:/var/www/clipx/

# Extract
unzip clipx.zip
rm clipx.zip
```

---

### Step 4: Configure Environment Variables

**Create or verify `.env` file:**

```bash
nano .env
```

**Required variables:**

```bash
# Database
DATABASE_URL=postgresql://user:pass@host/database?sslmode=require

# Privy Authentication
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Twitter API
TWITTER_API_KEY=your_api_key
TWITTER_API_SECRET=your_api_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

# Blockchain
BSC_RPC_URL=https://bsc-dataseed.binance.org
CLIPX_TOKEN_ADDRESS=0xc269d59a0d608ea0bd672f2f4616c372d8554444

# Escrow Wallet (CRITICAL - Required for web portal tips)
ESCROW_WALLET_ADDRESS=0x5088a172d3a2a2895A17EF34554AA28370Bb0E23
ESCROW_WALLET_PRIVATE_KEY=0x38727ee3763c75be19b0171be0e5e920dcaeed2053c76ec2f20863a195038093

# Session Security
SESSION_SECRET=your_random_session_secret_min_32_chars

# Environment
NODE_ENV=production
PORT=5000
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`

---

### Step 5: Install Dependencies and Build

```bash
# Install Node.js packages
npm install --production

# Install Python packages
pip3 install tweepy web3 apscheduler psycopg2-binary python-dotenv cryptography

# Build the application
npm run build

# Verify build
ls -la dist/  # Should see index.js and public/
```

---

### Step 6: Setup PM2 Process Manager

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start both web server and bot
pm2 start ecosystem.config.cjs --env production

# Check status (both should be "online")
pm2 status

# View logs
pm2 logs clipx-server --lines 30
pm2 logs clipx-bot --lines 30

# Save PM2 configuration
pm2 save

# Auto-start on boot
pm2 startup systemd
# Run the command it outputs (starts with "sudo env PATH=...")
pm2 save
```

**Expected PM2 Status:**
```
┌─────┬────────────────┬─────────────┬─────────┬─────────┐
│ id  │ name           │ namespace   │ status  │ restart │
├─────┼────────────────┼─────────────┼─────────┼─────────┤
│ 0   │ clipx-server   │ default     │ online  │ 0       │
│ 1   │ clipx-bot      │ default     │ online  │ 0       │
└─────┴────────────────┴─────────────┴─────────┴─────────┘
```

---

### Step 7: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/clipx0.xyz
```

**Paste this:**

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
        
        # Disable caching (important for development)
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

**Save and exit:** `Ctrl+X`, `Y`, `Enter`

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/clipx0.xyz /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

### Step 8: Configure DNS

**Go to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.):**

1. **Add A Record:**
   - Host: `@`
   - Value: `YOUR_VPS_IP`
   - TTL: 300

2. **Add A Record for www:**
   - Host: `www`
   - Value: `YOUR_VPS_IP`
   - TTL: 300

**Wait 5-15 minutes**, then verify:

```bash
dig clipx0.xyz +short
# Should return: YOUR_VPS_IP
```

---

### Step 9: Install SSL Certificate

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d clipx0.xyz -d www.clipx0.xyz \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email \
  --redirect

# Test auto-renewal
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

---

### Step 10: Verify Deployment

```bash
# Check PM2 processes
pm2 status

# Check web server logs
pm2 logs clipx-server --lines 50

# Check bot logs
pm2 logs clipx-bot --lines 50

# Test website
curl -I https://clipx0.xyz
# Should return: HTTP/2 200
```

**Visit your website:** `https://clipx0.xyz` ✅

---

## 🔄 Updating Your VPS

When you make changes and need to update:

```bash
# SSH into VPS
ssh root@YOUR_VPS_IP
cd /var/www/clipx

# Pull latest changes (if using git)
git pull

# OR replace specific files manually
# scp server/routes.ts root@YOUR_VPS_IP:/var/www/clipx/server/

# Rebuild application
npm run build

# Restart PM2 processes
pm2 restart all

# Check logs
pm2 logs --lines 30
```

---

## 📊 Monitoring and Maintenance

### View Logs
```bash
# Live logs (all processes)
pm2 logs

# Specific process logs
pm2 logs clipx-server
pm2 logs clipx-bot

# Last 100 lines
pm2 logs --lines 100
```

### Restart Services
```bash
# Restart all
pm2 restart all

# Restart specific service
pm2 restart clipx-server
pm2 restart clipx-bot

# Reload (zero-downtime)
pm2 reload all
```

### Check System Resources
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
df -h  # Disk usage
free -h  # Memory usage
```

---

## 🆘 Troubleshooting

### Web Server Not Starting
```bash
# Check logs
pm2 logs clipx-server --err --lines 50

# Common issues:
# - Port 5000 already in use: sudo lsof -i :5000
# - Missing .env variables: cat .env
# - Database connection: check DATABASE_URL
```

### Bot Not Processing Mentions
```bash
# Check bot logs
pm2 logs clipx-bot --lines 50

# Verify escrow wallet
grep ESCROW .env

# Test database connection
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
```

### Website Shows 502 Bad Gateway
```bash
# Check if server is running
pm2 status

# Check Nginx
sudo nginx -t
sudo systemctl status nginx

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Force renew
sudo certbot renew --force-renewal
```

---

## 📁 Important File Locations

```
/var/www/clipx/           # Application root
├── .env                  # Environment variables
├── server/routes.ts      # API routes (updated today)
├── client/public/        # Static files (favicon updated)
├── bot/nativebot.py      # Twitter bot
├── dist/                 # Built application
└── logs/                 # Application logs

/etc/nginx/sites-available/clipx0.xyz  # Nginx config
/var/log/nginx/           # Nginx logs
~/.pm2/logs/              # PM2 logs
```

---

## 🎯 Latest Updates (November 2024)

✅ **Files Updated Today:**
- `server/routes.ts` - Escrow support for web portal + currency fields
- `client/public/favicon.png` - ClipX logo
- `client/src/pages/claims.tsx` - Currency display fix
- `client/src/pages/transactions.tsx` - Currency display fix
- `client/src/pages/dashboard.tsx` - Currency display fix

✅ **New Features:**
- Web portal can now send tips to unregistered users (escrow)
- Proper BNB vs ClipX currency labels everywhere
- Tweet announcements match bot format
- ClipX favicon in browser tabs

✅ **Environment Variables Required:**
- `ESCROW_WALLET_ADDRESS` - Critical for web portal tips
- `ESCROW_WALLET_PRIVATE_KEY` - Critical for web portal tips

---

## 📞 Quick Commands Reference

```bash
# Deploy updates
cd /var/www/clipx && git pull && npm run build && pm2 restart all

# Check status
pm2 status

# View all logs
pm2 logs

# Restart everything
pm2 restart all && sudo systemctl restart nginx

# Monitor resources
pm2 monit

# Check SSL expiry
sudo certbot certificates
```

---

## ✅ Post-Deployment Checklist

- [ ] Both PM2 processes running (clipx-server + clipx-bot)
- [ ] Website accessible at https://clipx0.xyz
- [ ] SSL certificate valid (green padlock)
- [ ] Can login with Privy (Twitter OAuth)
- [ ] Can send BNB tip from web portal
- [ ] Can send ClipX tip from web portal
- [ ] Bot processes Twitter mentions
- [ ] Currency displays correctly (BNB vs CLIPX)
- [ ] ClipX favicon appears in browser tab
- [ ] Escrow tips work for unregistered users

---

**🎉 Your ClipX platform is now live!**

For support, check logs first: `pm2 logs --lines 100`
