import Link from "next/link";

const modules = [
  {
    title: "Technical Vocabulary",
    href: "/vocabulary",
    icon: "\ud83d\udcda",
    description:
      "Master key terms across algorithms, OS, AI, networking, and databases with definitions, examples, and Chinese translations.",
    color: "bg-sky-50 border-sky-200 hover:border-sky-400",
    count: "40 terms \u00b7 5 categories",
  },
  {
    title: "Reading Comprehension",
    href: "/reading",
    icon: "\ud83d\udcd6",
    description:
      "Read real technical passages on Big-O, virtual memory, transformers, and database indexing. Answer comprehension questions.",
    color: "bg-emerald-50 border-emerald-200 hover:border-emerald-400",
    count: "4 articles \u00b7 12 questions",
  },
  {
    title: "Commit Message Practice",
    href: "/commit",
    icon: "\u270d\ufe0f",
    description:
      "Learn to write clear, professional git commit messages following Conventional Commits with real diffs.",
    color: "bg-amber-50 border-amber-200 hover:border-amber-400",
    count: "5 exercises \u00b7 Bug fix, Feature, Perf, Test, Breaking",
  },
  {
    title: "Code Review in English",
    href: "/review",
    icon: "\ud83d\udd0d",
    description:
      "Practice writing code review comments in English. Spot security, performance, concurrency, and error handling issues.",
    color: "bg-purple-50 border-purple-200 hover:border-purple-400",
    count: "4 reviews \u00b7 Security, Performance, Concurrency, Error Handling",
  },
];

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="mb-10">
        <h1 className="mb-2 text-3xl font-semibold text-slate-900">
          DevEnglish &mdash; English for Programmers
        </h1>
        <p className="max-w-2xl text-slate-600">
          Improve your ability to <strong>read technical English</strong> and{" "}
          <strong>write professional commit messages &amp; code reviews</strong>{" "}
          by practicing with real-world content from algorithms, operating
          systems, AI, networking, and databases.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {modules.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className={`group rounded-xl border-2 p-6 transition ${m.color}`}
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="text-3xl">{m.icon}</span>
              <h2 className="text-xl font-semibold text-slate-800 group-hover:text-slate-900">
                {m.title}
              </h2>
            </div>
            <p className="mb-3 text-sm text-slate-600">{m.description}</p>
            <span className="text-xs font-medium text-slate-500">
              {m.count}
            </span>
          </Link>
        ))}
      </div>

      <section className="mt-12 rounded-xl bg-slate-100 p-6">
        <h2 className="mb-3 text-lg font-semibold text-slate-800">
          How It Works
        </h2>
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            {
              step: "1",
              label: "Learn Vocabulary",
              detail: "Study technical terms with context and examples",
            },
            {
              step: "2",
              label: "Read Articles",
              detail: "Read real technical passages and answer questions",
            },
            {
              step: "3",
              label: "Write Commits",
              detail: "Practice writing clear commit messages from diffs",
            },
            {
              step: "4",
              label: "Review Code",
              detail: "Write professional review comments in English",
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-sky-500 font-bold text-white">
                {s.step}
              </div>
              <h3 className="font-semibold text-slate-800">{s.label}</h3>
              <p className="mt-1 text-xs text-slate-500">{s.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
