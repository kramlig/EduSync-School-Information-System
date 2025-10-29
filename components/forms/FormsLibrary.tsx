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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      {/* Premium Header with Glassmorphism */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 dark:from-indigo-500/20 dark:via-purple-500/20 dark:to-pink-500/20 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-8 shadow-2xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-pink-600/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/50 w-14 h-14 flex items-center justify-center">
                  <ClipboardDocumentListIcon />
                </div>
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">
                  DepEd Forms Library
                </h1>
              </div>
              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium ml-1">
                Generate official DepEd-compliant forms and reports with one click
              </p>
            </div>
            
            {/* Premium Quick Stats */}
            <div className="hidden lg:flex gap-4">
              <div className="px-6 py-4 rounded-xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-sm border border-white/40 dark:border-slate-700/50 shadow-lg hover:scale-105 transition-transform duration-300">
                <div className="text-center">
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                    {stats.totalFormsThisMonth}
                  </div>
                  <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">Generated This Month</div>
                </div>
              </div>
              {stats.pendingForms > 0 && (
                <div className="px-6 py-4 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 shadow-lg hover:scale-105 transition-transform duration-300">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 animate-pulse">
                      {stats.pendingForms}
                    </div>
                    <div className="text-sm font-medium text-amber-700 dark:text-amber-300 mt-1">Pending Review</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Premium Forms Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibleForms.map(form => {
            const colorClasses = getColorClasses(form.color);
            
            return (
              <a
                key={form.id}
                href={form.route}
                className="group relative block"
              >
                {/* Glassmorphism Card */}
                <div className={`
                  relative overflow-hidden p-6 rounded-2xl border-2 transition-all duration-300
                  ${colorClasses.bg} ${colorClasses.border}
                  backdrop-blur-sm shadow-lg
                  hover:shadow-2xl hover:scale-[1.03] hover:-translate-y-1
                `}>
                  {/* Gradient overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/20 dark:from-white/0 dark:to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Animated glow effect */}
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colorClasses.bg} blur-xl -z-10`}></div>
                  
                  <div className="relative z-10">
                    {/* Icon and Badge */}
                    <div className="flex items-start justify-between mb-5">
                      <div className={`p-4 rounded-xl ${colorClasses.badge} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <div className={`${colorClasses.icon} transform group-hover:rotate-6 transition-transform duration-300`}>
                          {form.icon}
                        </div>
                      </div>
                      {form.badge && (
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${colorClasses.badge} shadow-md border border-white/20`}>
                          {form.badge}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 dark:group-hover:from-indigo-400 dark:group-hover:to-purple-400 transition-all duration-300">
                      {form.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-5 line-clamp-2 leading-relaxed">
                      {form.description}
                    </p>

                    {/* Stats and Arrow */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-700/50">
                      {form.stats && (
                        <div className="flex items-center gap-2">
                          <div className="text-sm">
                            <span className="text-slate-500 dark:text-slate-400 font-medium">
                              {form.stats.label}:{' '}
                            </span>
                            <span className={`font-bold text-lg ${colorClasses.icon}`}>
                              {form.stats.value}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={`${colorClasses.icon} transform group-hover:translate-x-1 transition-transform duration-300`}>
                        <ChevronRightIcon />
                      </div>
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      {/* Premium Quick Actions */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/60 to-white/40 dark:from-slate-800/60 dark:to-slate-800/40 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 p-8 shadow-xl">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-600/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 mb-6">
              ⚡ Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="group px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105 transition-all duration-300 font-semibold text-left relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <span>Generate Report Card</span>
                </div>
              </button>
              <button className="group px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/50 hover:scale-105 transition-all duration-300 font-semibold text-left relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-2xl">📊</span>
                  <span>Export EBEIS Forms</span>
                </div>
              </button>
              <button className="group px-6 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 font-semibold text-left relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center gap-3">
                  <span className="text-2xl">📈</span>
                  <span>View Statistics</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Information Banner */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 backdrop-blur-xl border-2 border-blue-200/50 dark:border-blue-700/50 p-8 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-indigo-500/20 to-purple-600/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="flex items-start gap-6 relative z-10">
            <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl shadow-lg shadow-blue-500/30">
              ℹ️
            </div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-300 dark:to-indigo-300 mb-3">
                About DepEd Forms
              </h4>
              <p className="text-blue-900 dark:text-blue-100 text-base leading-relaxed">
                All forms generated by this system comply with <span className="font-semibold">DepEd Order No. 8, s. 2015</span> (Classroom Assessment), 
                <span className="font-semibold"> DepEd Order No. 21, s. 2019</span> (Grading System), and <span className="font-semibold">EBEIS Guidelines</span> (Memorandum No. 160, s. 2012). 
                Forms are automatically populated with data from the school information system and are ready for 
                printing or digital submission.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-500/30">
                  ✓ DepEd Compliant
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-semibold border border-indigo-500/30">
                  ✓ Auto-Populated
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-semibold border border-purple-500/30">
                  ✓ Print Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsLibrary;
