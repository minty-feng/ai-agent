'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/Button';
import { Toast, useToast } from '@/components/Toast';
import PaywallModal from '@/components/PaywallModal';

// Mock data for the report
const mockReport = {
  id: 'report-123',
  shareId: 'share-abc123',
  role: 'Senior Frontend Engineer',
  company: 'Acme Corp',
  overallScore: 7.2,
  summary:
    'Strong relevance and technical depth, but evidence is weak—add measurable impact and specific examples.',
  dimensions: [
    { name: 'Relevance', score: 8.5 },
    { name: 'Evidence', score: 6.2 },
    { name: 'Structure', score: 7.8 },
    { name: 'Clarity', score: 6.8 },
  ],
  improvements: [
    {
      id: 1,
      title: 'Add measurable impact',
      fixes: [
        'Include specific metrics (e.g., "reduced load time by 40%")',
        'Quantify team size or user base affected',
      ],
      dataNeeded: 'Performance improvements, user engagement metrics',
    },
    {
      id: 2,
      title: 'Strengthen your STAR structure',
      fixes: [
        'Clearly separate Situation, Task, Action, and Result',
        'Spend more time on Actions and Results',
      ],
      dataNeeded: 'Specific actions you took, measurable results',
    },
    {
      id: 3,
      title: 'Clarify technical decisions',
      fixes: [
        'Explain why you chose a specific technology or approach',
        'Mention trade-offs you considered',
      ],
      dataNeeded: 'Alternative solutions considered, decision criteria',
    },
  ],
  bestHighlight: {
    category: 'Behavioral',
    question: 'Tell me about a time you had to resolve a conflict within your team',
    feedback:
      'Your answer demonstrated excellent conflict resolution skills and showed empathy. The structure was clear and the outcome was well-articulated.',
  },
  rewrites: [
    {
      before:
        'I worked on improving the app performance. We changed some code and it got faster.',
      after:
        'I led the optimization of our React app, implementing code splitting and lazy loading. This reduced initial load time by 45% and improved user engagement by 20%.',
    },
  ],
  recommendedFocus: 'Evidence + Measurable Impact',
  createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
};

// Simulate owner check (in production, verify with backend/auth)
// TODO: Replace with actual authentication context/hook
// Example: const { user, isAuthenticated } = useAuth(); const isOwner = user?.id === reportOwnerId;
const isOwner = true;
// TODO: Replace with actual logged-in user check from auth context
// Example: const { isAuthenticated } = useAuth();
const isLoggedIn = false;

interface PageProps {
  params: {
    shareId: string;
  };
}

