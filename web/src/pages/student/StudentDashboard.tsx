import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PiTrophyLight, PiFireSimpleLight, PiCheckCircleLight, PiTargetLight, PiReadCvLogoLight, PiFlame, PiStar, PiMedal, PiAtom, PiCalculator, PiBookOpen, PiGlobe, PiPalette } from 'react-icons/pi';
import { AchievementBadge } from '../../components/AchievementBadge';

// --- TYPES ---
type Subject = { id: string; name: string; code: string; grade: number };
type Lesson = { id: string; subject_id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number | null };

const StreakFire = ({ streak }: { streak: number }) => (
  <motion.div
    className="flex items-center space-x-2"
    initial={{ scale: 0 }}
    animate={{ scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <PiFlame className="text-red-500 text-3xl animate-pulse" />
    <span className="text-2xl font-bold text-gray-800">{streak} day streak</span>
  </motion.div>
);

const DailyGoal = ({ progress, goal = 50 }: { progress: number; goal?: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-4">
    <motion.div
      className="bg-green-500 h-4 rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${(progress / goal) * 100}%` }}
      transition={{ duration: 1 }}
    />
  </div>
);

// --- UI Helper Component (Stat Card) ---
function Stat({ label, value, icon, gradientClass }: { 
    label: string; 
    value: string | number; 
    icon: ReactNode; 
    gradientClass: string; 
}) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 text-center">
      <div className={`w-12 h-12 ${gradientClass} rounded-full flex items-center justify-center mx-auto mb-3 shadow-md`}>
        {icon}
      </div>
      <h3 className="font-bold text-lg text-gray-800">{value}</h3>
      <p className="text-sm text-gray-500">{label}</p>
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
  const [studentInfo, setStudentInfo] = useState({ name: 'pabi', grade: 11 });
  
  const navigate = useNavigate();
  
  // Navigate handler for SubjectCard click
  const onSubjectSelect = (subjectId: string) => navigate(`/subject/${subjectId}`);

  useEffect(() => {
    const load = async () => {
      try {
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

        // Defensive checks and state assignment
        const grade = profile?.grade || 11;
        setStudentInfo({ 
            name: profile?.full_name?.split(' ')[0] || 'pabi', 
            grade: grade
        });
        
        const filteredSubjects = (subj as Subject[] || []).filter(s => s.grade === grade);
        setSubjects(filteredSubjects);

        const lessonsMap: Record<string, Lesson[]> = {};
        (allLessons as Lesson[] || []).forEach((l: Lesson) => {
          if (!lessonsMap[l.subject_id]) {
            lessonsMap[l.subject_id] = [];
          }
          lessonsMap[l.subject_id].push(l);
        });
        setLessonsBySubject(lessonsMap);

        const pMap: Record<string, Progress> = {};
        (prog as Progress[] || []).forEach((p: Progress) => { pMap[p.lesson_id] = p; });
        setProgressByLesson(pMap);
        
        const total = (xpRows || []).reduce((s, r) => s + r.amount, 0);
        setXp(total);
        
        // Streak Logic
        if (streakDays) {
          let current = 0;
          const today = new Date();
          const dates = (streakDays as { activity_date: string }[] || []).map(d => new Date(d.activity_date).toDateString());
          
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
      } catch (error) {
          // Log any data fetching error to the console (for debugging)
          console.error("Dashboard Load Error:", error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [navigate]);

  const lessonsDone = Object.values(progressByLesson).filter(p => p.status === 'completed').length;
  const totalLessons = Object.values(lessonsBySubject).flat().length;
  const userLevel = Math.floor(xp / 1000) + 1;
  const xpForNextLevel = Math.max(0, ((userLevel) * 1000) - xp);
  const dailyProgress = Math.min(lessonsDone * 10, 50); // Example: 10 XP per lesson toward daily goal

  const getSubjectIcon = (code: string) => {
    switch (code) {
      case 'SCI': return <PiAtom className="text-white text-2xl" />;
      case 'MAT': return <PiCalculator className="text-white text-2xl" />;
      case 'ENG': return <PiBookOpen className="text-white text-2xl" />;
      case 'SOC': return <PiGlobe className="text-white text-2xl" />;
      case 'ART': return <PiPalette className="text-white text-2xl" />;
      default: return <PiReadCvLogoLight className="text-white text-2xl" />;
    }
  };

  const getSubjectDescription = (name: string) => {
    switch (name.toLowerCase()) {
      case 'science': return 'Explore the wonders of the natural world';
      case 'mathematics': return 'Master numbers, logic, and problem-solving';
      case 'english': return 'Enhance language skills and literature';
      case 'social science': return 'Understand society, history, and geography';
      case 'art': return 'Unleash creativity through visual expression';
      default: return 'Dive into this fascinating subject';
    }
  };

  if (isLoading) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">Loading Dashboard...</main>;
  if (subjects.length === 0) return <main className="max-w-6xl mx-auto px-4 py-10 text-center text-xl font-medium">No subjects found for your grade. Please ensure you completed onboarding.</main>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Welcome section with Streak */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">
            Welcome back, {studentInfo.name}! 🎓
          </h1>
          <p className="text-gray-500 mb-4">
            Grade {studentInfo.grade} CHSE preparation journey. You're doing great!
          </p>
          <StreakFire streak={streak} />
        </div>

        {/* Daily Goal */}
        <div className="mb-8 text-center">
          <h3 className="text-xl font-bold text-gray-700 mb-2">Daily Goal</h3>
          <DailyGoal progress={dailyProgress} goal={50} />
          <p className="text-sm text-gray-500 mt-1">{dailyProgress}/50 XP today</p>
        </div>

        {/* Quick stats (Compact, Duolingo-style) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <Stat 
            label="Total XP" 
            value={xp.toLocaleString()} 
            icon={<PiTrophyLight size={24} className="text-white" />} 
            gradientClass="bg-gradient-to-br from-yellow-500 to-orange-500"
          />
          <Stat 
            label="Level" 
            value={userLevel}
            icon={<PiTargetLight size={24} className="text-white" />} 
            gradientClass="bg-gradient-to-br from-blue-500 to-indigo-500"
          />
          <Stat 
            label="Lessons Done" 
            value={lessonsDone}
            icon={<PiCheckCircleLight size={24} className="text-white" />} 
            gradientClass="bg-gradient-to-br from-green-500 to-green-600"
          />
          <Stat 
            label="Subjects" 
            value={subjects.length}
            icon={<PiReadCvLogoLight size={24} className="text-white" />} 
            gradientClass="bg-gradient-to-br from-purple-500 to-pink-500"
          />
        </div>

        {/* Central Lesson Tree/Path Overview */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Your Learning Path</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const subjectLessons = lessonsBySubject[subject.id] || [];
              const completedCount = subjectLessons.filter(l => progressByLesson[l.id]?.status === 'completed').length;
              const progressPercent = subjectLessons.length > 0 ? (completedCount / subjectLessons.length) * 100 : 0;
              return (
                <motion.div
                  key={subject.id}
                  onClick={() => onSubjectSelect(subject.id)}
                  className="bg-white rounded-3xl shadow-2xl p-6 border border-gray-200 hover:shadow-3xl transition-all cursor-pointer"
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                      {getSubjectIcon(subject.code)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                      <p className="text-sm text-gray-500">{subject.code}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-4">{getSubjectDescription(subject.name)}</p>
                  <div className="mb-3">
                    <div className="flex justify-between text-sm text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{completedCount}/{subjectLessons.length} lessons</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <motion.div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Start Learning</span>
                    <PiCheckCircleLight className="text-green-500 text-xl" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Achievements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AchievementBadge
              title="First Lesson"
              description="Complete your first lesson"
              icon={<PiStar className="text-white text-xl" />}
              earned={lessonsDone > 0}
            />
            <AchievementBadge
              title="Streak Master"
              description="Maintain a 7-day streak"
              icon={<PiFlame className="text-white text-xl" />}
              earned={streak >= 7}
              progress={streak}
              maxProgress={7}
            />
            <AchievementBadge
              title="XP Champion"
              description="Earn 1000 XP"
              icon={<PiMedal className="text-white text-xl" />}
              earned={xp >= 1000}
              progress={xp}
              maxProgress={1000}
            />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex gap-4 border-b pb-2 justify-center">
          <button
            onClick={() => console.log('Subjects selected')}
            className={`px-4 py-2 font-semibold transition-all rounded-full bg-orange-500 text-white shadow-md`}
          >
            Path
          </button>
          <button
            onClick={() => navigate('/quests')}
            className={`px-4 py-2 font-semibold transition-all rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200`}
          >
            Achievements
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className={`px-4 py-2 font-semibold transition-all rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200`}
          >
            Leaderboard
          </button>
        </div>

        {/* Quick start if no progress */}
        {lessonsDone === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-2xl border border-orange-500/20 text-center"
          >
            <h3 className="font-bold text-xl text-gray-800 mb-2">🚀 Ready to start your adventure?</h3>
            <p className="text-gray-600 mb-4">
              Choose a subject to begin your Duolingo-like learning journey!
            </p>
            <button 
              onClick={() => onSubjectSelect(subjects[0]?.id)}
              className="bg-orange-600 text-white font-bold px-6 py-3 rounded-full shadow-lg hover:bg-orange-700"
            >
              Start with {subjects[0]?.name || 'Science'}
