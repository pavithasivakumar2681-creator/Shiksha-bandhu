import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

type Student = { id: string; full_name: string | null; grade: number | null; email: string | null };
type Subject = { id: string; name: string; grade: number };

export function TeacherDashboard() {
  console.log('TeacherDashboard component rendered');
  const [students, setStudents] = useState<Student[]>([]);
  const [xpByStudent, setXpByStudent] = useState<Record<string, number>>({});

  useEffect(() => {
    console.log('TeacherDashboard loaded');
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found in TeacherDashboard');
        return;
      }
      console.log('TeacherDashboard user:', user.id);
      const { data: map, error: mapError } = await supabase.from('teacher_students').select('student_id').eq('teacher_id', user.id);
      if (mapError) {
        console.error('Error fetching teacher_students:', mapError);
        return;
      }
      const studentIds = (map||[]).map(m=>m.student_id);
      if (studentIds.length === 0) {
        console.log('No students linked to teacher');
        setStudents([]);
        return;
      }
      const { data: profiles, error: profilesError } = await supabase.from('student_profiles').select('id, full_name, grade, email').in('id', studentIds);
      if (profilesError) {
        console.error('Error fetching student profiles:', profilesError);
        return;
      }
      setStudents(profiles || []);
      const xpMap: Record<string, number> = {};
      for (const sid of studentIds) {
        const { data: xpRows, error: xpError } = await supabase.from('xp_ledger').select('amount').eq('student_id', sid);
        if (xpError) {
          console.error(`Error fetching XP for student ${sid}:`, xpError);
          continue;
        }
        const total = (xpRows||[]).reduce((s,r)=>s+r.amount,0);
        xpMap[sid] = total;
      }
      setXpByStudent(xpMap);
    };
    load();
  }, []);

  if (!students.length) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Welcome to your Teacher Dashboard</h1>
        <p>You currently have no students linked. Please add students to get started.</p>
      </main>
    );
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Teacher Dashboard</h1>
      <ul>
        {students.map(student => (
          <li key={student.id}>
            {student.full_name} (Grade {student.grade ?? 'N/A'}) - {student.email}
            - XP: {xpByStudent[student.id] || 0}
          </li>
        ))}
      </ul>
    </main>
  );
}
