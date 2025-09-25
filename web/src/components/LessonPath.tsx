import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { PiLockFill, PiPlayFill } from 'react-icons/pi'; // Import icons

type Lesson = { id: string; title: string; order_index: number; xp_reward: number };
type Progress = { lesson_id: string; status: 'locked'|'unlocked'|'completed'; best_score: number | null };

type LessonPathProps = {
  subjectName: string;
  lessons: Lesson[];
  progressByLesson: Record<string, Progress>;
};

type LessonIconProps = {
  status: 'locked' | 'unlocked' | 'completed';
  linkTo: string;
  xpReward: number;
}

const LessonIcon = ({ status, linkTo, xpReward }: LessonIconProps) => {
  const isLocked = status === 'locked';
  
  // Dynamic visual cues based on status
  let bgColor = 'bg-gray-300';
  let iconColor = 'text-white';
  let IconComponent: ReactNode = <PiLockFill size={24} />; // Larger lock icon

  if (status === 'completed') {
    bgColor = 'bg-green-500';
    IconComponent = <span className="text-2xl">⭐</span>; // Star for completed
  } else if (status === 'unlocked') {
    bgColor = 'bg-orange-500';
    IconComponent = <PiPlayFill size={28} />; // Play button for unlocked
  }

  const content: ReactNode = (
    <motion.div
      className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white ${bgColor} shadow-xl transition-transform duration-300 relative`}
      whileHover={!isLocked ? { scale: 1.15 } : {}}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className={`${iconColor}`}>{IconComponent}</div>
      
      {/* XP Label Sticker (Matching Screenshot 3 style) */}
      {!isLocked && (
        <span className="absolute -bottom-2 right-[-20px] rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 shadow-md">
          {xpReward} XP
        </span>
      )}
    </motion.div>
  );

  return isLocked ? (
    <div className="relative pointer-events-none opacity-60">{content}</div>
  ) : (
    <Link to={linkTo} className="relative block">
      {content}
    </Link>
  );
};

export function LessonPath({ subjectName, lessons, progressByLesson }: LessonPathProps) {
  const sortedLessons = lessons.sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="rounded-2xl border p-4 bg-white shadow-xl h-[600px] overflow-y-auto transform transition-all duration-300 hover:shadow-2xl">
      <h3 className="text-xl font-extrabold text-gray-800 mb-4 sticky top-0 bg-white/90 backdrop-blur-sm z-10 pt-1 pb-3 border-b border-gray-200">{subjectName}</h3>
      <div className="relative flex flex-col items-center pt-4">
        {/* Vertical path line: Centered, prominent line */}
        <div className="absolute top-0 bottom-0 w-1 bg-gray-200 z-0"></div>

        {sortedLessons.map((lesson, index) => {
          const prog: Progress = progressByLesson[lesson.id] || { lesson_id: lesson.id, status: 'locked', best_score: null };
          let currentStatus: 'locked' | 'unlocked' | 'completed' = prog.status;
          
          if (index === 0 && currentStatus === 'locked') {
            currentStatus = 'unlocked';
          } else if (index > 0) {
            const prevLesson = sortedLessons[index - 1];
            const prevProg = progressByLesson[prevLesson.id];
            if (prevProg && prevProg.status === 'completed' && currentStatus === 'locked') {
              currentStatus = 'unlocked';
            }
          }
          
          const isCompleted = currentStatus === 'completed';
          const isLocked = currentStatus === 'locked';
          
          const titleClasses = isCompleted ? 'text-green-800 font-bold' : (isLocked ? 'text-gray-500' : 'text-orange-700 font-semibold');
          const linkTo = isLocked ? '#' : `/lesson/${lesson.id}`;

          return (
            <div key={lesson.id} className="relative w-full py-6 flex justify-center z-10">
              <div className="relative flex flex-col items-center">
                <LessonIcon 
                  status={currentStatus} 
                  linkTo={linkTo} 
                  xpReward={lesson.xp_reward}
                />
                {/* Lesson Title/Subtitle Card (Centered under the icon) */}
                <motion.div 
                    className="mt-2 text-center"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                >
                  <div className={`text-base ${titleClasses}`}>{lesson.title}</div>
                  <div className="text-xs text-gray-500">{isLocked ? `Locked` : `Ready to start`}</div>
                </motion.div>
              </div>
            </div>
          );
        })}
        <div className="text-gray-500 text-base font-semibold py-6 mt-4">Journey Complete!</div>
      </div>
    </div>
  );
}

export default LessonPath;