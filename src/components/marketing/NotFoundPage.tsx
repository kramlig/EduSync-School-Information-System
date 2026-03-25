/**
 * NotFoundPage — 404 page for unmatched routes.
 *
 * Shows a friendly message with navigation links back to
 * useful destinations (home, teachers, form generator, login).
 */

import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, AcademicCapIcon, DocumentTextIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Page Not Found | EduSync';
    return () => { document.title = 'EduSync — School Information System for Filipino Educators'; };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="text-center max-w-md">
        <p className="text-7xl font-extrabold text-indigo-600 dark:text-indigo-400">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3">
          <Link
            to="/"
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <HomeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Go to Homepage</span>
          </Link>
          <Link
            to="/teachers"
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <AcademicCapIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">EduSync for Teachers</span>
          </Link>
          <Link
            to="/tools/form-generator"
            className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
          >
            <DocumentTextIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Free Form Generator</span>
          </Link>
        </div>

        <Link
          to="/"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Back to home
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
