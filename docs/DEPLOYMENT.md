# ClipX Deployment Guide

## 🚀 Deploying to clipx0.xyz

This guide will walk you through deploying ClipX to production with your custom domain.

---

## ✅ Pre-Deployment Checklist

All environment variables are confirmed set:
- ✅ `DATABASE_URL` - Neon PostgreSQL database
- ✅ `PRIVY_APP_ID` & `PRIVY_APP_SECRET` - Web3 authentication
- ✅ `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN` - Twitter API access
- ✅ `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET` - Bot authentication
- ✅ `BSC_RPC_URL` - Binance Smart Chain RPC endpoint
- ✅ `SESSION_SECRET` - Session encryption

### Network Configuration

**Default:** BSC Mainnet (production - real BNB transactions)

Set your `BSC_RPC_URL` environment variable to:
- **Mainnet** (recommended): `https://bsc-dataseed.binance.org`
- **Testnet** (testing only): `https://data-seed-prebsc-1-s1.binance.org:8545`

⚠️ **Important:** Mainnet uses real BNB. Make sure your `BSC_RPC_URL` is set correctly before deploying.

The bot automatically detects which network you're using and includes the correct BSCscan explorer links in replies:
- Mainnet: `https://bscscan.com/tx/...`
- Testnet: `https://testnet.bscscan.com/tx/...`

---

## 📋 Deployment Steps

### Step 1: Deploy to Replit Reserved VM

1. **Click the "Deploy" button** in your Replit workspace
2. **Select "Reserved VM Deployment"**
3. **Configure deployment settings:**

   **Run Command:**
   ```bash
   bash start-production.sh
   ```

   **Machine Type:**
   - Start with: **1 vCPU / 1 GB RAM**
   - Can upgrade later if needed

   **Environment:**
   - All secrets will be automatically available
   - No additional configuration needed

4. **Add payment method** if prompted
5. **Click "Deploy"** or **"Publish"**
6. **Wait 2-3 minutes** for deployment to complete

---

### Step 2: Verify Deployment

Once deployed, check the logs:

**Look for these success messages:**
```
Starting ClipX Production Environment...
Building application...
[build output for frontend and backend]
Build complete!
Starting production web server...
Web server PID: [number]
Starting Twitter/X tipping bot...
Bot PID: [number]
ClipX is now running!
Monitoring processes...
[WEB] Server running on port 5000 in production mode
[BOT] Bot scheduled to check mentions every 300 seconds
```

The startup script automatically:
- Builds optimized production bundles (frontend + backend)
- Starts the compiled production server
- Monitors both processes and restarts them if they crash

**Test the deployment URL:**
- Visit your `*.replit.app` URL
- Try logging in with Privy
- Generate a test wallet

---

### Step 3: Add Custom Domain (clipx0.xyz)

1. **In Replit, go to:**
   - Deployments tab → Settings tab
   - Click "Link a domain" or "Custom Domains"

2. **Enter your domain:**
   ```
   clipx0.xyz
   ```

3. **Replit will show DNS records like:**
   ```
   A Record:
   Hostname: @
   Value: 123.45.67.89  (actual IP will be shown)

   TXT Record:
   Hostname: @
   Value: replit-verify=abc123xyz456  (actual code will be shown)
   ```

---

### Step 4: Configure DNS at Your Domain Registrar

**Go to where you purchased clipx0.xyz** (GoDaddy, Namecheap, Cloudflare, etc.)

#### Example: GoDaddy
1. Log in → My Products → DNS
2. Add **A Record**:
   - Name: `@` (or leave blank)
   - Value: `[IP from Replit]`
   - TTL: 600
3. Add **TXT Record**:
   - Name: `@`
   - Value: `[verification code from Replit]`
   - TTL: 600

#### Example: Namecheap
1. Log in → Manage Domain → Advanced DNS
2. Add **A Record**:
   - Host: `@`
   - Value: `[IP from Replit]`
   - TTL: Automatic
3. Add **TXT Record**:
   - Host: `@`
   - Value: `[verification code]`

