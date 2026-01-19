import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function Landing() {
  return (
    <>
      <Nav />
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-b from-secondary-50 to-white">
          <div className="container-responsive">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl font-bold text-secondary-900 mb-6">
                Turn any job description into a tailored interview plan in minutes.
              </h1>
              <p className="text-xl text-secondary-600 mb-8">
                Track applications → tailor your resume bullets → practice with mock interviews → share a report to get feedback.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/try" className="btn-primary text-lg">
                  Try free
                </Link>
                <Link href="/r/sample" className="btn-secondary text-lg">
                  View sample report
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container-responsive">
            <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
              How it works
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Paste resume + JD</h3>
                <p className="text-secondary-600">
                  Add your resume and the job description you're targeting.
                </p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Get tailored bullets + question pack</h3>
                <p className="text-secondary-600">
                  AI generates personalized resume bullets and interview questions.
                </p>
              </div>
              <div className="card text-center">
                <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Do a mock session → get a shareable report</h3>
                <p className="text-secondary-600">
                  Practice your answers and share your report with mentors or friends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Report Preview */}
        <section className="py-20 bg-secondary-50">
          <div className="container-responsive">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-center text-secondary-900 mb-4">
                Share your progress
              </h2>
              <p className="text-center text-secondary-600 mb-12">
                This is what you can share with mentors/friends (anonymous by default).
              </p>
              <div className="card">
                <div className="border-b border-secondary-200 pb-4 mb-4">
                  <h3 className="text-xl font-semibold mb-2">Mock Interview Report</h3>
                  <p className="text-sm text-secondary-600">Senior Frontend Engineer</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-center mb-4">
                      <div className="text-5xl font-bold text-primary-600 mb-2">7.2</div>
                      <div className="text-sm text-secondary-600">Overall Score</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Top Improvement</h4>
                    <p className="text-sm text-secondary-600">
                      Strong relevance, but evidence is weak—add measurable impact.
                    </p>
                  </div>
                </div>
                <div className="mt-6 text-center">
                  <Link href="/r/sample" className="text-primary-600 hover:text-primary-700 font-medium">
                    View full report →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="py-20">
          <div className="container-responsive">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-secondary-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-secondary-600">
                Start free, upgrade when you're ready.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="card">
                <h3 className="text-xl font-semibold mb-2">Free</h3>
                <div className="text-3xl font-bold mb-4">$0</div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3 jobs tracked</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>1 mock session per job</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>3 questions per session</span>
                  </li>
                </ul>
                <Link href="/try" className="btn-secondary w-full text-center block">
                  Try free
                </Link>
              </div>
              <div className="card border-primary-500 border-2">
                <h3 className="text-xl font-semibold mb-2">Pro</h3>
                <div className="text-3xl font-bold mb-4">$19<span className="text-lg font-normal text-secondary-600">/month</span></div>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited jobs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Unlimited mock sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>10 questions + follow-ups</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Detailed feedback & rewrites</span>
                  </li>
                </ul>
                <Link href="/signup" className="btn-primary w-full text-center block">
                  Start Pro
                </Link>
              </div>
            </div>
            <div className="text-center mt-8">
              <Link href="/pricing" className="text-primary-600 hover:text-primary-700 font-medium">
                View full pricing details →
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 bg-secondary-50">
          <div className="container-responsive">
            <h2 className="text-3xl font-bold text-center text-secondary-900 mb-12">
              Frequently asked questions
            </h2>
            <div className="max-w-3xl mx-auto space-y-6">
              <details className="card cursor-pointer">
                <summary className="font-semibold">Is my data private?</summary>
                <p className="mt-2 text-secondary-600">
                  Yes. Your resume and job applications are private. Reports are anonymous by default and only accessible via a private link that you control.
                </p>
              </details>
              <details className="card cursor-pointer">
                <summary className="font-semibold">Can I cancel my subscription anytime?</summary>
                <p className="mt-2 text-secondary-600">
                  Yes, you can cancel your Pro subscription at any time. You'll continue to have access until the end of your billing period.
                </p>
              </details>
              <details className="card cursor-pointer">
                <summary className="font-semibold">Will the AI make up information?</summary>
                <p className="mt-2 text-secondary-600">
                  Our AI generates questions and suggestions based on your actual resume and job description. We focus on helping you articulate your real experience, not fabricating content.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container-responsive text-center text-sm text-secondary-600">
            <p>&copy; 2026 ApplyFlow. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </>
  );
}
