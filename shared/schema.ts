import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, decimal, boolean, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table - required for session management
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table - stores user information for both Privy Auth and Twitter bot
export const users = pgTable("users", {
  id: varchar("id").primaryKey(), // Privy user ID (DID format like did:privy:123...)
  // Privy Auth fields (cached from Privy user object)
  email: varchar("email"),
  firstName: varchar("first_name"), // From Privy user profile
  lastName: varchar("last_name"), // From Privy user profile
  profileImageUrl: varchar("profile_image_url"), // From Privy or Twitter
  // Twitter fields for bot functionality (populated when user links Twitter via Privy)
  twitterId: text("twitter_id").unique(),
  username: text("username"), // Twitter handle
  displayName: text("display_name"), // Twitter display name
  avatarUrl: text("avatar_url"), // Twitter avatar (fallback if no Privy profile image)
  preferredGasTier: text("preferred_gas_tier").default("standard"), // slow, standard, fast
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Wallets table - stores BNB wallet for each user
export const wallets = pgTable("wallets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  address: text("address").notNull().unique(),
  walletType: text("wallet_type").notNull().default("privy_embedded"), // privy_embedded, external
  encryptedPrivateKey: text("encrypted_private_key"), // Null for Privy embedded wallets
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Transactions table - stores all tip transactions
export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("BNB"), // BNB, CLIPX, ASTER, USDT, or GIGGLE
  txHash: text("tx_hash"),
  status: text("status").notNull().default("pending"), // pending, completed, failed
  tweetId: text("tweet_id"),
  isPrivate: boolean("is_private").default(false).notNull(), // Private mode - no Twitter announcement
  errorMessage: text("error_message"),
  gasPriceUsed: text("gas_price_used"), // Wei as string for historical tracking
  gasUsed: text("gas_used"), // Actual gas consumed (filled after completion)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

// Tip Queue table - stores mentions that need to be processed
export const tipQueue = pgTable("tip_queue", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tweetId: text("tweet_id").notNull().unique(),
  fromUsername: text("from_username").notNull(),
  toUsername: text("to_username").notNull(),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  processed: boolean("processed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});

// Pending Claims table - stores tips sent to unregistered users that can be claimed later
export const pendingClaims = pgTable("pending_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toTwitterUsername: text("to_twitter_username").notNull(),
  toTwitterId: text("to_twitter_id").notNull(), // Numeric Twitter ID for stable matching
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  currency: text("currency").notNull().default("BNB"), // BNB, CLIPX, ASTER, USDT, or GIGGLE
  escrowTxHash: text("escrow_tx_hash").notNull(),
  status: text("status").notNull().default("pending"), // pending, claimed, refunded, expired
  tweetId: text("tweet_id").unique(),
  claimTxHash: text("claim_tx_hash"),
  claimedBy: varchar("claimed_by").references(() => users.id),
  refundTxHash: text("refund_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  claimedAt: timestamp("claimed_at"),
  refundedAt: timestamp("refunded_at"),
}, (table) => [
  index("idx_pending_claims_status_expires").on(table.status, table.expiresAt),
  index("idx_pending_claims_twitter_id").on(table.toTwitterId, table.status),
]);

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(wallets, {
    fields: [users.id],
    references: [wallets.userId],
  }),
  sentTransactions: many(transactions, { relationName: "sender" }),
  receivedTransactions: many(transactions, { relationName: "receiver" }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
    relationName: "sender",
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertWalletSchema = createInsertSchema(wallets).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertTipQueueSchema = createInsertSchema(tipQueue).omit({
  id: true,
  createdAt: true,
  processedAt: true,
});

export const insertPendingClaimSchema = createInsertSchema(pendingClaims).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
  refundedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = z.infer<typeof insertWalletSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type TipQueue = typeof tipQueue.$inferSelect;
export type InsertTipQueue = z.infer<typeof insertTipQueueSchema>;

export type PendingClaim = typeof pendingClaims.$inferSelect;
export type InsertPendingClaim = z.infer<typeof insertPendingClaimSchema>;
