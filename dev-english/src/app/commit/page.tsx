"use client";

import { useState } from "react";
import Link from "next/link";
import { commitData } from "@/data/commits";

export default function CommitPage() {
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [userCommit, setUserCommit] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const exercise = commitData[exerciseIndex];

  function handleNext() {
    setExerciseIndex((i) => (i + 1) % commitData.length);
    setUserCommit("");
    setShowAnswer(false);
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-800">Commit Messages</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">
        {"\u270d\ufe0f"} Commit Message Practice
      </h1>
      <p className="mb-6 text-slate-600">
        Read the scenario and diff, then write a professional commit message.
        Compare yours with good and bad examples.
      </p>

      {/* Exercise selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {commitData.map((ex, i) => (
          <button
            key={ex.id}
            onClick={() => {
              setExerciseIndex(i);
              setUserCommit("");
              setShowAnswer(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              exerciseIndex === i
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {ex.category}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Scenario + Diff */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-900">Scenario</h2>
            <p className="text-sm text-slate-700">{exercise.scenario}</p>
          </div>
          <div className="rounded-xl border bg-slate-900 p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-300">Diff</h2>
            <pre className="overflow-x-auto font-mono text-xs leading-relaxed">
              {exercise.diff.split("\n").map((line, i) => {
                let cls = "text-slate-400";
                if (line.startsWith("+")) cls = "text-green-400";
                else if (line.startsWith("-")) cls = "text-red-400";
                else if (line.startsWith("@@")) cls = "text-sky-400";
                return (
                  <div key={i} className={cls}>
                    {line}
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Right: Write commit + Answers */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h2 className="mb-2 font-semibold text-slate-900">
              Your Commit Message
            </h2>
            <textarea
              value={userCommit}
              onChange={(e) => setUserCommit(e.target.value)}
              rows={4}
              placeholder="type: subject line&#10;&#10;Optional body explaining WHY..."
              className="w-full rounded-lg border p-3 font-mono text-sm focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
            <button
              onClick={() => setShowAnswer(true)}
              className="mt-3 rounded-lg bg-amber-500 px-6 py-2 font-medium text-white transition hover:bg-amber-600"
            >
              Show Answer
            </button>
          </div>

          {showAnswer && (
            <>
              <div className="rounded-xl border border-green-200 bg-green-50 p-6">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-green-800">
                  {"\u2705"} Good Commit
                </h3>
                <pre className="whitespace-pre-wrap font-mono text-sm text-green-900">
                  {exercise.goodCommit}
                </pre>
              </div>

              <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                <h3 className="mb-2 flex items-center gap-2 font-semibold text-red-800">
                  {"\u274c"} Bad Commit
                </h3>
                <pre className="whitespace-pre-wrap font-mono text-sm text-red-900">
                  {exercise.badCommit}
                </pre>
              </div>

              <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="mb-2 font-semibold text-slate-900">
                  Why?
                </h3>
                <p className="mb-3 text-sm text-slate-700">
                  {exercise.explanation}
                </p>
                <h4 className="mb-1 text-sm font-semibold text-slate-800">
                  Tips:
                </h4>
                <ul className="list-inside list-disc space-y-1 text-sm text-slate-600">
                  {exercise.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </div>

              <button
                onClick={handleNext}
                className="rounded-lg bg-amber-500 px-6 py-2.5 font-medium text-white transition hover:bg-amber-600"
              >
                Next Exercise &rarr;
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
