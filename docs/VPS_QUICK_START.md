# ClipX VPS Deployment - Quick Start Guide

**Path:** `/root/release2`

---

## ✅ Pre-installed
- ✅ npm
- ✅ nginx

---

## 🚀 Deployment Steps

### 1. Upload Project Files

Upload all your project files to `/root/release2` on your VPS.

---

### 2. Setup Python Virtual Environment

```bash
cd /root/release2

# Create venv
python3 -m venv venv

# Activate venv
source venv/bin/activate

# Install Python packages
pip install web3 tweepy apscheduler python-dotenv psycopg2-binary cryptography

# Deactivate
deactivate
```

---

### 3. Install Node Dependencies & Build

```bash
cd /root/release2

# Install dependencies
npm install

# Build the application
npm run build

# Create logs directory
mkdir -p logs
```

---

### 4. Configure Environment Variables

```bash
# Create/edit .env file
nano /root/release2/.env
```

**Paste your environment variables:**

```env
NODE_ENV=production
PORT=5000

DATABASE_URL=postgresql://user:pass@host:5432/dbname
PGHOST=your_db_host
PGPORT=5432
PGUSER=your_db_user
PGPASSWORD=your_db_password
PGDATABASE=your_db_name

SESSION_SECRET=your_session_secret

PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret

BSC_RPC_URL=https://bsc-dataseed.binance.org

ESCROW_WALLET_ADDRESS=0x...
ESCROW_WALLET_PRIVATE_KEY=0x...

CLIPX_TOKEN_ADDRESS=0xc269d59a0d608ea0bd672f2f4616c372d8554444
ASTER_TOKEN_ADDRESS=0x000ae314e2a2172a039b26378814c252734f556a
```

Save and exit: `Ctrl+X`, `Y`, `Enter`

```bash
# Secure the .env file
chmod 600 /root/release2/.env
```

---

### 5. Install PM2 (if not already installed)

```bash
npm install -g pm2
```

---

### 6. Start Application with PM2

```bash
cd /root/release2

# Start both server and bot
pm2 start ecosystem.config.cjs --env production

# Save PM2 process list
pm2 save

# Enable PM2 to start on boot
pm2 startup
# Copy and run the command it outputs
```

---

### 7. Configure Nginx

```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/clipx
```

**Paste this (replace `your-domain.com` with your actual domain):**

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
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
sudo ln -s /etc/nginx/sites-available/clipx /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

### 8. Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Follow the prompts
```

---

## ✅ Verification

```bash
# Check PM2 status
pm2 list

# Should show:
# - clipx-server (status: online)
# - clipx-bot (status: online)

# View logs
pm2 logs

# Check if website loads
curl http://localhost:5000
```

---

## 📊 PM2 Commands

```bash
# View all processes
pm2 list

# View logs (real-time)
pm2 logs

# View server logs only
pm2 logs clipx-server

# View bot logs only
pm2 logs clipx-bot

# Restart all
pm2 restart all

# Restart server only
pm2 restart clipx-server

# Restart bot only
pm2 restart clipx-bot

# Stop all
pm2 stop all

# Monitor resources
pm2 monit
```

---

## 🔄 Deploy Updates

When you have new code to deploy:

```bash
cd /root/release2

# Pull latest code (if using git)
git pull

# Install new dependencies (if any)
npm install

# Rebuild
npm run build

# Update Python packages (if changed)
source venv/bin/activate
pip install <any-new-packages>
deactivate

# Restart PM2
pm2 restart all
```

---

## 🐛 Troubleshooting

### Server not starting

```bash
# Check logs
pm2 logs clipx-server --lines 50

# Check if dist folder exists
ls -la /root/release2/dist/index.js

# Check if port 5000 is free
sudo lsof -i :5000

# Restart
pm2 restart clipx-server
```

### Bot not starting

```bash
# Check logs
pm2 logs clipx-bot --lines 50

# Test bot manually
cd /root/release2
source venv/bin/activate
python3 bot/nativebot.py
# Ctrl+C to stop
deactivate

# Restart
pm2 restart clipx-bot
```

### Check environment variables

```bash
# Check if .env exists and has content
cat /root/release2/.env | grep DATABASE_URL
```

---

## 📂 File Structure After Setup

```
/root/release2/
├── dist/                   ← Built server (created by npm run build)
├── bot/
│   └── nativebot.py
├── venv/                   ← Python virtual environment
│   └── bin/
│       └── python3
├── logs/                   ← PM2 logs
│   ├── server-out.log
│   ├── server-error.log
│   ├── bot-out.log
│   └── bot-error.log
├── .env                    ← Your secrets
├── ecosystem.config.cjs    ← PM2 config (already configured)
└── package.json
```

---

## ✅ Final Checklist

- [ ] Files uploaded to `/root/release2`
- [ ] Python venv created and packages installed
- [ ] Node dependencies installed (`npm install`)
- [ ] Application built (`npm run build`)
- [ ] `.env` file created with all secrets
- [ ] PM2 installed globally
- [ ] PM2 apps started: `pm2 list` shows both online
- [ ] PM2 startup configured
- [ ] Nginx configured and running
- [ ] Website accessible

---

## 🎯 Quick Commands Summary

```bash
# One-time setup
cd /root/release2
python3 -m venv venv
source venv/bin/activate && pip install web3 tweepy apscheduler python-dotenv psycopg2-binary cryptography && deactivate
npm install
npm run build
mkdir -p logs

# Start application
pm2 start ecosystem.config.cjs --env production
pm2 save
pm2 startup  # Run the command it outputs

# Check status
pm2 list
pm2 logs

# Restart
pm2 restart all
```

---

**Done! Your ClipX app is now running in production!** 🚀

- Server: Running on port 5000
- Bot: Processing Twitter mentions every 5 minutes
- Access: http://your-domain.com (or https:// if SSL configured)
