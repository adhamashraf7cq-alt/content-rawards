import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { createVideo, createProject, getProjects } from '@/lib/db';
import { generateId, extractYouTubeId, getThumbnailUrl } from '@/lib/utils';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.json() as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/mkv', 'video/*'],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024, // 2GB
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Create video record after upload completes
        const userId = 'demo-user-1';
        const projects = getProjects(userId);
        let projectId: string;

        if (projects.length === 0) {
          const now = new Date().toISOString();
          const p = createProject({
            id: generateId(), name: 'My First Project', userId,
            videoCount: 0, clipCount: 0, createdAt: now, updatedAt: now,
          });
          projectId = p.id;
        } else {
          projectId = projects[projects.length - 1].id;
        }

        const now = new Date().toISOString();
        const title = blob.pathname.split('/').pop()?.replace(/\.[^.]+$/, '') ?? 'Uploaded Video';

        createVideo({
          id: generateId(),
          title,
          url: blob.url,
          duration: 0,
          size: 0,
          status: 'ready',
          progress: 100,
          projectId,
          createdAt: now,
          updatedAt: now,
        });
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}
