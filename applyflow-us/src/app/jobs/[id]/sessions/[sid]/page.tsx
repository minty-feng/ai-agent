'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';

// ============================================================================
// Types
// ============================================================================

type QuestionCategory = 'Behavioral' | 'Deep-dive' | 'Role-specific';

interface Question {
  id: string;
  number: number;
  text: string;
  category: QuestionCategory;
}

interface SessionScore {
  overall: number;
  relevance: number;
  evidence: number;
  structure: number;
  clarity: number;
}

type SessionState = 'answering' | 'completed';

// ============================================================================
// Constants
// ============================================================================

/** Auto-save draft every N milliseconds */
const AUTO_SAVE_INTERVAL_MS = 3000;

/** Mock questions for demo (3 for Free plan) */
const mockQuestions: Question[] = [
  {
    id: '1',
    number: 1,
    text: 'Tell me about a time you had to work with a difficult team member. How did you handle it?',
    category: 'Behavioral',
  },
  {
    id: '2',
    number: 2,
    text: 'Walk me through your approach to optimizing a slow-loading page. What tools and techniques do you use?',
    category: 'Deep-dive',
  },
  {
    id: '3',
    number: 3,
    text: 'Describe a project where you had to learn a new technology quickly. How did you approach it?',
    category: 'Role-specific',
  },
];

/** Mock session score for completion */
const mockSessionScore: SessionScore = {
  overall: 7.2,
  relevance: 8.5,
  evidence: 6.2,
  structure: 7.8,
  clarity: 6.8,
};

const mockImprovements = [
  {
    title: 'Add measurable impact',
    description: 'Include specific metrics (e.g., "reduced load time by 40%") and quantify team size or user base affected.',
  },
  {
    title: 'Strengthen your STAR structure',
    description: 'Clearly separate Situation, Task, Action, and Result. Spend more time on Actions and Results.',
  },
  {
    title: 'Clarify technical decisions',
    description: 'Explain why you chose a specific technology or approach. Mention trade-offs you considered.',
  },
];

// ============================================================================
// Confirmation Dialog Component
// ============================================================================

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-secondary-900 mb-2">{title}</h2>
        <p className="text-secondary-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Category Badge Component
// ============================================================================

interface CategoryBadgeProps {
  category: QuestionCategory;
}

