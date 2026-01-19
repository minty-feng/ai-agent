export default function CompetePage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">Compete</h1>
        <p className="text-slate-600">Join live contests and track upcoming competitions.</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Upcoming contests</h2>
        <p className="text-sm text-slate-600">
          Stay ready with weekly challenges and company-sponsored hackathons tailored to your skills.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          <span className="rounded-full bg-purple-50 px-3 py-1 text-purple-700">Weekly Challenge</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">Hackathon</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Leaderboards</span>
        </div>
      </div>
    </main>
  );
}
