import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { mkdir } from 'fs/promises';

// Point fluent-ffmpeg at the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const EXPORTS_DIR = path.join(process.cwd(), 'uploads', 'exports');

export async function ensureExportsDir() {
  await mkdir(EXPORTS_DIR, { recursive: true });
}

export interface ExportOptions {
  inputPath: string;   // absolute path to source video
  outputName: string;  // filename without extension
  startTime: number;   // seconds
  duration: number;    // seconds
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality?: '720p' | '1080p';
}

export function exportClip(opts: ExportOptions): Promise<string> {
  return new Promise(async (resolve, reject) => {
    await ensureExportsDir();

    const outputPath = path.join(EXPORTS_DIR, `${opts.outputName}.mp4`);

    const height = opts.quality === '1080p' ? 1080 : 720;
    const width  =
      opts.aspectRatio === '9:16' ? Math.round(height * 9 / 16) :
      opts.aspectRatio === '1:1'  ? height :
      Math.round(height * 16 / 9);

    // Ensure width is even (FFmpeg requirement)
    const w = width  % 2 === 0 ? width  : width  + 1;
    const h = height % 2 === 0 ? height : height + 1;

    const videoFilter =
      opts.aspectRatio === '9:16'
        ? `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`
        : opts.aspectRatio === '1:1'
        ? `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`
        : `scale=${w}:${h}:force_original_aspect_ratio=decrease,pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`;

    ffmpeg(opts.inputPath)
      .setStartTime(opts.startTime)
      .setDuration(opts.duration)
      .videoCodec('libx264')
      .audioCodec('aac')
      .videoFilters(videoFilter)
      .outputOptions(['-crf 23', '-preset fast', '-movflags +faststart'])
      .output(outputPath)
      .on('end', () => resolve(`/uploads/exports/${opts.outputName}.mp4`))
      .on('error', (err: Error) => reject(new Error(`FFmpeg error: ${err.message}`)))
      .run();
  });
}
