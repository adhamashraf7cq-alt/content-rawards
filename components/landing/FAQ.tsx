'use client';
import { useState } from 'react';

const faqs = [
  {
    q: 'What video formats are supported?',
    a: 'MP4, MOV, AVI, MKV, WebM, and most common video formats. Maximum file size is 2 GB.',
  },
  {
    q: 'How does YouTube URL processing work?',
    a: 'You can paste a YouTube URL for videos you own or have rights to. We use the YouTube Data API to fetch metadata and your own downloaded video file for processing. We never bypass YouTube restrictions.',
  },
  {
    q: 'How accurate is the AI transcription?',
    a: 'We use OpenAI Whisper, which achieves near-human accuracy for clear audio. Accuracy may vary with heavy accents, background noise, or technical jargon.',
  },
  {
    q: 'Can I customize what clips are generated?',
    a: 'Yes. You can write any natural language instruction in the AI task box — "find the 5 funniest moments," "extract all product demos," "create motivational clips under 60 seconds," and more.',
  },
  {
    q: 'What platforms are the clips optimized for?',
    a: 'TikTok (9:16), Instagram Reels (9:16), YouTube Shorts (9:16), Facebook Reels (9:16), and standard horizontal (16:9) for YouTube. Each export includes suggested captions and hashtags.',
  },
  {
    q: 'Is my video data private?',
    a: 'Yes. Videos are stored securely in your private cloud storage bucket. We do not share your content with third parties. You can delete your data at any time.',
  },
];

export function FAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">FAQ</p>
          <h2 className="text-4xl font-bold text-white mb-4">Frequently asked questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <button
              key={i}
              className="w-full text-left p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all"
              onClick={() => setOpen(open === i ? null : i)}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-zinc-100">{faq.q}</span>
                <svg
                  className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform ${open === i ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </div>
              {open === i && (
                <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
