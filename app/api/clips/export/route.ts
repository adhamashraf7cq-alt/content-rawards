import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';
import { getClip, getVideo, updateClip } from '@/lib/db';
import { exportClip } from '@/lib/ffmpeg';
import { generateId } from '@/lib/utils';

export async function POST(req: NextRequest) {
  try {
    const { clipId, quality = '720p' } = await req.json() as {
      clipId: string;
      quality?: '720p' | '1080p';
    };

    if (!clipId) return NextResponse.json({ error: 'clipId required' }, { status: 400 });

    const clip = getClip(clipId);
    if (!clip) return NextResponse.json({ error: 'Clip not found' }, { status: 404 });

    const video = getVideo(clip.videoId);
    if (!video) return NextResponse.json({ error: 'Source video not found' }, { status: 404 });

    // YouTube URLs can't be processed server-side without a local file
    if (video.url.startsWith('http')) {
      return NextResponse.json(
        { error: 'YouTube videos cannot be exported directly. Please upload the video file first.' },
        { status: 400 },
      );
    }

    // Resolve local file path
    const inputPath = video.url.startsWith('/')
      ? path.join(process.cwd(), video.url)
      : path.join(process.cwd(), 'uploads', path.basename(video.url));

    if (!existsSync(inputPath)) {
      return NextResponse.json({ error: 'Video file not found on disk' }, { status: 404 });
    }

    const outputName = `clip_${generateId()}`;
    const duration = clip.endTime - clip.startTime;

    // Mark as exporting
    updateClip(clipId, { status: 'exporting', updatedAt: new Date().toISOString() } as any);

    const exportUrl = await exportClip({
      inputPath,
      outputName,
      startTime: clip.startTime,
      duration,
      aspectRatio: clip.aspectRatio,
      quality,
    });

    // Save export URL to clip
    updateClip(clipId, { status: 'exported', exportUrl, updatedAt: new Date().toISOString() } as any);

    return NextResponse.json({
      ok: true,
      exportUrl,
      message: `Clip exported at ${quality}`,
    });
  } catch (err: any) {
    console.error('Export error:', err);
    return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 });
  }
}
