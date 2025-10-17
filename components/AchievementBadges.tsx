import React from 'react';
import { TrophyIcon, FireIcon, CheckBadgeIcon, StarIcon } from './icons';

export interface Badge {
  id: string;
  name: string;
  description: string;
  type: 'gold' | 'silver' | 'bronze' | 'special';
  earned: boolean;
  icon?: React.ReactNode;
}

interface AchievementBadgesProps {
  badges: Badge[];
  maxDisplay?: number;
}

const AchievementBadges: React.FC<AchievementBadgesProps> = ({ badges, maxDisplay = 6 }) => {
  const earnedBadges = badges.filter(b => b.earned);
  const displayBadges = badges.slice(0, maxDisplay);

  const typeConfig = {
    gold: { 
      bg: 'bg-yellow-100 dark:bg-yellow-900/30', 
      border: 'border-yellow-400 dark:border-yellow-600',
      text: 'text-yellow-700 dark:text-yellow-300',
      icon: <TrophyIcon />
    },
    silver: { 
      bg: 'bg-slate-100 dark:bg-slate-700/30', 
      border: 'border-slate-400 dark:border-slate-600',
      text: 'text-slate-700 dark:text-slate-300',
      icon: <StarIcon />
    },
    bronze: { 
      bg: 'bg-orange-100 dark:bg-orange-900/30', 
      border: 'border-orange-400 dark:border-orange-600',
      text: 'text-orange-700 dark:text-orange-300',
      icon: <CheckBadgeIcon />
    },
    special: { 
      bg: 'bg-purple-100 dark:bg-purple-900/30', 
      border: 'border-purple-400 dark:border-purple-600',
      text: 'text-purple-700 dark:text-purple-300',
      icon: <FireIcon />
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
          Achievements
        </h3>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {earnedBadges.length} / {badges.length} earned
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayBadges.map((badge) => {
          const config = typeConfig[badge.type];
          const isEarned = badge.earned;
          
          return (
            <div
              key={badge.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                isEarned 
                  ? `${config.bg} ${config.border} shadow-sm` 
                  : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 grayscale'
              }`}
              title={badge.description}
            >
              <div className="flex flex-col items-center text-center">
                <div className={isEarned ? config.text : 'text-slate-400 dark:text-slate-600'}>
                  {badge.icon || config.icon}
                </div>
                <p className={`text-xs font-semibold mt-2 ${
                  isEarned ? config.text : 'text-slate-500 dark:text-slate-500'
                }`}>
                  {badge.name}
                </p>
                {isEarned && (
                  <div className="mt-1 text-green-600 dark:text-green-400">
                    <CheckBadgeIcon />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementBadges;
