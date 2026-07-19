import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';

// TODO(supabase): subject list difilter berdasarkan `teacher_user_id = profile.id`
// kecuali role developer (lihat query di subjects table + RLS `teacher_write_own_grades`).

export function GradeManagement() {
  const { profile } = useAuth();
  const [subjects] = useState([
    { id: 's1', subject_name: 'Pemrograman Web' },
    { id: 's2', subject_name: 'Basis Data' },
  ]);
  const [selectedSubject, setSelectedSubject] = useState('s1');
  const [rows, setRows] = useState([
    { id: '1', absent_no: 1, full_name: 'Ahmad Fauzan', daily_score: 85, midterm_score: 80, final_score: '' },
    { id: '2', absent_no: 2, full_name: 'Siti Aisyah', daily_score: 90, midterm_score: 88, final_score: '' },
  ]);
  const [savedFlash, setSavedFlash] = useState(null);

  function updateLocal(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function handleSaveOnEnter(e, studentId, field) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    // TODO(supabase):
    // await supabase.from('grades').upsert(
    //   { student_id: studentId, subject_id: selectedSubject, [field]: e.target.value },
    //   { onConflict: 'student_id,subject_id' }
    // );
    setSavedFlash(`${studentId}-${field}`);
    setTimeout(() => setSavedFlash(null), 500);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs text-on-surface-muted uppercase tracking-[0.1em] font-semibold">
          Mata Pelajaran
        </label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="rounded-md px-3 py-2 text-secondary text-sm"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.subject_name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-tertiary border border-border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-on-surface-muted text-xs uppercase tracking-[0.1em] border-b border-border">
              <th className="text-left font-semibold px-4 py-3">No.</th>
              <th className="text-left font-semibold px-4 py-3">Nama Siswa</th>
              <th className="text-center font-semibold px-4 py-3">Tugas Harian</th>
              <th className="text-center font-semibold px-4 py-3">UTS</th>
              <th className="text-center font-semibold px-4 py-3">UAS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 text-on-surface-muted">{r.absent_no}</td>
                <td className="px-4 py-3 text-secondary font-medium">{r.full_name}</td>
                {['daily_score', 'midterm_score', 'final_score'].map((field) => (
                  <td key={field} className="px-4 py-3">
                    <input
                      type="number"
                      defaultValue={r[field]}
                      onChange={(e) => updateLocal(r.id, field, e.target.value)}
                      onKeyDown={(e) => handleSaveOnEnter(e, r.id, field)}
                      className={`w-20 mx-auto block text-center rounded-md px-2 py-1.5 text-secondary transition-colors ${
                        savedFlash === `${r.id}-${field}` ? 'border-primary' : ''
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-on-surface-muted">
        Tekan Enter pada kolom nilai untuk menyimpan ke basis data.
      </p>
    </div>
  );
}
