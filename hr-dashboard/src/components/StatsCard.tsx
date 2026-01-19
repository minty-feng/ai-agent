export default function StatsCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-sm text-slate-500">{title}</p>
          <p className="text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="text-3xl">{icon}</div>
      </div>
    </div>
  );
}
