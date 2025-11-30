/**
 * FinancialReports - Financial analytics and reports dashboard
 * 
 * Features:
 * - Collection summary (daily/weekly/monthly/quarterly)
 * - Outstanding balances report
 * - Revenue breakdown by fee type
 * - Payment method analysis
 * - Export to CSV functionality
 * 
 * IMPORTANT: Admin/Registrar only. Displays school-wide financial data.
 * 
 * PostgreSQL Migration: ✅ COMPLETE
 * - Uses useStudentLedgersPostgreSQL for ledger data
 * - Uses useReceiptsPostgreSQL for receipt data
 * - Handles both paymentDate and createdAt fields for backward compatibility
 * - Revenue uses 'category' field from PostgreSQL charges
 * 
 * Performance: ✅ OPTIMIZED
 * - 6 useCallback hooks (processCollectionData, processPaymentMethodData, processOutstandingBalances, processRevenueByType, exportToCSV, formatCurrency)
 * - 3 useMemo hooks (currentSchoolYear, totalCollections, totalOutstanding, totalRevenue)
 * - Prevents unnecessary re-renders and recalculations
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { SchoolDataHook } from '../hooks/useSchoolData';
import type { AuthUser, StudentLedger, Receipt } from '../types';
import { useSchoolContext } from '../src/contexts/SchoolContext';
import { useStudentLedgersPostgreSQL } from '../src/hooks/useStudentLedgersPostgreSQL';
import { useReceiptsPostgreSQL } from '../src/hooks/useReceiptsPostgreSQL';
import BarChart from './BarChart';
import LineChart from './LineChart';
import { DocumentArrowDownIcon } from './icons';

interface FinancialReportsProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser; type: 'staff' };
}

type DateRangeType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'custom';
type ReportTab = 'collections' | 'outstanding' | 'revenue' | 'methods';

interface CollectionData {
  date: string;
  amount: number;
  count: number;
}

interface PaymentMethodData {
  method: string;
  amount: number;
  count: number;
  percentage: number;
}

interface OutstandingBalance {
  studentId: string;
  studentName: string;
  gradeLevel: string;
  section: string;
  balance: number;
  status: 'pending' | 'overdue';
}

interface RevenueByType {
  type: string;
  amount: number;
  percentage: number;
}

const FinancialReports: React.FC<FinancialReportsProps> = ({ 
  schoolData, 
  session 
}) => {
  const { students, sections, settings } = schoolData;
  const { schoolId } = useSchoolContext();
  const currentSchoolYear = useMemo(() => settings?.schoolYear || '2024-2025', [settings]);

  // State
  const [activeTab, setActiveTab] = useState<ReportTab>('collections');
  const [dateRange, setDateRange] = useState<DateRangeType>('monthly');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Load financial data from PostgreSQL
  const { ledgers, loading: ledgersLoading } = useStudentLedgersPostgreSQL({ 
    schoolId, 
    schoolYear: currentSchoolYear 
  });
  
  const { receipts, loading: receiptsLoading } = useReceiptsPostgreSQL({
    schoolId,
    includeVoided: false
  });
  const [collectionData, setCollectionData] = useState<CollectionData[]>([]);
  const [paymentMethodData, setPaymentMethodData] = useState<PaymentMethodData[]>([]);
  const [outstandingBalances, setOutstandingBalances] = useState<OutstandingBalance[]>([]);
  const [revenueByType, setRevenueByType] = useState<RevenueByType[]>([]);

  // Set default date range (last 30 days)
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  // Processing functions (defined before useEffect that uses them)
  const processCollectionData = useCallback((receiptsData: Receipt[]) => {
    // Filter receipts by date range
    const filtered = receiptsData.filter(r => {
      const dateField = r.paymentDate || (r as any).payment_date || r.createdAt || (r as any).created_at;
      if (!dateField) return false;
      
      const receiptDate = new Date(dateField);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      return receiptDate >= start && receiptDate <= end;
    });

    // Group by date (use YYYY-MM-DD format for consistent parsing)
    const grouped: { [key: string]: { amount: number; count: number } } = {};
    filtered.forEach(receipt => {
      const dateField = receipt.paymentDate || (receipt as any).payment_date || receipt.createdAt || (receipt as any).created_at;
      if (!dateField) return;
      
      const receiptDate = new Date(dateField);
      // Format as YYYY-MM-DD
      const dateKey = receiptDate.toISOString().split('T')[0];
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { amount: 0, count: 0 };
      }
      grouped[dateKey].amount += receipt.amount;
      grouped[dateKey].count += 1;
    });

    // Convert to array and sort by date
    const data = Object.entries(grouped)
      .map(([dateKey, data]) => {
        // Format display date as MMM DD, YYYY
        const displayDate = new Date(dateKey + 'T00:00:00');
        const formattedDate = displayDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        });
        return { 
          date: formattedDate,
          sortDate: dateKey,
          ...data 
        };
      })
      .sort((a, b) => a.sortDate.localeCompare(b.sortDate));

    setCollectionData(data);
  }, [startDate, endDate]);

  const processPaymentMethodData = useCallback((receiptsData: Receipt[]) => {
    // Filter by date range
    const filtered = receiptsData.filter(r => {
      const dateField = r.paymentDate || (r as any).payment_date || r.createdAt || (r as any).created_at;
      if (!dateField) return false;
      
      const receiptDate = new Date(dateField);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Start of day
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // End of day
      
      return receiptDate >= start && receiptDate <= end;
    });

    // Group by payment method
    const grouped: { [key: string]: { amount: number; count: number } } = {};
    filtered.forEach(receipt => {
      const method = receipt.paymentMethod || 'cash';
      if (!grouped[method]) {
        grouped[method] = { amount: 0, count: 0 };
      }
      grouped[method].amount += receipt.amount;
      grouped[method].count += 1;
    });

    // Calculate percentages
    const total = filtered.reduce((sum, r) => sum + r.amount, 0);
    const data = Object.entries(grouped).map(([method, data]) => ({
      method: method.replace('_', ' ').toUpperCase(),
      ...data,
      percentage: total > 0 ? (data.amount / total) * 100 : 0
    }));

    setPaymentMethodData(data);
  }, [startDate, endDate]);

  const processOutstandingBalances = useCallback((ledgersData: StudentLedger[]) => {
    const outstanding: OutstandingBalance[] = [];

    ledgersData.forEach(ledger => {
      if (ledger.balance > 0) {
        const student = students.find(s => s.id === ledger.studentId);
        if (!student) return;

        const section = sections.find(s => s.id === student.sectionId);
        
        outstanding.push({
          studentId: ledger.studentId,
          studentName: `${student.lastName}, ${student.firstName}`,
          gradeLevel: section?.gradeLevel?.toString() || 'N/A',
          section: section?.name || 'N/A',
          balance: ledger.balance,
          status: ledger.status === 'overdue' ? 'overdue' : 'pending'
        });
      }
    });

    // Sort by balance (highest first)
    outstanding.sort((a, b) => b.balance - a.balance);
    setOutstandingBalances(outstanding);
  }, [students, sections]);

  const processRevenueByType = useCallback((ledgersData: StudentLedger[]) => {
    const revenue: { [key: string]: number } = {};

    ledgersData.forEach(ledger => {
      ledger.charges.forEach(charge => {
        // Use category (PostgreSQL field), type (Firestore field), or 'Other' as fallback
        const chargeType = (charge as any).category || charge.type || charge.description || 'Other';
        if (!revenue[chargeType]) {
          revenue[chargeType] = 0;
        }
        revenue[chargeType] += charge.amount;
      });
    });

    // Calculate total and percentages
    const total = Object.values(revenue).reduce((sum, amount) => sum + amount, 0);
    const data = Object.entries(revenue).map(([type, amount]) => ({
      type: type ? type.replace(/_/g, ' ').toUpperCase() : 'UNCATEGORIZED',
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0
    }));

    setRevenueByType(data);
  }, []);

  // Process data when hooks return new data (placed after all processing functions)
  useEffect(() => {
    if (!receiptsLoading && !ledgersLoading && startDate && endDate) {
      processCollectionData(receipts);
      processPaymentMethodData(receipts);
      processOutstandingBalances(ledgers);
      processRevenueByType(ledgers);
      setLoading(false);
    }
  }, [
    receipts, 
    ledgers, 
    receiptsLoading, 
    ledgersLoading, 
    startDate, 
    endDate,
    processCollectionData,
    processPaymentMethodData,
    processOutstandingBalances,
    processRevenueByType
  ]);

  // Calculate totals
  const totalCollections = useMemo(() => {
    return receipts
      .filter(r => {
        const dateField = r.paymentDate || (r as any).payment_date || r.createdAt || (r as any).created_at;
        if (!dateField) return false;
        
        const receiptDate = new Date(dateField);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return receiptDate >= start && receiptDate <= end;
      })
      .reduce((sum, r) => sum + r.amount, 0);
  }, [receipts, startDate, endDate]);

  const totalOutstanding = useMemo(() => {
    return outstandingBalances.reduce((sum, b) => sum + b.balance, 0);
  }, [outstandingBalances]);

  const totalRevenue = useMemo(() => {
    return ledgers.reduce((sum, l) => {
      return sum + l.charges.reduce((chargeSum, c) => chargeSum + c.amount, 0);
    }, 0);
  }, [ledgers]);

  // Export to CSV
  const exportToCSV = useCallback(() => {
    let csvContent = '';
    
    if (activeTab === 'collections') {
      csvContent = 'Date,Amount,Count\n';
      collectionData.forEach(row => {
        csvContent += `${row.date},${row.amount},${row.count}\n`;
      });
    } else if (activeTab === 'outstanding') {
      csvContent = 'Student Name,Grade Level,Section,Balance,Status\n';
      outstandingBalances.forEach(row => {
        csvContent += `"${row.studentName}",${row.gradeLevel},${row.section},${row.balance},${row.status}\n`;
      });
    } else if (activeTab === 'revenue') {
      csvContent = 'Fee Type,Amount,Percentage\n';
      revenueByType.forEach(row => {
        csvContent += `${row.type},${row.amount},${row.percentage.toFixed(2)}%\n`;
      });
    } else if (activeTab === 'methods') {
      csvContent = 'Payment Method,Amount,Count,Percentage\n';
      paymentMethodData.forEach(row => {
        csvContent += `${row.method},${row.amount},${row.count},${row.percentage.toFixed(2)}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financial-report-${activeTab}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }, [activeTab, collectionData, outstandingBalances, revenueByType, paymentMethodData]);

  // Format currency
  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  }, []);

  if (loading || !schoolId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Financial Reports
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            School Year {currentSchoolYear}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <DocumentArrowDownIcon />
          Export CSV
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex gap-2">
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
                setDateRange('weekly');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
                setDateRange('monthly');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 90);
                setStartDate(start.toISOString().split('T')[0]);
                setEndDate(end.toISOString().split('T')[0]);
                setDateRange('quarterly');
              }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === 'quarterly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              Last 90 Days
            </button>
          </div>

          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDateRange('custom');
                }}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDateRange('custom');
                }}
                className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Collections
              </p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(totalCollections)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {receipts.length} receipts
              </p>
            </div>
            <div className="text-5xl">💰</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Outstanding Balance
              </p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {formatCurrency(totalOutstanding)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {outstandingBalances.length} students
              </p>
            </div>
            <div className="text-5xl">⏳</div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Revenue
              </p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(totalRevenue)}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                All fee types
              </p>
            </div>
            <div className="text-5xl">📊</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'collections'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Collections
            </button>
            <button
              onClick={() => setActiveTab('outstanding')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'outstanding'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Outstanding
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'revenue'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`py-4 px-2 font-medium border-b-2 transition-colors ${
                activeTab === 'methods'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Payment Methods
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Collections Tab */}
          {activeTab === 'collections' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Daily Collections
              </h3>
              {receipts.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                  <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                    No payment receipts found for school year {currentSchoolYear}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                    Financial reports require payment receipts to display data.
                  </p>
                  <div className="text-left max-w-md mx-auto text-sm text-yellow-700 dark:text-yellow-300">
                    <p className="font-medium mb-2">To generate report data:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Go to Payment Recording page</li>
                      <li>Search for a student</li>
                      <li>Ensure the student has a billing ledger initialized</li>
                      <li>Record a payment</li>
                      <li>Generate a receipt</li>
                    </ol>
                  </div>
                </div>
              ) : collectionData.length > 0 ? (
                <>
                  <LineChart
                    data={collectionData.map(d => ({
                      label: d.date,
                      value: d.amount
                    }))}
                    height={300}
                    color="green"
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Date
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Amount
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Receipts
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectionData.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="py-3 px-4 text-slate-900 dark:text-white">
                              {row.date}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-green-600 dark:text-green-400">
                              {formatCurrency(row.amount)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {row.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No collections data for selected date range
                </p>
              )}
            </div>
          )}

          {/* Outstanding Balances Tab */}
          {activeTab === 'outstanding' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Outstanding Balances by Student
              </h3>
              {outstandingBalances.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          Student Name
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          Grade Level
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          Section
                        </th>
                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          Balance
                        </th>
                        <th className="text-center py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingBalances.map((row, index) => (
                        <tr
                          key={index}
                          className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <td className="py-3 px-4 text-slate-900 dark:text-white">
                            {row.studentName}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {row.gradeLevel}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                            {row.section}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-orange-600 dark:text-orange-400">
                            {formatCurrency(row.balance)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                row.status === 'overdue'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                              }`}
                            >
                              {row.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No outstanding balances! All students are fully paid. 🎉
                </p>
              )}
            </div>
          )}

          {/* Revenue by Type Tab */}
          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Revenue Breakdown by Fee Type
              </h3>
              {revenueByType.length > 0 ? (
                <>
                  <BarChart
                    data={revenueByType.map(d => ({
                      label: d.type,
                      value: d.amount,
                      color: 'bg-blue-500'
                    }))}
                    height={300}
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Fee Type
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Amount
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {revenueByType.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="py-3 px-4 text-slate-900 dark:text-white">
                              {row.type}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-blue-600 dark:text-blue-400">
                              {formatCurrency(row.amount)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {row.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No revenue data available
                </p>
              )}
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'methods' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Payment Method Analysis
              </h3>
              {paymentMethodData.length > 0 ? (
                <>
                  <BarChart
                    data={paymentMethodData.map(d => ({
                      label: d.method,
                      value: d.amount,
                      color: 'bg-purple-500'
                    }))}
                    height={300}
                  />
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Payment Method
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Amount
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Count
                          </th>
                          <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentMethodData.map((row, index) => (
                          <tr
                            key={index}
                            className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <td className="py-3 px-4 text-slate-900 dark:text-white">
                              {row.method}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-purple-600 dark:text-purple-400">
                              {formatCurrency(row.amount)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {row.count}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                              {row.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                  No payment method data for selected date range
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;