#### Example: Cloudflare
1. DNS settings for your domain
2. Add **A Record**:
   - Name: `@`
   - IPv4 address: `[IP from Replit]`
   - **IMPORTANT:** Turn **OFF** proxy (gray cloud, not orange)
3. Add **TXT Record**:
   - Name: `@`
   - Content: `[verification code]`

⚠️ **Cloudflare Users:** Must disable proxy (keep it DNS only) or SSL auto-renewal won't work.

---

### Step 5: Wait for DNS Propagation

- **Typical time:** 5-30 minutes
- **Maximum time:** Up to 48 hours (rare)
- Check status in Replit's Deployments → Settings
- Wait for **"Verified"** status

**Check DNS propagation:**
```bash
# On your local machine
dig clipx0.xyz
# Should show the IP from Replit
```

---

### Step 6: Test Production Site

1. **Visit:** `https://clipx0.xyz`
2. **Test login:** Use Privy authentication
3. **Test wallet:** Generate a tipping wallet
4. **Test tipping:** Send a test tip via Twitter:
   ```
   @clipx0_ send 0.0001 bnb to @someuser
   ```
5. **Check bot response:** Should reply with BSCscan link

---

## 🎯 Post-Deployment

### Monitoring
- **View logs:** Deployments → Logs tab
- **Check metrics:** CPU, memory, request counts
- **Set alerts:** For errors or high usage

### Scaling
If you need more resources:
1. Go to Deployments → Settings
2. Upgrade to 2 vCPU / 2 GB RAM
3. Or higher as needed

### Using Testnet for Testing
If you want to test without real BNB first:
1. Set `BSC_RPC_URL` to `https://data-seed-prebsc-1-s1.binance.org:8545`
2. Deploy the application
3. Bot will automatically use `testnet.bscscan.com` for transaction links
4. Get free testnet BNB from a BSC testnet faucet
5. When ready, switch back to mainnet by updating `BSC_RPC_URL` to `https://bsc-dataseed.binance.org`

---

## 💰 Cost Estimate

**Reserved VM (1 vCPU / 1 GB RAM):**
- Approximately **$7-15/month**
- Includes your Replit plan credits
- Only pay extra if you exceed monthly allowance

---

## 📊 Process Monitoring

The startup script (`start-production.sh`) provides automatic supervision:
- **Health checks**: Every 30 seconds, both processes are checked
- **Auto-restart**: If either process crashes, it's automatically restarted
- **Graceful shutdown**: Handles SIGTERM/SIGINT properly for clean restarts
- **Prefixed logs**: All logs are tagged with `[WEB]` or `[BOT]` for easy filtering

**Viewing Logs:**
- In Replit: Go to Deployments → Logs tab
- Filter by `[WEB]` to see only web server logs
- Filter by `[BOT]` to see only bot logs
- Look for `ERROR:` to find crash/restart events

**Production Build Process:**
The startup script runs `npm run build` which:
- Compiles TypeScript backend with esbuild
- Builds optimized frontend with Vite
- Creates production-ready bundles in `dist/` directory
- Then runs `npm start` to serve the compiled application

---

## 🔧 Troubleshooting

### Domain Not Verifying?
- Wait longer (DNS can take time)
- Double-check DNS records match exactly
- Ensure no conflicting A records exist
- Remove any AAAA (IPv6) records

### Bot Not Processing Tips?
- Check deployment logs for errors
- Verify Twitter API credentials are correct
- Ensure BSC_RPC_URL is accessible
- Check user has wallet linked in database

### Web Portal Not Loading?
- Verify deployment is running (check logs)
- Ensure port 5000 is properly configured
- Check Privy credentials are correct

---

## 📞 Support

For Replit deployment issues:
- Contact Replit support via the platform

For ClipX-specific issues:
- Check deployment logs in Replit
- Verify all environment variables are set
- Review bot logs for Twitter/BSC errors

---

## ✅ Success Checklist

- [ ] Deployment running successfully
- [ ] Web portal accessible at clipx0.xyz
- [ ] Privy authentication working
- [ ] Users can generate wallets
- [ ] Bot processing Twitter mentions
- [ ] Bot replying with BSCscan links
- [ ] SSL certificate active (https://)

Once all checked, you're live! 🎉