export default function ReportPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast, showToast, hideToast } = useToast();

  const [showCompany, setShowCompany] = useState(true);
  const [paywallModal, setPaywallModal] = useState({
    show: false,
    trigger: '',
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Set share URL on client side to avoid hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShareUrl(`${window.location.origin}/r/${params.shareId}`);
    }
  }, [params.shareId]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    showToast('Share link copied!');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRevokeLink = () => {
    if (confirm('Are you sure? This will prevent others from accessing this report.')) {
      showToast('Share link revoked');
      // In production: call API to revoke link
    }
  };

  const handleUnlockSessions = () => {
    if (!isLoggedIn) {
      setPaywallModal({ show: true, trigger: 'full_sessions' });
    } else {
      router.push('/pricing');
    }
  };

  const getDimensionColor = (score: number) => {
    if (score >= 8) return 'bg-primary-600';
    if (score >= 7) return 'bg-primary-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <>
      <main className="min-h-screen bg-secondary-50 py-8 md:py-12">
        <div className="container-report">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-secondary-900">Mock Interview Report</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-2 text-secondary-600">
                <span className="font-medium">{mockReport.role}</span>
                {showCompany && (
                  <>
                    <span className="hidden sm:inline">•</span>
                    <span>{mockReport.company}</span>
                  </>
                )}
                {isOwner && (
                  <button
                    onClick={() => setShowCompany(!showCompany)}
                    className="text-xs text-primary-600 hover:text-primary-700 font-medium ml-2"
                  >
                    {showCompany ? 'Hide' : 'Show'} company
                  </button>
                )}
              </div>
            </div>
            <Link href="/try" className="btn-primary whitespace-nowrap">
              Try it
            </Link>
          </div>

          {/* Owner Actions */}
          {isOwner && (
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={handleCopyLink}
                className="text-xs px-3 py-1.5 bg-white border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                {copiedLink ? '✓ Copied' : 'Copy share link'}
              </button>
              <button
                onClick={handleRevokeLink}
                className="text-xs px-3 py-1.5 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                Revoke link
              </button>
            </div>
          )}

          {/* Main Report Card */}
          <div className="card mb-8">
            {/* Overall Section */}
            <div className="border-b border-secondary-200 pb-8 mb-8">
              <h2 className="text-xl font-semibold mb-6">Overall Performance</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Score */}
                <div className="text-center p-6 bg-primary-50 rounded-lg">
                  <div className="text-5xl md:text-6xl font-bold text-primary-600 mb-2">{mockReport.overallScore}</div>
                  <div className="text-sm text-secondary-600">Out of 10</div>
                </div>

                {/* Summary */}
                <div className="md:col-span-2 flex flex-col justify-center">
                  <h3 className="font-semibold text-secondary-900 mb-2">Summary</h3>
                  <p className="text-secondary-700">{mockReport.summary}</p>
                </div>
              </div>
            </div>

            {/* Dimensions - Desktop Grid */}
            <div className="hidden md:block mb-8">
              <h2 className="text-lg font-semibold mb-4">Dimension Breakdown</h2>
              <div className="grid grid-cols-2 gap-6">
                {mockReport.dimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-secondary-900">{dim.name}</span>
                      <span className="text-sm font-semibold text-secondary-900">{dim.score}/10</span>
                    </div>
                    <div className="w-full bg-secondary-200 rounded-full h-3">
                      <div
                        className={`${getDimensionColor(dim.score)} h-3 rounded-full transition-all`}
                        style={{ width: `${(dim.score / 10) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dimensions - Mobile Simplified */}
            <div className="md:hidden mb-8">
              <h2 className="text-lg font-semibold mb-4">Dimension Breakdown</h2>
              <div className="grid grid-cols-4 gap-2">
                {mockReport.dimensions.map((dim) => (
                  <div key={dim.name} className="text-center">
                    <div
                      className={`${getDimensionColor(dim.score)} h-12 rounded-lg flex items-center justify-center mb-2`}
                    >
                      <span className="text-xs font-bold text-white">{dim.score}</span>
                    </div>
                    <div className="text-xs font-medium text-secondary-600">{dim.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top 3 Improvements */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Top 3 Improvements</h2>
            <div className="grid gap-4">
              {mockReport.improvements.map((improvement) => (
                <div key={improvement.id} className="card bg-yellow-50 border-yellow-200">
                  <h3 className="font-semibold text-secondary-900 mb-3">
                    {improvement.id}. {improvement.title}
                  </h3>
                  <ul className="space-y-2 mb-3">
                    {improvement.fixes.map((fix, idx) => (
                      <li key={idx} className="flex gap-2 text-sm text-secondary-700">
                        <span className="text-primary-600 font-bold">→</span>
                        <span>{fix}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-secondary-600 bg-white bg-opacity-50 p-2 rounded">
                    <strong>Data needed:</strong> {improvement.dataNeeded}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Highlights Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Highlights</h2>

            {/* Best Answer */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3 text-secondary-900">Best Answer</h3>
              <div className="card bg-green-50 border-green-200">
                <div className="mb-3">
                  <span className="inline-block text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                    {mockReport.bestHighlight.category}
                  </span>
                </div>
                <p className="text-sm font-medium text-secondary-900 mb-3">{mockReport.bestHighlight.question}</p>
                <p className="text-sm text-secondary-700">{mockReport.bestHighlight.feedback}</p>
              </div>
            </div>

            {/* Before/After Rewrites */}
            <div>
              <div className="flex items-baseline gap-2 mb-3">
                <h3 className="text-lg font-semibold text-secondary-900">Answer Rewrites</h3>
                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded font-medium">
                  1 Free
                </span>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="card bg-red-50 border-red-200">
                  <h4 className="text-sm font-semibold text-secondary-900 mb-2">Before</h4>
                  <p className="text-sm text-secondary-700">{mockReport.rewrites[0].before}</p>
                </div>
                <div className="card bg-green-50 border-green-200">
                  <h4 className="text-sm font-semibold text-secondary-900 mb-2">After</h4>
                  <p className="text-sm text-secondary-700">{mockReport.rewrites[0].after}</p>
                </div>
              </div>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <p className="text-sm text-secondary-700">
                  <strong>Pro users</strong> unlock detailed rewrites for all 10 answers.{' '}
                  <button
                    onClick={() => setPaywallModal({ show: true, trigger: 'rewrites' })}
                    className="text-primary-600 hover:text-primary-700 font-medium underline"
                  >
                    Learn more
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Next Session Plan */}
          <div className="card border-t-4 border-t-primary-600">
            <h2 className="text-xl font-semibold mb-4">Next Session Plan</h2>
            <p className="text-secondary-700 mb-6">
              <strong>Recommended focus:</strong> {mockReport.recommendedFocus}
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleUnlockSessions} className="btn-primary">
                Unlock full sessions
              </button>
              <Link href="/try" className="btn-secondary">
                Generate questions from your JD
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-12 pt-6 border-t border-secondary-200">
            <p className="text-sm text-secondary-600">Reports are anonymous by default</p>
          </div>
        </div>
      </main>

      {/* Paywall Modal */}
      <PaywallModal
        show={paywallModal.show}
        onClose={() => setPaywallModal({ show: false, trigger: '' })}
        trigger={paywallModal.trigger}
      />

      {/* Toast */}
      <Toast message={toast.message} show={toast.show} onClose={hideToast} />
    </>
  );
}
