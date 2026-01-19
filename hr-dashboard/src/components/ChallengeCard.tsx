import type { Difficulty } from '@/types';

export default function ChallengeCard({ 
  title, 
  difficulty, 
  points, 
  successRate 
}: { 
  title: string; 
  difficulty: Difficulty; 
  points: number; 
  successRate: number;
}) {
  const difficultyColors: Record<Difficulty, string> = {
    Easy: 'bg-green-100 text-green-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Hard: 'bg-red-100 text-red-700',
  };

  return (
    <div className="cursor-pointer rounded-xl border border-gray-200/70 bg-white p-5 shadow-sm transition hover:border-gray-300 hover:shadow-md">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${difficultyColors[difficulty]}`}>
          {difficulty}
        </span>
      </div>
      <div className="flex items-center justify-between text-sm text-slate-600">
        <div className="flex items-center space-x-4">
          <span className="flex items-center">
            <svg className="w-4 h-4 mr-1 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            {points} pts
          </span>
          <span>{successRate}% success</span>
        </div>
      </div>
    </div>
  );
}
