import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

type AchievementBadgeProps = {
  title: string;
  description: string;
  icon: ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
};

export function AchievementBadge({ title, description, icon, earned, progress, maxProgress }: AchievementBadgeProps) {
  return (
    <motion.div
      className={`p-4 rounded-2xl shadow-lg border-2 transition-all duration-300 ${
        earned
          ? 'bg-gradient-to-br from-yellow-100 to-orange-100 border-yellow-400'
          : 'bg-gray-100 border-gray-300'
      }`}
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center space-x-3">
        <motion.div
          className={`w-12 h-12 rounded-full flex items-center justify-center ${
            earned ? 'bg-yellow-500' : 'bg-gray-400'
          }`}
          animate={earned ? { rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5, repeat: earned ? Infinity : 0, repeatDelay: 2 }}
        >
          {icon}
        </motion.div>
        <div className="flex-1">
          <h3 className={`font-bold text-lg ${earned ? 'text-yellow-800' : 'text-gray-600'}`}>
            {title}
          </h3>
          <p className="text-sm text-gray-600">{description}</p>
          {!earned && progress !== undefined && maxProgress && (
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-orange-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(progress / maxProgress) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">{progress}/{maxProgress}</p>
            </div>
          )}
        </div>
        {earned && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
          >
            <span className="text-2xl">🏆</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
