import { NextRequest, NextResponse } from 'next/server';
import { getVideo, updateVideo, createClip, updateProject, getProject } from '@/lib/db';
import { analyzeVideo, generateSubtitles } from '@/lib/ai';
import { generateId } from '@/lib/utils';
import { Clip } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { videoId: string; instruction?: string };
    const { videoId, instruction = '' } = body;

    if (!videoId) {
      return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
    }

    const video = getVideo(videoId);
    if (!video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.status !== 'ready' && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Video is not ready for analysis yet' }, { status: 400 });
    }

    // Mark as analyzing
    updateVideo(videoId, { status: 'analyzing', progress: 10, updatedAt: new Date().toISOString() });

    const transcript = video.transcription ?? '';
    const duration = video.duration || 900;

    const result = await analyzeVideo(transcript, duration, instruction, videoId, video.projectId);

    // Save clips to DB
    const savedClips: Clip[] = [];
    for (const clip of result.clips) {
      const subtitles = generateSubtitles(transcript, clip.startTime ?? 0, clip.endTime ?? 60);
      const saved = createClip({
        ...clip,
        id: clip.id ?? generateId(),
        videoId,
        projectId: video.projectId,
        subtitles,
        status: 'ready',
        createdAt: new Date().toISOString(),
      } as Clip);
      savedClips.push(saved);
    }

    // Update video as ready with transcription summary
    updateVideo(videoId, {
      status: 'ready',
      progress: 100,
      transcription: result.summary,
      updatedAt: new Date().toISOString(),
    });

    // Update project clip count
    const project = getProject(video.projectId);
    if (project) {
      updateProject(video.projectId, {
        clipCount: (project.clipCount ?? 0) + savedClips.length,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      clips: savedClips,
      summary: result.summary,
      topics: result.topics,
      message: `Generated ${savedClips.length} clips from AI analysis.`,
    });
  } catch (err) {
    console.error('Analysis error:', err);
    return NextResponse.json({ error: 'Analysis failed. Please try again.' }, { status: 500 });
  }
}
