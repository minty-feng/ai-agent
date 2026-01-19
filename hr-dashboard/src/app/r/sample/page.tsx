import Link from 'next/link';

export default function SampleReportPage() {
  return (
    <main className="min-h-screen bg-secondary-50 py-12">
      <div className="container-report">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="text-xl font-bold text-secondary-900">
            ApplyFlow
          </Link>
          <Link href="/try" className="btn-primary">
            Try it
          </Link>
        </div>

        {/* Report Card */}
        <div className="card max-w-4xl mx-auto">
          <div className="border-b border-secondary-200 pb-6 mb-6">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Mock Interview Report</h1>
            <p className="text-secondary-600">Senior Frontend Engineer • Sample Company</p>
          </div>

          {/* Overall Score Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Overall Score</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-primary-50 rounded-lg">
                <div className="text-6xl font-bold text-primary-600 mb-2">7.2</div>
                <div className="text-secondary-600">Out of 10</div>
              </div>
              <div className="flex items-center">
                <div>
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <p className="text-secondary-600">
                    Strong relevance and technical depth, but evidence is weak—add measurable impact and specific examples.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Dimension Breakdown</h2>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Relevance</span>
                  <span className="text-sm font-medium">8.5/10</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Evidence</span>
                  <span className="text-sm font-medium">6.2/10</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '62%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Structure</span>
                  <span className="text-sm font-medium">7.8/10</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Clarity</span>
                  <span className="text-sm font-medium">6.8/10</span>
                </div>
                <div className="w-full bg-secondary-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Improvements */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Top 3 Improvements</h2>
            <div className="space-y-4">
              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="font-semibold text-secondary-900 mb-2">1. Add measurable impact</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-secondary-600 mb-2">
                  <li>Include specific metrics (e.g., "reduced load time by 40%")</li>
                  <li>Quantify team size or user base affected</li>
                </ul>
                <p className="text-sm text-secondary-600">
                  <strong>Data needed:</strong> Performance improvements, user engagement metrics
                </p>
              </div>
              
              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="font-semibold text-secondary-900 mb-2">2. Strengthen your STAR structure</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-secondary-600 mb-2">
                  <li>Clearly separate Situation, Task, Action, and Result</li>
                  <li>Spend more time on Actions and Results</li>
                </ul>
                <p className="text-sm text-secondary-600">
                  <strong>Data needed:</strong> Specific actions you took, measurable results
                </p>
              </div>

              <div className="card bg-yellow-50 border-yellow-200">
                <h3 className="font-semibold text-secondary-900 mb-2">3. Clarify technical decisions</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-secondary-600 mb-2">
                  <li>Explain why you chose a specific technology or approach</li>
                  <li>Mention trade-offs you considered</li>
                </ul>
                <p className="text-sm text-secondary-600">
                  <strong>Data needed:</strong> Alternative solutions considered, decision criteria
                </p>
              </div>
            </div>
          </div>

          {/* Highlight */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Best Answer Highlight</h2>
            <div className="card bg-green-50 border-green-200">
              <div className="mb-2">
                <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                  Behavioral
                </span>
              </div>
              <p className="text-sm font-medium mb-2">
                "Tell me about a time you had to resolve a conflict within your team"
              </p>
              <p className="text-sm text-secondary-600">
                Your answer demonstrated excellent conflict resolution skills and showed empathy. The structure was clear and the outcome was well-articulated.
              </p>
            </div>
          </div>

          {/* Before/After Demo (Pro feature preview) */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Answer Rewrite Example</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="card bg-red-50 border-red-200">
                <h3 className="text-sm font-semibold mb-2">Before</h3>
                <p className="text-sm text-secondary-700">
                  "I worked on improving the app performance. We changed some code and it got faster."
                </p>
              </div>
              <div className="card bg-green-50 border-green-200">
                <h3 className="text-sm font-semibold mb-2">After</h3>
                <p className="text-sm text-secondary-700">
                  "I led the optimization of our React app, implementing code splitting and lazy loading. This reduced initial load time by 45% and improved user engagement by 20%."
                </p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
              <p className="text-sm text-secondary-700">
                <strong>Pro users</strong> get detailed rewrites for all answers. <Link href="/pricing" className="text-primary-600 hover:text-primary-700 font-medium">Upgrade to unlock</Link>
              </p>
            </div>
          </div>

          {/* Next Steps */}
          <div className="border-t border-secondary-200 pt-6">
            <h2 className="text-xl font-semibold mb-4">Next Session Plan</h2>
            <div className="card bg-secondary-50">
              <p className="text-secondary-700 mb-4">
                <strong>Recommended focus:</strong> Evidence + Measurable Impact
              </p>
              <div className="flex gap-3">
                <Link href="/signup" className="btn-primary">
                  Unlock full sessions
                </Link>
                <Link href="/try" className="btn-secondary">
                  Generate questions from your JD
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-secondary-600">
          <p>Reports are anonymous by default.</p>
        </div>
      </div>
    </main>
  );
}
