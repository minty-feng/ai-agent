import { Nav } from '@/components/Nav';

export default function ContestsPage() {
  const contests = [
    { id: 'c1', name: 'Monthly Contest', startAt: new Date(Date.now() + 86400000).toISOString() },
    { id: 'c2', name: 'Weekly Sprint', startAt: new Date(Date.now() + 3 * 86400000).toISOString() }
  ];
  return (
    <main className="min-h-screen bg-gray-50">
      <Nav />
      <div className="container-responsive py-8 space-y-6">
        <h1 className="text-2xl font-semibold">Contests</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {contests.map((c) => (
            <div key={c.id} className="p-6 border rounded-lg bg-white">
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-gray-600 mt-2">Starts {new Date(c.startAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
