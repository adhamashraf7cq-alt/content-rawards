'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    annual: 0,
    description: 'Perfect for trying it out.',
    features: [
      '3 videos per month',
      '10 clips per video',
      '720p export',
      'Automatic subtitles',
      '1 GB storage',
    ],
    cta: 'Get Started Free',
    variant: 'outline' as const,
    highlight: false,
  },
  {
    name: 'Pro',
    monthly: 29,
    annual: 19,
    description: 'For creators who ship daily.',
    features: [
      'Unlimited videos',
      'Unlimited clips',
      '1080p export',
      'Animated captions',
      'Custom AI tasks',
      'Background music',
      '100 GB storage',
      'Priority processing',
    ],
    cta: 'Start Pro Trial',
    variant: 'primary' as const,
    highlight: true,
  },
  {
    name: 'Team',
    monthly: 79,
    annual: 59,
    description: 'For agencies and teams.',
    features: [
      'Everything in Pro',
      '5 team members',
      '4K export',
      'Custom branding',
      'API access',
      'Dedicated support',
      '1 TB storage',
      'SLA guarantee',
    ],
    cta: 'Start Team Trial',
    variant: 'outline' as const,
    highlight: false,
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(false);
  const router = useRouter();

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-violet-400 text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
          <h2 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
          <p className="text-zinc-400 mb-8">No hidden fees. Cancel any time.</p>
          <div className="inline-flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-full px-1.5 py-1.5">
            <button
              onClick={() => setAnnual(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !annual ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                annual ? 'bg-violet-600 text-white shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Annual <span className="text-xs text-emerald-400 ml-1">–35%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-6 border transition-all ${
                plan.highlight
                  ? 'bg-zinc-900 border-violet-500/50 shadow-xl shadow-violet-900/20'
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-violet-600 text-white text-xs font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-zinc-400 mb-4">{plan.description}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold text-white">
                    ${annual ? plan.annual : plan.monthly}
                  </span>
                  <span className="text-zinc-400 text-sm pb-1">/mo</span>
                </div>
                {annual && plan.annual > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Save ${(plan.monthly - plan.annual) * 12}/yr
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 mb-7">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                variant={plan.variant}
                className="w-full"
                onClick={() => router.push('/dashboard')}
              >
                {plan.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
