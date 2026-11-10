/**
 * AI service layer.
 * Uses OpenAI Whisper for transcription and GPT-4 for analysis.
 * Falls back to mock data when OPENAI_API_KEY is not set.
 */
import { Clip, Subtitle } from '@/types';
import { generateId } from './utils';

const OPENAI_KEY = process.env.OPENAI_API_KEY;

// ─── Transcription ────────────────────────────────────────────────────────────

export async function transcribeAudio(audioPath: string): Promise<string> {
  if (!OPENAI_KEY) {
    // Mock transcript for development
    return MOCK_TRANSCRIPT;
  }

  const formData = new FormData();
  const audioBuffer = await import('fs').then((fs) =>
    fs.promises.readFile(audioPath),
  );
  const blob = new Blob([audioBuffer], { type: 'audio/mp4' });
  formData.append('file', blob, 'audio.mp4');
  formData.append('model', 'whisper-1');
  formData.append('response_format', 'verbose_json');
  formData.append('timestamp_granularities[]', 'segment');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}` },
    body: formData,
  });

  if (!res.ok) throw new Error(`Transcription failed: ${res.statusText}`);
  const data = await res.json();
  return data.text as string;
}

// ─── AI Analysis & Clip Generation ───────────────────────────────────────────

export interface AnalysisResult {
  clips: Partial<Clip>[];
  summary: string;
  topics: string[];
}

export async function analyzeVideo(
  transcript: string,
  duration: number,
  instruction: string,
  videoId: string,
  projectId: string,
): Promise<AnalysisResult> {
  if (!OPENAI_KEY) {
    return mockAnalysis(duration, videoId, projectId);
  }

  const systemPrompt = `You are an expert video editor and content strategist. 
Analyze the transcript and generate an editing plan.
Return valid JSON only, no markdown.`;

  const userPrompt = `Transcript:
${transcript.slice(0, 6000)}

Video duration: ${duration} seconds

User instruction: ${instruction || 'Find the best moments and create engaging short clips.'}

Return JSON with this structure:
{
  "summary": "brief summary of the video",
  "topics": ["topic1", "topic2"],
  "clips": [
    {
      "title": "clip title",
      "description": "why this is engaging",
      "startTime": 0,
      "endTime": 60,
      "engagementScore": 85,
      "hook": "opening hook sentence",
      "caption": "suggested social caption",
      "hashtags": ["#tag1", "#tag2"],
      "platform": ["tiktok", "instagram"],
      "aspectRatio": "9:16"
    }
  ]
}`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) throw new Error(`AI analysis failed: ${res.statusText}`);
  const data = await res.json();
  const result = JSON.parse(data.choices[0].message.content) as AnalysisResult;

  // Attach IDs
  result.clips = result.clips.map((c) => ({
    ...c,
    id: generateId(),
    videoId,
    projectId,
    duration: (c.endTime ?? 0) - (c.startTime ?? 0),
    status: 'ready' as const,
    createdAt: new Date().toISOString(),
  }));

  return result;
}

// ─── Subtitle generation (mock + real) ────────────────────────────────────────

export function generateSubtitles(
  transcript: string,
  startTime: number,
  endTime: number,
): Subtitle[] {
  const words = transcript.split(' ').filter(Boolean);
  const duration = endTime - startTime;
  const wordsPerSecond = words.length / duration;
  const chunkSize = 8; // words per subtitle line

  const subtitles: Subtitle[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    const t = startTime + i / wordsPerSecond;
    subtitles.push({
      id: generateId(),
      startTime: t,
      endTime: Math.min(t + chunkSize / wordsPerSecond, endTime),
      text: chunk.join(' '),
    });
  }
  return subtitles;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_TRANSCRIPT = `Welcome to today's podcast. We're going to talk about building a successful startup.
