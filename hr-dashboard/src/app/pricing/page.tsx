import Link from 'next/link';
import { Nav } from '@/components/Nav';

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen py-12">
        <div className="container-responsive">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-secondary-900 mb-4">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-secondary-600">
                Start free, upgrade when you're ready for unlimited practice.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="card">
                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Free</h2>
                  <div className="text-4xl font-bold mb-2">$0</div>
                  <p className="text-secondary-600">Perfect for trying out ApplyFlow</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track up to <strong>3 jobs</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>1 mock session</strong> per job</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>3 questions</strong> per session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Tailored resume bullets</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Shareable reports</span>
                  </li>
                </ul>

                <Link href="/signup" className="btn-secondary w-full text-center block">
                  Start free
                </Link>
              </div>

              <div className="card border-primary-500 border-2 relative">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold mb-2">Pro</h2>
                  <div className="text-4xl font-bold mb-2">
                    $19<span className="text-xl font-normal text-secondary-600">/month</span>
                  </div>
                  <p className="text-secondary-600">For serious job seekers</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Track <strong>unlimited jobs</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Unlimited mock sessions</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>10 questions</strong> per session</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Follow-up questions</strong></span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Detailed feedback & rewrites</strong> for every answer</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span><strong>Track improvement</strong> over time</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Priority support</span>
                  </li>
                </ul>

                <Link href="/signup" className="btn-primary w-full text-center block">
                  Start Pro
                </Link>
                <p className="text-center text-sm text-secondary-600 mt-3">
                  Cancel anytime. Your data stays private.
                </p>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-center mb-8">Frequently asked questions</h2>
              <div className="space-y-4 max-w-3xl mx-auto">
                <details className="card cursor-pointer">
                  <summary className="font-semibold cursor-pointer">
                    Can I switch between Free and Pro?
                  </summary>
                  <p className="mt-2 text-secondary-600">
                    Yes! You can upgrade to Pro anytime. If you downgrade from Pro to Free, your existing jobs and reports will remain accessible, but you'll be limited by Free plan constraints for new content.
                  </p>
                </details>

                <details className="card cursor-pointer">
                  <summary className="font-semibold cursor-pointer">
                    What payment methods do you accept?
                  </summary>
                  <p className="mt-2 text-secondary-600">
                    We accept all major credit cards via Stripe. Your payment information is secure and never stored on our servers.
                  </p>
                </details>

                <details className="card cursor-pointer">
                  <summary className="font-semibold cursor-pointer">
                    Is there a refund policy?
                  </summary>
                  <p className="mt-2 text-secondary-600">
                    Yes. If you're not satisfied within the first 7 days, contact us for a full refund.
                  </p>
                </details>

                <details className="card cursor-pointer">
                  <summary className="font-semibold cursor-pointer">
                    How does the free trial work?
                  </summary>
                  <p className="mt-2 text-secondary-600">
                    There's no time limit on the Free plan. You can use it indefinitely with the specified limits. Upgrade to Pro only when you need more features.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
