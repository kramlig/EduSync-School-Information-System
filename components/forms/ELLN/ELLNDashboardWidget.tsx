/**
 * ELLN Dashboard Widget
 * 
 * Summary widget for Principal's Dashboard showing school-wide ELLN metrics.
 * Displays key performance indicators and quick insights.
 * 
 * ✅ MIGRATED TO POSTGRESQL (November 25, 2025)
 */

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSchoolContext } from '../../../src/contexts/SchoolContext';
import { useELLNPostgreSQL } from '../../../src/hooks/useELLNPostgreSQL';
import { getCurrentSchoolYear } from '../../../services/dateHelpers';
import { ChevronRightIcon, AcademicCapIcon } from '@heroicons/react/24/outline';

interface DashboardMetrics {
  totalAssessments: number;
  avgOverallScore: number;
  studentsAtRisk: number; // Below 75
  topPerformers: number; // 90+
  recentTrend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export default function ELLNDashboardWidget() {
  const navigate = useNavigate();
  const { schoolId } = useSchoolContext();
  const schoolYear = getCurrentSchoolYear();
  
  // Fetch all ELLN assessments for current school year
  const { assessments, loading } = useELLNPostgreSQL({ schoolId, schoolYear });

  // Calculate metrics
  const metrics = useMemo((): DashboardMetrics => {
    if (assessments.length === 0) {
      return {
        totalAssessments: 0,
        avgOverallScore: 0,
        studentsAtRisk: 0,
        topPerformers: 0,
        recentTrend: 'stable',
        trendPercentage: 0
      };
    }

    const totalAssessments = assessments.length;
    const avgOverallScore = Math.round(
      (assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessments) * 10
    ) / 10;
    
    // Get unique students (latest assessment per student)
    const studentMap = new Map<string, typeof assessments[0]>();
    assessments.forEach(a => {
      const existing = studentMap.get(a.studentId);
      if (!existing || new Date(a.assessmentDate) > new Date(existing.assessmentDate)) {
        studentMap.set(a.studentId, a);
      }
    });

    const latestAssessments = Array.from(studentMap.values());
    const studentsAtRisk = latestAssessments.filter(a => a.overallScore < 75).length;
    const topPerformers = latestAssessments.filter(a => a.overallScore >= 90).length;

    // Calculate trend (comparing Q3 to Q2, or latest available)
    const q3Assessments = assessments.filter(a => a.quarter === 'q3');
    const q2Assessments = assessments.filter(a => a.quarter === 'q2');
    
    let recentTrend: 'up' | 'down' | 'stable' = 'stable';
    let trendPercentage = 0;

    if (q3Assessments.length > 0 && q2Assessments.length > 0) {
      const q3Avg = q3Assessments.reduce((sum, a) => sum + a.overallScore, 0) / q3Assessments.length;
      const q2Avg = q2Assessments.reduce((sum, a) => sum + a.overallScore, 0) / q2Assessments.length;
      const change = ((q3Avg - q2Avg) / q2Avg) * 100;
      
      trendPercentage = Math.abs(Math.round(change * 10) / 10);
      if (Math.abs(change) < 1) {
        recentTrend = 'stable';
      } else if (change > 0) {
        recentTrend = 'up';
      } else {
        recentTrend = 'down';
      }
    }

    return {
      totalAssessments,
      avgOverallScore,
      studentsAtRisk,
      topPerformers,
      recentTrend,
      trendPercentage
    };
  }, [assessments]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg shadow-sm border border-blue-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">ELLN Assessment</h3>
            <p className="text-xs text-gray-600">Early Language, Literacy & Numeracy</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/reports/elln/reports')}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
        >
          View Reports
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Total Assessments */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{metrics.totalAssessments}</div>
          <div className="text-xs text-gray-600 mt-1">Total Assessments</div>
        </div>

        {/* Average Score */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{metrics.avgOverallScore}</div>
          <div className="text-xs text-gray-600 mt-1">Avg Overall Score</div>
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-red-600">{metrics.studentsAtRisk}</div>
          <div className="text-xs text-gray-600 mt-1">Students At Risk</div>
          <div className="text-xs text-red-500 mt-1">(Below 75)</div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="text-2xl font-bold text-green-600">{metrics.topPerformers}</div>
          <div className="text-xs text-gray-600 mt-1">Top Performers</div>
          <div className="text-xs text-green-500 mt-1">(90+)</div>
        </div>
      </div>

      {/* Trend Indicator */}
      {metrics.totalAssessments > 0 && (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Recent Trend</span>
            <div className="flex items-center space-x-2">
              {metrics.recentTrend === 'up' && (
                <>
                  <span className="text-2xl">📈</span>
                  <span className="text-sm font-semibold text-green-600">+{metrics.trendPercentage}%</span>
                </>
              )}
              {metrics.recentTrend === 'down' && (
                <>
                  <span className="text-2xl">📉</span>
                  <span className="text-sm font-semibold text-red-600">-{metrics.trendPercentage}%</span>
                </>
              )}
              {metrics.recentTrend === 'stable' && (
                <>
                  <span className="text-2xl">➡️</span>
                  <span className="text-sm font-semibold text-gray-600">Stable</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-2">
        <button
          onClick={() => navigate('/reports/elln/assessment')}
          className="text-xs text-blue-600 hover:text-blue-700 font-medium py-2 px-3 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
        >
          New Assessment
        </button>
        <button
          onClick={() => navigate('/reports/elln/results')}
          className="text-xs text-purple-600 hover:text-purple-700 font-medium py-2 px-3 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
        >
          View Results
        </button>
        <button
          onClick={() => navigate('/reports/elln/ilmp')}
          className="text-xs text-green-600 hover:text-green-700 font-medium py-2 px-3 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
        >
          ILMP
        </button>
      </div>
    </div>
  );
}
