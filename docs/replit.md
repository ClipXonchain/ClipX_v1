# ClipX Bot Portal

## Overview
ClipX is a multi-platform cryptocurrency tipping bot that enables users to send BNB, ClipX, and Aaster tips on Twitter/X (currently implemented) and Telegram (planned). The system provides secure wallet creation, processes tip requests from social platforms, and executes blockchain transactions. Users authenticate via Privy (supporting Twitter OAuth and embedded wallets), manage a single wallet across platforms, and can tip anyone even if they're not yet registered (via escrow system with 3-day claim window). The platform comprises a React web portal for wallet management (including wallet import/export for backup and recovery), Python bots for platform monitoring, and an Express backend for API services.

**Supported Tokens:**
- **BNB** (native BSC token) - Used for transfers and gas fees
- **ClipX** (BEP-20 token at `0xc269d59a0d608ea0bd672f2f4616c372d8554444`)
- **Aster** (BEP-20 token at `0x000ae314e2a2172a039b26378814c252734f556a`)
- **USDT** (BEP-20 token at `0x55d398326f99059ff775485246999027b3197955`)
- **Giggle** (BEP-20 token at `0x20d6015660b3fe52e6690a889b5c51f69902ce0e`)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend uses React 18 with TypeScript and Vite, styled with shadcn/ui components (built on Radix UI) and Tailwind CSS. The design is fintech-inspired, emphasizing trust, clarity, and security with a card-based layout, sidebar navigation, QR code generation for deposits, and clear status indicators. It supports light/dark modes and uses a consistent spacing system.

### Technical Implementations

**Frontend**:
- **Framework**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui (Radix UI + Tailwind CSS)
- **Routing**: Wouter
- **State Management**: TanStack Query for server state
- **Styling**: Tailwind CSS with custom design tokens, theme system (light/dark mode)
- **Tipping Methods**: Users can send tips via Twitter mentions OR directly from the web portal's "Send Tips" page

**Backend**:
- **Runtime**: Node.js with Express.js (TypeScript, ESM)
- **Session Management**: PostgreSQL-backed sessions (`connect-pg-simple`), HTTP-only cookies, 7-day expiration.
- **Authentication**: Privy Web3 authentication (`@privy-io/react-auth`, `@privy-io/server-auth`) supporting Twitter/X, Google, GitHub, Apple, and external wallets. Uses JWTs.
- **API Design**: RESTful (`/api` namespace), JSON format, Zod validation, middleware for logging, error handling.
- **Wallet Management**: Supports Privy embedded wallets (auto-created, keys managed by Privy) and external wallets (user-connected). `walletType` field in DB. Includes wallet import/export functionality with encrypted storage.
- **Wallet Recovery**: Users can import existing wallets using private keys (with or without `0x` prefix - keys are automatically normalized before storage).
- **Database Layer**: Drizzle ORM for type-safe operations, abstract storage layer.
- **Twitter Integration**: Server-side Twitter API client (`twitter-api-v2`) for user lookups and posting announcement tweets when tips are sent from web portal.

**Bot** (`bot/nativebot.py` - Production):
- **Language**: Python 3
- **Twitter Integration**: Tweepy for Twitter API v2 (OAuth 1.0a, Bearer Token).
- **Blockchain Integration**: Web3.py for BSC interaction, POA middleware.
- **Scheduling**: APScheduler for periodic mention checking (every 5 minutes).
- **Database Access**: psycopg2 for PostgreSQL queries.
- **Queue System**: Mentions are queued and processed one-by-one with duplicate prevention via in-memory cache and database checks.
- **Enhanced Command Parsing**: Flexible regex supporting multiple tip formats with strict validation requiring BOTH action keywords (send/tip) AND token types (bnb/clipx/aster/usdt/giggle) AND explicit @clipx0_ mention to prevent false positives from conversational tweets.
- **Mention Filtering**: Bot filters out Twitter API responses that are replies to @clipx0_ posts but don't actually mention @clipx0_ in the text, preventing unwanted processing of unrelated comments. Bot also ignores tweets FROM the @clipx0_ account itself (e.g., batch send announcements) to prevent self-triggering.
- **Improved Messaging**: Unregistered users receive formatted signup instructions with website link; escrow notifications clearly explain 3-day claim period.
- **Key Features**: Processes tip mentions for BNB, ClipX, Aster, USDT, and Giggle tokens, validates users, decrypts private keys (for external wallets), executes blockchain transfers, updates transaction status, and replies to tweets with BSCscan links. Checks sender balance before processing tips and respects user's preferred gas tier. Compatible with Privy authentication system.

