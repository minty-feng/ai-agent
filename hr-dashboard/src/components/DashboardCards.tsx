type Progress = {
  solved: number;
  total: number;
};

type Contest = {
  id: string;
  name: string;
  startAt: string;
};

type Challenge = {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
};

export function DashboardCards({
  progress,
  nextContests,
  recommended
}: {
  progress: Progress;
  nextContests: Contest[];
  recommended: Challenge[];
}) {
  const percent = Math.round((progress.solved / Math.max(progress.total, 1)) * 100);
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <section className="p-6 border rounded-lg">
        <h3 className="font-medium">Your Progress</h3>
        <div className="mt-4">
          <div className="text-sm text-gray-600">{progress.solved} / {progress.total} solved</div>
          <div className="mt-2 h-2 bg-gray-100 rounded">
            <div className="h-2 bg-brand-600 rounded" style={{ width: `${percent}%` }} />
          </div>
        </div>
      </section>

      <section className="p-6 border rounded-lg">
        <h3 className="font-medium">Upcoming Contests</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {nextContests.map((c) => (
            <li key={c.id} className="flex items-center justify-between">
              <span>{c.name}</span>
              <time className="text-gray-500">{new Date(c.startAt).toLocaleString()}</time>
            </li>
          ))}
          {nextContests.length === 0 && <li className="text-gray-500">No upcoming contests</li>}
        </ul>
      </section>

      <section className="p-6 border rounded-lg">
        <h3 className="font-medium">Recommended Challenges</h3>
        <ul className="mt-4 space-y-2 text-sm">
          {recommended.map((ch) => (
            <li key={ch.id} className="flex items-center justify-between">
              <span>{ch.title}</span>
              <span className="text-xs px-2 py-0.5 rounded-full border">{ch.difficulty}</span>
            </li>
          ))}
          {recommended.length === 0 && <li className="text-gray-500">No recommendations</li>}
        </ul>
      </section>
    </div>
  );
}
