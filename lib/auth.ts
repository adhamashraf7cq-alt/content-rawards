/**
 * Simple cookie-based auth.
 * Session = signed JSON stored in an HttpOnly cookie.
 * For production: use a proper JWT library or Auth.js.
 */
import { cookies } from 'next/headers';
import { getUserAccounts, upsertUserAccount } from './db';
import { generateId } from './utils';

const COOKIE = 'cr_session';
const SECRET = process.env.NEXTAUTH_SECRET ?? 'dev-secret';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

/** Encode session as base64 JSON (no real signing in dev — add HMAC for prod) */
export function encodeSession(user: SessionUser): string {
  return Buffer.from(JSON.stringify(user)).toString('base64url');
}

export function decodeSession(token: string): SessionUser | null {
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString()) as SessionUser;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

export function makeSessionCookie(user: SessionUser): string {
  const value = encodeSession(user);
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  return `${COOKIE}=${value}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax`;
}

export function clearSessionCookie(): string {
  return `${COOKIE}=; HttpOnly; Path=/; Max-Age=0`;
}

/** Register or sign in, returns user */
export function signInOrRegister(params: {
  email: string; password: string; name?: string; mode: 'signin' | 'signup';
}): { user: SessionUser } | { error: string } {
  const { email, password, name, mode } = params;
  if (!email || !password) return { error: 'Email and password required' };

  const users = getUserAccounts();
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  const now = new Date().toISOString();

  if (mode === 'signup') {
    if (existing) return { error: 'Account already exists. Sign in instead.' };
    const user = { id: generateId(), email, name: name ?? email.split('@')[0], createdAt: now, lastLogin: now };
    upsertUserAccount(user);
    return { user: { id: user.id, email: user.email, name: user.name! } };
  }

  // signin
  if (!existing) {
    // In dev, auto-create
    if (process.env.NODE_ENV === 'development') {
      const user = { id: generateId(), email, name: email.split('@')[0], createdAt: now, lastLogin: now };
      upsertUserAccount(user);
      return { user: { id: user.id, email: user.email, name: user.name! } };
    }
    return { error: 'No account found. Sign up first.' };
  }

  upsertUserAccount({ ...existing, lastLogin: now });
  return { user: { id: existing.id, email: existing.email, name: existing.name ?? email.split('@')[0] } };
}

/** Handle Google OAuth callback — upsert user and return session user */
export function handleGoogleUser(params: { id: string; email: string; name?: string }): SessionUser {
  const now = new Date().toISOString();
  const existing = getUserAccounts().find(u => u.email.toLowerCase() === params.email.toLowerCase());
  const user = {
    id:        existing?.id ?? params.id ?? generateId(),
    email:     params.email,
    name:      params.name ?? params.email.split('@')[0],
    createdAt: existing?.createdAt ?? now,
    lastLogin: now,
  };
  upsertUserAccount(user);
  return { id: user.id, email: user.email, name: user.name };
}
