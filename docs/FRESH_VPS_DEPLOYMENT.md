# Fresh VPS Deployment Guide (ClipX)

**Target Domain:** `clipx.app` / `www.clipx.app`
**Target Port:** `5000` (Internal)
**Recommended Path:** `/var/www/clipx` (but works anywhere)

---

## 1. Initial VPS Setup

SSH into your fresh Ubuntu VPS:
```bash
ssh root@YOUR_VPS_IP
```

Update and install dependencies:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential ufw nginx certbot python3-certbot-nginx unzip
```

Configure Firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## 2. Install Node.js & Python

Install Node.js 20:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Install Python 3 & pip:
```bash
sudo apt install -y python3 python3-pip python3-venv
```

Install PM2 (Process Manager):
```bash
sudo npm install -g pm2
```

## 3. Deploy Code

Create directory (recommended):
```bash
sudo mkdir -p /var/www/clipx
sudo chown -R $USER:$USER /var/www/clipx
```

**Upload your code:**
From your **local machine** (where you have the code), run:
```bash
# Zip the current folder (exclude node_modules/dist to save time if you want, or just zip all)
# Assuming you are in the project root
zip -r clipx_deploy.zip . -x "node_modules/*" "dist/*" ".git/*"

# Upload to VPS
scp clipx_deploy.zip root@YOUR_VPS_IP:/var/www/clipx/
```

**Back on VPS:**
```bash
cd /var/www/clipx
unzip clipx_deploy.zip
rm clipx_deploy.zip
```

## 4. Install Dependencies & Build

Install Node dependencies:
```bash
npm install
```

Setup Python environment:
```bash
cd bot
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install web3 tweepy apscheduler python-dotenv psycopg2-binary cryptography
deactivate
cd ..
```

Build the application:
```bash
npm run build
```

## 5. Configure Environment

Create `.env` file:
```bash
nano .env
```
**Paste your local `.env` content here.**
*Ensure `PORT=5000` and `NODE_ENV=production` are set.*

## 6. Start Application

Start with PM2:
```bash
# This config is dynamic and works from any directory
pm2 start deploy/ecosystem.config.cjs --env production
pm2 save
pm2 startup
```

## 7. Configure Nginx (Critical Step)

**Note:** If you deployed to a folder other than `/var/www/clipx`, you MUST edit the configuration file before copying it.

1. **Edit the config (if needed):**
   ```bash
   nano deploy/nginx_clipx0.conf
   ```
   *Check the `root` directive. It should point to your client dist folder, e.g., `/var/www/clipx/client/dist`.*

2. **Copy and Enable:**
   ```bash
   sudo cp deploy/nginx_clipx0.conf /etc/nginx/sites-available/clipx.app
   sudo ln -s /etc/nginx/sites-available/clipx.app /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default  # Remove default if exists
   ```

3. **Test and Restart Nginx:**
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 8. SSL Certificate

Get SSL for your domain:
```bash
sudo certbot --nginx -d clipx.app -d www.clipx.app
```

## 9. Verification

Visit `https://clipx.app` in your browser.

Check logs if needed:
```bash
pm2 logs
```
