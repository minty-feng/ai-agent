export default function JobsPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">Jobs</h1>
        <p className="text-slate-600">Explore opportunities and showcase your verified skills.</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Talent matches</h2>
        <p className="text-sm text-slate-600">
          Build a standout profile and apply to roles that value your coding performance.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">Verified Skills</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Remote Ready</span>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-orange-700">New Roles</span>
        </div>
      </div>
    </main>
  );
}
