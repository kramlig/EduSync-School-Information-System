/**
 * ELLN Statistical Reports Component
 * 
 * Advanced statistical analysis for ELLN assessment data.
 * Includes trend analysis, growth rates, and predictive insights.
 */

import React from 'react';
import { ELLNAssessment } from '../shared/FormTypes';

interface StatisticalMetrics {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
}

interface TrendData {
  quarter: string;
  avgScore: number;
  assessmentCount: number;
  growthRate: number;
}

interface StatisticalReportProps {
  assessments: ELLNAssessment[];
  title: string;
}

/**
 * Calculate statistical metrics
 */
function calculateStatistics(scores: number[]): StatisticalMetrics {
  if (scores.length === 0) {
    return {
      mean: 0,
      median: 0,
      mode: 0,
      standardDeviation: 0,
      variance: 0,
      min: 0,
      max: 0,
      range: 0,
      q1: 0,
      q3: 0,
      iqr: 0
    };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const n = sorted.length;

  // Mean
  const mean = scores.reduce((sum, val) => sum + val, 0) / n;

  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  // Mode
  const frequency: Record<number, number> = {};
  let maxFreq = 0;
  let mode = sorted[0];
  scores.forEach(score => {
    frequency[score] = (frequency[score] || 0) + 1;
    if (frequency[score] > maxFreq) {
      maxFreq = frequency[score];
      mode = score;
    }
  });

  // Variance and Standard Deviation
  const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const standardDeviation = Math.sqrt(variance);

  // Min, Max, Range
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;

  // Quartiles
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;

  return {
    mean: Math.round(mean * 10) / 10,
    median: Math.round(median * 10) / 10,
    mode: Math.round(mode * 10) / 10,
    standardDeviation: Math.round(standardDeviation * 10) / 10,
    variance: Math.round(variance * 10) / 10,
    min,
    max,
    range,
    q1,
    q3,
    iqr
  };
}

/**
 * Calculate trend data by quarter
 */
function calculateTrends(assessments: ELLNAssessment[]): TrendData[] {
  const quarters: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
  const trends: TrendData[] = [];

  let previousAvg = 0;

  quarters.forEach(quarter => {
    const qAssessments = assessments.filter(a => a.quarter === quarter);
    const avgScore = qAssessments.length > 0
      ? qAssessments.reduce((sum, a) => sum + a.overallScore, 0) / qAssessments.length
      : 0;

    const growthRate = previousAvg > 0 ? ((avgScore - previousAvg) / previousAvg) * 100 : 0;

    trends.push({
      quarter: quarter.toUpperCase(),
      avgScore: Math.round(avgScore * 10) / 10,
      assessmentCount: qAssessments.length,
      growthRate: Math.round(growthRate * 10) / 10
    });

    if (avgScore > 0) previousAvg = avgScore;
  });

  return trends;
}

export default function StatisticalReports({ assessments, title }: StatisticalReportProps) {
  const overallScores = assessments.map(a => a.overallScore);
  const literacyScores = assessments.map(a => a.literacyScore);
  const numeracyScores = assessments.map(a => a.numeracyScore);

  const overallStats = calculateStatistics(overallScores);
  const literacyStats = calculateStatistics(literacyScores);
  const numeracyStats = calculateStatistics(numeracyScores);
  const trends = calculateTrends(assessments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">📊 Statistical Analysis</h2>
        <p className="text-purple-100">{title}</p>
        <p className="text-sm text-purple-200 mt-2">
          Based on {assessments.length} assessment{assessments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Overall Scores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
            Overall Score Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean:</span>
              <span className="font-semibold">{overallStats.mean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median:</span>
              <span className="font-semibold">{overallStats.median}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Dev:</span>
              <span className="font-semibold">{overallStats.standardDeviation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-semibold">{overallStats.min} - {overallStats.max}</span>
            </div>
          </div>
        </div>

        {/* Literacy Scores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Literacy Score Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean:</span>
              <span className="font-semibold">{literacyStats.mean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median:</span>
              <span className="font-semibold">{literacyStats.median}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Dev:</span>
              <span className="font-semibold">{literacyStats.standardDeviation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-semibold">{literacyStats.min} - {literacyStats.max}</span>
            </div>
          </div>
        </div>

        {/* Numeracy Scores */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
            <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Numeracy Score Statistics
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean:</span>
              <span className="font-semibold">{numeracyStats.mean}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Median:</span>
              <span className="font-semibold">{numeracyStats.median}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Dev:</span>
              <span className="font-semibold">{numeracyStats.standardDeviation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Range:</span>
              <span className="font-semibold">{numeracyStats.min} - {numeracyStats.max}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quarterly Trends */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Quarterly Trend Analysis</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Quarter</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Assessments</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Avg Score</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Growth Rate</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {trends.map((trend, idx) => (
                <tr key={trend.quarter} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{trend.quarter}</td>
                  <td className="px-4 py-3 text-center">{trend.assessmentCount}</td>
                  <td className="px-4 py-3 text-center font-semibold">{trend.avgScore}</td>
                  <td className="px-4 py-3 text-center">
                    {idx === 0 ? (
                      <span className="text-gray-400">Baseline</span>
                    ) : trend.growthRate > 0 ? (
                      <span className="text-green-600 font-semibold">+{trend.growthRate}%</span>
                    ) : trend.growthRate < 0 ? (
                      <span className="text-red-600 font-semibold">{trend.growthRate}%</span>
                    ) : (
                      <span className="text-gray-600">0%</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {idx === 0 ? (
                      '📊'
                    ) : trend.growthRate > 0 ? (
                      <span className="text-2xl">📈</span>
                    ) : trend.growthRate < 0 ? (
                      <span className="text-2xl">📉</span>
                    ) : (
                      <span className="text-2xl">➡️</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">📐 Quartile Analysis</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">1st Quartile (Q1):</span>
              <span className="font-semibold">{overallStats.q1}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">3rd Quartile (Q3):</span>
              <span className="font-semibold">{overallStats.q3}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Interquartile Range (IQR):</span>
              <span className="font-semibold">{overallStats.iqr}</span>
            </div>
            <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
              <strong>Interpretation:</strong> 50% of scores fall between {overallStats.q1} and {overallStats.q3}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">🎯 Performance Indicators</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Variance:</span>
              <span className="font-semibold">{overallStats.variance}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Mode (Most Common):</span>
              <span className="font-semibold">{overallStats.mode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Consistency:</span>
              <span className={`font-semibold ${overallStats.standardDeviation < 10 ? 'text-green-600' : overallStats.standardDeviation < 15 ? 'text-yellow-600' : 'text-red-600'}`}>
                {overallStats.standardDeviation < 10 ? 'High' : overallStats.standardDeviation < 15 ? 'Moderate' : 'Low'}
              </span>
            </div>
            <div className="mt-3 p-2 bg-purple-50 rounded text-xs text-purple-700">
              <strong>Note:</strong> Lower standard deviation indicates more consistent performance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
