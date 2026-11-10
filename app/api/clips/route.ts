import { NextRequest, NextResponse } from 'next/server';
import { getClips, getClip, updateClip, deleteClip } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');
  const clipId = searchParams.get('id');

  if (clipId) {
    const clip = getClip(clipId);
    if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    return NextResponse.json({ clip });
  }

  if (!videoId) {
    return NextResponse.json({ error: 'videoId or id required' }, { status: 400 });
  }

  const clips = getClips(videoId);
  return NextResponse.json({ clips });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json() as { id: string; [key: string]: any };
  const { id, ...data } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const clip = updateClip(id, data);
  if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  return NextResponse.json({ clip });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const deleted = deleteClip(id);
  if (!deleted) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}
