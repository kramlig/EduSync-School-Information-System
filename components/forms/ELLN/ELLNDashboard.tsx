/**
 * ELLN Dashboard - Main Landing Page
 * 
 * Central hub for Early Language, Literacy & Numeracy assessment system.
 * Provides navigation to assessment tool, results viewer, reports, and ILMP.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilSquareIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  AcademicCapIcon,
  HomeIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  badge?: string;
}

export default function ELLNDashboard() {
  const navigate = useNavigate();

  const features: FeatureCard[] = [
    {
      id: 'assessment',
      title: 'ELLN Assessment',
      description: 'Conduct literacy and numeracy assessments for K-3 students',
      icon: <PencilSquareIcon className="h-8 w-8" />,
      route: '/forms/elln/assessment',
      color: 'blue',
      badge: 'K-3'
    },
    {
      id: 'results',
      title: 'View Results',
      description: 'View individual student assessment results and progress tracking',
      icon: <ChartBarIcon className="h-8 w-8" />,
      route: '/forms/elln/results',
      color: 'green'
    },
    {
      id: 'reports',
      title: 'Reports & Analytics',
      description: 'Generate section, grade-level, and school-wide ELLN reports',
      icon: <DocumentTextIcon className="h-8 w-8" />,
      route: '/forms/elln/reports',
      color: 'purple'
    },
    {
      id: 'ilmp',
      title: 'ILMP Templates',
      description: 'Individualized Learning & Monitoring Plans for intervention',
      icon: <ClipboardDocumentListIcon className="h-8 w-8" />,
      route: '/forms/elln/ilmp',
      color: 'orange',
      badge: 'Intervention'
    }
  ];

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'green':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'purple':
        return 'bg-purple-50 border-purple-200 hover:bg-purple-100';
      case 'orange':
        return 'bg-orange-50 border-orange-200 hover:bg-orange-100';
      default:
        return 'bg-gray-50 border-gray-200 hover:bg-gray-100';
    }
  };

  const getIconColor = (color: string) => {
    switch (color) {
      case 'blue': return 'text-blue-600';
      case 'green': return 'text-green-600';
      case 'purple': return 'text-purple-600';
      case 'orange': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2">
            <li>
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700"
                title="Home"
              >
                <HomeIcon className="h-5 w-5" />
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <button
                onClick={() => navigate('/grades')}
                className="ml-2 text-gray-500 hover:text-gray-700"
              >
                Grades & Reports
              </button>
            </li>
            <li className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 text-gray-400" />
              <span className="ml-2 text-gray-900 font-medium">ELLN Assessment</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <AcademicCapIcon className="h-10 w-10 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">ELLN Assessment System</h1>
              <p className="mt-2 text-lg text-gray-600">
                Early Language, Literacy & Numeracy tracking for Kindergarten to Grade 3 students
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">About ELLN Assessment</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  The ELLN assessment system evaluates student performance across literacy and numeracy domains.
                  Each domain is scored from 0-100, and proficiency levels are automatically calculated based on overall performance.
                </p>
                <div className="mt-2 space-y-1">
                  <p><strong>Proficiency Levels:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>90-100: Advanced - Exceptional performance</li>
                    <li>80-89: Proficient - Meets all standards</li>
                    <li>65-79: Approaching Proficiency - Nearly meets standards</li>
                    <li>50-64: Developing - Making progress</li>
                    <li>0-49: Beginning - Needs significant support</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature) => (
            <button
              key={feature.id}
              onClick={() => navigate(feature.route)}
              className={`relative p-6 border-2 rounded-lg text-left transition-all transform hover:scale-105 ${getColorClasses(feature.color)}`}
            >
              {/* Badge */}
              {feature.badge && (
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getIconColor(feature.color)} bg-white border-2`}>
                    {feature.badge}
                  </span>
                </div>
              )}

              {/* Icon */}
              <div className={`mb-4 ${getIconColor(feature.color)}`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">
                {feature.description}
              </p>

              {/* Arrow */}
              <div className="mt-4 flex items-center text-sm font-medium text-gray-700">
                Open
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        {/* Domains Reference */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Literacy Domains */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
              Literacy Domains (6)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Oral Language:</strong> Speaking and listening skills</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Phonological Awareness:</strong> Sound recognition and manipulation</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Book & Print Knowledge:</strong> Understanding of text structure</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Alphabet Knowledge:</strong> Letter recognition and naming</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Phonics:</strong> Letter-sound relationships</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Comprehension:</strong> Understanding of text meaning</span>
              </li>
            </ul>
          </div>

          {/* Numeracy Domains */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
              Numeracy Domains (5)
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Number Sense:</strong> Understanding of numbers and quantities</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Measurement:</strong> Length, weight, capacity, and time</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Geometry:</strong> Shapes, spatial relationships, and patterns</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Patterns & Algebra:</strong> Identifying and creating patterns</span>
              </li>
              <li className="flex items-start">
                <span className="font-medium mr-2">•</span>
                <span><strong>Data Analysis:</strong> Collecting, organizing, and interpreting data</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Quick Stats (placeholder for future) */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">---</div>
              <div className="text-sm text-gray-600 mt-1">Total Assessments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">---</div>
              <div className="text-sm text-gray-600 mt-1">K-3 Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">---</div>
              <div className="text-sm text-gray-600 mt-1">Avg. Literacy Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">---</div>
              <div className="text-sm text-gray-600 mt-1">Avg. Numeracy Score</div>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">
            Statistics will be calculated as assessments are conducted
          </p>
        </div>
      </div>
    </div>
  );
}
