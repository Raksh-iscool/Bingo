// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgTableCreator, index } from "drizzle-orm/pg-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `Bingo_${name}`);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Store YouTube auth tokens
// Store Twitter auth tokens
export const twitterTokens = createTable("twitter_token", (d) => ({
  id: d.serial().primaryKey(),
  accessToken: d.text().notNull(),
  refreshToken: d.text().notNull(),
  expiryDate: d.timestamp().notNull(),
  userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// Store Twitter posts
export const twitterPosts = createTable(
  "twitter_post",
  (d) => ({
    id: d.serial().primaryKey(),
    tweetId: d.varchar({ length: 50 }).notNull(),
    twitterUserId: d.varchar({ length: 50 }).notNull(), // Twitter user ID
    content: d.text().notNull(),
    userId: d.varchar({ length: 256 }).notNull(),
    status: d.varchar({ length: 20 }).default("draft").notNull(),
    metrics: d.json(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("twitter_post_user_id_idx").on(t.userId),
    index("twitter_post_tweet_id_idx").on(t.tweetId),
    index("twitter_post_twitter_user_id_idx").on(t.twitterUserId), // Add index for twitterUserId
  ],
);

// Store YouTube auth tokens
export const youtubeTokens = createTable("youtube_token", (d) => ({
  id: d.serial().primaryKey(),
  accessToken: d.text().notNull(),
  refreshToken: d.text().notNull(),
  expiryDate: d.timestamp().notNull(),
  userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// Store video uploads
export const youtubeVideos = createTable(
  "youtube_video",
  (d) => ({
    id: d.serial().primaryKey(),
    youtubeId: d.varchar({ length: 50 }).notNull(),
    title: d.varchar({ length: 256 }).notNull(),
    description: d.text(),
    tags: d.json(),
    privacyStatus: d.varchar({ length: 20 }).default("private").notNull(),
    thumbnailUrl: d.text(),
    userId: d.varchar({ length: 256 }).notNull(), // Link to your user system
    status: d.varchar({ length: 20 }).default("uploaded").notNull(), // uploaded, processing, published, failed
    videoUrl: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("youtube_video_user_id_idx").on(t.userId),
    index("youtube_video_youtube_id_idx").on(t.youtubeId),
  ],
);
