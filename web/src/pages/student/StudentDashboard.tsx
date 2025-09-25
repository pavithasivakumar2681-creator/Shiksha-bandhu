import { useEffect, useState, ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { PiTrophyLight, PiFireSimpleLight, PiCheckCircleLight, PiTargetLight, PiReadCvLogoLight } from 'react-icons/pi';

type Subject = { id: string; name: string; code: string; grade: number };
type Lesson = { id: string; subject_id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number | null };

// --- UI Helper Component (Stat Card) ---
function Stat({ label, value, color, icon, link }: { 
    label: string; 
    value: string | number; 
    color: string; 
    icon: ReactNode; 
    link?: string 
}) {
  const content = (
    <div className="flex flex-col items-center justify-center p-4">
      <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-2 shadow-inner ${color}`}>
          {icon}
      </div>
      <div className="text-xs text-gray-500 font-semibold">{label}</div>
      <div className="text-3xl font-extrabold text-gray-800 mt-1">{value}</div>
    </div>
  );
  
  return (
    <div className="bg-white rounded-xl shadow-xl border hover:shadow-2xl transition-shadow duration-300 cursor-pointer">
      {link ? (
        <Link to={link} className="block hover:bg-gray-50 rounded-xl">
          {content}
        </Link>
      ) : content}
    </div>
  );
}

// --- Main Dashboard Component ---
export function StudentDashboard() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessonsBySubject, setLessonsBySubject] = useState<Record<string, Lesson[]>>({});
  const [progressByLesson, setProgressByLesson] = useState<Record<string, Progress>>({});
  const [xp, setXp] = useState(0);
  const [streak, setStreak] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [studentName, setStudentName] = useState('pabi');
  const [studentGrade, setStudentGrade] = useState<number | null>(null);
  const navigate = useNavigate(); // Hook for navigation

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      const [
        { data: profile },
        { data: subj },
        { data: xpRows }, 
        { data: streakDays }, 
        { data: prog },
        { data: allLessons }
      ] = await Promise.all([
        supabase.from('student_profiles').select('grade, full_name').eq('id', user.id).maybeSingle(),
        supabase.from('subjects').select('*').order('grade'),
        supabase.from('xp_ledger').select('amount').eq('student_id', user.id),
        supabase.from('daily_activity').select('activity_date').eq('student_id', user.id).order('activity_date', { ascending: false }),
        supabase.from('student_progress').select('lesson_id,status,best_score').eq('student_id', user.id),
        supabase.from('lessons').select('id,subject_id,title,order_index,xp_reward').order('order_index')
      ]);

      const grade = profile?.grade;
      setStudentGrade(grade || null);
      setStudentName(profile?.full_name?.split(' ')[0] || 'pabi');
      
      const filteredSubjects = subj?.filter(s => s.grade === grade) || [];
      setSubjects(filteredSubjects as Subject[]);

      const lessonsMap: Record<string, Lesson[]> = {};
      (allLessons || []).forEach((l: any) => {
        if (!lessonsMap[l.subject_id]) {
          lessonsMap[l.subject_id] = [];
        }
        lessonsMap[l.subject_id].push(l as Lesson);
      });
      setLessonsBySubject(lessonsMap);

      const pMap: Record<string, Progress> = {};
      (prog||[]).forEach((p: any) => { pMap[p.lesson_id] = p as Progress; });
      setProgressByLesson(pMap);
      
      const total = (xpRows || []).reduce((s, r) => s + r.amount, 0);
      setXp(total);
      
      // Streak Calculation Logic (Simplified for brevity)
      if (streakDays && streakDays.length > 0) {
        let current = 0;
        const today = new Date();
        const dates = (streakDays || []).map(d => new Date(d.activity_date as unknown as string).toDateString());
        
        for (let i = 0; i < dates.length + 1; i++) { 
          const compare = new Date();
          compare.setDate(today.getDate() - i);
          if (dates.includes(compare.toDateString())) {
            current += 1;
          } else if (i === 0) {
            continue; 
          } else {
            break; 
          }
        }
        setStreak(current);
      }
      
      setIsLoading(false);
    };
    load();
  }, []);

  const lessonsDone = Object.values(progressByLesson).filter(p => p.status === 'completed').length;
  const totalLessons = Object.values(lessonsBySubject).flat().length;

  if (isLoading) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">Loading Dashboard...</main>;
  if (subjects.length === 0) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">No subjects found for your grade. Please ensure you completed onboarding.</main>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      
      <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Welcome back, {studentName}! 🎓</h1>
      <p className="text-gray-500 mb-8">Grade {studentGrade} CHSE preparation journey. You're doing great!</p>

      {/* Dynamic Status Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        <Stat 
            label="Total XP" 
            value={`${xp} XP`} 
            color="bg-yellow-400/20 text-yellow-800" 
            icon={<PiTrophyLight size={28} className="text-yellow-600" />} 
        />
        <Stat 
            label="Day Streak" 
            value={`${streak} Days`} 
            color="bg-red-500/20 text-red-800" 
            icon={<PiFireSimpleLight size={28} className="text-red-600" />} 
        />
        <Stat 
            label="Lessons Done" 
            value={`${lessonsDone}/${totalLessons}`} 
            color="bg-green-500/20 text-green-800" 
            icon={<PiCheckCircleLight size={28} className="text-green-600" />} 
        />
        <Stat 
            label="Level Goal" 
            value={`Next Level`}
            color="bg-orange-500/20 text-orange-800" 
            link="/leaderboard"
            icon={<PiTargetLight size={28} className="text-orange-600" />} 
        />
      </div>
      
      {/* Subject Cards (Clickable to view path) */}
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">Your Subjects</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map(s => {
            const subjectLessons = lessonsBySubject[s.id] || [];
            const completedCount = subjectLessons.filter(l => progressByLesson[l.id]?.status === 'completed').length;

            return (
                <div 
                    key={s.id} 
                    onClick={() => navigate(`/subject/${s.id}`)} // Navigate to new view
                    className="rounded-xl border p-5 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] cursor-pointer flex items-center justify-between"
                >
                    <div className="flex items-center">
                        <PiReadCvLogoLight size={32} className="text-orange-500 mr-4" />
                        <div>
                            <h3 className="text-xl font-bold text-gray-800">{s.name}</h3>
                            <p className="text-sm text-gray-500">{s.code} | {subjectLessons.length} lessons</p>
                            <div className="text-sm font-semibold mt-1" style={{ color: completedCount > 0 ? '#10B981' : '#F97316' }}>
                                {completedCount} completed
                            </div>
                        </div>
                    </div>
                    <span className="text-2xl font-extrabold text-gray-400">→</span>
                </div>
            );
        })}
      </div>
    </main>
  );
}