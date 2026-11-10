import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db';
import { generateId } from '@/lib/utils';

export async function GET(req: NextRequest) {
  // In production: verify session and get userId from JWT
  const userId = req.headers.get('x-user-id') ?? 'demo-user-1';
  const projects = getProjects(userId);
  return NextResponse.json({ projects });
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id') ?? 'demo-user-1';
  const body = await req.json() as { name: string; description?: string };

  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const project = createProject({
    id: generateId(),
    name: body.name.trim(),
    description: body.description,
    userId,
    videoCount: 0,
    clipCount: 0,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ project }, { status: 201 });
}
