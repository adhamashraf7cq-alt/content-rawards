import type { Metadata } from 'next';
import './globals.css';
import { Tracker } from '@/components/analytics/Tracker';

export const metadata: Metadata = {
  title: 'Content Rawards – AI Video Editing & Content Repurposing',
  description:
    'Turn long-form videos into powerful short-form content with AI. Transcribe, analyze, clip, and export to TikTok, Instagram Reels, YouTube Shorts, and more.',
  keywords: ['AI video editor', 'content repurposing', 'short form video', 'TikTok clips', 'YouTube Shorts'],
  openGraph: {
    title: 'Content Rawards',
    description: 'Turn Long Videos Into Powerful Content.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0A0A0A] text-zinc-100 antialiased">
        <Tracker />
        {children}
      </body>
    </html>
  );
}
