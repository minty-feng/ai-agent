import { Nav } from '@/components/Nav';
import Link from 'next/link';

export default function ChallengeDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  return (
    <main className="min-h-screen bg-gray-50">
      <Nav />
      <div className="container-responsive py-8 space-y-4">
        <div className="text-sm"><Link href="/challenges" className="text-brand-600">← Back to challenges</Link></div>
        <h1 className="text-2xl font-semibold">Challenge {id}</h1>
        <p className="text-gray-600">Problem statement coming soon.</p>
      </div>
    </main>
  );
}
