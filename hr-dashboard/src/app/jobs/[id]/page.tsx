'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LimitBanner } from '@/components/LimitBanner';
import { SkeletonLoader } from '@/components/SkeletonLoader';

// ============================================================================
// Types
// ============================================================================

type JobStatus = 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';

interface JobDetail {
  id: string;
  company: string;
  role: string;
  status: JobStatus;
  jobDescription: string;
  notes: string;
}

interface KeywordGap {
  id: string;
  keyword: string;
}

interface TailoredBullet {
  id: string;
  bullet: string;
  category: string;
}

interface MockSession {
  id: string;
  date: string;
  score: number;
  questionsAsked: number;
}

type TailorState = 'initial' | 'loading' | 'generated';

// ============================================================================
// Constants
// ============================================================================

/** Simulated API delay for better UX during mock data generation */
const MOCK_API_DELAY_MS = 2000;

// ============================================================================
// Mock Data
// ============================================================================

/** 
 * Mock job data for demonstration. In production, this will be replaced with:
 * const job = await fetch(`/api/jobs/${params.id}`).then(r => r.json())
 */
const mockJobData: JobDetail = {
  id: '1',
  company: 'Acme Corporation',
  role: 'Senior Frontend Engineer',
  status: 'Applied',
  jobDescription: `We're looking for a Senior Frontend Engineer to lead our web platform initiatives.

Requirements:
- 5+ years of experience with React, TypeScript
- Strong knowledge of state management (Redux, Zustand)
- Experience with Next.js and SSR/SSG
- Proficiency in CSS-in-JS solutions
- Experience with performance optimization
- Knowledge of web accessibility standards (WCAG)
- Experience with CI/CD pipelines
- Excellent communication and mentoring skills

Responsibilities:
- Design and implement scalable frontend architecture
- Mentor junior engineers
- Collaborate with product and design teams
- Conduct code reviews
- Optimize application performance
- Contribute to technical documentation`,
  notes: 'Met with recruiter on Jan 15. Follow up scheduled for next week.',
};

const mockKeywordGaps: KeywordGap[] = [
  { id: '1', keyword: 'GraphQL' },
  { id: '2', keyword: 'Testing Framework' },
  { id: '3', keyword: 'Docker/Kubernetes' },
  { id: '4', keyword: 'Microservices' },
];

const mockTailoredBullets: TailoredBullet[] = [
  {
    id: '1',
    bullet: 'Led redesign of main dashboard using React + TypeScript, reducing bundle size by 40% and improving Core Web Vitals scores',
    category: 'Performance',
  },
  {
    id: '2',
    bullet: 'Implemented global state management with Redux, reducing prop drilling and improving code maintainability across 50+ components',
    category: 'Architecture',
  },
  {
    id: '3',
    bullet: 'Migrated legacy Vue.js codebase to Next.js with SSR/SSG, improving SEO score from 65 to 95 and reducing page load time by 35%',
    category: 'Framework',
  },
  {
    id: '4',
    bullet: 'Mentored 4 junior engineers through code reviews and pair programming sessions, leading to 2 promotions within 18 months',
    category: 'Leadership',
  },
];

const mockSessions: MockSession[] = [
  {
    id: '1',
    date: 'January 10, 2025',
    score: 78,
    questionsAsked: 10,
  },
  {
    id: '2',
    date: 'January 5, 2025',
    score: 72,
    questionsAsked: 10,
  },
];

