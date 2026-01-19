import StatsCard from '@/components/StatsCard';
import ChallengeCard from '@/components/ChallengeCard';
import SkillCard from '@/components/SkillCard';
import type { Difficulty } from '@/types';

export default function Home() {
  const challenges: Array<{ title: string; difficulty: Difficulty; points: number; successRate: number }> = [
    { title: "Two Sum", difficulty: "Easy", points: 10, successRate: 87 },
    { title: "Binary Search Tree", difficulty: "Medium", points: 25, successRate: 65 },
    { title: "Dynamic Programming", difficulty: "Hard", points: 50, successRate: 42 },
    { title: "Array Manipulation", difficulty: "Easy", points: 15, successRate: 79 },
    { title: "Graph Traversal", difficulty: "Medium", points: 30, successRate: 58 },
    { title: "System Design", difficulty: "Hard", points: 60, successRate: 35 },
  ];

  const skills = [
    { skill: "Problem Solving", level: "Advanced", progress: 75 },
    { skill: "Python", level: "Intermediate", progress: 60 },
    { skill: "JavaScript", level: "Advanced", progress: 80 },
    { skill: "Algorithms", level: "Intermediate", progress: 55 },
  ];

  return (
    <>
      <main className="container mx-auto px-4 py-10">
        {/* Welcome Section */}
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-semibold text-slate-900">Welcome back!</h1>
          <p className="text-slate-600">Continue your coding journey</p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Problems Solved" value={127} icon="✓" />
          <StatsCard title="Current Streak" value="7 days" icon="🔥" />
          <StatsCard title="Ranking" value="#1,234" icon="🏆" />
          <StatsCard title="Points" value={2450} icon="⭐" />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Challenges Section */}
          <div className="lg:col-span-2">
            <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900">Practice Challenges</h2>
                <button className="font-medium text-green-600 transition hover:text-green-700">
                  View All →
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {challenges.map((challenge, index) => (
                  <ChallengeCard key={index} {...challenge} />
                ))}
              </div>
            </div>

            {/* Competitions Section */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Active Competitions</h2>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 py-2 pl-4">
                  <h3 className="font-semibold text-slate-900">Weekly Challenge #47</h3>
                  <p className="text-sm text-slate-500">Ends in 3 days</p>
                  <div className="mt-2 flex items-center text-sm text-slate-600">
                    <span className="mr-4">👥 12,543 participants</span>
                    <span>🏆 Prize: $5,000</span>
                  </div>
                </div>
                <div className="border-l-4 border-blue-500 py-2 pl-4">
                  <h3 className="font-semibold text-slate-900">Algorithm Marathon</h3>
                  <p className="text-sm text-slate-500">Ends in 10 days</p>
                  <div className="mt-2 flex items-center text-sm text-slate-600">
                    <span className="mr-4">👥 8,921 participants</span>
                    <span>🏆 Prize: $10,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills Sidebar */}
          <div>
            <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Your Skills</h2>
              <div className="space-y-4">
                {skills.map((skill, index) => (
                  <SkillCard key={index} {...skill} />
                ))}
              </div>
              <button className="mt-4 w-full rounded-lg bg-green-500 py-2 font-medium text-white transition hover:bg-green-600">
                Add New Skill
              </button>
            </div>

            {/* Achievements */}
            <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-semibold text-slate-900">Achievements</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3 rounded-lg bg-yellow-50 p-3">
                  <span className="text-2xl">🥇</span>
                  <div>
                    <h4 className="font-semibold text-slate-900">Problem Solver</h4>
                    <p className="text-xs text-slate-600">100+ problems solved</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-blue-50 p-3">
                  <span className="text-2xl">⚡</span>
                  <div>
                    <h4 className="font-semibold text-slate-900">Speed Demon</h4>
                    <p className="text-xs text-slate-600">Top 10% fastest solutions</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 rounded-lg bg-green-50 p-3">
                  <span className="text-2xl">🎯</span>
                  <div>
                    <h4 className="font-semibold text-slate-900">Consistent</h4>
                    <p className="text-xs text-slate-600">7-day streak</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-[#0b0f14] py-8 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold mb-3">For Developers</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-green-400">Practice</a></li>
                <li><a href="#" className="hover:text-green-400">Compete</a></li>
                <li><a href="#" className="hover:text-green-400">Certification</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">For Companies</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-green-400">Hire Developers</a></li>
                <li><a href="#" className="hover:text-green-400">Screen Candidates</a></li>
                <li><a href="#" className="hover:text-green-400">Assessments</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">Community</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-green-400">Leaderboard</a></li>
                <li><a href="#" className="hover:text-green-400">Forum</a></li>
                <li><a href="#" className="hover:text-green-400">Blog</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-3">About</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-green-400">About Us</a></li>
                <li><a href="#" className="hover:text-green-400">Careers</a></li>
                <li><a href="#" className="hover:text-green-400">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
            <p>&copy; 2024 HackerRank. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
