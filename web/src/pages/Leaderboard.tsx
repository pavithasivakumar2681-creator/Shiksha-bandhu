import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.ts';
import { PiMedal, PiTrophy, PiCrown } from 'react-icons/pi';

type Entry = { student_id: string; total_xp: number; name: string };

export function Leaderboard() {
  const [rows, setRows] = useState<Entry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [userRes, leaderboardRes] = await Promise.all([
        supabase.auth.getUser(),
        supabase.from('leaderboard').select('student_id,total_xp').order('total_xp', { ascending: false })
      ]);

      const { data: { user } } = userRes;
      setCurrentUserId(user?.id || null);

      const leaderboard = leaderboardRes.data || [];
      const studentIds = leaderboard.map(e => e.student_id);
      const { data: profiles } = await supabase.from('student_profiles').select('id, full_name').in('id', studentIds);
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || 'Anonymous']) || []);
      const entries = leaderboard.map(e => ({ ...e, name: profileMap.get(e.student_id) || 'Anonymous' }));
      setRows(entries);
    };
    load();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <PiCrown className="text-yellow-500 text-2xl" />;
    if (index === 1) return <PiMedal className="text-gray-400 text-2xl" />;
    if (index === 2) return <PiTrophy className="text-amber-600 text-2xl" />;
    return null;
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-extrabold text-gray-800 mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🏅 Leaderboard
        </motion.h1>
        <div className="space-y-4">
          {rows.map((r, i) => (
            <motion.div
              key={r.student_id}
              className={`p-6 flex items-center justify-between rounded-3xl ${r.student_id === currentUserId ? 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-400 shadow-2xl' : 'bg-white shadow-xl'} hover:shadow-2xl transition-all`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {getRankIcon(i)}
                  <span className="w-12 text-center font-bold text-2xl text-gray-700">{i+1}</span>
                </div>
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {getInitials(r.name)}
                </div>
                <div>
                  <div className="font-bold text-xl text-gray-800">{r.name}</div>
                  <div className="text-sm text-gray-500">{r.student_id.slice(0,8)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {r.student_id === currentUserId && (
                  <span className="text-blue-600 font-semibold text-sm">You</span>
                )}
                <span className="rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-3 text-lg font-bold shadow-lg">{r.total_xp} XP</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </main>
  );
}