function CategoryBadge({ category }: CategoryBadgeProps) {
  const categoryColors: Record<QuestionCategory, string> = {
    Behavioral: 'bg-blue-100 text-blue-700',
    'Deep-dive': 'bg-purple-100 text-purple-700',
    'Role-specific': 'bg-green-100 text-green-700',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryColors[category]}`}>
      {category}
    </span>
  );
}

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full bg-secondary-200 rounded-full h-2">
      <div
        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// ============================================================================
// Question Card Component
// ============================================================================

interface QuestionCardProps {
  question: Question;
  answer: string;
  onChange: (answer: string) => void;
  isSaving?: boolean;
}

function QuestionCard({ question, answer, onChange, isSaving = false }: QuestionCardProps) {
  return (
    <div className="card">
      {/* Question Number Badge */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 bg-primary-100 rounded-full">
          <span className="text-sm font-semibold text-primary-600">Q{question.number}</span>
        </div>
        <CategoryBadge category={question.category} />
      </div>

      {/* Question Text */}
      <h2 className="text-2xl font-bold text-secondary-900 mb-6 leading-relaxed">
        {question.text}
      </h2>

      {/* Answer Textarea */}
      <div className="space-y-2 mb-4">
        <label htmlFor="answer" className="text-sm font-medium text-secondary-900">
          Your Answer
        </label>
        <textarea
          id="answer"
          value={answer}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer here. Auto-saves every 3 seconds."
          className="textarea min-h-48 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Auto-save indicator with dynamic status */}
      <p className="text-xs text-secondary-500">
        {isSaving ? (
          <span className="flex items-center gap-1">
            <span className="inline-block animate-pulse">●</span> Saving...
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <span className="text-green-600">✓</span> Auto-saves every 3 seconds
          </span>
        )}
      </p>
    </div>
  );
}

// ============================================================================
// Completion Page Component
// ============================================================================

interface CompletionPageProps {
  shareId: string;
  onStartNext: () => void;
}

function CompletionPage({ shareId, onStartNext }: CompletionPageProps) {
  const router = useRouter();

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <div className="card">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Session Complete! 🎉</h2>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Overall Score */}
          <div className="text-center p-6 bg-primary-50 rounded-lg">
            <div className="text-7xl font-bold text-primary-600 mb-2">{mockSessionScore.overall}</div>
            <div className="text-secondary-600 text-lg">Out of 10</div>
          </div>

          {/* Summary Text */}
          <div className="flex items-center">
            <div>
              <h3 className="font-semibold text-secondary-900 mb-3">Summary</h3>
              <p className="text-secondary-600 leading-relaxed">
                Strong relevance and technical depth, but evidence is weak—add measurable impact and specific examples.
              </p>
            </div>
          </div>
        </div>

        {/* Dimension Scores */}
        <div>
          <h3 className="text-lg font-semibold text-secondary-900 mb-4">Dimension Breakdown</h3>
          <div className="space-y-4">
            {/* Relevance */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-900">Relevance</span>
                <span className="text-sm font-semibold text-primary-600">{mockSessionScore.relevance}/10</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full"
                  style={{ width: `${mockSessionScore.relevance * 10}%` }}
                />
              </div>
            </div>

            {/* Evidence */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-900">Evidence</span>
                <span className="text-sm font-semibold text-yellow-600">{mockSessionScore.evidence}/10</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${mockSessionScore.evidence * 10}%` }}
                />
              </div>
            </div>

            {/* Structure */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-900">Structure</span>
                <span className="text-sm font-semibold text-primary-600">{mockSessionScore.structure}/10</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2.5">
                <div
                  className="bg-primary-600 h-2.5 rounded-full"
                  style={{ width: `${mockSessionScore.structure * 10}%` }}
                />
              </div>
            </div>

            {/* Clarity */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-secondary-900">Clarity</span>
                <span className="text-sm font-semibold text-yellow-600">{mockSessionScore.clarity}/10</span>
              </div>
              <div className="w-full bg-secondary-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-500 h-2.5 rounded-full"
                  style={{ width: `${mockSessionScore.clarity * 10}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Improvements */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-secondary-900">Top 3 Improvements</h3>
        {mockImprovements.map((improvement, index) => (
          <div key={index} className="card bg-yellow-50 border-yellow-200">
            <h4 className="font-semibold text-secondary-900 mb-2">
              {index + 1}. {improvement.title}
            </h4>
            <p className="text-sm text-secondary-600">{improvement.description}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="card bg-secondary-50 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="primary"
            className="flex-1"
            onClick={() => {
              const reportUrl = `/r/${shareId}`;
              window.location.href = reportUrl;
            }}
          >
            View full report
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onStartNext}
          >
            Start next session
          </Button>
        </div>
        <p className="text-xs text-secondary-600">
          💡 Pro tip: Share your report link with others for feedback
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Main Session Page Component
// ============================================================================

export default function MockSessionPage({
  params,
}: {
  params: { id: string; sid: string };
}) {
  const router = useRouter();

  // State Management
  const [sessionState, setSessionState] = useState<SessionState>('answering');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showPaywallConfirm, setShowPaywallConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = mockQuestions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || '';
  const totalQuestions = mockQuestions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const questionsAnswered = Object.keys(answers).length;

  // Auto-save draft answers
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would save to API:
      // POST /api/sessions/{sid}/answers with { questionId, answer }
      // For now, we track saving state for UX feedback
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 500); // Show saving indicator briefly
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [answers]);

  // Update answer for current question
  const handleAnswerChange = useCallback((newAnswer: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: newAnswer,
    }));
  }, [currentQuestion.id]);

  // Navigate to next question
  const handleNext = () => {
    if (isLastQuestion) {
      // Finish session and show completion page
      setSessionState('completed');
    } else {
      // Move to next question
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Skip current question
  const handleSkip = () => {
    if (isLastQuestion) {
      // On last question, skip means finish
      setSessionState('completed');
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  // Confirm end session
  const handleConfirmEnd = () => {
    setShowEndConfirm(false);
    router.push(`/jobs/${params.id}`);
  };

  // Handle "Start next session" - show paywall for Free plan
  const handleStartNext = () => {
    // In production: check user plan
    // if (user.plan === 'free') {
    setShowPaywallConfirm(true);
    // } else {
    //   router.push(`/jobs/${params.id}/sessions/new`);
    // }
  };

  // Share ID for report (in production, would be generated from session data via API)
  // This would typically come from: const sessionData = await fetch(`/api/sessions/${params.sid}`).then(r => r.json());
  // const shareId = sessionData.shareId || generateUUID();
  const shareId = `share-${params.sid}-${Date.now()}`;  // Demo: pseudo-unique ID

  // Render completion page
  if (sessionState === 'completed') {
    return (
      <main className="min-h-screen bg-secondary-50">
        <Nav />
        <div className="container-responsive py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-secondary-900">Interview Results</h1>
            <Button
              variant="secondary"
              onClick={() => router.push(`/jobs/${params.id}`)}
            >
              Back to job
            </Button>
          </div>

          <CompletionPage shareId={shareId} onStartNext={handleStartNext} />
        </div>

        {/* Paywall Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showPaywallConfirm}
          title="Upgrade to Pro"
          message="Free users can do 1 session per job. Upgrade to Pro to unlock unlimited sessions."
          confirmText="Upgrade"
          cancelText="Back"
          onConfirm={() => {
            setShowPaywallConfirm(false);
            router.push('/pricing');
          }}
          onCancel={() => setShowPaywallConfirm(false)}
        />
      </main>
    );
  }

  // Render answering state
  return (
    <main className="min-h-screen bg-secondary-50">
      <Nav />

      <div className="container-responsive py-8">
        {/* ====================================================================
            Top Bar: Progress, Timer Toggle, End Session
            ==================================================================== */}
        <div className="mb-8 space-y-4">
          {/* Progress Info and End Session Button */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-secondary-900">
              Question {currentQuestionIndex + 1}/{totalQuestions}
            </h1>
            <Button
              variant="secondary"
              onClick={() => setShowEndConfirm(true)}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              End session
            </Button>
          </div>

          {/* Progress Bar */}
          <ProgressBar current={currentQuestionIndex + 1} total={totalQuestions} />

          {/* Answers Status */}
          <p className="text-sm text-secondary-600">
            {questionsAnswered} of {totalQuestions} answered
          </p>
        </div>

        {/* ====================================================================
            Main Content: Question Card
            ==================================================================== */}
        <QuestionCard
          question={currentQuestion}
          answer={currentAnswer}
          onChange={handleAnswerChange}
          isSaving={isSaving}
        />

        {/* ====================================================================
            Navigation Buttons
            ==================================================================== */}
        <div className="mt-8 flex gap-3 justify-between">
          <Button
            variant="secondary"
            onClick={handleSkip}
            className="w-full sm:w-auto"
          >
            {isLastQuestion ? 'Finish session' : 'Skip'}
          </Button>
          <Button
            variant="primary"
            onClick={handleNext}
            className="w-full sm:w-auto"
          >
            {isLastQuestion ? 'Finish session' : 'Next'}
          </Button>
        </div>
      </div>

      {/* ====================================================================
          Confirmation Dialogs
          ==================================================================== */}

      {/* End Session Confirmation */}
      <ConfirmationDialog
        isOpen={showEndConfirm}
        title="End Session?"
        message={`You've answered ${questionsAnswered} of ${totalQuestions} questions. Your progress will be saved. Are you sure you want to end this session?`}
        confirmText="End Session"
        cancelText="Keep Going"
        onConfirm={handleConfirmEnd}
        onCancel={() => setShowEndConfirm(false)}
      />
    </main>
  );
}
