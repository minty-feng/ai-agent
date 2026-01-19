export default function SkillCard({ skill, level, progress }: { skill: string; level: string; progress: number }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="mb-2 flex items-start justify-between">
        <h3 className="font-semibold text-slate-900">{skill}</h3>
        <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">{level}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-gray-100">
        <div
          className="h-2 rounded-full bg-green-500 transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="mt-2 text-sm text-slate-500">{progress}% complete</p>
    </div>
  );
}
