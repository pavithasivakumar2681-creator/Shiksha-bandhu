import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

type Student = { id: string; full_name: string | null; grade: number | null };

export function TeacherDashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [xpByStudent, setXpByStudent] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<{ student_id: string; activity_date: string }[]>([]);
  const [avgBySubject, setAvgBySubject] = useState<{ subject: string; avg: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: map } = await supabase.from('teacher_students').select('student_id').eq('teacher_id', user.id);
      const studentIds = (map||[]).map(m=>m.student_id);
      if (studentIds.length === 0) return;
      const { data: profiles } = await supabase.from('student_profiles').select('id, full_name, grade').in('id', studentIds);
      setStudents(profiles || []);
      const xpMap: Record<string, number> = {};
      for (const sid of studentIds) {
        const { data: xpRows } = await supabase.from('xp_ledger').select('amount').eq('student_id', sid);
        const total = (xpRows||[]).reduce((s,r)=>s+r.amount,0);
        xpMap[sid] = total;
      }
      setXpByStudent(xpMap);

      // Recent activity (last 10)
      const { data: recentRows } = await supabase
        .from('daily_activity')
        .select('student_id,activity_date')
        .in('student_id', studentIds)
        .order('activity_date', { ascending: false })
        .limit(10);
      setRecent(recentRows || []);

      // Per-subject average best_score across class
      const { data: lessons } = await supabase.from('lessons').select('id,subject_id');
      const lessonIdToSubject: Record<string, string> = {};
      (lessons||[]).forEach(l => { lessonIdToSubject[l.id] = l.subject_id; });
      const { data: subjects } = await supabase.from('subjects').select('id,name');
      const subjectIdToName: Record<string, string> = {};
      (subjects||[]).forEach(s => { subjectIdToName[s.id] = s.name; });
      const { data: progress } = await supabase
        .from('student_progress')
        .select('student_id,lesson_id,best_score')
        .in('student_id', studentIds);
      const sum: Record<string, { total: number; count: number }> = {};
      (progress||[]).forEach(p => {
        const subj = lessonIdToSubject[p.lesson_id];
        if (!subj) return;
        if (!sum[subj]) sum[subj] = { total: 0, count: 0 };
        sum[subj].total += p.best_score || 0;
        sum[subj].count += 1;
      });
      const avg = Object.entries(sum).map(([sid, v]) => ({ subject: subjectIdToName[sid] || sid, avg: Math.round(v.total / Math.max(1, v.count)) }));
      setAvgBySubject(avg);
    };
    load();
  }, []);

  const chartData = students.map(s => ({ name: s.full_name || 'Student', xp: xpByStudent[s.id] || 0 }));

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-semibold mb-4">Class Analytics</h2>
      <div className="rounded-2xl border p-4 mb-6">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="xp" stroke="#f97316" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-2">Recent Activity</h3>
          <ul className="divide-y">
            {recent.map((r, idx) => (
              <li key={idx} className="py-2 flex items-center justify-between text-sm">
                <span>{r.student_id.slice(0,8)}</span>
                <span className="text-gray-500">{new Date(r.activity_date).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-4">
          <h3 className="font-semibold mb-2">Average Score by Subject</h3>
          <ul className="divide-y">
            {avgBySubject.map((s, idx) => (
              <li key={idx} className="py-2 flex items-center justify-between text-sm">
                <span>{s.subject}</span>
                <span className="text-gray-700">{s.avg}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="rounded-2xl border p-4">
        <h3 className="font-semibold mb-2">Students</h3>
        <ul className="divide-y">
          {students.map(s => (
            <li key={s.id} className="py-2 flex items-center justify-between">
              <div>
                <div className="font-medium">{s.full_name || s.id.slice(0,8)}</div>
                <div className="text-sm text-gray-500">Grade {s.grade ?? '--'}</div>
              </div>
              <span className="text-sm">XP: {xpByStudent[s.id] || 0}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}


