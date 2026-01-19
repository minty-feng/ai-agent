'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';
import { useRouter } from 'next/navigation';

interface JobForm {
  company: string;
  role: string;
  jobDescription: string;
}

interface FormErrors {
  role?: string;
  jobDescription?: string;
}

export default function FirstJobOnboardingPage() {
  const [form, setForm] = useState<JobForm>({
    company: '',
    role: '',
    jobDescription: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.role.trim()) {
      newErrors.role = 'Role is required';
    }
    if (!form.jobDescription.trim()) {
      newErrors.jobDescription = 'Job description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    // TODO: Save job to backend
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push('/jobs');
  };

  return (
    <main className="min-h-screen bg-secondary-50">
      <Nav />

      <div className="container-responsive py-12">
        <div className="max-w-2xl mx-auto">
          <div className="card space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold text-secondary-900">Create your first job</h1>
              <p className="text-secondary-600">
                Add a job opportunity to start tracking your application journey.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Company Field */}
              <div className="space-y-2">
                <label htmlFor="company" className="block text-sm font-medium text-secondary-900">
                  Company <span className="text-secondary-500 font-normal">(optional)</span>
                </label>
                <input
                  id="company"
                  name="company"
                  type="text"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="e.g., Google"
                  className="input text-sm"
                />
              </div>

              {/* Role Field */}
              <div className="space-y-2">
                <label htmlFor="role" className="block text-sm font-medium text-secondary-900">
                  Role <span className="text-red-500">*</span>
                </label>
                <input
                  id="role"
                  name="role"
                  type="text"
                  value={form.role}
                  onChange={handleChange}
                  placeholder="e.g., Senior Frontend Engineer"
                  className={`input text-sm ${errors.role ? 'border-red-500 focus:ring-red-500' : ''}`}
                  aria-invalid={!!errors.role}
                  aria-describedby={errors.role ? 'role-error' : undefined}
                />
                {errors.role && (
                  <p id="role-error" className="text-sm text-red-600 mt-1">
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Job Description Field */}
              <div className="space-y-2">
                <label htmlFor="jd" className="block text-sm font-medium text-secondary-900">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="jd"
                  name="jobDescription"
                  value={form.jobDescription}
                  onChange={handleChange}
                  placeholder="Paste or type the job description..."
                  className={`textarea h-48 text-sm ${
                    errors.jobDescription ? 'border-red-500 focus:ring-red-500' : ''
                  }`}
                  aria-invalid={!!errors.jobDescription}
                  aria-describedby={errors.jobDescription ? 'jd-error' : undefined}
                />
                {errors.jobDescription && (
                  <p id="jd-error" className="text-sm text-red-600 mt-1">
                    {errors.jobDescription}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="primary"
                  type="submit"
                  loading={loading}
                  className="flex-1"
                >
                  Create job
                </Button>
              </div>
            </form>

            {/* Helper text */}
            <p className="text-xs text-secondary-500 border-t border-secondary-200 pt-4">
              <span className="font-medium">Tip:</span> The more complete information you provide, the better we can help you track and manage your application.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
