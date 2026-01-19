export default function SkillCard({ skill, level, progress }: { skill: string; level: string; progress: number }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-800">{skill}</h3>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{level}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-600 mt-2">{progress}% complete</p>
    </div>
  );
}
