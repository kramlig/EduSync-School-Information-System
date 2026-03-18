import React from 'react';

/**
 * CSS-based product mockups for the landing page.
 * These look like real screenshots but are built purely with Tailwind —
 * zero external images, retina-sharp at any size, instant load.
 */

/* ------------------------------------------------------------------ */
/*  Dashboard Mockup — shown in the hero section                       */
/* ------------------------------------------------------------------ */
export const DashboardMockup: React.FC = () => (
  <div className="relative select-none pointer-events-none">
    {/* Soft glow behind */}
    <div className="absolute -inset-6 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-3xl blur-3xl" />

    {/* Browser window */}
    <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-white/20">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        </div>
        <div className="flex-1 text-center">
          <span className="inline-flex items-center gap-1 bg-slate-700/80 rounded px-2.5 py-0.5 text-[10px] text-slate-400">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            edusync.ph/dashboard
          </span>
        </div>
      </div>

      {/* Dashboard body */}
      <div className="flex" style={{ height: 260 }}>
        {/* Sidebar */}
        <div className="w-12 bg-indigo-950 py-3 px-1.5 flex flex-col items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center mb-1">
            <span className="text-white text-[7px] font-extrabold tracking-tight">ES</span>
          </div>
          <div className="w-7 h-7 rounded-lg bg-indigo-800/80" />
          <div className="w-7 h-7 rounded-lg bg-white/10" />
          <div className="w-7 h-7 rounded-lg bg-white/10" />
          <div className="w-7 h-7 rounded-lg bg-white/10" />
          <div className="mt-auto w-7 h-7 rounded-full bg-indigo-400/30" />
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50 p-2.5 overflow-hidden space-y-2">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div>
              <div className="h-2 w-16 bg-slate-800 rounded" />
              <div className="h-1.5 w-28 bg-slate-300 rounded mt-0.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <div className="w-5 h-5 rounded-full bg-slate-200" />
                <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500" />
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Students', value: '1,247', change: '↑ 12%', color: 'text-green-600' },
              { label: 'Attendance', value: '94.2%', change: '↑ 3%', color: 'text-green-600' },
              { label: 'At Risk', value: '5', change: 'Action needed', color: 'text-red-500' },
              { label: 'Forms Done', value: '89%', change: 'On track', color: 'text-blue-600' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-md p-1.5 shadow-sm border border-slate-100">
                <div className="text-[6px] text-slate-400">{s.label}</div>
                <div className="text-[11px] font-bold text-slate-800 leading-tight">{s.value}</div>
                <div className={`text-[5px] font-semibold ${s.color}`}>{s.change}</div>
              </div>
            ))}
          </div>

          {/* Chart + Activity */}
          <div className="grid grid-cols-5 gap-1.5">
            {/* Bar chart */}
            <div className="col-span-3 bg-white rounded-md p-2 shadow-sm border border-slate-100">
              <div className="text-[7px] font-semibold text-slate-700 mb-1.5">Grade Distribution</div>
              <div className="flex items-end gap-[2px] h-14">
                {[38, 62, 50, 78, 68, 88, 55, 72, 82, 45, 66, 85].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[1px] bg-gradient-to-t from-indigo-600 to-indigo-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
            </div>

            {/* Activity list */}
            <div className="col-span-2 bg-white rounded-md p-1.5 shadow-sm border border-slate-100">
              <div className="text-[7px] font-semibold text-slate-700 mb-1">Recent Activity</div>
              <div className="space-y-1">
                {[
                  { dot: 'bg-green-400', text: 'SF9 Generated', tag: 'Done', tagCls: 'text-green-700 bg-green-50' },
                  { dot: 'bg-blue-400', text: 'Grade Posted', tag: 'New', tagCls: 'text-blue-700 bg-blue-50' },
                  { dot: 'bg-amber-400', text: 'Enrollment', tag: 'Review', tagCls: 'text-amber-700 bg-amber-50' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div className={`w-3 h-3 rounded-full ${a.dot} shrink-0`} />
                    <span className="text-[6px] text-slate-600 flex-1 truncate">{a.text}</span>
                    <span className={`text-[5px] font-semibold px-1 py-0.5 rounded-full ${a.tagCls}`}>{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Student table rows */}
          <div className="bg-white rounded-md p-1.5 shadow-sm border border-slate-100">
            <div className="text-[7px] font-semibold text-slate-700 mb-1">Top Performers</div>
            {[
              { name: 'Maria S.', grade: '98', color: 'bg-emerald-100 text-emerald-700' },
              { name: 'Juan D.', grade: '95', color: 'bg-emerald-100 text-emerald-700' },
              { name: 'Ana R.', grade: '93', color: 'bg-blue-100 text-blue-700' },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-1 py-0.5">
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shrink-0" />
                <span className="text-[6px] text-slate-600 flex-1">{s.name}</span>
                <span className={`text-[5px] font-bold px-1.5 py-0.5 rounded-full ${s.color}`}>{s.grade}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    {/* Floating "Form Generated" card */}
    <div className="absolute -bottom-5 -left-4 bg-white rounded-xl shadow-xl p-2.5 border border-slate-100 animate-float" style={{ width: 150 }}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <svg className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
        </div>
        <div>
          <div className="text-[8px] font-bold text-slate-800">Form 138 Ready</div>
          <div className="text-[6px] text-slate-400">40 students · 30 sec</div>
        </div>
      </div>
    </div>

    {/* Floating AI badge */}
    <div className="absolute -top-3 -right-2 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-xl shadow-xl px-2.5 py-1.5 animate-float" style={{ animationDelay: '1.5s' }}>
      <div className="text-[7px] font-medium opacity-80">AI Insight</div>
      <div className="text-[10px] font-bold">5 At-Risk Detected</div>
    </div>
  </div>
);


/* ------------------------------------------------------------------ */
/*  Phone Mockup — Parent Portal view                                  */
/* ------------------------------------------------------------------ */
export const PhoneMockup: React.FC = () => (
  <div className="relative select-none pointer-events-none mx-auto" style={{ width: 180 }}>
    {/* Phone frame */}
    <div className="bg-slate-900 rounded-[2rem] p-1.5 shadow-2xl border-2 border-slate-700">
      {/* Notch */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 w-16 h-4 bg-slate-900 rounded-b-xl z-10" />

      {/* Screen */}
      <div className="bg-white rounded-[1.6rem] overflow-hidden relative" style={{ height: 340 }}>
        {/* Status bar */}
        <div className="bg-indigo-600 px-4 pt-5 pb-1 flex items-center justify-between">
          <span className="text-[7px] text-white/70 font-medium">9:41 AM</span>
          <div className="flex gap-1 items-center">
            <div className="w-2.5 h-1.5 bg-white/50 rounded-sm" />
            <div className="w-1.5 h-2 bg-white/50 rounded-sm" />
            <div className="w-4 h-2 border border-white/50 rounded-sm relative">
              <div className="absolute inset-0.5 bg-green-400 rounded-sm" style={{ width: '70%' }} />
            </div>
          </div>
        </div>

        {/* App header */}
        <div className="bg-indigo-600 px-4 pb-3">
          <div className="text-white text-[10px] font-bold">👨‍👩‍👧 Parent Portal</div>
          <div className="text-indigo-200 text-[7px]">Juan dela Cruz Jr. · Grade 6</div>
        </div>

        {/* Content */}
        <div className="p-2.5 space-y-2">
          {/* Grades card */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100">
            <div className="text-[8px] font-bold text-slate-700 mb-1.5">📚 Current Grades</div>
            {[
              { subject: 'Mathematics', grade: 92, color: 'text-green-600' },
              { subject: 'English', grade: 88, color: 'text-green-600' },
              { subject: 'Science', grade: 85, color: 'text-blue-600' },
              { subject: 'Filipino', grade: 91, color: 'text-green-600' },
            ].map((g, i) => (
              <div key={i} className="flex justify-between items-center py-0.5">
                <span className="text-[7px] text-slate-500">{g.subject}</span>
                <span className={`text-[8px] font-bold ${g.color}`}>{g.grade}</span>
              </div>
            ))}
          </div>

          {/* Attendance */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-center gap-3">
            <div>
              <div className="text-[8px] font-bold text-slate-700">📅 Attendance</div>
              <div className="text-[7px] text-slate-400">This quarter</div>
            </div>
            <div className="ml-auto text-center">
              <div className="text-[16px] font-extrabold text-green-600 leading-none">96%</div>
              <div className="text-[6px] text-green-500">Excellent</div>
            </div>
          </div>

          {/* Notification */}
          <div className="bg-blue-50 rounded-xl p-2 border border-blue-100">
            <div className="flex items-start gap-1.5">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[6px] text-white font-bold">!</span>
              </div>
              <div>
                <div className="text-[7px] font-bold text-blue-800">New Grade Posted</div>
                <div className="text-[6px] text-blue-600">Q3 Science grades are available</div>
              </div>
            </div>
          </div>

          {/* Pay button */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl py-2 text-center">
            <div className="text-[8px] font-bold text-white">💳 Pay Tuition Online</div>
            <div className="text-[6px] text-indigo-200">Balance: ₱2,500.00</div>
          </div>
        </div>
      </div>
    </div>

    {/* Home indicator */}
    <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-14 h-1 bg-white/30 rounded-full" />
  </div>
);


/* ------------------------------------------------------------------ */
/*  DepEd Form Preview — mini Form 138 / SF9                          */
/* ------------------------------------------------------------------ */
export const FormPreview: React.FC = () => (
  <div className="relative select-none pointer-events-none">
    {/* Paper shadow stack */}
    <div className="absolute top-1 left-1 w-full h-full bg-slate-200 rounded-lg" />
    <div className="absolute top-0.5 left-0.5 w-full h-full bg-slate-100 rounded-lg" />

    {/* Document */}
    <div className="relative bg-white rounded-lg shadow-xl border border-slate-200 p-3" style={{ width: 190 }}>
      {/* DepEd header */}
      <div className="text-center mb-2 border-b border-slate-200 pb-2">
        <div className="text-[6px] text-slate-500">Republic of the Philippines</div>
        <div className="text-[6px] font-bold text-slate-700">Department of Education</div>
        <div className="text-[8px] font-extrabold text-slate-900 mt-0.5">SCHOOL FORM 9</div>
        <div className="text-[5px] text-slate-400">(SF9) Learner's Progress Report Card</div>
      </div>

      {/* Student info */}
      <div className="space-y-0.5 mb-2">
        <div className="flex gap-0.5 items-baseline">
          <span className="text-[5px] text-slate-400 w-10">Name:</span>
          <span className="text-[6px] font-bold text-slate-800 border-b border-slate-300 flex-1">DELA CRUZ, JUAN JR.</span>
        </div>
        <div className="flex gap-0.5 items-baseline">
          <span className="text-[5px] text-slate-400 w-10">Grade/Sec:</span>
          <span className="text-[6px] font-bold text-slate-800 border-b border-slate-300 flex-1">6 - SAMPAGUITA</span>
        </div>
      </div>

      {/* Mini grade table */}
      <table className="w-full border-collapse text-[5px] border border-slate-300">
        <thead>
          <tr className="bg-slate-100">
            <th className="border border-slate-300 p-0.5 text-left text-slate-700 font-bold">Subject</th>
            <th className="border border-slate-300 p-0.5 text-center text-slate-700 font-bold w-6">Q1</th>
            <th className="border border-slate-300 p-0.5 text-center text-slate-700 font-bold w-6">Q2</th>
            <th className="border border-slate-300 p-0.5 text-center text-slate-700 font-bold w-6">Q3</th>
            <th className="border border-slate-300 p-0.5 text-center text-slate-700 font-bold w-6">Final</th>
          </tr>
        </thead>
        <tbody>
          {[
            { subj: 'Filipino', q1: 92, q2: 90, q3: 93, final: 92 },
            { subj: 'English', q1: 88, q2: 85, q3: 90, final: 88 },
            { subj: 'Mathematics', q1: 95, q2: 93, q3: 96, final: 95 },
            { subj: 'Science', q1: 87, q2: 89, q3: 91, final: 89 },
            { subj: 'AP', q1: 90, q2: 88, q3: 92, final: 90 },
            { subj: 'ESP', q1: 94, q2: 92, q3: 95, final: 94 },
          ].map((r, i) => (
            <tr key={i}>
              <td className="border border-slate-200 p-0.5 text-slate-600">{r.subj}</td>
              <td className="border border-slate-200 p-0.5 text-center text-slate-800">{r.q1}</td>
              <td className="border border-slate-200 p-0.5 text-center text-slate-800">{r.q2}</td>
              <td className="border border-slate-200 p-0.5 text-center text-slate-800">{r.q3}</td>
              <td className="border border-slate-200 p-0.5 text-center font-bold text-green-700">{r.final}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* General Average */}
      <div className="mt-1.5 flex justify-between items-center bg-indigo-50 rounded p-1 border border-indigo-100">
        <span className="text-[6px] font-bold text-indigo-700">General Average</span>
        <span className="text-[9px] font-extrabold text-indigo-700">91.33</span>
      </div>

      {/* Remarks */}
      <div className="mt-1 text-center">
        <span className="text-[5px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">PROMOTED ✓</span>
      </div>
    </div>

    {/* Auto-generated badge */}
    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-2 py-0.5 rounded-full text-[6px] font-bold shadow-lg">
      ✨ Auto-Generated
    </div>
  </div>
);


/* ------------------------------------------------------------------ */
/*  SVG Wave Section Divider                                           */
/* ------------------------------------------------------------------ */
export const WaveDivider: React.FC<{
  topColor?: string;
  bottomColor?: string;
  className?: string;
}> = ({ topColor = '#f8fafc', bottomColor = '#ffffff', className = '' }) => (
  <div className={`w-full overflow-hidden leading-[0] ${className}`} style={{ marginTop: -1, marginBottom: -1 }}>
    <svg
      viewBox="0 0 1440 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-auto block"
      preserveAspectRatio="none"
    >
      <rect width="1440" height="60" fill={topColor} />
      <path
        d="M0 30C240 50 480 10 720 30C960 50 1200 10 1440 30V60H0V30Z"
        fill={bottomColor}
      />
    </svg>
  </div>
);
