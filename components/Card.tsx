
import React from 'react';

interface CardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ title, value, icon }) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md flex items-center">
      <div className="bg-indigo-100 dark:bg-indigo-900/50 p-3 rounded-full text-indigo-600 dark:text-indigo-300 mr-4">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase">{title}</h4>
        <p className="text-3xl font-bold text-slate-800 dark:text-white">{value}</p>
      </div>
    </div>
  );
};

export default Card;
