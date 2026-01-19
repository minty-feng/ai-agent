import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function ChallengesPage() {
  const items = [
    { id: 'ch1', title: 'Two Sum', difficulty: 'Easy' },
    { id: 'ch2', title: 'Binary Tree Paths', difficulty: 'Medium' },
    { id: 'ch3', title: 'Substring With Concatenation', difficulty: 'Hard' }
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      <Nav />
      <div className="container-responsive py-8">
        <h1 className="text-2xl font-semibold">Challenges</h1>
        <ul className="mt-6 divide-y border rounded-lg bg-white">
          {items.map((it) => (
            <li key={it.id} className="p-4 flex items-center justify-between">
              <span>{it.title}</span>
              <div className="flex items-center gap-4">
                <span className="text-xs px-2 py-0.5 rounded-full border">{it.difficulty}</span>
                <Link className="text-brand-600" href={`/challenges/${it.id}`}>Open →</Link>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
