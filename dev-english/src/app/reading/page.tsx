"use client";

import { useState } from "react";
import Link from "next/link";
import { readingData } from "@/data/reading";

export default function ReadingPage() {
  const [activePassage, setActivePassage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);

  const passage = readingData[activePassage];

  function selectAnswer(qIndex: number, optIndex: number) {
    if (showResults) return;
    setAnswers((prev) => ({ ...prev, [`${activePassage}-${qIndex}`]: optIndex }));
  }

  function handleCheck() {
    setShowResults(true);
  }

  function handleNext() {
    setActivePassage((i) => (i + 1) % readingData.length);
    setAnswers({});
    setShowResults(false);
  }

  const score = passage.questions.reduce((acc, q, i) => {
    return acc + (answers[`${activePassage}-${i}`] === q.answer ? 1 : 0);
  }, 0);

  const difficultyColor: Record<string, string> = {
    Beginner: "bg-green-100 text-green-700",
    Intermediate: "bg-yellow-100 text-yellow-700",
    Advanced: "bg-red-100 text-red-700",
  };

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-800">Reading</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">
        {"\ud83d\udcd6"} Reading Comprehension
      </h1>
      <p className="mb-6 text-slate-600">
        Read a technical passage, then answer the comprehension questions below.
      </p>

      {/* Article selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {readingData.map((p, i) => (
          <button
            key={p.id}
            onClick={() => {
              setActivePassage(i);
              setAnswers({});
              setShowResults(false);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activePassage === i
                ? "bg-emerald-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>

      {/* Passage */}
      <div className="mb-8 rounded-xl border bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-slate-900">
            {passage.title}
          </h2>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${difficultyColor[passage.difficulty]}`}
          >
            {passage.difficulty}
          </span>
          <span className="text-xs text-slate-400">{passage.category}</span>
        </div>
        <div className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
          {passage.passage}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {passage.questions.map((q, qIndex) => {
          const selectedKey = `${activePassage}-${qIndex}`;
          const selected = answers[selectedKey];
          return (
            <div
              key={qIndex}
              className="rounded-xl border bg-white p-6 shadow-sm"
            >
              <p className="mb-3 font-medium text-slate-800">
                {qIndex + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt, optIndex) => {
                  let optClass =
                    "border-slate-200 bg-white hover:bg-slate-50";
                  if (showResults) {
                    if (optIndex === q.answer)
                      optClass =
                        "border-green-400 bg-green-50 text-green-800";
                    else if (optIndex === selected && optIndex !== q.answer)
                      optClass = "border-red-400 bg-red-50 text-red-800";
                  } else if (selected === optIndex) {
                    optClass = "border-sky-400 bg-sky-50 text-sky-800";
                  }
                  return (
                    <button
                      key={optIndex}
                      onClick={() => selectAnswer(qIndex, optIndex)}
                      className={`w-full rounded-lg border p-3 text-left text-sm transition ${optClass}`}
                    >
                      {String.fromCharCode(65 + optIndex)}. {opt}
                    </button>
                  );
                })}
              </div>
              {showResults && (
                <p className="mt-3 rounded bg-slate-50 p-2 text-xs text-slate-600">
                  {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-3">
        {!showResults ? (
          <button
            onClick={handleCheck}
            disabled={
              Object.keys(answers).filter((k) =>
                k.startsWith(`${activePassage}-`)
              ).length < passage.questions.length
            }
            className="rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-600 disabled:opacity-50"
          >
            Check Answers
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium">
              Score: {score} / {passage.questions.length}
            </span>
            <button
              onClick={handleNext}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 font-medium text-white transition hover:bg-emerald-600"
            >
              Next Article &rarr;
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
