import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { PiCheckCircleFill, PiPlayFill, PiBookOpenTextLight, PiTree } from 'react-icons/pi';

type Lesson = { id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number | null };

type LessonPathProps = {
  lessons: Lesson[]; 
  progressByLesson: Record<string, Progress>;
};

export function LessonPath({ lessons, progressByLesson }: LessonPathProps) {
  const sortedLessons = lessons.sort((a, b) => a.order_index - b.order_index);

  // --- DEFINITION OF LessonIcon (Helper Component) ---
  type LessonIconProps = {
    status: 'untouched' | 'active' | 'completed';
    linkTo: string;
    xpReward: number;
  }

  const LessonIcon = ({ status, linkTo, xpReward }: LessonIconProps) => {
    // Pastel Color Classes 
    let bgColor = 'bg-gray-200'; 
    let ringColor = 'border-gray-300';
    let iconColor = 'text-gray-500';
    let IconComponent: ReactNode = <PiBookOpenTextLight size={28} />; 

    if (status === 'completed') {
      bgColor = 'bg-blue-300'; 
      ringColor = 'border-blue-400';
      iconColor = 'text-white';
      IconComponent = <PiCheckCircleFill size={24} />;
    } else if (status === 'active') {
      bgColor = 'bg-orange-300'; 
      ringColor = 'border-orange-400';
      iconColor = 'text-white';
      IconComponent = <PiPlayFill size={30} />;
    }
    
    const content: ReactNode = (
      <motion.div
        className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${ringColor} ${bgColor} shadow-lg transition-transform duration-300 relative`}
        whileHover={{ scale: 1.25 }} 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <div className={`${iconColor}`}>{IconComponent}</div>
        
        {/* XP Label Sticker */}
        {!status.includes('completed') && (
          <span className="absolute -bottom-2 right-[-20px] rounded-full bg-yellow-200 text-yellow-800 text-xs font-bold px-2 py-0.5 shadow-md">
            {xpReward} XP
          </span>
        )}
      </motion.div>
    );

    return <Link to={linkTo} className="relative block">{content}</Link>;
  };
  // --- END LessonIcon DEFINITION ---
  
  return (
    // Outer Container - Tree-like structure
    <div className="relative pt-8 flex flex-col items-center w-full bg-gradient-to-b from-green-50 to-blue-50 rounded-3xl p-6 shadow-inner">
      {/* Tree Trunk */}
      <div className="absolute top-0 w-2 h-full bg-gradient-to-b from-brown-400 to-brown-600 rounded-full opacity-30"></div>

      {sortedLessons.map((lesson, index) => {
        const prog = progressByLesson[lesson.id] || { lesson_id: lesson.id, status: 'locked', best_score: null };

        let currentStatus: 'untouched' | 'active' | 'completed' = 'untouched';

        if (prog.status === 'completed') {
            currentStatus = 'completed';
        } else if ((prog.best_score && prog.best_score > 0) || prog.status === 'unlocked' || prog.status === 'locked') {
            currentStatus = 'active';
        }

        const isCompleted = currentStatus === 'completed';
        const titleClasses = isCompleted ? 'text-green-700 font-bold' : (currentStatus === 'active' ? 'text-orange-700 font-semibold' : 'text-gray-600');
        const linkTo = `/lesson/${lesson.id}`;

        // Tree branch logic: alternate sides, add levels
        const level = Math.floor(index / 3) + 1; // Group every 3 lessons as a level
        const positionInLevel = index % 3;
        const isLeftBranch = positionInLevel % 2 === 0;
        const branchLength = isLeftBranch ? -120 : 120;
        const verticalOffset = level * 120;

        return (
          <motion.div
            key={lesson.id}
            className="relative w-full flex justify-center z-10"
            style={{ marginTop: index === 0 ? 0 : 80 }}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: index * 0.1 }}
          >
            {/* Branch Line */}
            <motion.div
              className="absolute w-16 h-1 bg-gradient-to-r from-brown-400 to-transparent rounded-full"
              style={{
                left: '50%',
                transform: `translateX(${branchLength}px)`,
                top: 20
              }}
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
            />

            {/* Lesson Node */}
            <motion.div
              className={`flex items-center ${isLeftBranch ? 'flex-row-reverse' : 'flex-row'} space-x-4`}
              initial={{ x: isLeftBranch ? -50 : 50 }}
              whileInView={{ x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 + 0.3 }}
            >
              {/* Lesson Title Card */}
              <motion.div
                className={`p-4 rounded-2xl shadow-lg bg-white max-w-[220px] ${isLeftBranch ? 'text-right' : 'text-left'}`}
                whileHover={{ scale: 1.05 }}
              >
                <div className={`text-lg ${titleClasses}`}>{lesson.title}</div>
                <div className="text-sm text-gray-500">{isCompleted ? '🌟 Mastered' : '🚀 Start Lesson'}</div>
                <div className="text-xs text-yellow-600 font-semibold mt-1">{lesson.xp_reward} XP</div>
              </motion.div>

              {/* Lesson Icon */}
              <LessonIcon
                status={currentStatus}
                linkTo={linkTo}
                xpReward={lesson.xp_reward}
              />
            </motion.div>
          </motion.div>
        );
      })}

      {/* Tree Top */}
      <motion.div
        className="mt-8 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <PiTree className="text-green-600 text-4xl mx-auto mb-2" />
        <div className="text-green-700 text-xl font-bold">Journey Complete! 🎉</div>
        <div className="text-gray-500">You've mastered all lessons in this subject.</div>
      </motion.div>
    </div>
  );
}

export default LessonPath;