The first thing you need to understand is product-market fit. Without it, nothing else matters.
I spent three years working on a product nobody wanted before I learned this lesson.
The key insight was talking to customers before writing a single line of code.
Another critical factor is team. You need people who are passionate and resilient.
The journey is hard. You will face rejection, setbacks, and moments of doubt.
But if you truly believe in what you're building, you push through.
Let me share the moment everything clicked for us. We launched a simple landing page.
Within 24 hours we had 500 email signups. That was our signal.
We doubled down, shipped fast, and got our first paying customer in week three.
Growth hacking is overrated. Genuine value creation is what drives real growth.
Focus on the first 100 customers. Make them obsessively happy.
They become your best marketers. Word of mouth is more powerful than any ad.
In terms of fundraising, don't do it too early. Bootstrap as long as you can.
Every dollar of investor money comes with expectations and pressure.
Finally, take care of your mental health. Founder burnout is real and dangerous.
Build sustainable habits from day one. Your best thinking happens when you're rested.`;

function mockAnalysis(duration: number, videoId: string, projectId: string): AnalysisResult {
  const now = new Date().toISOString();
  return {
    summary:
      'A motivational podcast about startup building, covering product-market fit, team building, and growth strategies.',
    topics: ['Product-Market Fit', 'Team Building', 'Growth Hacking', 'Fundraising', 'Mental Health'],
    clips: [
      {
        id: generateId(), videoId, projectId,
        title: 'The Product-Market Fit Lesson',
        description: 'Hard-won lesson about talking to customers first',
        startTime: 15, endTime: 75, duration: 60,
        engagementScore: 92,
        aspectRatio: '9:16',
        platform: ['tiktok', 'instagram'],
        hook: 'I wasted 3 years building a product nobody wanted...',
        caption: 'The most important startup lesson nobody tells you 🚀',
        hashtags: ['#startup', '#entrepreneurship', '#productmarketfit', '#founder'],
        status: 'ready', createdAt: now,
      },
      {
        id: generateId(), videoId, projectId,
        title: '500 Signups in 24 Hours',
        description: 'The pivotal validation moment that changed everything',
        startTime: 120, endTime: 195, duration: 75,
        engagementScore: 88,
        aspectRatio: '9:16',
        platform: ['tiktok', 'instagram', 'youtube_shorts'],
        hook: 'We launched a landing page with no product...',
        caption: 'This is how we validated our startup idea in one day 💡',
        hashtags: ['#validation', '#startup', '#growthhack', '#saas'],
        status: 'ready', createdAt: now,
      },
      {
        id: generateId(), videoId, projectId,
        title: 'Your First 100 Customers',
        description: 'Focus strategy for early stage growth',
        startTime: 200, endTime: 260, duration: 60,
        engagementScore: 85,
        aspectRatio: '9:16',
        platform: ['tiktok', 'instagram', 'facebook_reels'],
        hook: 'Stop trying to reach millions. Focus on 100.',
        caption: 'The secret growth strategy every founder needs to hear 🎯',
        hashtags: ['#growthhacking', '#startup', '#customersuccess', '#b2b'],
        status: 'ready', createdAt: now,
      },
      {
        id: generateId(), videoId, projectId,
        title: 'Fundraising Truth',
        description: 'When NOT to raise venture capital',
        startTime: 265, endTime: 330, duration: 65,
        engagementScore: 78,
        aspectRatio: '16:9',
        platform: ['youtube_shorts'],
        hook: 'Taking investor money too early almost killed our company.',
        caption: 'The real cost of raising venture capital early 💰',
        hashtags: ['#fundraising', '#vc', '#startup', '#bootstrap'],
        status: 'ready', createdAt: now,
      },
      {
        id: generateId(), videoId, projectId,
        title: 'Founder Mental Health',
        description: 'Building sustainable habits as a founder',
        startTime: 340, endTime: 405, duration: 65,
        engagementScore: 82,
        aspectRatio: '9:16',
        platform: ['tiktok', 'instagram'],
        hook: 'Burnout almost made me quit the best thing I ever built.',
        caption: 'Every founder needs to hear this about mental health 🧠',
        hashtags: ['#founderlife', '#mentalhealth', '#burnout', '#startup'],
        status: 'ready', createdAt: now,
      },
    ],
  };
}
