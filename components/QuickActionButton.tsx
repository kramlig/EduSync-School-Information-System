import React from 'react';

interface QuickActionButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'indigo' | 'green' | 'blue' | 'purple' | 'orange';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({ 
  label, 
  icon, 
  onClick,
  color = 'indigo'
}) => {
  const colorClasses = {
    indigo: 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600',
    green: 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    blue: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    purple: 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600',
    orange: 'bg-orange-600 hover:bg-orange-700 dark:bg-orange-500 dark:hover:bg-orange-600',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 text-sm font-medium`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
};

export default QuickActionButton;
