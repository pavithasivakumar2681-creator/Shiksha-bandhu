import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link } from 'react-router-dom';

type Subject = { id: string; name: string; code: string };
type Lesson = { id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number };

export function StudentDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [progressByLesson, setProgressByLesson] = useState<Record<string, Progress>>({});

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: subj }, { data: xpRows }, { data: streakDays }, { data: prog }] = await Promise.all([
        supabase.from('subjects').select('*').order('grade'),
        supabase.from('xp_ledger').select('amount').eq('student_id', user.id),
        supabase.from('daily_activity').select('activity_date').eq('student_id', user.id).order('activity_date', { ascending: false }),
        supabase.from('student_progress').select('lesson_id,status,best_score').eq('student_id', user.id),
      ]);
      setSubjects(subj || []);
      const pMap: Record<string, Progress> = {};
      (prog||[]).forEach((p: any) => { pMap[p.lesson_id] = p as Progress; });
      setProgressByLesson(pMap);
      const total = (xpRows || []).reduce((s, r) => s + r.amount, 0);
      setXp(total);
      if (streakDays && streakDays.length > 0) {
        let current = 0;
        const today = new Date();
        for (let i = 0; i < streakDays.length; i++) {
          const d = new Date(streakDays[i].activity_date as unknown as string);
          const compare = new Date();
          compare.setDate(today.getDate() - i);
          if (d.toDateString() === compare.toDateString()) current += 1; else break;
        }
        setStreak(current);
      }
    };
    load();
  }, []);

  const loadLessons = async (subjectId: string) => {
    if (lessons[subjectId]) return;
    const { data } = await supabase.from('lessons').select('id,title,order_index,xp_reward').eq('subject_id', subjectId).order('order_index');
    setLessons(prev => ({ ...prev, [subjectId]: data || [] }));
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="XP" value={xp} color="bg-orange-100 text-orange-700" />
        <Stat label="Streak" value={`${streak}🔥`} color="bg-green-100 text-green-700" />
        <Stat label="Quests" value="Coming soon" color="bg-yellow-100 text-yellow-800" />
        <Stat label="Rank" value="--" color="bg-gray-100 text-gray-800" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Subjects</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {subjects.map(s => (
          <div key={s.id} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{s.name}</div>
              <button onClick={()=>loadLessons(s.id)} className="text-sm text-orange-600">Load</button>
            </div>
            <ol className="space-y-2">
              {(lessons[s.id]||[]).map(l => {
                const prog = progressByLesson[l.id];
                const locked = !prog || prog.status === 'locked';
                const completed = prog && prog.status === 'completed';
                return (
                  <li key={l.id} className={`flex items-center gap-2 ${locked? 'opacity-50':''}`}>
                    <div className={`w-3 h-3 rounded-full ${completed? 'bg-green-500':'bg-orange-500'}`}></div>
                    {locked ? (
                      <span className="flex-1">{l.order_index}. {l.title}</span>
                    ) : (
                      <Link to={`/lesson/${l.id}`} className="flex-1 hover:underline">{l.order_index}. {l.title}</Link>
                    )}
                    <span className="text-xs rounded-full bg-yellow-100 text-yellow-800 px-2">+{l.xp_reward} XP</span>
                    {completed && <span className="text-xs text-green-700">Best: {prog?.best_score}%</span>}
                  </li>
                );
              })}
            </ol>
          </div>
        ))}
      </div>
    </main>
  );
}

function Stat({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}


