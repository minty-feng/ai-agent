'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';
import { useRouter } from 'next/navigation';

export default function ResumeOnboardingPage() {
  const [resume, setResume] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSaveAndContinue = async () => {
    setLoading(true);
    // TODO: Save resume to backend
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/onboarding/first-job');
  };

  const handleSkip = () => {
    router.push('/onboarding/first-job');
  };

  return (
    <main className="min-h-screen bg-secondary-50">
      <Nav />

      <div className="container-responsive py-12">
        <div className="max-w-2xl mx-auto">
          <div className="card space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-secondary-900">Add your resume</h1>
              <p className="text-secondary-600">
                Paste the text content of your resume to help us match you with better opportunities.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="resume" className="block text-sm font-medium text-secondary-900">
                  Resume text
                </label>
                <textarea
                  id="resume"
                  value={resume}
                  onChange={(e) => setResume(e.target.value)}
                  placeholder="Paste your resume content here..."
                  className="textarea h-64 text-sm"
                />
                <p className="text-xs text-secondary-500 mt-2">
                  Simply copy and paste the text from your resume. Formatting will be preserved where possible.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="primary"
                loading={loading}
                onClick={handleSaveAndContinue}
                className="flex-1"
              >
                Save & continue
              </Button>
              <Button variant="secondary" onClick={handleSkip} className="flex-1">
                Skip for now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
