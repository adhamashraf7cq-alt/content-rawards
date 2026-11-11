/**
 * Neon Postgres client for Vercel serverless.
 * Falls back to JSON file store in local dev.
 */
import { neon } from '@neondatabase/serverless';

let _sql: ReturnType<typeof neon> | null = null;

export function getSQL() {
  if (!process.env.DATABASE_URL) return null;
  if (!_sql) _sql = neon(process.env.DATABASE_URL);
  return _sql;
}

/** Create all tables if they don't exist */
export async function initDB() {
  const sql = getSQL();
  if (!sql) return;

  await sql`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      video_count INT DEFAULT 0,
      clip_count INT DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL DEFAULT '',
      thumbnail_url TEXT,
      duration INT DEFAULT 0,
      size BIGINT DEFAULT 0,
      status TEXT DEFAULT 'processing',
      progress INT DEFAULT 0,
      transcription TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS clips (
      id TEXT PRIMARY KEY,
      video_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      start_time FLOAT DEFAULT 0,
      end_time FLOAT DEFAULT 60,
      duration FLOAT DEFAULT 60,
      engagement_score INT DEFAULT 80,
      aspect_ratio TEXT DEFAULT '9:16',
      platform TEXT[],
      hook TEXT,
      caption TEXT,
      hashtags TEXT[],
      status TEXT DEFAULT 'ready',
      export_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_accounts (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL,
      last_login TEXT
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS page_views (
      id TEXT PRIMARY KEY,
      path TEXT NOT NULL,
      session_id TEXT NOT NULL,
      user_id TEXT,
      ip TEXT,
      user_agent TEXT,
      referrer TEXT,
      timestamp TEXT NOT NULL
    )
  `;
}
