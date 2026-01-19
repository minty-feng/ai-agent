export default function PracticePage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">Practice</h1>
        <p className="text-slate-600">Sharpen your skills with curated tracks and daily challenges.</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Recommended next steps</h2>
        <p className="text-sm text-slate-600">
          Pick up where you left off with algorithm warm-ups, SQL practice, and domain-specific tracks.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Algorithms</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">SQL</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Interview Prep</span>
        </div>
      </div>
    </main>
  );
}
