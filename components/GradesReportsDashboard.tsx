import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpenIcon, 
  ClipboardDocumentListIcon, 
  ChartBarIcon,
  UsersIcon, 
  TrendingUpIcon, 
  AwardIcon, 
  TargetIcon 
} from './icons';
import type { AuthUser, StudentUser, ParentUser } from '../types';

interface GradesReportsDashboardProps {
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
}

const GradesReportsDashboard: React.FC<GradesReportsDashboardProps> = ({ session }) => {
  const navigate = useNavigate();
  const userRole = session.type === 'staff' ? (session.user as AuthUser).role : session.type;
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const dashboardCards = [
    {
      id: 'grade-entry',
      title: 'Grade Entry & Management',
      description: 'Enter, edit, and manage student grades across all quarters and subjects',
      route: '/grades/entry',
      icon: BookOpenIcon,
      gradient: 'from-violet-600 via-purple-600 to-blue-600',
      shadowColor: 'shadow-violet-500/25',
      roles: ['admin', 'teacher', 'principal', 'registrar'],
      stats: { label: 'Active Classes', value: '12' }
    },
    {
      id: 'report-cards',
      title: 'Report Cards (Form 138)',
      description: 'Generate and print quarterly report cards for students',
      route: '/grades/form138',
      icon: ClipboardDocumentListIcon,
      gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
      shadowColor: 'shadow-emerald-500/25',
      roles: ['admin', 'teacher', 'principal', 'registrar'],
      stats: { label: 'Reports Generated', value: '248' }
    },
    {
      id: 'permanent-records',
      title: 'Permanent Records (Form 137)',
      description: 'Manage cumulative academic records and permanent student files',
      route: '/grades/form137',
      icon: ClipboardDocumentListIcon,
      gradient: 'from-rose-600 via-pink-600 to-orange-600',
      shadowColor: 'shadow-rose-500/25',
      roles: ['admin', 'principal', 'registrar'],
      stats: { label: 'Student Records', value: '567' }
    },
    {
      id: 'school-forms',
      title: 'School Forms (EBEIS)',
      description: 'SF1 Enrollment, SF2 Attendance, SF9 Promotion - Government reporting forms',
      route: '/grades/schoolforms',
      icon: ChartBarIcon,
      gradient: 'from-amber-600 via-orange-600 to-red-600',
      shadowColor: 'shadow-amber-500/25',
      roles: ['admin', 'principal', 'registrar'],
      stats: { label: 'Reports Filed', value: '24' }
    },
    {
      id: 'elln-assessment',
      title: 'ELLN Assessment (K-3)',
      description: 'Early Literacy and Numeracy assessments for Kindergarten to Grade 3',
      route: '/forms/elln',
      icon: BookOpenIcon,
      gradient: 'from-indigo-600 via-blue-600 to-cyan-600',
      shadowColor: 'shadow-indigo-500/25',
      roles: ['admin', 'teacher', 'principal'],
      stats: { label: 'Assessments', value: '189' }
    }
  ];

  const quickStats = [
    { 
      label: 'Total Students', 
      value: '1,234', 
      change: '+12%', 
      trend: 'up',
      icon: UsersIcon,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      label: 'Average Grade', 
      value: '87.5', 
      change: '+2.3%', 
      trend: 'up',
      icon: TargetIcon,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    { 
      label: 'Completion Rate', 
      value: '94.2%', 
      change: '+5.1%', 
      trend: 'up',
      icon: TrendingUpIcon,
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
    { 
      label: 'Excellence Rate', 
      value: '78.9%', 
      change: '+8.2%', 
      trend: 'up',
      icon: AwardIcon,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    }
  ];

  const accessibleCards = dashboardCards.filter(card => 
    card.roles.includes(userRole)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Premium Header Section with Glass Morphism */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-purple-600/5 to-blue-600/10"></div>
        <div className="relative px-6 pt-8 pb-6">
          {/* Hero Section */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
            <div className="mb-6 lg:mb-0">
              <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-slate-800 bg-clip-text text-transparent mb-3">
                Grades & Reports
              </h1>
              <p className="text-lg text-slate-600 max-w-2xl leading-relaxed">
                Comprehensive academic record management with advanced analytics, 
                streamlined reporting, and intelligent insights for educational excellence.
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-4 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-white/20 shadow-lg">
                <span className="text-sm font-medium text-slate-700">SY 2025-2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8">
        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={stat.label}
                className="group relative overflow-hidden bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:bg-white/80 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <IconComponent />
                    </div>
                    <div className="flex items-center space-x-1 text-emerald-600">
                      <TrendingUpIcon />
                      <span className="text-sm font-semibold">{stat.change}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="text-sm text-slate-600">{stat.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Premium Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
          {accessibleCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <div
                key={card.id}
                onClick={() => navigate(card.route)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className={`group relative overflow-hidden bg-gradient-to-br ${card.gradient} rounded-3xl shadow-xl ${card.shadowColor} hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-500 cursor-pointer`}
              >
                {/* Animated Background Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-black/20"></div>
                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-lg group-hover:scale-125 transition-transform duration-500"></div>
                
                <div className="relative z-10 p-8">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                      <IconComponent />
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm font-medium">{card.stats.label}</p>
                      <p className="text-white text-2xl font-bold">{card.stats.value}</p>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-bold text-white leading-tight">{card.title}</h3>
                    <p className="text-white/90 text-sm leading-relaxed">{card.description}</p>
                  </div>
                  
                  {/* Action Indicator */}
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-white/80 text-sm font-medium">Explore →</span>
                    <div className={`w-2 h-2 rounded-full bg-white/60 transition-all duration-300 ${hoveredCard === card.id ? 'scale-150 bg-white' : ''}`}></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Enhanced Quick Actions */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
              <p className="text-slate-600 mt-1">Fast access to frequently used features</p>
            </div>
            <ChartBarIcon />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(userRole === 'teacher' || userRole === 'admin' || userRole === 'principal') && (
              <button
                onClick={() => navigate('/grades/entry')}
                className="group flex items-center space-x-4 p-4 bg-gradient-to-r from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-2xl border border-violet-200 hover:border-violet-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-2 bg-violet-600 rounded-lg group-hover:bg-violet-700 transition-colors">
                  <BookOpenIcon />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Grade Management</p>
                  <p className="text-sm text-slate-600">Enter & manage grades</p>
                </div>
              </button>
            )}
            
            {(userRole === 'admin' || userRole === 'teacher' || userRole === 'principal' || userRole === 'registrar') && (
              <button
                onClick={() => navigate('/grades/form138')}
                className="group flex items-center space-x-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-2xl border border-emerald-200 hover:border-emerald-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-2 bg-emerald-600 rounded-lg group-hover:bg-emerald-700 transition-colors">
                  <ClipboardDocumentListIcon />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Form 138</p>
                  <p className="text-sm text-slate-600">Generate report cards</p>
                </div>
              </button>
            )}
            
            {(userRole === 'admin' || userRole === 'principal' || userRole === 'registrar') && (
              <button
                onClick={() => navigate('/grades/form137')}
                className="group flex items-center space-x-4 p-4 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 rounded-2xl border border-rose-200 hover:border-rose-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="p-2 bg-rose-600 rounded-lg group-hover:bg-rose-700 transition-colors">
                  <ClipboardDocumentListIcon />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Form 137</p>
                  <p className="text-sm text-slate-600">Permanent records</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradesReportsDashboard;
