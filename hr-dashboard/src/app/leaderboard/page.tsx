export default function LeaderboardPage() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">Leaderboard</h1>
        <p className="text-slate-600">See where you stand across global and community rankings.</p>
      </div>
      <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-slate-900">Your current rank</h2>
        <p className="text-sm text-slate-600">
          Keep climbing by solving challenges, participating in contests, and earning badges.
        </p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-medium">
          <span className="rounded-full bg-yellow-50 px-3 py-1 text-yellow-700">Top 10%</span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">Weekly Points</span>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">Streak Boost</span>
        </div>
      </div>
    </main>
  );
}
