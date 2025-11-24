# ClipX Telegram Integration - Implementation Guide

## 🎯 Project Overview

Extend ClipX tipping bot to support Telegram alongside Twitter/X, enabling users to send and receive BNB tips across both platforms with a unified wallet and account system.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema Changes](#database-schema-changes)
3. [Phase 1: Foundation & Migration](#phase-1-foundation--migration)
4. [Phase 2: Telegram Bot Development](#phase-2-telegram-bot-development)
5. [Phase 3: Account Linking System](#phase-3-account-linking-system)
6. [Phase 4: Cross-Platform Features](#phase-4-cross-platform-features)
7. [Phase 5: Testing & Launch](#phase-5-testing--launch)
8. [API Endpoints](#api-endpoints)
9. [Security Considerations](#security-considerations)
10. [Deployment Strategy](#deployment-strategy)

---

## Architecture Overview

### Current System (Twitter-Only)
```
Twitter User → Privy Auth → User (twitterId) → Wallet
                                              ↓
                                         Transactions
Twitter Bot → Mentions → Tip Processing → Blockchain
```

### New System (Multi-Platform)
```
Twitter User ──┐
               ├→ Privy Auth → User (privy_user_id) → Wallet
Telegram User ─┘                     ↓                  ↓
                              Platform Accounts    Transactions
                                     ↓
Twitter Bot ──┐                      
              ├→ Shared Tip Processor → Blockchain
Telegram Bot ─┘
```

### Key Principles

1. **One Wallet Per User**: Regardless of platform(s) used
2. **Platform-Agnostic Core**: Business logic doesn't care about platform
3. **Optional Linking**: Users can use one or both platforms
4. **Universal Tipping**: Tip anyone on any platform from any platform
5. **Shared Escrow**: Pending claims work cross-platform

---

## Database Schema Changes

### 1. Modify Users Table

**Current Schema:**
```sql
CREATE TABLE users (
  "twitterId" TEXT PRIMARY KEY,
  username TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

**New Schema:**
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  privy_user_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Legacy column (keep for backward compatibility during migration)
  "twitterId" TEXT UNIQUE
);

CREATE INDEX idx_users_privy_id ON users(privy_user_id);
```

### 2. Create Platform Accounts Table

```sql
CREATE TABLE platform_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'telegram')),
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  linked_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  
  UNIQUE(platform, platform_user_id),
  UNIQUE(platform, username)
);

CREATE INDEX idx_platform_accounts_user ON platform_accounts(user_id);
CREATE INDEX idx_platform_accounts_lookup ON platform_accounts(platform, platform_user_id);
CREATE INDEX idx_platform_accounts_username ON platform_accounts(platform, username);
```

### 3. Update Wallets Table

```sql
-- Add user_id foreign key, keep twitterId for migration
ALTER TABLE wallets ADD COLUMN user_id INTEGER REFERENCES users(id);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);

-- After migration is complete, you can drop twitterId column
-- ALTER TABLE wallets DROP COLUMN "twitterId";
```

### 4. Update Pending Claims Table

**Current Schema:**
```sql
CREATE TABLE "pendingClaims" (
  "toTwitterUsername" TEXT,
  amount TEXT,
  -- ...
);
```

**New Schema:**
```sql
CREATE TABLE pending_claims (
  id SERIAL PRIMARY KEY,
  to_platform TEXT NOT NULL CHECK (to_platform IN ('twitter', 'telegram')),
  to_platform_user_id TEXT,
  to_username TEXT NOT NULL,
  
  from_platform TEXT NOT NULL,
  from_user_id INTEGER REFERENCES users(id),
  from_username TEXT,
  
  amount TEXT NOT NULL,
  escrow_tx_hash TEXT NOT NULL,
  tweet_id TEXT,
  message_id TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  claimed_at TIMESTAMP,
  claimed_by_user_id INTEGER REFERENCES users(id),
  refunded_at TIMESTAMP,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'refunded', 'expired'))
);

CREATE INDEX idx_pending_claims_recipient ON pending_claims(to_platform, to_username) WHERE status = 'pending';
CREATE INDEX idx_pending_claims_expiry ON pending_claims(expires_at) WHERE status = 'pending';
```

### 5. Update Transactions Table

```sql
ALTER TABLE transactions ADD COLUMN from_platform TEXT DEFAULT 'twitter';
ALTER TABLE transactions ADD COLUMN to_platform TEXT DEFAULT 'twitter';
ALTER TABLE transactions ADD COLUMN message_id TEXT;

-- Add index for platform-specific queries
CREATE INDEX idx_transactions_platform ON transactions(from_platform, to_platform);
```

### 6. Create Tip Queue Table

```sql
CREATE TABLE tip_queue (
  id SERIAL PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('twitter', 'telegram')),
  source_message_id TEXT NOT NULL,
  
  from_user_id INTEGER REFERENCES users(id),
  from_username TEXT NOT NULL,
  from_platform_user_id TEXT,
  
  to_username TEXT NOT NULL,
  to_platform TEXT NOT NULL,
  
  amount TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  
  UNIQUE(source_platform, source_message_id)
);

CREATE INDEX idx_tip_queue_status ON tip_queue(status, created_at);
```

### 7. Create Platform Events Table (Audit Trail)

```sql
CREATE TABLE platform_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  platform_user_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_platform_events_user ON platform_events(user_id, created_at DESC);
CREATE INDEX idx_platform_events_type ON platform_events(event_type, created_at DESC);
```

---

## Phase 1: Foundation & Migration

### Step 1.1: Database Migration Script

Create `migrations/001_multiplatform_foundation.sql`:

```sql
-- Step 1: Add new columns to users table
ALTER TABLE users ADD COLUMN id SERIAL;
ALTER TABLE users ADD COLUMN privy_user_id TEXT UNIQUE;
ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT NOW();

-- Step 2: Create platform_accounts table
CREATE TABLE platform_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'telegram')),
  platform_user_id TEXT NOT NULL,
  username TEXT NOT NULL,
  display_name TEXT,
  metadata JSONB DEFAULT '{}',
  linked_at TIMESTAMP DEFAULT NOW(),
  verified BOOLEAN DEFAULT TRUE,
  UNIQUE(platform, platform_user_id),
  UNIQUE(platform, username)
);

-- Step 3: Backfill platform_accounts with existing Twitter data
INSERT INTO platform_accounts (user_id, platform, platform_user_id, username, linked_at)
SELECT id, 'twitter', "twitterId", username, "createdAt"
FROM users
WHERE "twitterId" IS NOT NULL;

-- Step 4: Update wallets to use user_id
ALTER TABLE wallets ADD COLUMN user_id INTEGER;
UPDATE wallets SET user_id = (SELECT id FROM users WHERE users."twitterId" = wallets."twitterId");
ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id);

-- Step 5: Create tip_queue table
CREATE TABLE tip_queue (
  id SERIAL PRIMARY KEY,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('twitter', 'telegram')),
  source_message_id TEXT NOT NULL,
  from_user_id INTEGER REFERENCES users(id),
  from_username TEXT NOT NULL,
  from_platform_user_id TEXT,
  to_username TEXT NOT NULL,
  to_platform TEXT NOT NULL,
  amount TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP,
  UNIQUE(source_platform, source_message_id)
);

-- Step 6: Create platform_events table
CREATE TABLE platform_events (
  id SERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id),
  platform_user_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 7: Add platform columns to transactions
ALTER TABLE transactions ADD COLUMN from_platform TEXT DEFAULT 'twitter';
ALTER TABLE transactions ADD COLUMN to_platform TEXT DEFAULT 'twitter';
ALTER TABLE transactions ADD COLUMN message_id TEXT;

-- Step 8: Create indexes
CREATE INDEX idx_users_privy_id ON users(privy_user_id);
CREATE INDEX idx_platform_accounts_user ON platform_accounts(user_id);
CREATE INDEX idx_platform_accounts_lookup ON platform_accounts(platform, platform_user_id);
CREATE INDEX idx_platform_accounts_username ON platform_accounts(platform, username);
CREATE INDEX idx_wallets_user_id ON wallets(user_id);
CREATE INDEX idx_tip_queue_status ON tip_queue(status, created_at);
CREATE INDEX idx_platform_events_user ON platform_events(user_id, created_at DESC);
CREATE INDEX idx_platform_events_type ON platform_events(event_type, created_at DESC);
CREATE INDEX idx_transactions_platform ON transactions(from_platform, to_platform);
```

### Step 1.2: Update Drizzle Schema

Create `shared/schema-multiplatform.ts`:

```typescript
import { pgTable, serial, text, timestamp, integer, jsonb, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table (platform-agnostic)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  privyUserId: text('privy_user_id').unique().notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  // Legacy
  twitterId: text('twitterId').unique(),
});

// Platform accounts linking
export const platformAccounts = pgTable('platform_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  platform: text('platform').notNull(), // 'twitter' | 'telegram'
  platformUserId: text('platform_user_id').notNull(),
  username: text('username').notNull(),
  displayName: text('display_name'),
  metadata: jsonb('metadata').default({}),
  linkedAt: timestamp('linked_at').defaultNow(),
  verified: boolean('verified').default(false),
}, (table) => ({
  platformUserUnique: uniqueIndex('platform_user_unique').on(table.platform, table.platformUserId),
  platformUsernameUnique: uniqueIndex('platform_username_unique').on(table.platform, table.username),
}));

// Tip queue for async processing
export const tipQueue = pgTable('tip_queue', {
  id: serial('id').primaryKey(),
  sourcePlatform: text('source_platform').notNull(),
  sourceMessageId: text('source_message_id').notNull(),
  fromUserId: integer('from_user_id').references(() => users.id),
  fromUsername: text('from_username').notNull(),
  fromPlatformUserId: text('from_platform_user_id'),
  toUsername: text('to_username').notNull(),
  toPlatform: text('to_platform').notNull(),
  amount: text('amount').notNull(),
  status: text('status').default('pending'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').defaultNow(),
  processedAt: timestamp('processed_at'),
});

// Platform events for audit
export const platformEvents = pgTable('platform_events', {
  id: serial('id').primaryKey(),
  eventType: text('event_type').notNull(),
  platform: text('platform').notNull(),
  userId: integer('user_id').references(() => users.id),
  platformUserId: text('platform_user_id'),
  metadata: jsonb('metadata').default({}),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  platforms: many(platformAccounts),
  wallet: one(wallets),
  tips: many(transactions),
}));

export const platformAccountsRelations = relations(platformAccounts, ({ one }) => ({
  user: one(users, {
    fields: [platformAccounts.userId],
    references: [users.id],
  }),
}));
```

### Step 1.3: Create Identity Resolver Service

Create `server/services/identity-resolver.ts`:

```typescript
import { db } from '../db';
import { users, platformAccounts, pendingClaims } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

export interface PlatformIdentity {
  platform: 'twitter' | 'telegram';
  username: string;
  platformUserId?: string;
}

export interface ResolvedUser {
  userId: number;
  privyUserId: string;
  walletAddress?: string;
  platforms: Array<{
    platform: string;
    username: string;
    platformUserId: string;
  }>;
}

export class IdentityResolver {
  /**
   * Resolve a platform handle to a ClipX user
   */
  static async resolveUser(identity: PlatformIdentity): Promise<ResolvedUser | null> {
    const account = await db.query.platformAccounts.findFirst({
      where: and(
        eq(platformAccounts.platform, identity.platform),
        eq(platformAccounts.username, identity.username)
      ),
      with: {
        user: {
          with: {
            platforms: true,
            wallet: true,
          }
        }
      }
    });

    if (!account) return null;

    return {
      userId: account.user.id,
      privyUserId: account.user.privyUserId,
      walletAddress: account.user.wallet?.address,
      platforms: account.user.platforms.map(p => ({
        platform: p.platform,
        username: p.username,
        platformUserId: p.platformUserId,
      })),
    };
  }

  /**
   * Check if a user has pending claims for this identity
   */
  static async getPendingClaims(identity: PlatformIdentity) {
    return await db.query.pendingClaims.findMany({
      where: and(
        eq(pendingClaims.toPlatform, identity.platform),
        eq(pendingClaims.toUsername, identity.username),
        eq(pendingClaims.status, 'pending')
      ),
    });
  }

  /**
   * Link a new platform account to an existing user
   */
  static async linkPlatformAccount(
    privyUserId: string,
    identity: PlatformIdentity & { platformUserId: string; displayName?: string }
  ) {
    // Find user by Privy ID
    const user = await db.query.users.findFirst({
      where: eq(users.privyUserId, privyUserId),
    });

    if (!user) throw new Error('User not found');

    // Check if this platform account is already linked
    const existing = await db.query.platformAccounts.findFirst({
      where: and(
        eq(platformAccounts.platform, identity.platform),
        eq(platformAccounts.platformUserId, identity.platformUserId)
      ),
    });

    if (existing) {
      if (existing.userId === user.id) {
        return existing; // Already linked to this user
      }
      throw new Error('Platform account already linked to another user');
    }

    // Create new platform account link
    const [newAccount] = await db.insert(platformAccounts).values({
      userId: user.id,
      platform: identity.platform,
      platformUserId: identity.platformUserId,
      username: identity.username,
      displayName: identity.displayName,
      verified: true,
    }).returning();

    return newAccount;
  }

  /**
   * Get all platform accounts for a user
   */
  static async getUserPlatforms(privyUserId: string) {
    const user = await db.query.users.findFirst({
      where: eq(users.privyUserId, privyUserId),
      with: {
        platforms: true,
      }
    });

    return user?.platforms || [];
  }
}
```

### Step 1.4: Gradual Privy ID Backfill

Create `server/middleware/privy-id-sync.ts`:

```typescript
import { db } from '../db';
import { users } from '../../shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Middleware to backfill privy_user_id for existing users
 */
export async function syncPrivyUserId(req: any, res: any, next: any) {
  if (!req.user?.id) return next();

  try {
    const twitterId = req.user.twitter?.subject;
    
    if (!twitterId) return next();

    const existingUser = await db.query.users.findFirst({
      where: eq(users.twitterId, twitterId),
    });

    if (existingUser && !existingUser.privyUserId) {
      // Backfill privy_user_id
      await db.update(users)
        .set({ 
          privyUserId: req.user.id,
          updatedAt: new Date(),
        })
        .where(eq(users.twitterId, twitterId));
      
      console.log(`✓ Backfilled Privy ID for user ${twitterId}`);
    }
  } catch (error) {
    console.error('Error syncing Privy user ID:', error);
  }

  next();
}
```

---

## Phase 2: Telegram Bot Development

### Step 2.1: Telegram Bot Setup

**Get Bot Token from BotFather:**
```
1. Open Telegram and search for @BotFather
2. Send /newbot
3. Choose a name: "ClipX Tip Bot"
4. Choose a username: "clipx_tip_bot" (must end in _bot)
5. Copy the token
```

**Dependencies:**
```bash
pip install python-telegram-bot==20.7 web3 psycopg2-binary cryptography python-dotenv
```

**Environment Variables:**
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=clipx_tip_bot
APP_URL=https://clipx0.xyz
```

### Step 2.2: Telegram Bot Core (`bot/telegram_bot.py`)

```python
import os
import logging
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import psycopg2
from web3 import Web3
from web3.middleware import geth_poa_middleware
from dotenv import load_dotenv
import re
from datetime import datetime, timedelta
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.backends import default_backend
import hashlib
import base64

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
DATABASE_URL = os.getenv('DATABASE_URL')
BSC_RPC_URL = os.getenv('BSC_RPC_URL')
ESCROW_ADDRESS = os.getenv('ESCROW_ADDRESS')
ESCROW_PRIVATE_KEY = os.getenv('ESCROW_PRIVATE_KEY')
APP_URL = os.getenv('APP_URL', 'https://clipx0.xyz')

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(BSC_RPC_URL))
w3.middleware_onion.inject(geth_poa_middleware, layer=0)

class TelegramTipBot:
    def __init__(self):
        self.conn = psycopg2.connect(DATABASE_URL)
        self.processed_messages = set()
    
    def parse_tip_command(self, text):
        """
        Parse tip commands like:
        /tip @username 0.1
        $tip @username 0.1 BNB
        """
        pattern = r'(?:/tip|\\$tip)\s+@?(\w+)\s+([\d.]+)'
        match = re.search(pattern, text, re.IGNORECASE)
        
        if match:
            return {
                'to_username': match.group(1),
                'amount': match.group(2)
            }
        return None
    
    def decrypt_private_key(self, encrypted_key_base64, privy_user_id):
        """Decrypt wallet private key using Privy user ID"""
        try:
            encrypted_data = base64.b64decode(encrypted_key_base64)
            nonce = encrypted_data[:12]
            ciphertext = encrypted_data[12:]
            
            password_hash = hashlib.sha256(privy_user_id.encode()).digest()
            aesgcm = AESGCM(password_hash)
            
            private_key = aesgcm.decrypt(nonce, ciphertext, None)
            return private_key.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            return None
    
    async def handle_tip(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /tip command"""
        message = update.message
        sender = message.from_user
        
        # Prevent duplicate processing
        msg_id = f"{message.chat_id}_{message.message_id}"
        if msg_id in self.processed_messages:
            return
        self.processed_messages.add(msg_id)
        
        # Parse command
        tip_data = self.parse_tip_command(message.text)
        if not tip_data:
            await message.reply_text(
                "❌ Invalid format!\n\n"
                "Use: /tip @username 0.1\n"
                "Example: /tip @alice 0.05"
            )
            return
        
        # Insert into tip queue
        cursor = self.conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO tip_queue (
                    source_platform, source_message_id,
                    from_username, from_platform_user_id,
                    to_username, to_platform,
                    amount, status
                ) VALUES (
                    'telegram', %s, %s, %s, %s, 'telegram', %s, 'pending'
                )
                RETURNING id
            """, (
                str(message.message_id),
                sender.username or sender.first_name,
                str(sender.id),
                tip_data['to_username'],
                tip_data['amount']
            ))
            
            tip_id = cursor.fetchone()[0]
            self.conn.commit()
            
            await message.reply_text(
                f"⏳ Processing your tip of {tip_data['amount']} BNB to @{tip_data['to_username']}...\n"
                "I'll confirm once it's sent!"
            )
            
            # Process the tip
            await self.process_tip(tip_id, message)
            
        except psycopg2.errors.UniqueViolation:
            self.conn.rollback()
            await message.reply_text("⚠️ This tip has already been processed!")
        except Exception as e:
            logger.error(f"Error queuing tip: {e}")
            self.conn.rollback()
            await message.reply_text("❌ Failed to process tip. Please try again.")
        finally:
            cursor.close()
    
    async def process_tip(self, tip_id, message):
        """Process tip from queue"""
        cursor = self.conn.cursor()
        
        try:
            # Update status to processing
            cursor.execute("UPDATE tip_queue SET status = 'processing' WHERE id = %s", (tip_id,))
            self.conn.commit()
            
            # Get tip details
            cursor.execute("""
                SELECT from_username, from_platform_user_id, to_username, amount
                FROM tip_queue WHERE id = %s
            """, (tip_id,))
            
            tip = cursor.fetchone()
            if not tip:
                return
            
            from_username, from_platform_user_id, to_username, amount = tip
            amount_wei = w3.to_wei(float(amount), 'ether')
            
            # Check if sender is registered
            cursor.execute("""
                SELECT u.id, u.privy_user_id, w.address, w.wallet_type, w.encrypted_private_key
                FROM users u
                JOIN platform_accounts pa ON u.id = pa.user_id
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE pa.platform = 'telegram' AND pa.platform_user_id = %s
            """, (from_platform_user_id,))
            
            sender = cursor.fetchone()
            
            if not sender:
                await message.reply_text(
                    "🔐 You need to register first!\n\n"
                    f"Visit {APP_URL} to create your wallet and start tipping."
                )
                cursor.execute("UPDATE tip_queue SET status = 'failed', error_message = 'Sender not registered' WHERE id = %s", (tip_id,))
                self.conn.commit()
                return
            
            sender_user_id, privy_user_id, sender_address, wallet_type, encrypted_key = sender
            
            # Check if sender has external wallet (needed for bot tipping)
            if wallet_type != 'external':
                await message.reply_text(
                    "⚠️ To send tips via Telegram, you need an external wallet.\n\n"
                    "Privy embedded wallets can receive tips but can't send them via bot commands.\n\n"
                    f"Add an external wallet at {APP_URL}/wallet"
                )
                cursor.execute("UPDATE tip_queue SET status = 'failed', error_message = 'No external wallet' WHERE id = %s", (tip_id,))
                self.conn.commit()
                return
            
            # Decrypt private key
            private_key = self.decrypt_private_key(encrypted_key, privy_user_id)
            if not private_key:
                await message.reply_text("❌ Failed to decrypt wallet. Please contact support.")
                cursor.execute("UPDATE tip_queue SET status = 'failed', error_message = 'Decryption failed' WHERE id = %s", (tip_id,))
                self.conn.commit()
                return
            
            # Check balance
            balance = w3.eth.get_balance(sender_address)
            gas_price = w3.eth.gas_price
            gas_limit = 21000
            total_needed = amount_wei + (gas_price * gas_limit)
            
            if balance < total_needed:
                needed_bnb = w3.from_wei(total_needed - balance, 'ether')
                await message.reply_text(
                    f"❌ Insufficient balance!\n\n"
                    f"You need {needed_bnb:.6f} more BNB for this tip (including gas)."
                )
                cursor.execute("UPDATE tip_queue SET status = 'failed', error_message = 'Insufficient balance' WHERE id = %s", (tip_id,))
                self.conn.commit()
                return
            
            # Check if recipient is registered
            cursor.execute("""
                SELECT u.id, w.address
                FROM users u
                JOIN platform_accounts pa ON u.id = pa.user_id
                LEFT JOIN wallets w ON u.id = w.user_id
                WHERE pa.platform = 'telegram' AND pa.username = %s
            """, (to_username,))
            
            recipient = cursor.fetchone()
            
            if recipient and recipient[1]:
                # Direct tip to registered user
                recipient_user_id, recipient_address = recipient
                
                # Send transaction
                account = w3.eth.account.from_key(private_key)
                nonce = w3.eth.get_transaction_count(sender_address)
                
                transaction = {
                    'nonce': nonce,
                    'to': recipient_address,
                    'value': amount_wei,
                    'gas': gas_limit,
                    'gasPrice': gas_price,
                }
                
                signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
                tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
                tx_hash_hex = tx_hash.hex()
                
                # Wait for confirmation
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                
                # Record transaction
                cursor.execute("""
                    INSERT INTO transactions (
                        "fromTwitterUsername", "toTwitterUsername",
                        amount, "txHash", "tweetId", status,
                        "gasPriceUsed", "gasUsed",
                        from_platform, to_platform, message_id
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    from_username, to_username, amount, tx_hash_hex,
                    str(message.message_id), 'completed',
                    str(gas_price), str(receipt['gasUsed']),
                    'telegram', 'telegram', str(message.message_id)
                ))
                
                cursor.execute("UPDATE tip_queue SET status = 'completed', processed_at = NOW() WHERE id = %s", (tip_id,))
                self.conn.commit()
                
                explorer_url = f"https://bscscan.com/tx/{tx_hash_hex}"
                await message.reply_text(
                    f"✅ Tip sent successfully!\n\n"
                    f"💰 {amount} BNB → @{to_username}\n"
                    f"🔗 {explorer_url}"
                )
                
            else:
                # Escrow for unregistered user
                escrow_account = w3.eth.account.from_key(ESCROW_PRIVATE_KEY)
                nonce = w3.eth.get_transaction_count(sender_address)
                
                transaction = {
                    'nonce': nonce,
                    'to': ESCROW_ADDRESS,
                    'value': amount_wei,
                    'gas': gas_limit,
                    'gasPrice': gas_price,
                }
                
                signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
                tx_hash = w3.eth.send_raw_transaction(signed_txn.rawTransaction)
                tx_hash_hex = tx_hash.hex()
                
                receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
                
                # Create pending claim
                expires_at = datetime.now() + timedelta(days=3)
                cursor.execute("""
                    INSERT INTO pending_claims (
                        to_platform, to_username, from_platform,
                        from_user_id, from_username, amount,
                        escrow_tx_hash, message_id, expires_at, status
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                """, (
                    'telegram', to_username, 'telegram',
                    sender_user_id, from_username, amount,
                    tx_hash_hex, str(message.message_id), expires_at
                ))
                
                cursor.execute("UPDATE tip_queue SET status = 'completed', processed_at = NOW() WHERE id = %s", (tip_id,))
                self.conn.commit()
                
                await message.reply_text(
                    f"✅ Tip held in escrow!\n\n"
                    f"💰 {amount} BNB for @{to_username}\n\n"
                    f"@{to_username} can claim this tip by registering at {APP_URL}\n"
                    f"Expires in 3 days if unclaimed."
                )
            
        except Exception as e:
            logger.error(f"Error processing tip {tip_id}: {e}")
            cursor.execute("UPDATE tip_queue SET status = 'failed', error_message = %s WHERE id = %s", (str(e), tip_id))
            self.conn.commit()
            await message.reply_text(f"❌ Failed to send tip: {str(e)}")
        finally:
            cursor.close()
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.message.from_user
        
        welcome_text = (
            f"👋 Welcome to ClipX, {user.first_name}!\n\n"
            "💰 Send BNB tips to anyone on Telegram:\n"
            "   /tip @username 0.1\n\n"
            "🔗 Register your wallet:\n"
            f"   {APP_URL}\n\n"
            "📊 Check your balance:\n"
            "   /balance\n\n"
            "❓ Need help?\n"
            "   /help"
        )
        
        await update.message.reply_text(welcome_text)
        
        # Check for pending claims
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT COUNT(*), COALESCE(SUM(CAST(amount AS NUMERIC)), 0)
            FROM pending_claims
            WHERE to_platform = 'telegram'
            AND (to_platform_user_id = %s OR to_username = %s)
            AND status = 'pending'
        """, (str(user.id), user.username))
        
        result = cursor.fetchone()
        cursor.close()
        
        if result and result[0] > 0:
            await update.message.reply_text(
                f"🎁 You have {result[0]} pending tip(s) worth {result[1]} BNB!\n\n"
                f"Register at {APP_URL} to claim them before they expire."
            )
    
    async def balance_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /balance command"""
        user = update.message.from_user
        
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT w.address
            FROM users u
            JOIN platform_accounts pa ON u.id = pa.user_id
            JOIN wallets w ON u.id = w.user_id
            WHERE pa.platform = 'telegram' AND pa.platform_user_id = %s
        """, (str(user.id),))
        
        result = cursor.fetchone()
        cursor.close()
        
        if not result:
            await update.message.reply_text(
                f"⚠️ You're not registered yet!\n\n"
                f"Create your wallet at {APP_URL}"
            )
            return
        
        wallet_address = result[0]
        balance_wei = w3.eth.get_balance(wallet_address)
        balance_bnb = w3.from_wei(balance_wei, 'ether')
        
        await update.message.reply_text(
            f"💰 Your Balance\n\n"
            f"Address: `{wallet_address[:6]}...{wallet_address[-4:]}`\n"
            f"Balance: {balance_bnb:.6f} BNB\n\n"
            f"View full details at {APP_URL}/wallet",
            parse_mode='Markdown'
        )
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = (
            "📖 ClipX Help\n\n"
            "Commands:\n"
            "/tip @username 0.1 - Send a tip\n"
            "/balance - Check your balance\n"
            "/help - Show this message\n\n"
            "How it works:\n"
            "1️⃣ Register at clipx0.xyz\n"
            "2️⃣ Get your wallet address\n"
            "3️⃣ Send tips to anyone on Telegram\n"
            "4️⃣ Unregistered users can claim tips later\n\n"
            "Need support? Visit clipx0.xyz"
        )
        await update.message.reply_text(help_text)

def main():
    """Start the Telegram bot"""
    bot = TelegramTipBot()
    application = Application.builder().token(BOT_TOKEN).build()
    
    # Register handlers
    application.add_handler(CommandHandler("start", bot.start_command))
    application.add_handler(CommandHandler("tip", bot.handle_tip))
    application.add_handler(CommandHandler("balance", bot.balance_command))
    application.add_handler(CommandHandler("help", bot.help_command))
    
    # Start polling
    logger.info("🚀 Telegram bot started")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
```

---

## Phase 3: Account Linking System

### Step 3.1: Telegram Login Widget Integration

Create `client/src/components/LinkTelegramButton.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { usePrivy } from '@privy-io/react-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export function LinkTelegramButton() {
  const { user } = usePrivy();
  const [linkedPlatforms, setLinkedPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlatforms = async () => {
    try {
      const res = await fetch('/api/platforms');
      const data = await res.json();
      setLinkedPlatforms(data.platforms || []);
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatforms();
  }, []);

  const handleTelegramAuth = async (telegramUser: TelegramUser) => {
    try {
      const res = await fetch('/api/platforms/link-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramUser }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || 'Telegram account linked successfully!');
        fetchPlatforms();
      } else {
        alert(data.error || 'Failed to link Telegram account');
      }
    } catch (error) {
      console.error('Error linking Telegram:', error);
      alert('Failed to link Telegram account');
    }
  };

  useEffect(() => {
    // Load Telegram Widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', import.meta.env.VITE_TELEGRAM_BOT_USERNAME || '');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    
    const container = document.getElementById('telegram-login-container');
    if (container && container.children.length === 0) {
      container.appendChild(script);
    }

    // @ts-ignore
    window.onTelegramAuth = handleTelegramAuth;

    return () => {
      // @ts-ignore
      delete window.onTelegramAuth;
    };
  }, []);

  const telegramAccount = linkedPlatforms.find(p => p.platform === 'telegram');
  const twitterAccount = linkedPlatforms.find(p => p.platform === 'twitter');

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Platforms</CardTitle>
        <CardDescription>
          Link your social accounts to receive tips across multiple platforms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Twitter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="default">𝕏</Badge>
            <div>
              <div className="font-medium">Twitter / X</div>
              {twitterAccount && (
                <div className="text-sm text-muted-foreground">@{twitterAccount.username}</div>
              )}
            </div>
          </div>
          {twitterAccount && (
            <Badge variant="outline" className="text-green-600">✓ Linked</Badge>
          )}
        </div>

        {/* Telegram */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary">✈️</Badge>
            <div>
              <div className="font-medium">Telegram</div>
              {telegramAccount ? (
                <div className="text-sm text-muted-foreground">@{telegramAccount.username}</div>
              ) : (
                <div className="text-sm text-muted-foreground">Not linked</div>
              )}
            </div>
          </div>
          {telegramAccount ? (
            <Badge variant="outline" className="text-green-600">✓ Linked</Badge>
          ) : (
            <div id="telegram-login-container" />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
```

### Step 3.2: Backend Linking Endpoints

Add to `server/routes.ts`:

```typescript
import { IdentityResolver } from './services/identity-resolver';
import crypto from 'crypto';

// Get user's linked platforms
app.get('/api/platforms', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const platforms = await IdentityResolver.getUserPlatforms(req.user.id);
    res.json({ platforms });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// Link Telegram account
app.post('/api/platforms/link-telegram', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { telegramUser } = req.body;

  // Verify Telegram data hash (security critical!)
  const isValid = verifyTelegramAuth(telegramUser, process.env.TELEGRAM_BOT_TOKEN!);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid Telegram authentication' });
  }

  try {
    await IdentityResolver.linkPlatformAccount(req.user.id, {
      platform: 'telegram',
      username: telegramUser.username || `user_${telegramUser.id}`,
      platformUserId: String(telegramUser.id),
      displayName: `${telegramUser.first_name} ${telegramUser.last_name || ''}`.trim(),
    });

    // Check for pending claims
    const claims = await IdentityResolver.getPendingClaims({
      platform: 'telegram',
      username: telegramUser.username || `user_${telegramUser.id}`,
    });

    // Log event
    await db.insert(platformEvents).values({
      eventType: 'platform_linked',
      platform: 'telegram',
      userId: (await db.query.users.findFirst({
        where: eq(users.privyUserId, req.user.id)
      }))?.id,
      platformUserId: String(telegramUser.id),
      metadata: { username: telegramUser.username, pendingClaims: claims.length },
    });

    res.json({ 
      success: true, 
      pendingClaims: claims.length,
      message: claims.length > 0 
        ? `Telegram linked! You have ${claims.length} pending claim(s)!` 
        : 'Telegram linked successfully!',
    });
  } catch (error: any) {
    console.error('Error linking Telegram:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify Telegram login data
function verifyTelegramAuth(authData: any, botToken: string): boolean {
  const checkHash = authData.hash;
  const dataToCheck = { ...authData };
  delete dataToCheck.hash;

  const dataCheckArr = Object.keys(dataToCheck)
    .sort()
    .map(k => `${k}=${dataToCheck[k]}`);
  
  const dataCheckString = dataCheckArr.join('\n');
  const secretKey = crypto.createHash('sha256').update(botToken).digest();
  const hash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  return hash === checkHash;
}
```

---

## Phase 4: Cross-Platform Features

### Step 4.1: Update Dashboard for Multi-Platform

Add to `client/src/pages/dashboard.tsx`:

```typescript
// Fetch pending claims from all platforms
const { data: allClaims } = useQuery({
  queryKey: ['pending-claims-all'],
  queryFn: async () => {
    const res = await fetch('/api/pending-claims/all');
    return res.json();
  },
});

// Display with platform badges
{allClaims?.map((claim: any) => (
  <div key={claim.id} className="flex items-center gap-2 p-3 border rounded">
    <Badge variant={claim.fromPlatform === 'twitter' ? 'default' : 'secondary'}>
      {claim.fromPlatform === 'twitter' ? '𝕏' : '✈️'}
    </Badge>
    <div className="flex-1">
      <div className="font-medium">
        {claim.fromUsername} sent you {claim.amount} BNB
      </div>
      <div className="text-sm text-muted-foreground">
        via {claim.fromPlatform} • {formatDistanceToNow(new Date(claim.createdAt))} ago
      </div>
    </div>
    <Button size="sm" onClick={() => handleClaim(claim.id)}>
      Claim
    </Button>
  </div>
))}
```

### Step 4.2: Update API to Handle Cross-Platform Claims

```typescript
// Get all pending claims across platforms
app.get('/api/pending-claims/all', async (req, res) => {
  if (!req.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    // Get user's platforms
    const platforms = await IdentityResolver.getUserPlatforms(req.user.id);
    
    // Get claims for all linked platforms
    const claims = await db.query.pendingClaims.findMany({
      where: or(
        ...platforms.map(p => 
          and(
            eq(pendingClaims.toPlatform, p.platform),
            eq(pendingClaims.toUsername, p.username),
            eq(pendingClaims.status, 'pending')
          )
        )
      ),
    });

    res.json(claims);
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({ error: 'Failed to fetch claims' });
  }
});
```

---

## Phase 5: Testing & Launch

### Test Scenarios

**Test 1: Single Platform (Twitter Only)**
- ✅ Register via Twitter
- ✅ Receive tip on Twitter
- ✅ Claim works

**Test 2: Single Platform (Telegram Only)**
- ✅ Register via web with Telegram link
- ✅ Send tip via Telegram command
- ✅ Receive tip on Telegram

**Test 3: Cross-Platform User**
- ✅ Register via Twitter
- ✅ Link Telegram account
- ✅ Same wallet shows in both
- ✅ Balance consistent

**Test 4: Cross-Platform Tipping**
- ✅ User A has Twitter only
- ✅ User B tips @UserA via Telegram
- ✅ Tip reaches User A's wallet

**Test 5: Pending Claims**
- ✅ Send tip to unregistered Telegram user
- ✅ User registers via Twitter
- ✅ User links Telegram
- ✅ Claim appears in dashboard
- ✅ Claim succeeds

---

## Security Considerations

### 1. Telegram Authentication
- Always verify hash using HMAC-SHA256
- Check auth_date freshness (< 1 day old)
- Never trust client data without verification

### 2. Account Linking
- Require proof of ownership
- One platform account per user
- Log all linking events
- Prevent account hijacking

### 3. Private Key Security
- Use Privy user ID for encryption
- Same decryption in bot and backend
- Never expose keys in logs
- Rotate escrow key periodically

---

## Deployment Strategy

### Update `start-production.sh`

```bash
#!/bin/bash

echo "Building ClipX..."
npm run build

echo "Starting services..."

# Start backend
node dist/server/index.js &
BACKEND_PID=$!

# Start Twitter bot
python bot/clipx_bot.py &
TWITTER_BOT_PID=$!

# Start Telegram bot
python bot/telegram_bot.py &
TELEGRAM_BOT_PID=$!

echo "All services started!"
echo "Backend PID: $BACKEND_PID"
echo "Twitter Bot PID: $TWITTER_BOT_PID"
echo "Telegram Bot PID: $TELEGRAM_BOT_PID"

# Wait for all processes
wait
```

### Environment Variables (Add to Replit Secrets)

```
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_BOT_USERNAME=clipx_tip_bot
```

---

## Migration Timeline

- **Week 1**: Database schema + backend infrastructure
- **Week 2**: Telegram bot development
- **Week 3**: Account linking + frontend
- **Week 4**: Cross-platform features
- **Week 5**: Testing
- **Week 6**: Production launch

---

## Success Metrics

- Users with both platforms linked
- Cross-platform tips sent
- Platform-specific engagement
- Claim success rate
- User retention

---

**Status**: Ready for Implementation  
**Last Updated**: November 15, 2025  
**Version**: 1.0
