
import type { SchoolInfo } from './types';
import { SCHOOL_INFO_CACHE_KEY } from './types';

interface Props {
  data: SchoolInfo;
  onChange: (data: SchoolInfo) => void;
}

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function SchoolInfoForm({ data, onChange }: Props) {
  const update = (field: keyof SchoolInfo, value: string | number) => {
    const next = { ...data, [field]: value };
    onChange(next);
    // Persist to localStorage so returning users don't re-type
    try { localStorage.setItem(SCHOOL_INFO_CACHE_KEY, JSON.stringify(next)); } catch { /* quota */ }
  };

  const inputCls = 'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">School Information</h2>
        <p className="text-gray-500 mt-1">
          This information appears on the generated form header.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* School Name */}
        <div className="sm:col-span-2">
          <label className={labelCls}>School Name *</label>
          <input
            type="text"
            value={data.name}
            onChange={e => update('name', e.target.value)}
            placeholder="e.g. Mati Central Elementary School"
            className={inputCls}
            required
          />
        </div>

        {/* School ID */}
        <div>
          <label className={labelCls}>School ID</label>
          <input
            type="text"
            value={data.schoolId}
            onChange={e => update('schoolId', e.target.value)}
            placeholder="e.g. 301234"
            className={inputCls}
          />
        </div>

        {/* Division */}
        <div>
          <label className={labelCls}>Division</label>
          <input
            type="text"
            value={data.division}
            onChange={e => update('division', e.target.value)}
            placeholder="e.g. Division of Davao Oriental"
            className={inputCls}
          />
        </div>

        {/* Region */}
        <div>
          <label className={labelCls}>Region</label>
          <input
            type="text"
            value={data.region}
            onChange={e => update('region', e.target.value)}
            placeholder="e.g. Region XI"
            className={inputCls}
          />
        </div>

        {/* District */}
        <div>
          <label className={labelCls}>District</label>
          <input
            type="text"
            value={data.district}
            onChange={e => update('district', e.target.value)}
            placeholder="e.g. Mati District"
            className={inputCls}
          />
        </div>

        {/* School Year */}
        <div>
          <label className={labelCls}>School Year *</label>
          <input
            type="text"
            value={data.schoolYear}
            onChange={e => update('schoolYear', e.target.value)}
            placeholder="e.g. 2024-2025"
            className={inputCls}
            required
          />
        </div>

        {/* Grade Level */}
        <div>
          <label className={labelCls}>Grade Level *</label>
          <select
            value={data.gradeLevel}
            onChange={e => update('gradeLevel', Number(e.target.value))}
            className={inputCls}
          >
            <option value={0} disabled>Select grade level</option>
            {GRADE_LEVELS.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div>
          <label className={labelCls}>Section Name *</label>
          <input
            type="text"
            value={data.sectionName}
            onChange={e => update('sectionName', e.target.value)}
            placeholder="e.g. Mapagmahal"
            className={inputCls}
            required
          />
        </div>

        {/* Adviser */}
        <div className="sm:col-span-2">
          <label className={labelCls}>Adviser / Teacher Name</label>
          <input
            type="text"
            value={data.adviserName}
            onChange={e => update('adviserName', e.target.value)}
            placeholder="e.g. Juan dela Cruz"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}
