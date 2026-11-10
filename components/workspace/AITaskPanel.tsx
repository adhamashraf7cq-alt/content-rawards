'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Input';
import { Clip } from '@/types';

const EXAMPLES = [
  'Find the 10 most engaging moments',
  'Create 5 viral-style short clips',
  'Extract all funny moments',
  'Find the best motivational quotes',
  'Turn this into educational clips',
  'Remove silence, keep only highlights',
  'Find moments where the speaker shares a surprising insight',
  'Create a 60-second summary clip',
];

interface Props {
  videoId: string;
  onClipsGenerated: (clips: Clip[]) => void;
}

export function AITaskPanel({ videoId, onClipsGenerated }: Props) {
  const [instruction, setInstruction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  async function run() {
    setError('');
    setLoading(true);
    setStatus('Sending to AI…');

    try {
      const res = await fetch('/api/videos/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, instruction }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Analysis failed');

      setStatus(`✓ ${data.message}`);
      onClipsGenerated(data.clips as Clip[]);
      setInstruction('');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">AI Task</h3>
      </div>

      <Textarea
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        placeholder="Tell the AI what to do…"
        rows={3}
        className="mb-3"
      />

      {/* Example pills */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            onClick={() => setInstruction(ex)}
            className="text-[10px] px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-all border border-zinc-700/50"
          >
            {ex}
          </button>
        ))}
      </div>

      <Button
        className="w-full"
        loading={loading}
        onClick={run}
        icon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
          </svg>
        }
      >
        {loading ? 'Analyzing…' : 'Run AI Analysis'}
      </Button>

      {status && !error && (
        <p className="mt-2 text-xs text-emerald-400">{status}</p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
