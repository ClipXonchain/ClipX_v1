# ClipX - VPS Deployment Quick Start

This project has been configured for deployment on a VPS (Virtual Private Server).

## 🔄 Changes Made for VPS Compatibility

The following Replit-specific components have been removed or made optional:

1. **Removed**: `server/replitAuth.ts` (Replit OAuth) - The app now uses Privy authentication exclusively
2. **Made Optional**: Replit Vite plugins (only load when `REPL_ID` environment variable is present)
3. **Added**: `.env` file support via `dotenv` package
4. **Added**: Environment export script (`scripts/export-env.sh`)
5. **Updated**: Comments and documentation to be platform-agnostic

## 🚀 Quick Deployment Steps

### 1. Export Environment Variables (Run on Replit)

```bash
bash scripts/export-env.sh
```

This creates a `.env` file with all your current secrets.

### 2. Transfer to Your VPS

```bash
# Copy the .env file to your VPS
scp .env user@your-vps-ip:/path/to/project/

# Or clone this repo and add .env manually
git clone <your-repo>
cd <project>
# Upload your .env file here
```

### 3. Install & Build

```bash
npm install
npm run build
```

### 4. Run the Application

```bash
# Development
npm run dev

# Production
npm start
```

## 📋 Required Environment Variables

See `.env.example` for a complete list with descriptions. Key variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=...
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...
BSC_RPC_URL=https://bsc-dataseed.binance.org/
ESCROW_WALLET_ADDRESS=0x...
ESCROW_WALLET_PRIVATE_KEY=0x...
```

## 📖 Full Documentation

- **VPS Deployment Guide**: See `VPS_DEPLOYMENT.md` for complete VPS setup instructions
- **Replit Deployment**: See `DEPLOYMENT.md` for Replit-specific deployment

## 🔐 Security Notes

- The `.env` file is in `.gitignore` and should NEVER be committed
- Always use `chmod 600 .env` to restrict file permissions
- Rotate your `SESSION_SECRET` regularly
- Keep your `ESCROW_WALLET_PRIVATE_KEY` secure

## ✅ What Still Works

Everything works the same as on Replit:
- ✅ Privy authentication
- ✅ PostgreSQL database (local or remote)
- ✅ Twitter bot functionality
- ✅ BSC blockchain integration
- ✅ All API endpoints

## 🆚 Differences from Replit Deployment

| Feature | Replit | VPS |
|---------|--------|-----|
| Environment Variables | Secrets UI | `.env` file |
| Authentication | Replit OAuth or Privy | Privy only |
| Reverse Proxy | Built-in | Nginx (recommended) |
| SSL | Automatic | Let's Encrypt (manual setup) |
| Process Management | Built-in | PM2 (recommended) |
| Cost | ~$15/month | ~$6-12/month |

## 🐛 Troubleshooting

### "Cannot find module 'dotenv'"
```bash
npm install dotenv
```

### "DATABASE_URL must be set"
Make sure your `.env` file exists and contains `DATABASE_URL`

### Port already in use
Change `PORT` in your `.env` file or kill the process using that port

## 🎯 Next Steps

1. ✅ Export your environment with `scripts/export-env.sh`
2. ✅ Review the generated `.env` file
3. ✅ Follow `VPS_DEPLOYMENT.md` for full setup
4. ✅ Set up Nginx reverse proxy for HTTPS
5. ✅ Configure PM2 for process management
6. ✅ Set up monitoring and backups

---

Happy deploying! 🚀
