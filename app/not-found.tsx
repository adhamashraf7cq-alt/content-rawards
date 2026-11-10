import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-7xl font-extrabold text-zinc-800 mb-4">404</p>
        <h1 className="text-xl font-bold text-zinc-200 mb-2">Page not found</h1>
        <p className="text-sm text-zinc-500 mb-6">That page doesn&apos;t exist.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-all"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
