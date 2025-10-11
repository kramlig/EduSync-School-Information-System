import React from 'react';
import Spinner from './Spinner';

const FullScreenLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <Spinner />
      <p className="mt-4 text-lg font-semibold text-slate-700 dark:text-slate-300">
        Loading School Data...
      </p>
    </div>
  );
};

export default FullScreenLoader;