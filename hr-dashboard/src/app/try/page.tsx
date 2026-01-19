'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';
import { SkeletonLoader } from '@/components/SkeletonLoader';

export default function TryPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [resume, setResume] = useState('');
  const [showResumeInput, setShowResumeInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!jobDescription.trim()) {
      setError('Job description is required.');
      return;
    }

    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      const mockQuestions = [
        'Tell me about a time when you had to handle a challenging technical problem in your previous role.',
        'How do you approach code review and ensure code quality in a team setting?',
        'Describe your experience with the technologies mentioned in this job description.'
      ];
      setQuestions(mockQuestions);
      setLoading(false);
    }, 3000);
  };

  return (
    <>
      <Nav />
      <main className="min-h-screen py-12">
        <div className="container-responsive">
          <div className="max-w-5xl mx-auto">
            <h1 className="text-4xl font-bold text-center text-secondary-900 mb-4">
              Try ApplyFlow free
            </h1>
            <p className="text-center text-secondary-600 mb-12">
              Paste a job description to see how we generate personalized interview questions.
            </p>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Input Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Input</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="textarea h-48"
                      placeholder="Paste a job description here..."
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value);
                        setError('');
                      }}
                    />
                    {error && (
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showResumeInput}
                        onChange={(e) => setShowResumeInput(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">I also want to paste my resume</span>
                    </label>
                  </div>

                  {showResumeInput && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Resume (optional)
                      </label>
                      <textarea
                        className="textarea h-32"
                        placeholder="Paste your resume text here..."
                        value={resume}
                        onChange={(e) => setResume(e.target.value)}
                      />
                    </div>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Generating… (~10s)' : 'Generate 3 interview questions'}
                  </Button>
                </div>
              </div>

              {/* Output Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Output</h2>
                {loading && (
                  <div className="space-y-4">
                    <SkeletonLoader lines={4} />
                    <SkeletonLoader lines={4} />
                    <SkeletonLoader lines={4} />
                  </div>
                )}

                {!loading && questions.length === 0 && (
                  <div className="card bg-secondary-50 text-center py-12">
                    <svg className="w-16 h-16 mx-auto mb-4 text-secondary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-secondary-600">
                      Your generated questions will appear here
                    </p>
                  </div>
                )}

                {!loading && questions.length > 0 && (
                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div key={index} className="card">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <p className="text-secondary-900">{question}</p>
                        </div>
                      </div>
                    ))}

                    <div className="card bg-primary-50 border-primary-200">
                      <h3 className="font-semibold mb-2">Want the full experience?</h3>
                      <p className="text-sm text-secondary-600 mb-4">
                        Sign up to get a complete mock interview with 10 questions, detailed feedback, and a shareable report.
                      </p>
                      <div className="flex gap-3">
                        <Link href="/signup" className="btn-primary flex-1 text-center">
                          Sign up to get a full mock interview + report
                        </Link>
                      </div>
                      <p className="text-center text-sm text-secondary-600 mt-3">
                        Already have an account? <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">Log in</Link>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
