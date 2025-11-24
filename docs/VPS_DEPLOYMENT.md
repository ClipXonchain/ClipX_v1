# ClipX VPS Deployment Guide

This guide explains how to deploy ClipX on a VPS (Virtual Private Server) such as DigitalOcean, Linode, AWS EC2, or any other Linux-based server.

---

## 📋 Prerequisites

- A Linux VPS (Ubuntu 20.04+ or similar)
- Node.js 20.x or higher installed
- PostgreSQL database (can be local or remote like Neon)
- Domain name (optional, but recommended)
- SSH access to your VPS

---

## 🚀 Quick Start

### 1. Prepare Your Environment File

On your current Replit environment, run this script to export all environment variables:

```bash
bash scripts/export-env.sh
```

This will create a `.env` file with all your current environment variables. 

**Important:** Review the `.env` file and ensure all values are correct, especially:
- Database credentials
- Privy API keys
- BSC RPC endpoint
- Escrow wallet credentials

### 2. Transfer Files to VPS

Copy your project to the VPS. You can use one of these methods:

#### Option A: Using Git (Recommended)
```bash
# On your VPS
git clone <your-repo-url>
cd <your-project>

# Copy your .env file to the project directory
scp .env user@your-vps-ip:/path/to/project/
```

#### Option B: Using SCP
```bash
# From your local machine
scp -r /path/to/project user@your-vps-ip:/home/user/
scp .env user@your-vps-ip:/home/user/project/
```

### 3. Install Dependencies on VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Navigate to project directory
cd /path/to/project

# Install Node.js dependencies
npm install

# Install Python dependencies (for the bot)
pip3 install -r requirements.txt
# or if using uv:
uv sync
```

### 4. Set Up Database

If you're using a remote database (like Neon), your `DATABASE_URL` in `.env` should already work.

If you're setting up PostgreSQL locally on the VPS:

```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE clipx;
CREATE USER clipx_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE clipx TO clipx_user;
\q

# Update your .env file with the local database URL
DATABASE_URL=postgresql://clipx_user:your_password@localhost:5432/clipx
```

### 5. Run Database Migrations

```bash
npm run db:push
```

### 6. Build the Application

```bash
npm run build
```

This will:
- Build the frontend (Vite)
- Build the backend (esbuild)
- Output production-ready files to `dist/`

### 7. Start the Application

#### Option A: Direct Start (for testing)
```bash
npm start
```

#### Option B: Using PM2 (Recommended for production)
```bash
# Install PM2 globally
npm install -g pm2

# Start the web server
pm2 start npm --name "clipx-web" -- start

# Start the bot (if using the Twitter bot)
pm2 start python3 --name "clipx-bot" -- main.py

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the instructions from the command output
```

---

## 🔧 Configuration

### Environment Variables

All required environment variables are documented in `.env.example`. Key variables:

```bash
# Server
NODE_ENV=production
PORT=5000

# Database (use one OR the other)
DATABASE_URL=postgresql://user:pass@host:port/db
# OR individual params:
PGHOST=localhost
PGPORT=5432
PGUSER=clipx_user
PGPASSWORD=your_password
PGDATABASE=clipx

# Authentication
SESSION_SECRET=your_random_secret_here
PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret

# Blockchain
BSC_RPC_URL=https://bsc-dataseed.binance.org/

# Escrow Wallet
ESCROW_WALLET_ADDRESS=0x...
ESCROW_WALLET_PRIVATE_KEY=0x...
```

### Firewall Configuration

Make sure port 5000 (or your configured PORT) is accessible:

```bash
# Using UFW (Ubuntu)
sudo ufw allow 5000
sudo ufw enable

# Verify
sudo ufw status
```

### Reverse Proxy with Nginx (Recommended)

Set up Nginx as a reverse proxy for better security and SSL:

```bash
# Install Nginx
sudo apt install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/clipx
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

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

Enable the site:

```bash
# Enable the configuration
sudo ln -s /etc/nginx/sites-available/clipx /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### SSL/HTTPS with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certbot will automatically configure Nginx for HTTPS
# Test automatic renewal
sudo certbot renew --dry-run
```

---

## 📊 Monitoring

### View Logs

```bash
# PM2 logs
pm2 logs

# View specific service
pm2 logs clipx-web
pm2 logs clipx-bot

# System logs
journalctl -u nginx -f
```

### Monitor Resources

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

---

## 🔄 Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Rebuild the application
npm run build

# Restart services
pm2 restart all
```

### Database Migrations

```bash
# After updating schema, push changes
npm run db:push
```

### Backup

```bash
# Backup database
pg_dump -U clipx_user clipx > backup_$(date +%Y%m%d).sql

# Restore database
psql -U clipx_user clipx < backup_20240101.sql
```

---

## 🐛 Troubleshooting

### Application Won't Start

1. Check environment variables:
   ```bash
   cat .env
   ```

2. Verify database connection:
   ```bash
   # Test PostgreSQL connection
   psql -U clipx_user -h localhost -d clipx
   ```

3. Check logs:
   ```bash
   pm2 logs clipx-web --lines 100
   ```

### Database Connection Issues

- Verify `DATABASE_URL` is correct
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify firewall allows database connections
- For remote databases, ensure your VPS IP is whitelisted

### Port Already in Use

```bash
# Find process using port 5000
sudo lsof -i :5000

# Kill the process
sudo kill -9 <PID>
```

### Nginx Issues

```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 🔐 Security Best Practices

1. **Environment Variables**: Never commit `.env` to version control
   ```bash
   chmod 600 .env  # Restrict permissions
   ```

2. **Firewall**: Only open necessary ports
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   sudo ufw allow ssh
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

3. **SSH**: Use key-based authentication, disable password login
   ```bash
   # In /etc/ssh/sshd_config
   PasswordAuthentication no
   PubkeyAuthentication yes
   ```

4. **Regular Updates**:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

5. **Database**: Use strong passwords, restrict access to localhost or specific IPs

---

## 💰 Cost Estimation

### VPS Options

- **DigitalOcean Droplet**: $6-12/month (Basic/Standard)
- **Linode**: $5-10/month (Nanode/Standard)
- **Vultr**: $6-12/month (Cloud Compute)
- **AWS EC2**: $8-15/month (t2.micro/t3.micro with Reserved Instance)

### Additional Costs

- Domain name: $10-15/year
- Database (if external like Neon): $0-20/month depending on usage
- SSL Certificate: Free (Let's Encrypt)

---

## ✅ Post-Deployment Checklist

- [ ] Application running on VPS
- [ ] Database migrations completed
- [ ] Environment variables configured
- [ ] PM2 process manager set up
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed (HTTPS)
- [ ] Firewall configured
- [ ] Domain DNS configured
- [ ] Application accessible via domain
- [ ] Privy authentication working
- [ ] Bot processing Twitter mentions (if applicable)
- [ ] Monitoring and logging set up
- [ ] Backup strategy in place

---

## 📞 Support

For issues specific to:
- **VPS hosting**: Contact your VPS provider
- **Domain/DNS**: Contact your domain registrar
- **ClipX application**: Check application logs with `pm2 logs`

---

## 🎉 Success!

Once all checklist items are complete, your ClipX application should be running smoothly on your VPS!

Visit `https://your-domain.com` to verify everything is working correctly.