// ============================================================================
// Collapsible Section Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="card">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-2 mb-4 hover:opacity-80 transition-opacity"
      >
        <h2 className="text-lg font-semibold text-secondary-900">{title}</h2>
        <svg
          className={`w-5 h-5 text-secondary-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </button>
      {isOpen && <div>{children}</div>}
    </div>
  );
}

// ============================================================================
// Keyword Gap Chip Component
// ============================================================================

interface KeywordChipProps {
  keyword: string;
  onCopy: (keyword: string) => void;
}

function KeywordChip({ keyword, onCopy }: KeywordChipProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(keyword);
    setCopied(true);
    setTimeout(() => setCopied(false), MOCK_API_DELAY_MS);
  };

  return (
    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-3 py-1.5 text-sm text-secondary-700 hover:bg-yellow-100 transition-colors">
      <span>{keyword}</span>
      <button
        onClick={() => {
          handleCopy();
          onCopy(keyword);
        }}
        className="text-yellow-600 hover:text-yellow-700 transition-colors"
        title="Copy keyword"
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Tailored Bullet Card Component
// ============================================================================

interface BulletCardProps {
  bullet: string;
  category: string;
  onCopy: (bullet: string) => void;
}

function BulletCard({ bullet, category, onCopy }: BulletCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(bullet);
    setCopied(true);
    setTimeout(() => setCopied(false), MOCK_API_DELAY_MS);
  };

  const categoryColors: Record<string, string> = {
    Performance: 'bg-blue-50 text-blue-700',
    Architecture: 'bg-purple-50 text-purple-700',
    Framework: 'bg-green-50 text-green-700',
    Leadership: 'bg-pink-50 text-pink-700',
  };

  return (
    <div className="border border-secondary-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`text-xs font-medium px-2 py-1 rounded ${categoryColors[category] || 'bg-secondary-100 text-secondary-700'}`}>
          {category}
        </span>
        <button
          onClick={() => {
            handleCopy();
            onCopy(bullet);
          }}
          className="text-secondary-500 hover:text-secondary-700 transition-colors flex-shrink-0"
          title="Copy bullet"
        >
          {copied ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          )}
        </button>
      </div>
      <p className="text-sm text-secondary-700 leading-relaxed">{bullet}</p>
    </div>
  );
}

// ============================================================================
// Module B: Tailor Resume Component
// ============================================================================

function TailorResumeModule() {
  const [state, setState] = useState<TailorState>('initial');
  const [keywords, setKeywords] = useState<KeywordGap[]>([]);
  const [bullets, setBullets] = useState<TailoredBullet[]>([]);

  const handleGenerateTailor = async () => {
    setState('loading');
    // Simulate API call: const res = await fetch(`/api/jobs/${jobId}/tailor`)
    await new Promise((resolve) => setTimeout(resolve, MOCK_API_DELAY_MS));
    setKeywords(mockKeywordGaps);
    setBullets(mockTailoredBullets);
    setState('generated');
  };

  const handleCopyKeyword = (keyword: string) => {
    // TODO: Replace with toast notification system before production
    // Example: showToast({ message: `Copied: ${keyword}`, type: 'success' });
    console.log('Copied keyword:', keyword);
  };

  const handleCopyBullet = (bullet: string) => {
    // TODO: Replace with toast notification system before production
    // Example: showToast({ message: 'Bullet copied to clipboard', type: 'success' });
    console.log('Copied bullet:', bullet);
  };

  return (
    <CollapsibleSection title="Tailor Resume" defaultOpen={true}>
      {/* Initial State */}
      {state === 'initial' && (
        <div className="space-y-4">
          <p className="text-secondary-600">
            Generate tailored bullets and keyword gaps for this role.
          </p>
          <Button
            variant="primary"
            onClick={handleGenerateTailor}
            className="w-full sm:w-auto"
          >
            Generate tailored bullets
          </Button>
        </div>
      )}

      {/* Loading State */}
      {state === 'loading' && (
        <div className="space-y-4">
          <SkeletonLoader lines={4} />
        </div>
      )}

      {/* Generated State */}
      {state === 'generated' && (
        <div className="space-y-6">
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Keyword Gaps */}
            <div>
              <h3 className="text-base font-semibold text-secondary-900 mb-4">
                Keyword gaps ({keywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {keywords.map((item) => (
                  <KeywordChip
                    key={item.id}
                    keyword={item.keyword}
                    onCopy={handleCopyKeyword}
                  />
                ))}
              </div>
            </div>

            {/* Right Column: Tailored Bullets */}
            <div>
              <h3 className="text-base font-semibold text-secondary-900 mb-4">
                Tailored bullet suggestions ({bullets.length})
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {bullets.map((item) => (
                  <BulletCard
                    key={item.id}
                    bullet={item.bullet}
                    category={item.category}
                    onCopy={handleCopyBullet}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="pt-4 border-t border-secondary-200">
            <Button
              variant="primary"
              className="w-full sm:w-auto"
            >
              Start a mock interview for this job
            </Button>
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
}

// ============================================================================
// Module C: Mock Interview Component
// ============================================================================

function MockInterviewModule() {
  const hasSessions = mockSessions.length > 0;

  return (
    <CollapsibleSection title="Mock Interview" defaultOpen={true}>
      <div className="space-y-6">
        {/* Initial State / CTA */}
        <div className="space-y-4">
          <p className="text-secondary-600">
            10 questions in Pro, 3 in Free. Get a shareable report after.
          </p>
          <Button variant="primary" className="w-full sm:w-auto">
            Start mock session
          </Button>
        </div>

        {/* Session History */}
        {hasSessions && (
          <div className="pt-6 border-t border-secondary-200">
            <h3 className="text-base font-semibold text-secondary-900 mb-4">
              Session history
            </h3>
            <div className="space-y-3">
              {mockSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-secondary-900">
                      {session.date}
                    </p>
                    <p className="text-xs text-secondary-600">
                      {session.questionsAsked} questions • Score: <strong>{session.score}%</strong>
                    </p>
                  </div>
                  <Button variant="text">View report</Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSessions && (
          <div className="p-6 bg-secondary-50 rounded-lg text-center">
            <p className="text-sm text-secondary-600">
              Complete your first mock to get a report
            </p>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function JobDetailPage({ params }: { params: { id: string } }) {
  // TODO: Fetch job data from API using params.id
  // const [job, setJob] = useState<JobDetail | null>(null);
  // useEffect(() => {
  //   fetch(`/api/jobs/${params.id}`).then(r => r.json()).then(setJob);
  // }, [params.id]);
  
  // For now, using mock data for demonstration
  const [job, setJob] = useState<JobDetail>(mockJobData);
  const [isEditingJD, setIsEditingJD] = useState(false);
  const [jdText, setJdText] = useState(job.jobDescription);
  const [notesText, setNotesText] = useState(job.notes);
  const [status, setStatus] = useState<JobStatus>(job.status);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const statuses: JobStatus[] = ['Saved', 'Applied', 'Interviewing', 'Offer', 'Rejected'];

  // Save Job Description
  const handleSaveJD = () => {
    setJob({ ...job, jobDescription: jdText, notes: notesText });
    setIsEditingJD(false);
  };

  // Update Status
  const handleStatusChange = (newStatus: JobStatus) => {
    setStatus(newStatus);
    setJob({ ...job, status: newStatus });
    setIsStatusOpen(false);
  };

  // Copy job link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.href}`);
    setCopied(true);
    setTimeout(() => setCopied(false), MOCK_API_DELAY_MS);
  };

  return (
    <main className="min-h-screen bg-secondary-50">
      <Nav />

      <div className="container-responsive py-8 space-y-8">
        {/* ====================================================================
            Header Section
            ==================================================================== */}
        <div className="space-y-6">
          {/* Limit Banner - conditionally shown */}
          <LimitBanner current={1} max={1} type="sessions" />

          {/* Company + Role + Status Row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-secondary-600 mb-1">
                {job.company}
              </p>
              <h1 className="text-4xl font-bold text-secondary-900">
                {job.role}
              </h1>
            </div>

            {/* Status Badge with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className="flex items-center gap-2 px-4 py-2 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <Badge status={status} />
                <svg
                  className={`w-4 h-4 text-secondary-600 transition-transform ${isStatusOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isStatusOpen && (
                <div className="absolute top-full right-0 mt-2 bg-white border border-secondary-200 rounded-lg shadow-lg z-10 min-w-48">
                  {statuses.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary-50 transition-colors first:rounded-t-lg last:rounded-b-lg text-left"
                    >
                      <Badge status={s} />
                      {s === status && (
                        <svg className="w-4 h-4 text-primary-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="primary" className="flex-1 sm:flex-none">
              Start mock
            </Button>
            <Button variant="secondary" className="flex-1 sm:flex-none">
              Generate tailored bullets
            </Button>
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-secondary-300 rounded-lg hover:bg-secondary-50 transition-colors text-secondary-700 font-medium"
              title="Copy job link"
            >
              {copied ? (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="hidden sm:inline">Copied</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Copy link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ====================================================================
            Module A: Job Description
            ==================================================================== */}
        <CollapsibleSection title="Job Description" defaultOpen={true}>
          <div className="space-y-4">
            {/* Editable JD Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-900">
                Job Description
              </label>
              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                disabled={!isEditingJD}
                className="textarea disabled:bg-secondary-50 disabled:cursor-not-allowed"
                rows={8}
                placeholder="Paste or edit the job description here..."
              />
            </div>

            {/* Notes Textarea */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-secondary-900">
                Notes (optional)
              </label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                disabled={!isEditingJD}
                className="textarea disabled:bg-secondary-50 disabled:cursor-not-allowed"
                rows={3}
                placeholder="Add any notes about this job..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              {!isEditingJD ? (
                <Button
                  variant="secondary"
                  onClick={() => setIsEditingJD(true)}
                >
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="primary"
                    onClick={handleSaveJD}
                  >
                    Save changes
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setJdText(job.jobDescription);
                      setNotesText(job.notes);
                      setIsEditingJD(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </CollapsibleSection>

        {/* ====================================================================
            Module B: Tailor Resume (MVP Focus)
            ==================================================================== */}
        <TailorResumeModule />

        {/* ====================================================================
            Module C: Mock Interview
            ==================================================================== */}
        <MockInterviewModule />
      </div>
    </main>
  );
}
