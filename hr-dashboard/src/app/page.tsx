import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="container-responsive py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">HR Dashboard</h1>
          <div className="space-x-3">
            <Link className="px-4 py-2 rounded-md bg-brand-600 text-white" href="/dashboard">Dashboard</Link>
            <Link className="px-4 py-2 rounded-md border" href="/login">Login</Link>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="p-6 border rounded-lg">
            <h2 className="text-xl font-medium">Practice Challenges</h2>
            <p className="mt-2 text-gray-600">Solve problems and improve coding skills.</p>
            <Link className="mt-4 inline-block text-brand-600" href="/challenges">Browse challenges →</Link>
          </section>
          <section className="p-6 border rounded-lg">
            <h2 className="text-xl font-medium">Contests</h2>
            <p className="mt-2 text-gray-600">Compete in timed challenges.</p>
            <Link className="mt-4 inline-block text-brand-600" href="/contests">View contests →</Link>
          </section>
        </div>
      </div>
    </main>
  );
}
