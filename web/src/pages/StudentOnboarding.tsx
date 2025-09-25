import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

export function StudentOnboarding() {
  const [fullName, setFullName] = useState('');
  const [grade, setGrade] = useState<11 | 12>(11);
  const [section, setSection] = useState('');
  const navigate = useNavigate();

  const complete = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('student_profiles').insert({ id: user.id, full_name: fullName, grade, section });
    // Unlock first lesson of each subject for the student's grade
    const { data: subs } = await supabase.from('subjects').select('id').eq('grade', grade);
    if (subs && subs.length > 0) {
      for (const s of subs) {
        const { data: first } = await supabase
          .from('lessons')
          .select('id')
          .eq('subject_id', s.id)
          .order('order_index')
          .limit(1)
          .maybeSingle();
        if (first?.id) {
          await supabase.from('student_progress').upsert({
            student_id: user.id,
            lesson_id: first.id,
            status: 'unlocked',
            best_score: 0,
          }, { onConflict: 'student_id,lesson_id' });
        }
      }
    }
    navigate('/student');
  };

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h2 className="text-2xl font-bold mb-4">Tell us about you</h2>
        <label className="block text-sm mb-1">Full name</label>
        <input value={fullName} onChange={e=>setFullName(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-3" />
        <label className="block text-sm mb-1">Grade</label>
        <div className="flex gap-2 mb-3">
          <button onClick={()=>setGrade(11)} className={`rounded-full px-4 py-2 ${grade===11?'bg-orange-500 text-white':'bg-gray-100'}`}>11</button>
          <button onClick={()=>setGrade(12)} className={`rounded-full px-4 py-2 ${grade===12?'bg-orange-500 text-white':'bg-gray-100'}`}>12</button>
        </div>
        <label className="block text-sm mb-1">Section (optional)</label>
        <input value={section} onChange={e=>setSection(e.target.value)} className="w-full border rounded-lg px-3 py-2 mb-4" />
        <button onClick={complete} className="w-full rounded-full bg-green-500 text-white px-4 py-2">Continue</button>
      </div>
    </main>
  );
}


