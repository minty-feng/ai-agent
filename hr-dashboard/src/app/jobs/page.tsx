'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { LimitBanner } from '@/components/LimitBanner';
import Link from 'next/link';

interface Job {
  id: string;
  company: string;
  role: string;
  status: 'Saved' | 'Applied' | 'Interviewing' | 'Offer' | 'Rejected';
  updated: string;
}

// Mock data for demonstration
const mockJobs: Job[] = [
  {
    id: '1',
    company: 'Acme Corp',
    role: 'Senior Frontend Engineer',
    status: 'Applied',
    updated: '2 days ago',
  },
  {
    id: '2',
    company: 'TechStart Inc',
    role: 'Full Stack Engineer',
    status: 'Interviewing',
    updated: '1 day ago',
  },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const isEmpty = jobs.length === 0;

  return (
    <main className="min-h-screen bg-secondary-50">
      <Nav />

      <div className="container-responsive py-8 space-y-6">
        {/* Header with New Job button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold text-secondary-900">Jobs</h1>
          <Link href="/onboarding/first-job">
            <Button variant="primary">New job</Button>
          </Link>
        </div>

        {/* Limit Banner */}
        <LimitBanner current={jobs.length} max={3} type="jobs" />

        {/* Empty State */}
        {isEmpty ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-secondary-900">
                Track your applications in one place
              </h2>
              <p className="text-secondary-600 max-w-md">
                Start creating jobs to organize and track your job applications across all companies.
              </p>
            </div>
            <Link href="/onboarding/first-job">
              <Button variant="primary">Create your first job</Button>
            </Link>
          </div>
        ) : (
          /* Jobs Table */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-secondary-200 bg-secondary-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr
                      key={job.id}
                      className="border-b border-secondary-200 hover:bg-secondary-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                        {job.company}
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-700">{job.role}</td>
                      <td className="px-6 py-4 text-sm">
                        <Badge status={job.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-secondary-600">{job.updated}</td>
                      <td className="px-6 py-4 text-sm space-x-2">
                        <button className="text-primary-600 hover:text-primary-700 font-medium transition-colors">
                          Edit
                        </button>
                        <span className="text-secondary-300">·</span>
                        <button className="text-red-600 hover:text-red-700 font-medium transition-colors">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
