'use client';

import Link from 'next/link';
import { Button } from '@/components/Button';

interface PaywallModalProps {
  show: boolean;
  onClose: () => void;
  trigger?: string;
}

export default function PaywallModal({ show, onClose, trigger = 'upgrade' }: PaywallModalProps) {
  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
        role="presentation"
        aria-label="Close paywall modal"
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full animate-scale-in">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-secondary-400 hover:text-secondary-600 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Header */}
          <div className="px-6 py-8 border-b border-secondary-200">
            <h2 className="text-2xl font-bold text-secondary-900">Upgrade to Pro</h2>
            <p className="text-sm text-secondary-600 mt-1">
              {trigger === 'full_sessions'
                ? 'Unlock unlimited mock interview sessions'
                : trigger === 'rewrites'
                  ? 'Get AI-powered rewrites for all your answers'
                  : 'Access premium features to improve faster'}
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-8">
            {/* Value Points */}
            <div className="space-y-4 mb-8">
              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 text-sm">Full 10-question sessions</h3>
                  <p className="text-xs text-secondary-600 mt-1">Complete interviews with follow-up questions</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 text-sm">Detailed feedback & rewrites</h3>
                  <p className="text-xs text-secondary-600 mt-1">AI-powered improvements for every answer</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-secondary-900 text-sm">Track improvement over time</h3>
                  <p className="text-xs text-secondary-600 mt-1">See your progress across multiple sessions</p>
                </div>
              </div>
            </div>

            {/* Price */}
            <div className="mb-8">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-secondary-900">$19</span>
                <span className="text-secondary-600">/month</span>
              </div>
              <p className="text-xs text-secondary-600 mt-2">Billed monthly. Cancel anytime.</p>
            </div>

            {/* CTA */}
            <Link href="/pricing" className="w-full block">
              <Button variant="primary" className="w-full">
                Start Pro
              </Button>
            </Link>

            {/* Close Alternative */}
            <button
              onClick={onClose}
              className="w-full mt-2 px-4 py-2 text-secondary-600 hover:text-secondary-900 font-medium transition-colors"
            >
              Continue with Free
            </button>
          </div>

          {/* Footer Text */}
          <div className="px-6 py-4 bg-secondary-50 border-t border-secondary-200 rounded-b-lg">
            <p className="text-xs text-secondary-600 text-center">
              Cancel anytime • Your data stays private
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
