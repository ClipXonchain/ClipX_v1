# Local/VPS Deployment Guide for ClipX

This guide will help you deploy ClipX on your local machine (Windows, macOS, Linux) or a VPS server.

## Prerequisites

### Required Software
- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **Python** 3.8 or higher ([Download](https://www.python.org/downloads/))
- **PostgreSQL** database (local or cloud-hosted like Neon, Supabase)
- **Git** ([Download](https://git-scm.com/))

### Required Accounts & API Keys
- **Privy Account** - For authentication ([Sign up](https://dashboard.privy.io/))
- **Twitter Developer Account** - For Twitter API ([Apply](https://developer.twitter.com/))
- **BSC RPC Endpoint** - Public endpoint or Infura/Alchemy
- **PostgreSQL Database** - Neon, Supabase, or self-hosted

---

## Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd <repo-directory>
```

---

## Step 2: Install Dependencies

### Install Node.js Dependencies
```bash
npm install
```

### Install Python Dependencies
```bash
cd bot
pip install -r requirements.txt
cd ..
```

---

## Step 3: Configure Environment Variables

### Create .env File
Copy the example file and fill in your actual values:

```bash
cp .env.example .env
```

### Edit .env File
Open `.env` in your preferred text editor and configure:

#### Database Configuration
```env
DATABASE_URL=postgresql://username:password@hostname:5432/database?sslmode=require
PGHOST=your-database-host
PGPORT=5432
PGUSER=your_database_user
PGPASSWORD=your_database_password
PGDATABASE=your_database_name
```

#### Session Secret
Generate a secure random string:
```bash
openssl rand -base64 48
```
Then set:
```env
SESSION_SECRET=<generated-secret>
```

#### Privy Authentication
Get these from https://dashboard.privy.io/:
```env
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
```

#### Twitter API Credentials
Get these from https://developer.twitter.com/:
```env
TWITTER_API_KEY=your_key
TWITTER_API_SECRET=your_secret
TWITTER_BEARER_TOKEN=your_bearer_token
TWITTER_ACCESS_TOKEN=your_access_token
TWITTER_ACCESS_SECRET=your_access_secret
```

#### Escrow Wallet
Generate a new wallet for holding unclaimed tips:
```bash
node -e "const {Web3} = require('web3'); const account = new Web3().eth.accounts.create(); console.log('Address:', account.address, '\nPrivate Key:', account.privateKey)"
```
Then set:
```env
ESCROW_WALLET_ADDRESS=<generated-address>
ESCROW_WALLET_PRIVATE_KEY=<generated-private-key>
```

---

## Step 4: Initialize Database

### Push Database Schema
```bash
npm run db:push
```

This will create all necessary tables in your PostgreSQL database using Drizzle ORM.

---

## Step 5: Build the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
# Build frontend and backend
npm run build

# Start production server
npm run start
```

---

## Step 6: Run the Python Bot (Optional)

The Twitter bot monitors mentions and processes tip requests.

### In a Separate Terminal
```bash
cd bot
python clipx_bot.py
```

### Keep Bot Running (Production)
Use a process manager like `pm2`, `systemd`, or `screen`:

#### Using PM2 (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start the web app
pm2 start npm --name "clipx-web" -- start

# Start the Python bot
pm2 start bot/clipx_bot.py --name "clipx-bot" --interpreter python3

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

---

## Step 7: Access the Application

### Development
- Open browser: http://localhost:5000

### Production (VPS)
- Configure your domain to point to your VPS IP
- Set up nginx reverse proxy (see nginx configuration below)
- Enable HTTPS with Let's Encrypt

---

## Nginx Configuration (Production)

### Basic Reverse Proxy
Create `/etc/nginx/sites-available/clipx`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/clipx /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Enable HTTPS with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Environment-Specific Configuration

### For Windows
Use `cross-env` (already in package.json):
```json
"scripts": {
  "start": "cross-env NODE_ENV=production node -r dotenv/config dist/index.js"
}
```

### For Linux/VPS
Standard scripts work out of the box.

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>
```

### Database Connection Issues
- Verify DATABASE_URL format
- Check firewall allows PostgreSQL connections
- For Neon/cloud databases, ensure SSL is enabled

### Python Bot Not Starting
```bash
# Install missing dependencies
cd bot
pip install -r requirements.txt

# Check environment variables are loaded
python -c "import os; from dotenv import load_dotenv; load_dotenv('../.env'); print(os.getenv('DATABASE_URL'))"
```

### Build Errors
```bash
# Clean build
rm -rf dist node_modules
npm install
npm run build
```

---

## Monitoring & Logs

### PM2 Logs
```bash
# View all logs
pm2 logs

# View specific app logs
pm2 logs clipx-web
pm2 logs clipx-bot
```

### Manual Logs (Development)
Both the web server and Python bot output logs to the console.

---

## Security Recommendations

1. **Never commit .env file** - Already in .gitignore
2. **Use strong SESSION_SECRET** - Generate with `openssl rand -base64 48`
3. **Secure escrow wallet** - Use a dedicated wallet with minimal funds
4. **Enable HTTPS** - Required for Privy authentication in production
5. **Firewall configuration** - Only expose port 80/443, block direct access to 5000
6. **Regular backups** - Backup PostgreSQL database regularly
7. **Update dependencies** - Run `npm audit fix` and `pip-audit` regularly

---

## Updating the Application

```bash
# Pull latest changes
git pull

# Update Node.js dependencies
npm install

# Update Python dependencies
cd bot
pip install -r requirements.txt --upgrade
cd ..

# Rebuild
npm run build

# Restart services (PM2)
pm2 restart all
```

---

## Support

For issues or questions:
- Check the main README.md
- Review replit.md for architecture details
- Check GitHub issues (if open source)

---

## Quick Start Checklist

- [ ] Install Node.js v18+
- [ ] Install Python 3.8+
- [ ] Install PostgreSQL or get cloud database
- [ ] Clone repository
- [ ] Run `npm install`
- [ ] Create `.env` from `.env.example`
- [ ] Configure all environment variables
- [ ] Generate session secret
- [ ] Generate escrow wallet
- [ ] Run `npm run db:push`
- [ ] Run `npm run build`
- [ ] Start with `npm run start`
- [ ] (Optional) Start Python bot
- [ ] Access http://localhost:5000

---

## Production Deployment Checklist

- [ ] Set NODE_ENV=production
- [ ] Use production BSC RPC (mainnet)
- [ ] Configure domain DNS
- [ ] Set up Nginx reverse proxy
- [ ] Enable HTTPS with Let's Encrypt
- [ ] Use PM2 for process management
- [ ] Set up PM2 startup script
- [ ] Configure firewall (ufw/iptables)
- [ ] Set up database backups
- [ ] Monitor logs regularly
- [ ] Test all features (login, tipping, claims)
