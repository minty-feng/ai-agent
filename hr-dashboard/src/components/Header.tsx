export default function Header() {
  return (
    <header className="bg-[#0d1117] text-white shadow-md">
      <nav className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold text-green-500">HR</div>
              <span className="text-xl font-semibold">HackerRank</span>
            </div>
            <div className="hidden md:flex space-x-6">
              <a href="#" className="hover:text-green-400 transition">Dashboard</a>
              <a href="#" className="hover:text-green-400 transition">Practice</a>
              <a href="#" className="hover:text-green-400 transition">Compete</a>
              <a href="#" className="hover:text-green-400 transition">Jobs</a>
              <a href="#" className="hover:text-green-400 transition">Leaderboard</a>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-800 rounded">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold">U</span>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
