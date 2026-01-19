import { Nav } from '@/components/Nav';
import { DashboardCards } from '@/components/DashboardCards';

async function getData() {
  const [progressRes, contestsRes, recRes] = await Promise.all([
    fetch('/api/progress', { cache: 'no-store' }),
    fetch('/api/contests', { cache: 'no-store' }),
    fetch('/api/recommended', { cache: 'no-store' })
  ]);

  const [progress, nextContests, recommended] = await Promise.all([
    progressRes.json(),
    contestsRes.json(),
    recRes.json()
  ]);

  return { progress, nextContests, recommended };
}

export default async function DashboardPage() {
  const data = await getData();
  return (
    <main className="min-h-screen bg-gray-50">
      <Nav />
      <div className="container-responsive py-8 space-y-8">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <DashboardCards
          progress={data.progress}
          nextContests={data.nextContests}
          recommended={data.recommended}
        />
      </div>
    </main>
  );
}
