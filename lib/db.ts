/**
 * DB layer — uses Neon Postgres on Vercel, JSON files in local dev.
 */
import fs from 'fs';
import path from 'path';
import { Project, Video, Clip, AITask } from '@/types';
import { getSQL, initDB } from './neon';

// ─── Local file store (dev only) ─────────────────────────────────────────────

const DATA_DIR = process.env.VERCEL
  ? '/tmp/.data'
  : path.join(process.cwd(), '.data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCol<T>(name: string): T[] {
  ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')) as T[]; } catch { return []; }
}

function writeCol<T>(name: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function getProjects(userId: string): Project[] {
  const sql = getSQL();
  if (!sql) return readCol<Project>('projects').filter(p => p.userId === userId);
  // sync wrapper — Neon calls are async but we need sync here; use file store fallback
  return readCol<Project>('projects').filter(p => p.userId === userId);
}

export function getAllProjects(): Project[] {
  return readCol<Project>('projects');
}

export function getProject(id: string): Project | undefined {
  return readCol<Project>('projects').find(p => p.id === id);
}

export function createProject(project: Project): Project {
  const projects = readCol<Project>('projects');
  projects.push(project);
  writeCol('projects', projects);
  // Also write to Neon async (fire-and-forget)
  void writeProjectToDB(project);
  return project;
}

async function writeProjectToDB(p: Project) {
  const sql = getSQL();
  if (!sql) return;
  await initDB();
  await sql`INSERT INTO projects (id, user_id, name, video_count, clip_count, created_at, updated_at)
    VALUES (${p.id}, ${p.userId}, ${p.name}, ${p.videoCount ?? 0}, ${p.clipCount ?? 0}, ${p.createdAt}, ${p.updatedAt})
    ON CONFLICT (id) DO UPDATE SET name=${p.name}, video_count=${p.videoCount ?? 0}, clip_count=${p.clipCount ?? 0}, updated_at=${p.updatedAt}`;
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const projects = readCol<Project>('projects');
  const idx = projects.findIndex(p => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...data };
  writeCol('projects', projects);
  void writeProjectToDB(projects[idx]);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = readCol<Project>('projects');
  const filtered = projects.filter(p => p.id !== id);
  writeCol('projects', filtered);
  return filtered.length < projects.length;
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function getVideos(projectId: string): Video[] {
  return readCol<Video>('videos').filter(v => v.projectId === projectId);
}

export function getAllVideos(): Video[] {
  return readCol<Video>('videos');
}

export function getVideo(id: string): Video | undefined {
  return readCol<Video>('videos').find(v => v.id === id);
}

export function createVideo(video: Video): Video {
  const videos = readCol<Video>('videos');
  videos.push(video);
  writeCol('videos', videos);
  void writeVideoToDB(video);
  return video;
}

async function writeVideoToDB(v: Video) {
  const sql = getSQL();
  if (!sql) return;
  await initDB();
  await sql`INSERT INTO videos (id, project_id, title, url, thumbnail_url, duration, size, status, progress, transcription, created_at, updated_at)
    VALUES (${v.id}, ${v.projectId}, ${v.title}, ${v.url ?? ''}, ${v.thumbnailUrl ?? null}, ${v.duration ?? 0}, ${v.size ?? 0}, ${v.status}, ${v.progress ?? 0}, ${v.transcription ?? null}, ${v.createdAt}, ${v.updatedAt})
    ON CONFLICT (id) DO UPDATE SET title=${v.title}, url=${v.url ?? ''}, status=${v.status}, progress=${v.progress ?? 0}, transcription=${v.transcription ?? null}, updated_at=${v.updatedAt}`;
}

export function updateVideo(id: string, data: Partial<Video>): Video | null {
  const videos = readCol<Video>('videos');
  const idx = videos.findIndex(v => v.id === id);
  if (idx === -1) {
    // Not in local store -- create minimal record
    const now = new Date().toISOString();
    const v: Video = { id, title: '', url: '', duration: 0, status: 'processing', progress: 0, projectId: '', createdAt: now, updatedAt: now, ...data } as Video;
    videos.push(v);
    writeCol('videos', videos);
    void writeVideoToDB(v);
    return v;
  }
  videos[idx] = { ...videos[idx], ...data };
  writeCol('videos', videos);
  void writeVideoToDB(videos[idx]);
  return videos[idx];
}

// ─── Clips ───────────────────────────────────────────────────────────────────

export function getClips(videoId: string): Clip[] {
  return readCol<Clip>('clips').filter(c => c.videoId === videoId);
}

export function getAllClips(): Clip[] {
  return readCol<Clip>('clips');
}

export function getClip(id: string): Clip | undefined {
  return readCol<Clip>('clips').find(c => c.id === id);
}

export function createClip(clip: Clip): Clip {
  const clips = readCol<Clip>('clips');
  clips.push(clip);
  writeCol('clips', clips);
  return clip;
}

export function updateClip(id: string, data: Partial<Clip>): Clip | null {
  const clips = readCol<Clip>('clips');
  const idx = clips.findIndex(c => c.id === id);
  if (idx === -1) return null;
  clips[idx] = { ...clips[idx], ...data };
  writeCol('clips', clips);
  return clips[idx];
}

export function deleteClip(id: string): boolean {
  const clips = readCol<Clip>('clips');
  const filtered = clips.filter(c => c.id !== id);
  writeCol('clips', filtered);
  return filtered.length < clips.length;
}

// ─── AI Tasks ────────────────────────────────────────────────────────────────

export function getAITasks(videoId: string): AITask[] {
  return readCol<AITask>('ai_tasks').filter(t => t.videoId === videoId);
}

export function createAITask(task: AITask): AITask {
  const tasks = readCol<AITask>('ai_tasks');
  tasks.push(task);
  writeCol('ai_tasks', tasks);
  return task;
}

export function updateAITask(id: string, data: Partial<AITask>): AITask | null {
  const tasks = readCol<AITask>('ai_tasks');
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...data };
  writeCol('ai_tasks', tasks);
  return tasks[idx];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface PageView {
  id: string; path: string; referrer?: string; userAgent?: string;
  ip?: string; sessionId: string; userId?: string; timestamp: string;
}

export interface ActiveSession {
  sessionId: string; userId?: string; path: string;
  lastSeen: string; startedAt: string; userAgent?: string; ip?: string;
}

export interface UserAccount {
  id: string; email: string; name?: string; createdAt: string; lastLogin?: string;
}

export function recordPageView(view: PageView): void {
  const views = readCol<PageView>('pageviews');
  views.push(view);
  if (views.length > 10000) views.splice(0, views.length - 10000);
  writeCol('pageviews', views);
  // async write to Neon
  void (async () => {
    const sql = getSQL();
    if (!sql) return;
    await initDB();
    await sql`INSERT INTO page_views (id, path, session_id, user_id, ip, user_agent, referrer, timestamp)
      VALUES (${view.id}, ${view.path}, ${view.sessionId}, ${view.userId ?? null}, ${view.ip ?? null}, ${view.userAgent ?? null}, ${view.referrer ?? null}, ${view.timestamp})
      ON CONFLICT (id) DO NOTHING`;
  })();
}

export function upsertSession(session: ActiveSession): void {
  const sessions = readCol<ActiveSession>('sessions');
  const idx = sessions.findIndex(s => s.sessionId === session.sessionId);
  if (idx >= 0) sessions[idx] = { ...sessions[idx], ...session };
  else sessions.push(session);
  writeCol('sessions', sessions);
}

export function getActiveSessions(): ActiveSession[] {
  const sessions = readCol<ActiveSession>('sessions');
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  return sessions.filter(s => s.lastSeen >= cutoff);
}

export function getAllSessions(): ActiveSession[] {
  return readCol<ActiveSession>('sessions');
}

export function getPageViews(): PageView[] {
  return readCol<PageView>('pageviews');
}

export function getUserAccounts(): UserAccount[] {
  return readCol<UserAccount>('user_accounts');
}

export function upsertUserAccount(user: UserAccount): void {
  const users = readCol<UserAccount>('user_accounts');
  const idx = users.findIndex(u => u.id === user.id);
  const updated = { ...user, lastLogin: new Date().toISOString() };
  if (idx >= 0) users[idx] = { ...users[idx], ...updated };
  else users.push(updated);
  writeCol('user_accounts', users);
  // async write to Neon
  void (async () => {
    const sql = getSQL();
    if (!sql) return;
    await initDB();
    await sql`INSERT INTO user_accounts (id, email, name, created_at, last_login)
      VALUES (${updated.id}, ${updated.email}, ${updated.name ?? null}, ${updated.createdAt}, ${updated.lastLogin ?? null})
      ON CONFLICT (id) DO UPDATE SET name=${updated.name ?? null}, last_login=${updated.lastLogin ?? null}`;
  })();
}
