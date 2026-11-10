import { NextRequest, NextResponse } from 'next/server';
import { getVideos, getVideo } from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('projectId');
  const videoId = searchParams.get('id');

  if (videoId) {
    const video = getVideo(videoId);
    if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    return NextResponse.json({ video });
  }

  if (!projectId) {
    return NextResponse.json({ error: 'projectId or id required' }, { status: 400 });
  }

  const videos = getVideos(projectId);
  return NextResponse.json({ videos });
}
