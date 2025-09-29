import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabaseClient.ts';
import { PiTrophy, PiFlame, PiCheckCircle, PiClock } from 'react-icons/pi';

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

  const getQuestIcon = (id: string) => {
    if (id.startsWith('xp-')) return <PiTrophy className="text-yellow-500 text-3xl" />;
    if (id.startsWith('streak-')) return <PiFlame className="text-red-500 text-3xl" />;
    return <PiCheckCircle className="text-green-500 text-3xl" />;
  };

  const getQuestReward = (id: string) => {
    if (id.startsWith('xp-')) return '100 XP Bonus';
    if (id.startsWith('streak-')) return 'Streak Badge';
    return 'Achievement';
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.h1
          className="text-4xl font-extrabold text-gray-800 mb-8 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🏆 Quests & Achievements
        </motion.h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quests.map((q, index) => {
            const progressPercent = Math.min(100, Math.round((q.progress / q.target) * 100));
            return (
              <motion.div
                key={q.id}
                className={`bg-white rounded-3xl shadow-2xl p-6 border-2 ${q.completed ? 'border-green-300 bg-green-50' : 'border-gray-200'} hover:shadow-3xl transition-all`}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mr-4 ${q.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                    {getQuestIcon(q.id)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800">{q.name}</h3>
                    <p className="text-sm text-gray-500">Reward: {getQuestReward(q.id)}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${q.completed ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                    {q.completed ? <PiCheckCircle className="inline mr-1" /> : <PiClock className="inline mr-1" />}
                    {q.completed ? 'Completed' : 'In Progress'}
                  </div>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.min(q.progress, q.target)} / {q.target}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <motion.div
                      className={`h-3 rounded-full ${q.completed ? 'bg-gradient-to-r from-green-400 to-blue-500' : 'bg-gradient-to-r from-orange-400 to-yellow-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                </div>
                {q.completed && (
                  <motion.div
                    className="text-center text-green-600 font-semibold"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, delay: 1 }}
                  >
                    🎉 Quest Completed!
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </main>
  );
}



