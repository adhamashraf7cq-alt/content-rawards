/**
 * Simple file-based JSON store for development.
 * In production replace with Prisma + PostgreSQL.
 */
import fs from 'fs';
import path from 'path';
import { Project, Video, Clip, AITask } from '@/types';

const DATA_DIR = process.env.VERCEL
  ? '/tmp/.data'
  : path.join(process.cwd(), '.data');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readCollection<T>(name: string): T[] {
  ensureDir();
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T[];
  } catch {
    return [];
  }
}

function writeCollection<T>(name: string, data: T[]): void {
  ensureDir();
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2));
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function getProjects(userId: string): Project[] {
  return readCollection<Project>('projects').filter((p) => p.userId === userId);
}

export function getAllProjects(): Project[] {
  return readCollection<Project>('projects');
}

export function getProject(id: string): Project | undefined {
  return readCollection<Project>('projects').find((p) => p.id === id);
}

export function createProject(project: Project): Project {
  const projects = readCollection<Project>('projects');
  projects.push(project);
  writeCollection('projects', projects);
  return project;
}

export function updateProject(id: string, data: Partial<Project>): Project | null {
  const projects = readCollection<Project>('projects');
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  projects[idx] = { ...projects[idx], ...data };
  writeCollection('projects', projects);
  return projects[idx];
}

export function deleteProject(id: string): boolean {
  const projects = readCollection<Project>('projects');
  const filtered = projects.filter((p) => p.id !== id);
  writeCollection('projects', filtered);
  return filtered.length < projects.length;
}

// ─── Videos ──────────────────────────────────────────────────────────────────

export function getVideos(projectId: string): Video[] {
  return readCollection<Video>('videos').filter((v) => v.projectId === projectId);
}

export function getAllVideos(): Video[] {
  return readCollection<Video>('videos');
}

export function getVideo(id: string): Video | undefined {
  return readCollection<Video>('videos').find((v) => v.id === id);
}

export function createVideo(video: Video): Video {
  const videos = readCollection<Video>('videos');
  videos.push(video);
  writeCollection('videos', videos);
  return video;
}

export function updateVideo(id: string, data: Partial<Video>): Video | null {
  const videos = readCollection<Video>('videos');
  const idx = videos.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  videos[idx] = { ...videos[idx], ...data };
  writeCollection('videos', videos);
  return videos[idx];
}

// ─── Clips ───────────────────────────────────────────────────────────────────

export function getClips(videoId: string): Clip[] {
  return readCollection<Clip>('clips').filter((c) => c.videoId === videoId);
}

export function getAllClips(): Clip[] {
  return readCollection<Clip>('clips');
}

export function getClip(id: string): Clip | undefined {
  return readCollection<Clip>('clips').find((c) => c.id === id);
}

export function createClip(clip: Clip): Clip {
  const clips = readCollection<Clip>('clips');
  clips.push(clip);
  writeCollection('clips', clips);
  return clip;
}

export function updateClip(id: string, data: Partial<Clip>): Clip | null {
  const clips = readCollection<Clip>('clips');
  const idx = clips.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clips[idx] = { ...clips[idx], ...data };
  writeCollection('clips', clips);
  return clips[idx];
}

export function deleteClip(id: string): boolean {
  const clips = readCollection<Clip>('clips');
  const filtered = clips.filter((c) => c.id !== id);
  writeCollection('clips', filtered);
  return filtered.length < clips.length;
}

// ─── AI Tasks ────────────────────────────────────────────────────────────────

export function getAITasks(videoId: string): AITask[] {
  return readCollection<AITask>('ai_tasks').filter((t) => t.videoId === videoId);
}

export function createAITask(task: AITask): AITask {
  const tasks = readCollection<AITask>('ai_tasks');
  tasks.push(task);
  writeCollection('ai_tasks', tasks);
  return task;
}

export function updateAITask(id: string, data: Partial<AITask>): AITask | null {
  const tasks = readCollection<AITask>('ai_tasks');
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...data };
  writeCollection('ai_tasks', tasks);
  return tasks[idx];
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface PageView {
  id: string;
  path: string;
  referrer?: string;
  userAgent?: string;
  ip?: string;
  sessionId: string;
  userId?: string;
  timestamp: string;
}

export interface ActiveSession {
  sessionId: string;
  userId?: string;
  path: string;
  lastSeen: string;
  startedAt: string;
  userAgent?: string;
  ip?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLogin?: string;
}

export function recordPageView(view: PageView): void {
  const views = readCollection<PageView>('pageviews');
  views.push(view);
  // Keep last 10,000 views only
  if (views.length > 10000) views.splice(0, views.length - 10000);
  writeCollection('pageviews', views);
}

export function upsertSession(session: ActiveSession): void {
  const sessions = readCollection<ActiveSession>('sessions');
  const idx = sessions.findIndex((s) => s.sessionId === session.sessionId);
  if (idx >= 0) {
    sessions[idx] = { ...sessions[idx], ...session };
  } else {
    sessions.push(session);
  }
  writeCollection('sessions', sessions);
}

export function getActiveSessions(): ActiveSession[] {
  const sessions = readCollection<ActiveSession>('sessions');
  const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min
  return sessions.filter((s) => s.lastSeen >= cutoff);
}

export function getAllSessions(): ActiveSession[] {
  return readCollection<ActiveSession>('sessions');
}

export function getPageViews(): PageView[] {
  return readCollection<PageView>('pageviews');
}

export function getUserAccounts(): UserAccount[] {
  return readCollection<UserAccount>('user_accounts');
}

export function upsertUserAccount(user: UserAccount): void {
  const users = readCollection<UserAccount>('user_accounts');
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = { ...users[idx], ...user, lastLogin: new Date().toISOString() };
  } else {
    users.push(user);
  }
  writeCollection('user_accounts', users);
}
