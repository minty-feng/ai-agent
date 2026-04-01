"use client";

import { useState } from "react";
import Link from "next/link";
import { reviewData } from "@/data/review";

export default function ReviewPage() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [userComments, setUserComments] = useState<Record<number, string>>({});
  const [showAnswers, setShowAnswers] = useState(false);

  const exercise = reviewData[exerciseIndex];

  function handleNext() {
    setExerciseIndex((i) => (i + 1) % reviewData.length);
    setUserComments({});
    setShowAnswers(false);
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-800">Code Review</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">
        {"\ud83d\udd0d"} Code Review in English
      </h1>
      <p className="mb-6 text-slate-600">
        Review the code below and write your comments in English. Then compare
        with expert examples.
      </p>

      {/* Exercise selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {reviewData.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => {
              setExerciseIndex(i);
              setUserComments({});
              setShowAnswers(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              exerciseIndex === i
                ? "bg-purple-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {ex.category}: {ex.title}
          </button>
        ))}
      </div>

      {/* Code display */}
      <div className="mb-6 rounded-xl border bg-slate-900 p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="font-semibold text-white">{exercise.title}</h2>
          <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
            {exercise.language}
          </span>
          <span className="rounded bg-purple-900 px-2 py-0.5 text-xs text-purple-300">
            {exercise.category}
          </span>
        </div>
        <pre className="overflow-x-auto font-mono text-sm leading-relaxed text-slate-200">
          {exercise.code.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-6 select-none text-right text-slate-500">
                {i + 1}
              </span>
              <span>{line}</span>
            </div>
          ))}
        </pre>
      </div>

      {/* Issues to find */}
      <div className="space-y-6">
        {exercise.issues.map((issue, i) => (
          <div key={i} className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                Issue {i + 1}
              </span>
              <span className="text-xs text-slate-400">{issue.line}</span>
            </div>

            <p className="mb-3 text-sm font-medium text-slate-800">
              {issue.problem}
            </p>

            <textarea
              value={userComments[i] || ""}
              onChange={(e) =>
                setUserComments((prev) => ({ ...prev, [i]: e.target.value }))
              }
              rows={3}
              placeholder="Write your review comment in English..."
              className="mb-3 w-full rounded-lg border p-3 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
            />

            {showAnswers && (
              <div className="space-y-2">
                <div className="rounded-lg bg-purple-50 p-3">
                  <h4 className="mb-1 text-xs font-semibold text-purple-700">
                    Suggestion
                  </h4>
                  <p className="text-sm text-purple-900">{issue.suggestion}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <h4 className="mb-1 text-xs font-semibold text-slate-700">
                    Example Comment
                  </h4>
                  <p className="text-sm text-slate-700">
                    {issue.exampleComment}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {!showAnswers ? (
          <button
            onClick={() => setShowAnswers(true)}
            className="rounded-lg bg-purple-500 px-6 py-2.5 font-medium text-white transition hover:bg-purple-600"
          >
            Show Expert Answers
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="rounded-lg bg-purple-500 px-6 py-2.5 font-medium text-white transition hover:bg-purple-600"
          >
            Next Exercise &rarr;
          </button>
        )}
      </div>
    </main>
  );
}