### System Design Choices
- **Authentication Migration**: Moved from Replit Auth to Privy for enhanced Web3 and social login capabilities, including embedded wallet management.
- **Wallet Security**: Privy manages embedded wallet private keys securely. External wallet private keys are encrypted server-side using AES-256-GCM.
- **Wallet Recovery System**: Users can export their wallet's private key for backup and import it later if needed. Private keys are automatically normalized (ensuring `0x` prefix) before encryption/storage to prevent Web3 compatibility issues. The same normalized key is used across all flows (import, export, tipping) to ensure consistency.
- **Encryption Key**: Both backend and bot use Privy user ID (`user.id`) as the encryption/decryption password, ensuring consistency across the system.
- **Balance Verification**: Bot and web portal verify sender's balance against tip amount + gas cost before processing transactions.
- **Database Schema**: Uses Drizzle ORM with Neon serverless PostgreSQL. Includes `users`, `sessions`, `wallets`, `transactions`, `tipQueue`, and `pendingClaims` tables. `walletType` field added to `wallets` table. `gasPriceUsed` and `gasUsed` added to `transactions`.
- **Escrow System**: Uses an EOA wallet (address + private key) to hold tips sent to unregistered users. Tips are held for 3 days, then automatically refunded if unclaimed.
- **Pending Claims UX**: New users with pending claims see a welcome dialog on first login. Dedicated Claims page accessible from sidebar. Dashboard shows top 2 pending claims with quick claim action. Works seamlessly with both Privy embedded and external wallets.
- **Web Portal Tipping**: New `/send-tips` page allows users to send tips directly from the web interface. Requires external wallet (with encrypted private key). Validates recipients via Twitter API, handles both registered and unregistered users (escrow), and posts announcement tweets from @clipx0_ bot account.
- **Batch Send (Group Tipping)**: New `/batch-send` page enables users to send tips to multiple recipients simultaneously. Features include duplicate recipient validation (case-insensitive), real-time balance preview with gas estimates, gas speed control (slow/standard/fast), per-recipient success/failure reporting, and Twitter announcement only when ALL transfers succeed. Supports up to 50 recipients per batch with the same amount per person. Requires external wallet.
- **Private Mode**: Users can send tips from web portal without public Twitter announcements. Private tips are marked with `isPrivate` flag in database and display a "Private" badge in transaction history. Only sender and recipient see the transaction.
- **Multi-Platform Architecture (Planned)**: Telegram integration documented in `TELEGRAM_IMPLEMENTATION.md`. Key architectural decision: migrate from Twitter ID to Privy User ID as primary identifier to support multiple platforms. Platform accounts table will link Twitter and Telegram identities to a single user and wallet. Cross-platform tipping enabled via identity resolver service.

## External Dependencies

### Third-Party Services
- **Twitter/X API**: For OAuth authentication and monitoring mentions.
- **Binance Smart Chain (BSC)**: RPC endpoint for blockchain interactions (supports testnet and mainnet).
- **Neon Database**: Serverless PostgreSQL for all application and session data.
- **Privy**: For Web3 authentication, social logins, and embedded wallet management.

### npm Packages
- **Core**: `express`, `react`, `react-dom`, `vite`, `typescript`.
- **Authentication**: `@privy-io/react-auth`, `@privy-io/server-auth`, `express-session`, `connect-pg-simple`.
- **Database**: `drizzle-orm`, `@neondatabase/serverless`, `ws`.
- **UI**: `@radix-ui/*`, `tailwindcss`, `class-variance-authority`, `lucide-react`.
- **State/Routing**: `@tanstack/react-query`, `wouter`.
- **Utilities**: `web3`, `qrcode`, `date-fns`, `zod`, `drizzle-zod`.
- **Twitter**: `twitter-api-v2` (for server-side Twitter API integration).

### Python Packages
- **Core**: `tweepy`, `web3.py`, `psycopg2`.
- **Utilities**: `apscheduler`.

## Deployment

### Production Environment
- **Hosting**: Replit Reserved VM deployment
- **Domain**: clipx0.xyz (custom domain)
- **Run Command**: `bash start-production.sh` (builds app, starts production server and Python bot)
- **Build Process**: Compiles TypeScript backend and optimizes frontend with Vite
- **Machine**: 1 vCPU / 1 GB RAM (upgradeable)
- **SSL**: Automatic HTTPS certificate via Replit

### Environment Variables (Production)
All secrets are configured in Replit secrets and automatically available to deployed applications:
- `DATABASE_URL`: Neon PostgreSQL connection string
- `PRIVY_APP_ID`, `PRIVY_APP_SECRET`: Web3 authentication
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_BEARER_TOKEN`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`: Twitter API access
- `BSC_RPC_URL`: Binance Smart Chain RPC endpoint
- `SESSION_SECRET`: Session encryption key

### Deployment Files
- `start-production.sh`: Production startup script (starts web + bot)
- `DEPLOYMENT.md`: Complete deployment guide with step-by-step instructions
- `TELEGRAM_IMPLEMENTATION.md`: Comprehensive guide for adding Telegram support (including database migration, bot development, account linking, and cross-platform features)

### Network Configuration
- **Default**: BSC Mainnet (production - real BNB transactions)
- **Mainnet RPC**: `https://bsc-dataseed.binance.org` (recommended default)
- **Testnet RPC**: `https://data-seed-prebsc-1-s1.binance.org:8545` (for testing only)
- Bot automatically detects network from RPC URL and uses correct BSCscan explorer (bscscan.com or testnet.bscscan.com)