import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

// Guru hanya melihat mata pelajaran miliknya sendiri (teacher_user_id = profile.id);
// developer melihat semua mata pelajaran. Ini konsisten dengan RLS
// `teacher_write_own_grades` di supabase/schema.sql - filter di sini murni
// untuk UX (menyembunyikan pilihan yang toh akan ditolak backend).

export function GradeManagement() {
  const { profile } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedFlash, setSavedFlash] = useState(null);

  useEffect(() => {
    if (profile) loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (selectedSubject) loadGrades(selectedSubject);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  async function loadSubjects() {
    let query = supabase.from('subjects').select('id, subject_name, teacher_user_id');
    if (profile.role !== 'developer') {
      query = query.eq('teacher_user_id', profile.id);
    }
    const { data, error } = await query.order('subject_name', { ascending: true });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setSubjects(data ?? []);
    if (data && data.length > 0) setSelectedSubject(data[0].id);
    else setLoading(false);
  }

  async function loadGrades(subjectId) {
    setLoading(true);
    setError('');

    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, absent_no, full_name')
      .eq('is_active', true)
      .order('absent_no', { ascending: true });
    if (studentsError) {
      setError(studentsError.message);
      setLoading(false);
      return;
    }

    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select('student_id, daily_score, midterm_score, final_score')
      .eq('subject_id', subjectId);
    if (gradesError) {
      setError(gradesError.message);
      setLoading(false);
      return;
    }

    const gradeByStudent = {};
    (grades ?? []).forEach((g) => {
      gradeByStudent[g.student_id] = g;
    });

    setRows(
      (students ?? []).map((s) => ({
        id: s.id,
        absent_no: s.absent_no,
        full_name: s.full_name,
        daily_score: gradeByStudent[s.id]?.daily_score ?? '',
        midterm_score: gradeByStudent[s.id]?.midterm_score ?? '',
        final_score: gradeByStudent[s.id]?.final_score ?? '',
      }))
    );
    setLoading(false);
  }

  function updateLocal(id, field, value) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  async function handleSaveOnEnter(e, studentId, field) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const value = e.target.value === '' ? null : Number(e.target.value);

    const { error } = await supabase
      .from('grades')
      .upsert(
        { student_id: studentId, subject_id: selectedSubject, [field]: value },
        { onConflict: 'student_id,subject_id' }
      );
    if (error) {
      setError(error.message);
      return;
    }
    setSavedFlash(`${studentId}-${field}`);
    setTimeout(() => setSavedFlash(null), 500);
  }

  if (!loading && subjects.length === 0) {
    return (
      <div className="bg-tertiary border border-border rounded-xl p-6 text-center text-on-surface-muted text-sm">
        Belum ada mata pelajaran yang ditugaskan ke akunmu. Hubungi developer untuk
        menautkan akunmu ke mata pelajaran di menu Mata Pelajaran.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-primary text-xs font-semibold">{error}</p>}
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
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-on-surface-muted">
                  Memuat nilai...
                </td>
              </tr>
            )}
            {!loading && rows.map((r) => (
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
