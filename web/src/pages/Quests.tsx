import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.ts';

type Quest = { id: string; name: string; progress: number; target: number; completed: boolean };

export function Quests() {
  const [quests, setQuests] = useState<Quest[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: xpRows } = await supabase.from('xp_ledger').select('amount').eq('student_id', user.id);
      const totalXp = (xpRows||[]).reduce((s,r)=>s+r.amount,0);
      const { data: days } = await supabase.from('daily_activity').select('activity_date').eq('student_id', user.id);
      const streak = days ? new Set(days.map(d=>d.activity_date)).size : 0;
      setQuests([
        { id: 'xp-100', name: 'Earn 100 XP', progress: totalXp, target: 100, completed: totalXp>=100 },
        { id: 'streak-3', name: '3-Day Streak', progress: streak, target: 3, completed: streak>=3 },
      ]);
    };
    load();
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Quests</h1>
      <div className="space-y-3">
        {quests.map(q => (
          <div key={q.id} className="rounded-2xl border p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">{q.name}</div>
              <span className={`text-xs rounded-full px-2 py-1 ${q.completed? 'bg-green-100 text-green-700':'bg-gray-100 text-gray-700'}`}>{q.completed? 'Completed':'In progress'}</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-400" style={{ width: `${Math.min(100, Math.round((q.progress/q.target)*100))}%` }} />
            </div>
            <div className="text-sm text-gray-600 mt-1">{Math.min(q.progress, q.target)} / {q.target}</div>
          </div>
        ))}
      </div>
    </main>
  );
}


