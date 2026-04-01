"use client";

import { useState } from "react";
import Link from "next/link";
import { vocabularyData } from "@/data/vocabulary";

export default function VocabularyPage() {
  const [activeCategory, setActiveCategory] = useState(vocabularyData[0].id);
  const [revealedTerms, setRevealedTerms] = useState<Set<string>>(new Set());
  const [quizMode, setQuizMode] = useState(false);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<null | boolean>(null);

  const category = vocabularyData.find((c) => c.id === activeCategory)!;
  const quizTerm = category.terms[quizIndex % category.terms.length];

  function toggleReveal(term: string) {
    setRevealedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  }

  function checkQuiz() {
    const correct =
      quizAnswer.trim().toLowerCase() === quizTerm.term.toLowerCase();
    setQuizResult(correct);
  }

  function nextQuiz() {
    setQuizIndex((i) => i + 1);
    setQuizAnswer("");
    setQuizResult(null);
  }

  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/" className="hover:text-sky-600">
          Home
        </Link>
        <span>/</span>
        <span className="text-slate-800">Vocabulary</span>
      </div>

      <h1 className="mb-2 text-2xl font-semibold">
        {"\ud83d\udcda"} Technical Vocabulary
      </h1>
      <p className="mb-6 text-slate-600">
        Master essential technical English terms. Click a card to reveal the
        definition, or switch to quiz mode to test yourself.
      </p>

      {/* Category tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {vocabularyData.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setActiveCategory(cat.id);
              setRevealedTerms(new Set());
              setQuizIndex(0);
              setQuizResult(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              activeCategory === cat.id
                ? "bg-sky-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {cat.icon} {cat.title}
          </button>
        ))}
      </div>

      {/* Mode toggle */}
      <div className="mb-6 flex gap-3">
        <button
          onClick={() => setQuizMode(false)}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            !quizMode
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          Browse Mode
        </button>
        <button
          onClick={() => {
            setQuizMode(true);
            setQuizResult(null);
            setQuizAnswer("");
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
            quizMode
              ? "bg-sky-100 text-sky-700"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          Quiz Mode
        </button>
      </div>

      {!quizMode ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {category.terms.map((t) => {
            const revealed = revealedTerms.has(t.term);
            return (
              <button
                key={t.term}
                onClick={() => toggleReveal(t.term)}
                className="rounded-xl border bg-white p-5 text-left shadow-sm transition hover:shadow-md"
              >
                <div className="mb-1 flex items-center justify-between">
                  <h3 className="font-mono text-lg font-semibold text-sky-700">
                    {t.term}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {t.chinese}
                  </span>
                </div>
                {revealed ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-slate-700">{t.definition}</p>
                    <p className="rounded bg-slate-50 p-2 font-mono text-xs text-slate-600">
                      {t.example}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-slate-400">
                    Click to reveal definition &amp; example
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div className="mx-auto max-w-lg rounded-xl border bg-white p-8 shadow-sm">
          <p className="mb-1 text-xs text-slate-500">
            Question {(quizIndex % category.terms.length) + 1} of{" "}
            {category.terms.length}
          </p>
          <p className="mb-2 text-sm text-slate-700">{quizTerm.definition}</p>
          <p className="mb-4 rounded bg-slate-50 p-2 font-mono text-xs text-slate-600">
            {quizTerm.example}
          </p>
          <p className="mb-1 text-xs text-slate-400">
            Hint: {quizTerm.chinese}
          </p>

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={quizAnswer}
              onChange={(e) => setQuizAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") checkQuiz();
              }}
              placeholder="Type the English term..."
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
            />
            <button
              onClick={checkQuiz}
              className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Check
            </button>
          </div>

          {quizResult !== null && (
            <div
              className={`mt-4 rounded-lg p-3 text-sm ${
                quizResult
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {quizResult ? (
                <p>
                  {"\u2705"} Correct! The term is{" "}
                  <strong>{quizTerm.term}</strong>.
                </p>
              ) : (
                <p>
                  {"\u274c"} Not quite. The correct answer is{" "}
                  <strong>{quizTerm.term}</strong>.
                </p>
              )}
              <button
                onClick={nextQuiz}
                className="mt-2 text-sm font-medium text-sky-600 hover:text-sky-700"
              >
                Next question &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
