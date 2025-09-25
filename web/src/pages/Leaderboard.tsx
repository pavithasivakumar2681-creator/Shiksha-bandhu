import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient.ts';

type Entry = { student_id: string; total_xp: number };

export function Leaderboard() {
  const [rows, setRows] = useState<Entry[]>([]);

  useEffect(() => {
    supabase.from('leaderboard').select('student_id,total_xp').order('total_xp', { ascending: false }).then(({ data }) => setRows(data || []));
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4">Leaderboard</h1>
      <ol className="bg-white rounded-2xl border divide-y">
        {rows.map((r, i) => (
          <li key={r.student_id} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 text-center font-bold">{i+1}</span>
              <span className="text-gray-700">{r.student_id.slice(0,8)}</span>
            </div>
            <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-sm">{r.total_xp} XP</span>
          </li>
        ))}
      </ol>
    </main>
  );
}


