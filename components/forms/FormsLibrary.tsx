/**
 * Forms Library - Central Hub for DepEd Forms
 * 
 * This is the main landing page for all DepEd-compliant forms including:
 * - Form 137 (Permanent Record)
 * - Form 138 (Report Card)
 * - School Forms (SF1, SF2, SF9)
 * - ELLN Assessment (K-3)
 */

import React, { useState, useEffect } from 'react';
import { 
  ClipboardDocumentIcon,
  AcademicCapIcon, 
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  ChevronRightIcon
} from '../icons';
import type { AuthUser } from '../../types';

interface FormsLibraryProps {
  user: AuthUser;
}

interface FormCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  badge?: string;
  stats?: {
    label: string;
    value: number;
  };
  requiredRole?: string[];
}

const FormsLibrary: React.FC<FormsLibraryProps> = ({ user }) => {
  const [stats, setStats] = useState({
    form137Generated: 0,
    form138Generated: 0,
    schoolFormsGenerated: 0,
    ellnAssessments: 0,
    totalFormsThisMonth: 0,
    pendingForms: 0
  });

  // TODO: Fetch actual stats from Firestore
  useEffect(() => {
    // Placeholder stats
    setStats({
      form137Generated: 45,
      form138Generated: 234,
      schoolFormsGenerated: 12,
      ellnAssessments: 67,
      totalFormsThisMonth: 358,
      pendingForms: 5
    });
  }, []);

  const formCards: FormCard[] = [
    {
      id: 'form137',
      title: 'Form 137',
      description: 'Permanent Record - Student academic history across multiple school years',
      icon: <ClipboardDocumentIcon />,
      route: '/forms/137',
      color: 'indigo',
      badge: 'Permanent Record',
      stats: {
        label: 'Generated',
        value: stats.form137Generated
      },
      requiredRole: ['admin', 'registrar', 'principal']
    },
    {
      id: 'form138',
      title: 'Form 138',
      description: 'Report Card - Quarterly grades, core values, and attendance',
      icon: <AcademicCapIcon />,
      route: '/forms/form138',
      color: 'blue',
      badge: 'Report Card',
      stats: {
        label: 'Generated',
        value: stats.form138Generated
      },
      requiredRole: ['admin', 'teacher', 'principal']
    },
    {
      id: 'schoolforms',
      title: 'School Forms',
      description: 'SF1 (Enrollment), SF2 (Attendance), SF9 (Promotion) - EBEIS compliant',
      icon: <ChartBarIcon />,
      route: '/forms/schoolforms',
      color: 'green',
      badge: 'EBEIS',
      stats: {
        label: 'Generated',
        value: stats.schoolFormsGenerated
      },
      requiredRole: ['admin', 'registrar', 'principal']
    },
    {
      id: 'elln',
      title: 'ELLN Assessment',
      description: 'Early Literacy & Numeracy for Kindergarten to Grade 3',
      icon: <BookOpenIcon />,
      route: '/forms/elln',
      color: 'purple',
      badge: 'K-3 Only',
      stats: {
        label: 'Assessments',
        value: stats.ellnAssessments
      },
      requiredRole: ['admin', 'teacher', 'principal']
    },
    {
      id: 'reports',
      title: 'Statistical Reports',
      description: 'School-wide analytics, trends, and compliance reports',
      icon: <ClipboardDocumentListIcon />,
      route: '/forms/reports',
      color: 'amber',
      badge: 'Analytics',
      requiredRole: ['admin', 'principal']
    }
  ];

  // Filter forms based on user role
  const accessibleForms = formCards.filter(form => {
    if (!form.requiredRole) return true;
    return form.requiredRole.includes(user.role);
  });

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: {
        bg: 'bg-indigo-50 dark:bg-indigo-900/20',
        border: 'border-indigo-200 dark:border-indigo-800',
        icon: 'text-indigo-600 dark:text-indigo-400',
        badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
        hover: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
        hover: 'hover:bg-blue-100 dark:hover:bg-blue-900/30'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        icon: 'text-green-600 dark:text-green-400',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
        hover: 'hover:bg-green-100 dark:hover:bg-green-900/30'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        icon: 'text-purple-600 dark:text-purple-400',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
        hover: 'hover:bg-purple-100 dark:hover:bg-purple-900/30'
      },
      amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
        hover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30'
      }
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
              📚 DepEd Forms Library
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Generate official DepEd-compliant forms and reports
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden lg:flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.totalFormsThisMonth}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">This Month</div>
            </div>
            {stats.pendingForms > 0 && (
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.pendingForms}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">Pending</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleForms.map(form => {
            const colorClasses = getColorClasses(form.color);
            
            return (
              <a
                key={form.id}
                href={form.route}
                className={`
                  block p-6 rounded-xl border-2 transition-all duration-200
                  ${colorClasses.bg} ${colorClasses.border} ${colorClasses.hover}
                  hover:shadow-lg hover:scale-105
                `}
              >
                {/* Icon and Badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${colorClasses.badge}`}>
                    <div className={colorClasses.icon}>
                      {form.icon}
                    </div>
                  </div>
                  {form.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colorClasses.badge}`}>
                      {form.badge}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {form.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                  {form.description}
                </p>

                {/* Stats and Arrow */}
                <div className="flex items-center justify-between">
                  {form.stats && (
                    <div className="text-sm">
                      <span className="text-slate-500 dark:text-slate-400">
                        {form.stats.label}:{' '}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {form.stats.value}
                      </span>
                    </div>
                  )}
                  <div className={colorClasses.icon}>
                    <ChevronRightIcon />
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium">
              📄 Generate Report Card (Form 138)
            </button>
            <button className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
              📊 Export EBEIS Forms
            </button>
            <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
              📈 View Statistics
            </button>
          </div>
        </div>
      </div>

      {/* Information Banner */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="text-blue-600 dark:text-blue-400 text-2xl">ℹ️</div>
            <div>
              <h4 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">
                About DepEd Forms
              </h4>
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                All forms generated by this system comply with DepEd Order No. 8, s. 2015 (Classroom Assessment), 
                DepEd Order No. 21, s. 2019 (Grading System), and EBEIS Guidelines (Memorandum No. 160, s. 2012). 
                Forms are automatically populated with data from the school information system and are ready for 
                printing or digital submission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsLibrary;
