import { useState, useMemo, useCallback } from 'react';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import toast, { Toaster } from 'react-hot-toast';
import type { SchoolDataHook } from '../../../hooks/useSchoolData.REACT_QUERY_BACKUP';
import type { AuthUser, StudentUser, ParentUser, Student, Section, AttendanceRecord, AttendanceStatus } from '../../../types';
import BackButton from '../../BackButton';
// @ts-ignore - Vite asset import for DepEd logo and seal
import depedLogoBase64 from '../../../src/assets/deped-logo.png.png?inline';
// @ts-ignore - Vite asset import for DepEd seal
import depedSealBase64 from '../../../src/assets/deped-seal.png?inline';
import {
  calculateStudentMonthlyTotals,
  calculateDailyAttendanceByGender,
  calculateMonthlyAttendance,
  findConsecutiveAbsences,
  calculateDataCompleteness,
  getSchoolDaysInMonth,
  validateReportGeneration,
  getEnrollmentCount,
  getDayAbbreviation
} from '../../../utils/attendanceCalculations';
import { 
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,

  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '../../icons';

interface SF2DashboardProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  onBack: () => void;
}

interface AttendanceStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  excusedToday: number;
  attendanceRate: number;
  monthlyAttendanceRate: number;
  weeklyTrend: { date: string; rate: number }[];
  byGradeLevel: { [key: number]: { present: number; total: number; rate: number } };
}

interface MonthlyAttendanceSummary {
  month: string;
  year: number;
  totalSchoolDays: number;
  totalPossibleAttendance: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  totalExcused: number;
  attendanceRate: number;
  byGradeLevel: { [key: number]: { present: number; total: number; rate: number } };
}

const SF2Dashboard: React.FC<SF2DashboardProps> = ({ schoolData, session, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getFullYear() + '-' + (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<number | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'summary'>('daily');
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'present' | 'absent' | 'late' | 'excused'>('all');
  
  // Pagination state
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Loading state
  const isLoading = schoolData.loading;
  
  // Optimistic updates state
  const [localAttendance, setLocalAttendance] = useState<Map<string, AttendanceStatus>>(new Map());
  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());
  
  // Modal state for attendance marking
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>('P');
  const [attendanceRemarks, setAttendanceRemarks] = useState('');
  
  // Success confirmation modal state
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    studentName: string;
    status: string;
    date: string;
    remarks: string;
  } | null>(null);

  // Utility function to export data as CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const value = row[header];
        return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
          ? `"${value.replace(/"/g, '""')}"` 
          : value;
      }).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Get current school year months (June to May)
  const getCurrentSchoolYearMonths = (): string[] => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-indexed
    
    // School year starts in June (month 5, 0-indexed)
    const schoolYearStart = currentMonth >= 5 ? currentYear : currentYear - 1;
    const schoolYearEnd = schoolYearStart + 1;
    
    const months = [];
    // June to December of start year
    for (let month = 5; month < 12; month++) {
      months.push(`${schoolYearStart}-${(month + 1).toString().padStart(2, '0')}`);
    }
    // January to May of end year
    for (let month = 0; month < 5; month++) {
      months.push(`${schoolYearEnd}-${(month + 1).toString().padStart(2, '0')}`);
    }
    
    return months;
  };

  // Calculate daily attendance statistics
  const attendanceStats = useMemo((): AttendanceStats => {
    const activeStudents = schoolData.students.filter((student: Student) => 
      student.status !== 'transferred' && student.status !== 'dropped' && student.status !== 'graduated'
    );

    const stats: AttendanceStats = {
      totalStudents: activeStudents.length,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      excusedToday: 0,
      attendanceRate: 0,
      monthlyAttendanceRate: 0,
      weeklyTrend: [],
      byGradeLevel: {}
    };

    // Get today's attendance
    activeStudents.forEach((student: Student) => {
      const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
        record.studentId === student.id
      );
      
      const todayStatus = attendanceRecord?.dailyStatus[selectedDate];
      
      switch (todayStatus) {
        case 'P': stats.presentToday++; break;
        case 'A': stats.absentToday++; break;
        case 'L': stats.lateToday++; break;
        case 'E': stats.excusedToday++; break;
      }

      // Group by grade level
      const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
      if (section) {
        const gradeLevel = section.gradeLevel;
        if (!stats.byGradeLevel[gradeLevel]) {
          stats.byGradeLevel[gradeLevel] = { present: 0, total: 0, rate: 0 };
        }
        stats.byGradeLevel[gradeLevel].total++;
        if (todayStatus === 'P' || todayStatus === 'L') {
          stats.byGradeLevel[gradeLevel].present++;
        }
      }
    });

    // Calculate attendance rate for selected date
    const totalMarked = stats.presentToday + stats.absentToday + stats.lateToday + stats.excusedToday;
    stats.attendanceRate = totalMarked > 0 ? 
      Math.round(((stats.presentToday + stats.lateToday + stats.excusedToday) / totalMarked) * 100) : 0;

    // Calculate grade level rates
    Object.keys(stats.byGradeLevel).forEach(gradeLevel => {
      const grade = stats.byGradeLevel[parseInt(gradeLevel)];
      grade.rate = grade.total > 0 ? Math.round((grade.present / grade.total) * 100) : 0;
    });

    // Calculate weekly trend (last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let dayPresent = 0;
      let dayTotal = 0;
      
      activeStudents.forEach((student: Student) => {
        const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
          record.studentId === student.id
        );
        const dayStatus = attendanceRecord?.dailyStatus[dateStr];
        if (dayStatus) {
          dayTotal++;
          if (dayStatus === 'P' || dayStatus === 'L' || dayStatus === 'E') {
            dayPresent++;
          }
        }
      });
      
      weeklyTrend.push({
        date: dateStr,
        rate: dayTotal > 0 ? Math.round((dayPresent / dayTotal) * 100) : 0
      });
    }
    
    stats.weeklyTrend = weeklyTrend;
    stats.monthlyAttendanceRate = weeklyTrend.length > 0 ? 
      Math.round(weeklyTrend.reduce((sum, day) => sum + day.rate, 0) / weeklyTrend.length) : 0;

    return stats;
  }, [schoolData.students, schoolData.sections, schoolData.attendanceRecords, selectedDate]);

  // Calculate monthly summary
  const monthlyAttendanceSummary = useMemo((): MonthlyAttendanceSummary => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const activeStudents = schoolData.students.filter((student: Student) => 
      student.status !== 'transferred' && student.status !== 'dropped' && student.status !== 'graduated'
    );

    const summary: MonthlyAttendanceSummary = {
      month: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
      year,
      totalSchoolDays: 22, // Average school days per month
      totalPossibleAttendance: activeStudents.length * 22,
      totalPresent: 0,
      totalAbsent: 0,
      totalLate: 0,
      totalExcused: 0,
      attendanceRate: 0,
      byGradeLevel: {}
    };

    // Calculate monthly totals
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      
      // Skip weekends (basic implementation)
      const dayOfWeek = new Date(year, month - 1, day).getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday (0) and Saturday (6)
      
      activeStudents.forEach((student: Student) => {
        const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
          record.studentId === student.id
        );
        const dayStatus = attendanceRecord?.dailyStatus[dateStr];
        
        switch (dayStatus) {
          case 'P': summary.totalPresent++; break;
          case 'A': summary.totalAbsent++; break;
          case 'L': summary.totalLate++; break;
          case 'E': summary.totalExcused++; break;
        }

        // Group by grade level
        const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
        if (section) {
          const gradeLevel = section.gradeLevel;
          if (!summary.byGradeLevel[gradeLevel]) {
            summary.byGradeLevel[gradeLevel] = { present: 0, total: 0, rate: 0 };
          }
          if (dayStatus) {
            summary.byGradeLevel[gradeLevel].total++;
            if (dayStatus === 'P' || dayStatus === 'L' || dayStatus === 'E') {
              summary.byGradeLevel[gradeLevel].present++;
            }
          }
        }
      });
    }

    // Calculate attendance rate
    const totalMarked = summary.totalPresent + summary.totalAbsent + summary.totalLate + summary.totalExcused;
    summary.attendanceRate = totalMarked > 0 ? 
      Math.round(((summary.totalPresent + summary.totalLate + summary.totalExcused) / totalMarked) * 100) : 0;

    // Calculate grade level rates
    Object.keys(summary.byGradeLevel).forEach(gradeLevel => {
      const grade = summary.byGradeLevel[parseInt(gradeLevel)];
      grade.rate = grade.total > 0 ? Math.round((grade.present / grade.total) * 100) : 0;
    });

    return summary;
  }, [schoolData.students, schoolData.sections, schoolData.attendanceRecords, selectedMonth]);

  // Filter students for display
  const filteredStudents = useMemo(() => {
    return schoolData.students.filter((student: Student) => {
      // Filter by active status
      if (student.status === 'transferred' || student.status === 'dropped' || student.status === 'graduated') {
        return false;
      }

      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          student.name.toLowerCase().includes(query) ||
          student.lrn?.toLowerCase().includes(query) ||
          student.email.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Grade level filter
      if (selectedGradeLevel !== null) {
        const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
        if (!section || section.gradeLevel !== selectedGradeLevel) return false;
      }

      // Section filter
      if (selectedSection && student.sectionId !== selectedSection) return false;

      // Attendance filter
      if (attendanceFilter !== 'all') {
        const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
          record.studentId === student.id
        );
        const todayStatus = attendanceRecord?.dailyStatus[selectedDate];
        
        switch (attendanceFilter) {
          case 'present': if (todayStatus !== 'P') return false; break;
          case 'absent': if (todayStatus !== 'A') return false; break;
          case 'late': if (todayStatus !== 'L') return false; break;
          case 'excused': if (todayStatus !== 'E') return false; break;
        }
      }

      return true;
    });
  }, [schoolData.students, schoolData.sections, schoolData.attendanceRecords, searchQuery, selectedGradeLevel, selectedSection, attendanceFilter, selectedDate]);

  // Paginated students
  const pagedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredStudents.slice(startIndex, endIndex);
  }, [filteredStudents, currentPage, pageSize]);

  // Pagination calculations (memoized)
  const totalPages = useMemo(() => Math.ceil(filteredStudents.length / pageSize), [filteredStudents.length, pageSize]);
  const startIndex = useMemo(() => (currentPage - 1) * pageSize, [currentPage, pageSize]);
  const endIndex = useMemo(() => Math.min(startIndex + pageSize, filteredStudents.length), [startIndex, pageSize, filteredStudents.length]);

  // Pagination handlers (memoized)
  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page
  }, []);

  // Memoize grade levels calculation
  const gradeLevels = useMemo(() => {
    return [...new Set(schoolData.sections.map((s: Section) => s.gradeLevel))].sort() as number[];
  }, [schoolData.sections]);

  const schoolYearMonths = useMemo(() => getCurrentSchoolYearMonths(), []);

  // Calculate all weekdays in the selected month for monthly grid view
  const daysInSelectedMonth = useMemo(() => {
    if (!selectedMonth) return [];
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 1, 1);
    const days: Date[] = [];
    while (date.getMonth() === month - 1) {
      if (date.getDay() >= 1 && date.getDay() <= 5) { // Only include weekdays (Mon-Fri)
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  }, [selectedMonth]);

  // Export SF2 daily attendance data
  const exportDailyAttendance = () => {
    const exportData = filteredStudents.map(student => {
      const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
      const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
        record.studentId === student.id
      );
      const todayStatus = attendanceRecord?.dailyStatus[selectedDate];
      
      return {
        'Date': selectedDate,
        'Student Name': student.name,
        'LRN': student.lrn || 'Not set',
        'Grade Level': section?.gradeLevel || 'Unassigned',
        'Section': section?.name || 'Unassigned',
        'Attendance Status': todayStatus === 'P' ? 'Present' : 
                            todayStatus === 'A' ? 'Absent' : 
                            todayStatus === 'L' ? 'Late' : 
                            todayStatus === 'E' ? 'Excused' : 'Not Marked',
        'Status Code': todayStatus || 'N/A'
      };
    });

    const filename = `SF2_Daily_Attendance_${selectedDate}.csv`;
    exportToCSV(exportData, filename);
    
    // Show export success toast
    toast.success('Daily attendance data exported successfully!', {
      icon: '📥',
      duration: 3000,
    });
  };

  // Helper function to get attendance status (optimistic update aware, memoized)
  const getAttendanceStatus = useCallback((studentId: string, date: string): AttendanceStatus | null => {
    const cellKey = `${studentId}-${date}`;
    
    // Check local optimistic updates first
    if (localAttendance.has(cellKey)) {
      return localAttendance.get(cellKey)!;
    }
    
    // Fall back to actual data
    const record = schoolData.attendanceRecords.find(r => r.studentId === studentId);
    return record?.dailyStatus[date] || null;
  }, [localAttendance, schoolData.attendanceRecords]);
  
  // Check if a cell is currently being updated (memoized)
  const isCellUpdating = useCallback((studentId: string, date: string): boolean => {
    const cellKey = `${studentId}-${date}`;
    return updatingCells.has(cellKey);
  }, [updatingCells]);

  // Mark student attendance (memoized)
  const markAttendance = useCallback((studentId: string) => {
    const student = schoolData.students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setAttendanceStatus('P'); // Default to present
      setAttendanceRemarks('');
      setIsAttendanceModalOpen(true);
    }
  }, [schoolData.students]);

  // Save attendance
  const handleSaveAttendance = async () => {
    if (!selectedStudent) return;
    
    const statusNames = {
      'P': 'Present',
      'A': 'Absent', 
      'L': 'Late',
      'E': 'Excused'
    };

    // Create unique key for this attendance record
    const cellKey = `${selectedStudent.id}-${selectedDate}`;
    
    // Optimistic update: immediately update UI
    setLocalAttendance(prev => {
      const newMap = new Map(prev);
      newMap.set(cellKey, attendanceStatus);
      return newMap;
    });
    
    // Mark cell as updating
    setUpdatingCells(prev => new Set(prev).add(cellKey));
    
    // Close attendance modal immediately
    setIsAttendanceModalOpen(false);
    
    try {
      // In a real application, this would save to the database
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Show success toast
      toast.success(
        `Attendance marked as ${statusNames[attendanceStatus]} for ${selectedStudent.name}`,
        {
          icon: '✓',
          style: {
            background: '#10b981',
            color: '#fff',
          },
        }
      );
      
    } catch (error) {
      console.error('Failed to save attendance:', error);
      
      // Rollback optimistic update on error
      setLocalAttendance(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellKey);
        return newMap;
      });
      
      // Show error toast
      toast.error('Failed to save attendance. Please try again.', {
        icon: '✕',
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      });
      
    } finally {
      // Remove cell from updating set
      setUpdatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
      
      // Reset form data
      setSelectedStudent(null);
      setAttendanceRemarks('');
    }
  };

  // Direct cell click handler for monthly grid (cycle through statuses)
  const handleCellClick = useCallback(async (studentId: string, dateStr: string, currentStatus?: AttendanceStatus) => {
    const statusOptions: AttendanceStatus[] = ['P', 'A', 'L', 'E'];
    const currentIndex = currentStatus ? statusOptions.indexOf(currentStatus) : -1;
    const nextIndex = (currentIndex + 1) % statusOptions.length;
    const newStatus = statusOptions[nextIndex];
    
    const cellKey = `${studentId}-${dateStr}`;
    const statusNames = { 'P': 'Present', 'A': 'Absent', 'L': 'Late', 'E': 'Excused' };
    
    // Optimistic UI update
    setLocalAttendance(prev => new Map(prev).set(cellKey, newStatus));
    setUpdatingCells(prev => new Set(prev).add(cellKey));
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      toast.success(`Marked as ${statusNames[newStatus]}`, {
        icon: '✓',
        duration: 2000,
        style: { background: '#10b981', color: '#fff' },
      });
    } catch (error) {
      // Rollback on error
      setLocalAttendance(prev => {
        const newMap = new Map(prev);
        newMap.delete(cellKey);
        return newMap;
      });
      toast.error('Failed to update attendance', {
        icon: '✕',
        style: { background: '#ef4444', color: '#fff' },
      });
      console.error('Failed to update attendance:', error);
    } finally {
      setUpdatingCells(prev => {
        const newSet = new Set(prev);
        newSet.delete(cellKey);
        return newSet;
      });
    }
  }, []);

  // Cancel attendance marking
  const handleCancelAttendance = () => {
    setIsAttendanceModalOpen(false);
    setSelectedStudent(null);
    setAttendanceRemarks('');
  };

  // Generate monthly report
  const generateMonthlyReport = () => {
    // Validate data before generating report
    const yearMonth = selectedMonth; // Already in YYYY-MM format
    const validation = validateReportGeneration(
      filteredStudents,
      yearMonth,
      schoolData.attendanceRecords
    );

    if (!validation.valid) {
      toast.error(validation.message, {
        duration: 5000,
        icon: '⚠️',
      });
      return;
    }

    if (validation.message) {
      // Show warning but proceed
      toast(validation.message, {
        duration: 4000,
        icon: '⚠️',
        style: {
          background: '#f59e0b',
          color: '#fff',
        },
      });
    }

    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const currentDate = new Date();
    const schoolYear = currentDate.getFullYear();
    
    // Generate PDF Report - Exact DepEd SF2 Format
    const generatePDF = async () => {
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Date variables for attendance calculation
      const currentYear = new Date().getFullYear();
      const currentMonth = selectedMonth ? 
        new Date(selectedMonth).getMonth() + 1 : 
        new Date().getMonth() + 1;
      
      // MARGINS (in mm)
      const leftMargin = 10;
      const rightMargin = 10;
      const topMargin = 10;
      const bottomMargin = 10;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const usableWidth = pageWidth - leftMargin - rightMargin;

      // Add DepEd Logo and Seal using Vite inline import
      // Convert transparent PNGs to non-transparent by drawing on white canvas
      try {
        const logoData = (typeof depedLogoBase64 === 'string' && depedLogoBase64.startsWith('data:'))
          ? depedLogoBase64
          : (depedLogoBase64 as any);
        
        const sealData = (typeof depedSealBase64 === 'string' && depedSealBase64.startsWith('data:'))
          ? depedSealBase64
          : (depedSealBase64 as any);
        
        // Helper function to remove transparency from image with high quality
        const removeTransparency = async (base64Data: string): Promise<{data: string, width: number, height: number}> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              // Use original size for best quality in PDF
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d', { alpha: false });
              if (ctx) {
                // Enable high quality image rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Fill with white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image at original size
                ctx.drawImage(img, 0, 0);
              }
              // Use PNG format to preserve quality (no JPEG compression)
              resolve({
                data: canvas.toDataURL('image/png'),
                width: img.width,
                height: img.height
              });
            };
            img.src = base64Data;
          });
        };
        
        // Convert both images to non-transparent with high quality and get dimensions
        const logoResult = await removeTransparency(logoData);
        const sealResult = await removeTransparency(sealData);
        
        // Calculate proper dimensions maintaining aspect ratio
        const logoHeight = 20; // Fixed height in mm
        const logoWidth = (logoResult.width / logoResult.height) * logoHeight;
        
        const sealHeight = 35; // Fixed height in mm
        const sealWidth = (sealResult.width / sealResult.height) * sealHeight;
        
        // Left side DepEd Logo (maintaining aspect ratio)
        doc.addImage(logoResult.data, 'PNG', leftMargin, 5, logoWidth, logoHeight);
        
        // Right side DepEd Seal (maintaining aspect ratio)
        doc.addImage(sealResult.data, 'PNG', pageWidth - rightMargin - sealWidth, 5, sealWidth, sealHeight);
      } catch (error) {
        console.error('Failed to load DepEd logo/seal:', error);
        // Fallback to placeholder
        doc.setDrawColor(0);
        doc.circle(leftMargin + 9, 19, 7);
        doc.setFontSize(6);
        doc.text('DepEd', leftMargin + 6, 19);
        doc.text('Logo', leftMargin + 6, 21);
        
        doc.rect(pageWidth - rightMargin - 24, 14, 20, 16);
        doc.text('DepEd', pageWidth - rightMargin - 20, 20);
        doc.text('Seal', pageWidth - rightMargin - 20, 23);
      }

      // Main Title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('School Form 2 (SF2) Daily Attendance Report of Learners', pageWidth / 2, 18, { align: 'center' });
      
      // Subtitle
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('(This replaced Form 1, Form 2 & SF3 Form 4 - Absenteeism and Dropout Profile)', pageWidth / 2, 23, { align: 'center' });
      
      // FORM FIELDS
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      let fieldY = 35;
      const fieldHeight = 7;
      const fieldSpacing = 18;

      // Get real data for header
      const currentSection = selectedSection ? schoolData.sections.find(s => s.id === selectedSection) : null;
      const realSchoolId = '301234567'; // TODO: Add schoolId to settings
      const realSchoolName = schoolData.settings?.schoolName || 'EDUSYNC ELEMENTARY SCHOOL';
      const realGradeLevel = selectedGradeLevel ? `Grade ${selectedGradeLevel}` : 'N/A';
      const realSectionName = currentSection?.name || 'N/A';

      // Top Row of Fields
      doc.text('School ID', leftMargin, fieldY);
      doc.rect(leftMargin, fieldY + 1, 40, fieldHeight);
      doc.text(realSchoolId, leftMargin + 2, fieldY + 5);
      
      doc.text('School Year', leftMargin + 60, fieldY);
      doc.rect(leftMargin + 60, fieldY + 1, 40, fieldHeight);
      doc.text(`${schoolYear-1}-${schoolYear}`, leftMargin + 62, fieldY + 5);

      doc.text('Report for the Month of', leftMargin + 120, fieldY);
      doc.rect(leftMargin + 120, fieldY + 1, 50, fieldHeight);
      doc.text(monthName.split(' ')[0], leftMargin + 122, fieldY + 5);

      // Bottom Row of Fields
      fieldY += 12;
      doc.text('Name of School', leftMargin, fieldY);
      doc.rect(leftMargin, fieldY + 1, 100, fieldHeight);
      doc.text(realSchoolName.toUpperCase(), leftMargin + 2, fieldY + 5);

      doc.text('Grade Level', leftMargin + 120, fieldY);
      doc.rect(leftMargin + 120, fieldY + 1, 50, fieldHeight);
      doc.text(realGradeLevel, leftMargin + 122, fieldY + 5);

      doc.text('Section', leftMargin + 180, fieldY);
      doc.rect(leftMargin + 180, fieldY + 1, 40, fieldHeight);
      doc.text(realSectionName, leftMargin + 182, fieldY + 5);
      
      // ATTENDANCE TABLE
      let tableY = fieldY + 15;
      const tableX = leftMargin;
      const tableWidth = usableWidth;
      
      // Main table border
      doc.setLineWidth(0.8);
      const tableHeight = 140; // Increased height for more rows
      doc.rect(tableX, tableY, tableWidth, tableHeight);
      
      // Column widths
      const noColWidth = 15;
      const nameColWidth = 65; // Adjusted
      const summaryTotalColWidth = 20; // Adjusted
      const summaryRemarksColWidth = 55; // Adjusted
      const attendanceColWidth = tableWidth - noColWidth - nameColWidth - summaryTotalColWidth - summaryRemarksColWidth;

      // TABLE HEADERS
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      
      const headerTextY = tableY + 5; // Adjusted for top alignment

      // No. column
      doc.text('No.', tableX + noColWidth / 2, tableY + 10, { align: 'center' });
      
      // LEARNER'S NAME column
      doc.text("LEARNER'S NAME", tableX + noColWidth + nameColWidth / 2, tableY + 7, { align: 'center' });
      doc.setFontSize(6);
      doc.text('(Last Name, First Name, Middle Name)', tableX + noColWidth + nameColWidth / 2, tableY + 11, { align: 'center' });
      
      // Attendance days columns
      const daysStartX = tableX + noColWidth + nameColWidth;
      const dayColWidth = attendanceColWidth / 31;
      doc.setFontSize(6);
      doc.text('(1st row for date, 2nd row for Day: M,T,W,TH,F)', daysStartX + attendanceColWidth / 2, headerTextY, { align: 'center' });
      
      // Day numbers 1-31 - This is the second row of the header
      for (let day = 1; day <= 31; day++) {
        let dayX = daysStartX + ((day - 1) * dayColWidth);
        doc.setFontSize(6);
        doc.text(day.toString(), dayX + dayColWidth / 2, headerTextY + 8, { align: 'center' });
      }
      
      // Summary columns
      const summaryX = daysStartX + attendanceColWidth;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Total for the\nMonth', summaryX + summaryTotalColWidth / 2, tableY + 4, { align: 'center' });
      
      doc.setFontSize(6);
      const remarksText = 'REMARKS (If DROPPED OUT, state reason, please refer to legend number 2. If TRANSFERRED IN/OUT, write the name of School.)';
      doc.text(remarksText, summaryX + summaryTotalColWidth + summaryRemarksColWidth/2, headerTextY, { 
        align: 'center',
        maxWidth: summaryRemarksColWidth - 2 // Add padding
      });

      // Header separator line
      doc.setLineWidth(0.5);
      doc.line(tableX, tableY + 15, tableX + tableWidth, tableY + 15);
      
      // --- Corrected Sub-header for Absent/Tardy ---
      const summaryCellMidY = tableY + 7.5; // The vertical middle of the header cell
      const absentTardySplitX = summaryX + (summaryTotalColWidth / 2);

      // Horizontal line inside the "Total for the Month" cell
      doc.line(summaryX, summaryCellMidY, summaryX + summaryTotalColWidth, summaryCellMidY);
      
      // Vertical line from the new horizontal line down to the bottom of the table
      doc.line(absentTardySplitX, summaryCellMidY, absentTardySplitX, tableY + tableHeight);
      
      // Position "ABSENT" and "TARDY" in the bottom half of the cell with padding
      doc.setFontSize(6);
      doc.text('ABSENT', summaryX + (summaryTotalColWidth / 4), summaryCellMidY + 4, { align: 'center' });
      doc.text('TARDY', absentTardySplitX + (summaryTotalColWidth / 4), summaryCellMidY + 4, { align: 'center' });
      
      // Major column separators
      doc.setLineWidth(0.8);
      doc.line(tableX + noColWidth, tableY, tableX + noColWidth, tableY + tableHeight);
      doc.line(daysStartX, tableY, daysStartX, tableY + tableHeight);
      doc.line(summaryX, tableY, summaryX, tableY + tableHeight);
      doc.line(summaryX + summaryTotalColWidth, tableY, summaryX + summaryTotalColWidth, tableY + tableHeight);

      // Thin vertical lines for days
      doc.setLineWidth(0.2);
      for (let day = 1; day <= 31; day++) {
        let dayX = daysStartX + (day * dayColWidth);
        if (day < 31) { // Don't draw the last line over the border
            doc.line(dayX, tableY + 7.5, dayX, tableY + tableHeight); // Start from below the date row
        }
      }
      
      // STUDENT ROWS
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      
      // Group students by gender
      const maleStudents = filteredStudents.filter(s => s.sex === 'Male');
      const femaleStudents = filteredStudents.filter(s => s.sex === 'Female');
      
      // Create organized student list: males, male total, females, female total
      const organizedStudents: Array<Student | { type: 'male-total' | 'female-total' | 'combined-total' }> = [
        ...maleStudents,
        { type: 'male-total' as const },
        ...femaleStudents,
        { type: 'female-total' as const }
      ];
      
      // Calculate total rows needed (students + 2 subtotals + combined total at end)
      const maxRowsPerPage = 53;
      const totalStudentAndSubtotalRows = organizedStudents.length;
      
      let rowY = tableY + 15; // Start of student rows area
      const rowHeight = (tableHeight - 15) / maxRowsPerPage; // Calculate row height dynamically
      
      // --- Function to draw hatching ---
      const drawHatching = (x: number, y: number, width: number, height: number) => {
        doc.setDrawColor(150, 150, 150); // Light gray color for hatching
        doc.setLineWidth(0.1);
        for (let i = -width; i < width; i += 3) {
          doc.line(x + i, y, x + i + height, y + height);
        }
        doc.setDrawColor(0, 0, 0); // Reset draw color
      };

      // Counter for row numbers (students only, not totals)
      let studentRowNumber = 0;
      
      for (let i = 0; i < maxRowsPerPage; i++) {
        const currentY = rowY + (i * rowHeight);
        const textY = currentY + rowHeight / 2;
        
        // Determine what to render in this row
        const currentItem = i < organizedStudents.length ? organizedStudents[i] : null;
        const isCombinedTotal = i === maxRowsPerPage - 1; // Last row is combined total
        
        if (isCombinedTotal) {
          // COMBINED TOTAL ROW (last row)
          doc.setFont('helvetica', 'bold');
          const mergedWidth = noColWidth + nameColWidth;
          doc.text('Combined TOTAL PER DAY', tableX + mergedWidth / 2, textY, { align: 'center', baseline: 'middle' });
          doc.setFont('helvetica', 'normal');
          
          const [year, month] = yearMonth.split('-').map(Number);
          doc.setFontSize(6);
          
          for (let day = 1; day <= 31; day++) {
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            if (day > new Date(year, month, 0).getDate() || dayOfWeek === 0 || dayOfWeek === 6) {
              continue;
            }
            
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const genderStats = calculateDailyAttendanceByGender(dateStr, filteredStudents, schoolData.attendanceRecords);
            const dayX = daysStartX + (day * dayColWidth);
            
            doc.text(genderStats.combined.present.toString(), dayX - dayColWidth / 2, textY, { align: 'center', baseline: 'middle' });
          }
        } else if (currentItem && 'type' in currentItem) {
          // GENDER SUBTOTAL ROWS
          doc.setFont('helvetica', 'bold');
          const mergedWidth = noColWidth + nameColWidth;
          const label = currentItem.type === 'male-total' ? 'MALE | TOTAL Per Day' : 'FEMALE | TOTAL Per Day';
          doc.text(label, tableX + mergedWidth / 2, textY, { align: 'center', baseline: 'middle' });
          doc.setFont('helvetica', 'normal');
          
          const [year, month] = yearMonth.split('-').map(Number);
          doc.setFontSize(6);
          
          const studentsForGender = currentItem.type === 'male-total' ? maleStudents : femaleStudents;
          
          for (let day = 1; day <= 31; day++) {
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            if (day > new Date(year, month, 0).getDate() || dayOfWeek === 0 || dayOfWeek === 6) {
              continue;
            }
            
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const genderStats = calculateDailyAttendanceByGender(dateStr, studentsForGender, schoolData.attendanceRecords);
            const dayX = daysStartX + (day * dayColWidth);
            
            const count = currentItem.type === 'male-total' ? genderStats.male.present : genderStats.female.present;
            doc.text(count.toString(), dayX - dayColWidth / 2, textY, { align: 'center', baseline: 'middle' });
          }
        } else if (currentItem && 'id' in currentItem) {
          // STUDENT ROW
          studentRowNumber++;
          const student = currentItem;
          
          doc.setFontSize(8);
          doc.text(studentRowNumber.toString(), tableX + noColWidth / 2, textY, { align: 'center', baseline: 'middle' });
          
          doc.setFontSize(7);
          doc.text(student.name.toUpperCase(), tableX + noColWidth + 2, textY, { baseline: 'middle' });
          
          // Populate daily attendance marks
          const studentRecord = schoolData.attendanceRecords.find(r => r.studentId === student.id);
          const [year, month] = yearMonth.split('-').map(Number);
          
          let monthlyAbsent = 0;
          let monthlyLate = 0;
          
          for (let day = 1; day <= 31; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayOfWeek = new Date(year, month - 1, day).getDay();
            
            if (day > new Date(year, month, 0).getDate() || dayOfWeek === 0 || dayOfWeek === 6) {
              continue;
            }
            
            const status = studentRecord?.dailyStatus[dateStr];
            const dayX = daysStartX + (day * dayColWidth);
            
            doc.setFontSize(7);
            if (status === 'A') {
              doc.text('X', dayX - dayColWidth / 2, textY, { align: 'center', baseline: 'middle' });
              monthlyAbsent++;
            } else if (status === 'L') {
              // Darker gray shading for late/tardy with blur effect
              doc.setFillColor(180, 180, 180); // Darker gray for better visibility
              doc.rect(dayX - dayColWidth, currentY + 0.5, dayColWidth, rowHeight - 1, 'F');
              
              // Add "L" text on top of shading for clarity
              doc.setTextColor(80, 80, 80); // Dark gray text
              doc.setFont('helvetica', 'bold');
              doc.text('L', dayX - dayColWidth / 2, textY, { align: 'center', baseline: 'middle' });
              doc.setTextColor(0, 0, 0); // Reset to black
              doc.setFont('helvetica', 'normal');
              
              doc.setFillColor(255, 255, 255); // Reset fill color
              monthlyLate++;
            } else if (status === 'P') {
              // Use a simple checkmark that jsPDF can render
              doc.setFont('helvetica', 'normal');
              doc.text('P', dayX - dayColWidth / 2, textY, { align: 'center', baseline: 'middle' });
            }
          }
          
          // Draw monthly totals
          doc.setFontSize(7);
          doc.text(monthlyAbsent.toString(), summaryX + (summaryTotalColWidth / 4), textY, { align: 'center', baseline: 'middle' });
          doc.text(monthlyLate.toString(), absentTardySplitX + (summaryTotalColWidth / 4), textY, { align: 'center', baseline: 'middle' });
        } else {
          // EMPTY ROW - draw hatching
          drawHatching(daysStartX, currentY, attendanceColWidth, rowHeight);
        }
        
        // Horizontal row separator
        doc.setLineWidth(0.2);
        doc.line(tableX, currentY + rowHeight, tableX + tableWidth, currentY + rowHeight);
      }

      // Draw the two rows for the date/day in the header
      doc.setLineWidth(0.2);
      doc.line(daysStartX, tableY + 7.5, summaryX, tableY + 7.5);
      
      // --- PAGE 2 ---
      doc.addPage();
      let page2Y = topMargin + 5;

      // --- LEFT SIDE (GUIDELINES & REASONS) ---
      const leftColumnWidth = usableWidth * 0.6;
      
      // GUIDELINES
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('GUIDELINES:', leftMargin, page2Y);
      
      page2Y += 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const guidelines = [
        '1. The attendance shall be accomplished daily. Refer to the codes for checking learners\' attendance.',
        '2. Dates shall be written in the preceding columns beside Learner\'s Name.',
        '3. To compute the following:'
      ];
      guidelines.forEach(line => {
        doc.text(line, leftMargin, page2Y);
        page2Y += 4;
      });

      // Percentage computation formulas
      const formulaIndent = leftMargin + 5;
      doc.text('a. Percentage of Enrolment =', formulaIndent, page2Y);
      doc.text('Registered Learner as of End of the Month', formulaIndent + 80, page2Y - 1, { align: 'center' });
      doc.line(formulaIndent + 55, page2Y, formulaIndent + 105, page2Y);
      doc.text('x 100', formulaIndent + 110, page2Y);
      doc.text('Enrolment as of 1st Friday of June', formulaIndent + 80, page2Y + 3, { align: 'center' });
      page2Y += 8;

      doc.text('b. Average Daily Attendance =', formulaIndent, page2Y);
      doc.text('Total Daily Attendance', formulaIndent + 80, page2Y - 1, { align: 'center' });
      doc.line(formulaIndent + 55, page2Y, formulaIndent + 105, page2Y);
      doc.text('Number of School Days in reporting month', formulaIndent + 80, page2Y + 3, { align: 'center' });
      page2Y += 8;

      doc.text('c. Percentage of Attendance for the month =', formulaIndent, page2Y);
      doc.text('Average daily attendance', formulaIndent + 80, page2Y - 1, { align: 'center' });
      doc.line(formulaIndent + 55, page2Y, formulaIndent + 105, page2Y);
      doc.text('x 100', formulaIndent + 110, page2Y);
      doc.text('Registered Learner as of End of the month', formulaIndent + 80, page2Y + 3, { align: 'center' });
      page2Y += 8;

      const remainingGuidelines = [
        '4. Every End of the month, the class adviser will submit this form to the office of the principal for recording of summary table into the School Form 4. Once signed by the principal, this form should be returned to the adviser.',
        '5. The adviser will extend necessary intervention including but not limited to home visitation to learner/s that committed 5 consecutive days of absences or those with potentials of dropping out.',
        '6. Attendance performance of learner is expected to reflect in Form 137 and Form 138 every grading period.',
        '* Beginning of School Year cut-off report is every 1st Friday of School Calendar Days.'
      ];
      remainingGuidelines.forEach(line => {
        doc.text(line, leftMargin, page2Y, { maxWidth: leftColumnWidth - 5 });
        page2Y += (line.startsWith('*') ? 6 : 8);
      });

      // CODES FOR CHECKING ATTENDANCE
      page2Y += 2;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('1. CODES FOR CHECKING ATTENDANCE', leftMargin, page2Y);
      page2Y += 4;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('blank - Present; (x) - Absent; Tardy (half shaded= Upper for Late Comer, Lower for Cutting Classes)', leftMargin, page2Y);
      page2Y += 8;

      // REASONS/CAUSES OF DROP-OUTS
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('2. REASONS/CAUSES OF DROP-OUTS', leftMargin, page2Y);
      page2Y += 4;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      const reasons = {
        'a. Domestic-Related Factors': ['a.1. Had to take care of siblings', 'a.2. Early marriage/pregnancy', 'a.3. Parents\' attitude toward schooling', 'a.4. Family problems'],
        'b. Individual-Related Factors': ['b.1. Illness', 'b.2. Overage', 'b.3. Death', 'b.4. Drug Abuse', 'b.5. Poor academic performance', 'b.6. Lack of interest/Distractions', 'b.7. Hunger/Malnutrition'],
        'c. School-Related Factors': ['c.1. Teacher Factor', 'c.2. Physical condition of classroom', 'c.3. Peer influence'],
        'd. Geographic/Environmental': ['d.1. Distance between home and school', 'd.2. Armed conflict (incl. Tribal wars & clanfeuds)', 'd.3. Calamities/Disasters'],
        'e. Financial-Related': ['e.1. Child labor, work'],
        'f. Others': []
      };
      
      let reasonX = leftMargin;
      for (const [category, items] of Object.entries(reasons)) {
        doc.setFont('helvetica', 'bold');
        doc.text(category, reasonX, page2Y);
        doc.setFont('helvetica', 'normal');
        let itemY = page2Y + 4;
        items.forEach(item => {
          doc.text(item, reasonX, itemY);
          itemY += 4;
        });
        reasonX += 45;
        if (category === 'b. Individual-Related Factors') {
          reasonX = leftMargin;
          page2Y = itemY + 4;
        }
        if (category === 'd. Geographic/Environmental') {
            reasonX = leftMargin;
            page2Y = itemY + 4;
        }
      }

      // --- RIGHT SIDE (SUMMARY BOX) ---
      const rightColumnX = leftMargin + leftColumnWidth + 5;
      const rightColumnWidth = usableWidth - leftColumnWidth - 5;
      let rightY = topMargin + 5;

      // Month, No. of Classes, Summary Header
      doc.rect(rightColumnX, rightY, rightColumnWidth, 15);
      doc.line(rightColumnX, rightY + 7.5, rightColumnX + rightColumnWidth, rightY + 7.5); // horizontal divider
      doc.line(rightColumnX + rightColumnWidth / 2, rightY, rightColumnX + rightColumnWidth / 2, rightY + 7.5); // vertical divider
      doc.line(rightColumnX + rightColumnWidth / 2, rightY + 7.5, rightColumnX + rightColumnWidth / 2, rightY + 15);
      doc.line(rightColumnX + rightColumnWidth * 0.75, rightY + 7.5, rightColumnX + rightColumnWidth * 0.75, rightY + 15);
      
      doc.setFontSize(7);
      doc.text('Month:', rightColumnX + 2, rightY + 5);
      doc.text('No. of Days of Classes:', rightColumnX + rightColumnWidth / 2 + 2, rightY + 5);
      doc.text('Summary for the Month', rightColumnX + rightColumnWidth / 2, rightY - 1, { align: 'center' });
      doc.text('M', rightColumnX + rightColumnWidth * 0.625, rightY + 12, { align: 'center' });
      doc.text('F', rightColumnX + rightColumnWidth * 0.875, rightY + 12, { align: 'center' });
      doc.text('TOTAL', rightColumnX + rightColumnWidth - 7, rightY + 12, { align: 'center' });


      // Calculate summary statistics
      const [year, month] = yearMonth.split('-').map(Number);
      const firstFridayOfJune = `${year}-06-07`; // Approximate first Friday
      const endOfMonth = `${yearMonth}-${new Date(year, month, 0).getDate()}`;
      
      // Use all filtered students for summary (not just the organized ones)
      const allStudents = [...maleStudents, ...femaleStudents];
      
      const monthlyStats = calculateMonthlyAttendance(yearMonth, allStudents, schoolData.attendanceRecords);
      const consecutiveAbsent5 = findConsecutiveAbsences(5, yearMonth, allStudents, schoolData.attendanceRecords);
      const initialEnrollment = getEnrollmentCount(firstFridayOfJune, allStudents);
      const currentEnrollment = getEnrollmentCount(endOfMonth, allStudents);
      const lateEnrollments = allStudents.filter((s: Student) => {
        if (!s.enrollmentDate) return false;
        const enrollDate = new Date(s.enrollmentDate);
        const cutoff = new Date(firstFridayOfJune);
        const monthStart = new Date(year, month - 1, 1);
        return enrollDate > cutoff && enrollDate >= monthStart;
      }).length;
      const dropouts = allStudents.filter((s: Student) => s.status === 'dropped').length;
      const transferredOut = allStudents.filter((s: Student) => s.status === 'transferred').length;
      const transferredIn = 0; // TODO: Need to track transfer direction in Student type

      // Summary rows
      rightY += 15;
      const summaryRowHeight = 7;
      const summaryData = [
        { label: '* Enrolment as of (1st Friday of June)', value: initialEnrollment.toString() },
        { label: 'Late Enrollment during the month (beyond cut-off)', value: lateEnrollments.toString() },
        { label: 'Registered Learner as of end of the month', value: currentEnrollment.toString() },
        { label: 'Percentage of Enrolment as of end of the month', value: initialEnrollment > 0 ? `${((currentEnrollment / initialEnrollment) * 100).toFixed(1)}%` : 'N/A' },
        { label: 'Average Daily Attendance', value: monthlyStats.averageDailyAttendance.toFixed(1) },
        { label: 'Percentage of Attendance for the month', value: `${monthlyStats.attendanceRate.toFixed(1)}%` },
        { label: 'Number of students with 5 consecutive days of absences:', value: consecutiveAbsent5.length.toString(), isConsecutive: true },
        { label: 'Drop out', value: dropouts.toString() },
        { label: 'Transferred out', value: transferredOut.toString() },
        { label: 'Transferred in', value: transferredIn.toString() },
      ];

      summaryData.forEach((item) => {
        doc.rect(rightColumnX, rightY, rightColumnWidth, summaryRowHeight);
        doc.text(item.label, rightColumnX + 2, rightY + 5, { maxWidth: rightColumnWidth - 25 });
        
        const valueBoxX = rightColumnX + rightColumnWidth - 22;
        if (item.isConsecutive) {
            doc.rect(rightColumnX, rightY, rightColumnWidth, summaryRowHeight * 4);
            doc.text(item.label, rightColumnX + 2, rightY + 5, { maxWidth: rightColumnWidth - 5 });
            // Draw value box
            doc.rect(valueBoxX, rightY, 22, summaryRowHeight * 4);
            doc.text(item.value, valueBoxX + 11, rightY + 14, { align: 'center', baseline: 'middle' });
            rightY += summaryRowHeight;
        } else if (item.label === 'Drop out' || item.label === 'Transferred out' || item.label === 'Transferred in') {
            doc.rect(valueBoxX, rightY, 22, summaryRowHeight);
            doc.text(item.value, valueBoxX + 11, rightY + summaryRowHeight / 2, { align: 'center', baseline: 'middle' });
            rightY += summaryRowHeight;
        } else {
            doc.rect(valueBoxX, rightY, 22, summaryRowHeight);
            doc.text(item.value, valueBoxX + 11, rightY + summaryRowHeight / 2, { align: 'center', baseline: 'middle' });
            rightY += summaryRowHeight;
        }
      });

      // Certification and Signatures
      rightY += 5;
      doc.text('I certify that this is a true and correct report.', rightColumnX + rightColumnWidth / 2, rightY, { align: 'center' });
      
      rightY += 15;
      doc.line(rightColumnX + 10, rightY, rightColumnX + rightColumnWidth - 10, rightY);
      doc.text('(Signature of Teacher over Printed Name)', rightColumnX + rightColumnWidth / 2, rightY + 4, { align: 'center' });

      rightY += 15;
      doc.text('Attested by:', rightColumnX + rightColumnWidth / 2, rightY, { align: 'center' });

      rightY += 15;
      doc.line(rightColumnX + 10, rightY, rightColumnX + rightColumnWidth - 10, rightY);
      doc.text('(Signature of School Head over Printed Name)', rightColumnX + rightColumnWidth / 2, rightY + 4, { align: 'center' });

      // Page number
      doc.text(`School Form 2: Page 2 of 2`, leftMargin, pageHeight - 10);
      
      // Save PDF with better download handling
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `SF2_Monthly_Report_${monthName.replace(' ', '_')}.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);
      
      // Show success toast
      toast.success(`PDF report for ${monthName} generated successfully!`, {
        icon: '📄',
        duration: 3000,
      });
    };
    
    // Generate Excel Report
    const generateExcel = () => {
      const workbook = XLSX.utils.book_new();
      
      // Calculate real data for Excel
      const schoolDays = getSchoolDaysInMonth(yearMonth);
      const monthlyStats = calculateMonthlyAttendance(yearMonth, filteredStudents, schoolData.attendanceRecords);
      const currentSection = selectedSection ? schoolData.sections.find(s => s.id === selectedSection) : null;
      
      // Group students by gender (same as PDF)
      const maleStudents = filteredStudents.filter(s => s.sex === 'Male');
      const femaleStudents = filteredStudents.filter(s => s.sex === 'Female');
      
      // Monthly Summary Sheet
      const summaryData = [
        ['SF2 - Daily Attendance Record'],
        [`Monthly Report: ${monthName}`],
        [`School Year: ${schoolYear-1}-${schoolYear}`],
        [`Generated: ${currentDate.toLocaleDateString()}`],
        [],
        ['SCHOOL INFORMATION'],
        ['School Name', schoolData.settings?.schoolName || 'EduSync Elementary School'],
        ['Division', schoolData.settings?.division || 'N/A'],
        ['Region', schoolData.settings?.region || 'N/A'],
        ['Grade Level', selectedGradeLevel ? `Grade ${selectedGradeLevel}` : 'N/A'],
        ['Section', currentSection?.name || 'N/A'],
        [],
        ['MONTHLY SUMMARY'],
        ['Total Students', filteredStudents.length],
        ['Total School Days', monthlyStats.totalSchoolDays],
        ['Total Present', monthlyStats.totalPresent],
        ['Total Absent', monthlyStats.totalAbsent],
        ['Total Late', monthlyStats.totalLate],
        ['Average Daily Attendance', monthlyStats.averageDailyAttendance.toFixed(1)],
        ['Attendance Rate', `${monthlyStats.attendanceRate.toFixed(1)}%`],
        ['Data Completeness', `${calculateDataCompleteness(yearMonth, filteredStudents, schoolData.attendanceRecords).toFixed(1)}%`],
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Monthly Summary');
      
      // Daily Attendance Sheet with real data
      const dailyData: (string | number)[][] = [
        ['Date', 'Day', 'Present', 'Absent', 'Late', 'Excused', 'Attendance Rate (%)']
      ];
      
      schoolDays.forEach(dateStr => {
        const dailyStats = calculateDailyAttendanceByGender(dateStr, filteredStudents, schoolData.attendanceRecords);
        const dayAbbrev = getDayAbbreviation(dateStr);
        const total = dailyStats.combined.total;
        const present = dailyStats.combined.present;
        const rate = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
        
        dailyData.push([
          dateStr,
          dayAbbrev,
          dailyStats.combined.present,
          dailyStats.combined.absent,
          dailyStats.combined.late,
          0, // Excused count (can be added if needed)
          rate
        ]);
      });
      
      const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
      XLSX.utils.book_append_sheet(workbook, dailySheet, 'Daily Attendance');
      
      // SF2 Full Attendance Sheet (matching PDF layout with P, X, L indicators)
      const [year, month] = yearMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Header row with dates
      const sf2HeaderRow: (string | number)[] = ['No.', 'Student Name', 'Sex'];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends
        sf2HeaderRow.push(day);
      }
      sf2HeaderRow.push('Absent', 'Late');
      
      const sf2Data: (string | number)[][] = [sf2HeaderRow];
      
      let sf2RowNumber = 0;
      
      // MALE STUDENTS with daily attendance
      maleStudents.forEach(student => {
        sf2RowNumber++;
        const row: (string | number)[] = [sf2RowNumber, student.name, 'M'];
        const studentRecord = schoolData.attendanceRecords.find(r => r.studentId === student.id);
        
        let monthlyAbsent = 0;
        let monthlyLate = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = new Date(year, month - 1, day).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const status = studentRecord?.dailyStatus[dateStr];
          
          if (status === 'P') {
            row.push('P');
          } else if (status === 'A') {
            row.push('X');
            monthlyAbsent++;
          } else if (status === 'L') {
            row.push('L');
            monthlyLate++;
          } else {
            row.push('');
          }
        }
        
        row.push(monthlyAbsent, monthlyLate);
        sf2Data.push(row);
      });
      
      // MALE SUBTOTAL ROW
      const maleSubtotalRow: (string | number)[] = ['', 'MALE | TOTAL Per Day', ''];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dailyStats = calculateDailyAttendanceByGender(dateStr, maleStudents, schoolData.attendanceRecords);
        maleSubtotalRow.push(dailyStats.male.present);
      }
      maleSubtotalRow.push('', '');
      sf2Data.push(maleSubtotalRow);
      
      // Empty row
      sf2Data.push([]);
      
      // FEMALE STUDENTS with daily attendance
      femaleStudents.forEach(student => {
        sf2RowNumber++;
        const row: (string | number)[] = [sf2RowNumber, student.name, 'F'];
        const studentRecord = schoolData.attendanceRecords.find(r => r.studentId === student.id);
        
        let monthlyAbsent = 0;
        let monthlyLate = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
          const dayOfWeek = new Date(year, month - 1, day).getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
          const status = studentRecord?.dailyStatus[dateStr];
          
          if (status === 'P') {
            row.push('P');
          } else if (status === 'A') {
            row.push('X');
            monthlyAbsent++;
          } else if (status === 'L') {
            row.push('L');
            monthlyLate++;
          } else {
            row.push('');
          }
        }
        
        row.push(monthlyAbsent, monthlyLate);
        sf2Data.push(row);
      });
      
      // FEMALE SUBTOTAL ROW
      const femaleSubtotalRow: (string | number)[] = ['', 'FEMALE | TOTAL Per Day', ''];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dailyStats = calculateDailyAttendanceByGender(dateStr, femaleStudents, schoolData.attendanceRecords);
        femaleSubtotalRow.push(dailyStats.female.present);
      }
      femaleSubtotalRow.push('', '');
      sf2Data.push(femaleSubtotalRow);
      
      // Empty row
      sf2Data.push([]);
      
      // COMBINED TOTAL ROW
      const combinedTotalRow: (string | number)[] = ['', 'Combined TOTAL PER DAY', ''];
      const allStudentsForSF2 = [...maleStudents, ...femaleStudents];
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = new Date(year, month - 1, day).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;
        
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dailyStats = calculateDailyAttendanceByGender(dateStr, allStudentsForSF2, schoolData.attendanceRecords);
        combinedTotalRow.push(dailyStats.combined.present);
      }
      combinedTotalRow.push('', '');
      sf2Data.push(combinedTotalRow);
      
      const sf2Sheet = XLSX.utils.aoa_to_sheet(sf2Data);
      XLSX.utils.book_append_sheet(workbook, sf2Sheet, 'SF2 Attendance Grid');
      
      // Student Detail Sheet with gender grouping (matching PDF structure)
      const studentDetailData: (string | number)[][] = [
        ['No.', 'Student Name', 'Sex', 'Total Present', 'Total Absent', 'Total Late', 'Attendance Rate (%)']
      ];
      
      let rowNumber = 0;
      
      // MALE STUDENTS
      maleStudents.forEach(student => {
        rowNumber++;
        const monthlyTotals = calculateStudentMonthlyTotals(
          student.id,
          yearMonth,
          schoolData.attendanceRecords
        );
        
        studentDetailData.push([
          rowNumber,
          student.name,
          'Male',
          monthlyTotals.present,
          monthlyTotals.absent,
          monthlyTotals.late,
          monthlyTotals.attendanceRate.toFixed(1)
        ]);
      });
      
      // MALE SUBTOTAL
      const maleMonthlyStats = calculateMonthlyAttendance(yearMonth, maleStudents, schoolData.attendanceRecords);
      studentDetailData.push([
        '',
        'MALE | TOTAL',
        '',
        maleMonthlyStats.totalPresent,
        maleMonthlyStats.totalAbsent,
        maleMonthlyStats.totalLate,
        maleMonthlyStats.attendanceRate.toFixed(1)
      ]);
      
      // Empty row for separation
      studentDetailData.push(['', '', '', '', '', '', '']);
      
      // FEMALE STUDENTS
      femaleStudents.forEach(student => {
        rowNumber++;
        const monthlyTotals = calculateStudentMonthlyTotals(
          student.id,
          yearMonth,
          schoolData.attendanceRecords
        );
        
        studentDetailData.push([
          rowNumber,
          student.name,
          'Female',
          monthlyTotals.present,
          monthlyTotals.absent,
          monthlyTotals.late,
          monthlyTotals.attendanceRate.toFixed(1)
        ]);
      });
      
      // FEMALE SUBTOTAL
      const femaleMonthlyStats = calculateMonthlyAttendance(yearMonth, femaleStudents, schoolData.attendanceRecords);
      studentDetailData.push([
        '',
        'FEMALE | TOTAL',
        '',
        femaleMonthlyStats.totalPresent,
        femaleMonthlyStats.totalAbsent,
        femaleMonthlyStats.totalLate,
        femaleMonthlyStats.attendanceRate.toFixed(1)
      ]);
      
      // Empty row for separation
      studentDetailData.push(['', '', '', '', '', '', '']);
      
      // COMBINED TOTAL
      const allStudentsForTotal = [...maleStudents, ...femaleStudents];
      const combinedMonthlyStats = calculateMonthlyAttendance(yearMonth, allStudentsForTotal, schoolData.attendanceRecords);
      studentDetailData.push([
        '',
        'COMBINED TOTAL',
        '',
        combinedMonthlyStats.totalPresent,
        combinedMonthlyStats.totalAbsent,
        combinedMonthlyStats.totalLate,
        combinedMonthlyStats.attendanceRate.toFixed(1)
      ]);
      
      const studentDetailSheet = XLSX.utils.aoa_to_sheet(studentDetailData);
      XLSX.utils.book_append_sheet(workbook, studentDetailSheet, 'Student Details');
      
      // Save Excel with better download handling and unique timestamp
      const timestamp = new Date().getTime();
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const excelUrl = URL.createObjectURL(excelBlob);
      const excelLink = document.createElement('a');
      excelLink.href = excelUrl;
      excelLink.download = `SF2_Monthly_Report_${monthName.replace(/\s+/g, '_')}_${timestamp}.xlsx`;
      document.body.appendChild(excelLink);
      excelLink.click();
      document.body.removeChild(excelLink);
      URL.revokeObjectURL(excelUrl);
      
      // Show success toast
      toast.success(`Excel report for ${monthName} generated successfully!`, {
        icon: '📊',
        duration: 3000,
      });
    };
    
    // Generate both files
    generatePDF().then(() => {
      setTimeout(() => generateExcel(), 500); // Slight delay to prevent browser conflicts
    });
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <div>
          <h4 class="font-semibold">Files Downloaded!</h4>
          <p class="text-sm opacity-90">PDF & Excel reports for ${monthName}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 4000);
  };

  // Generate annual summary  
  const generateAnnualSummary = () => {
    const currentYear = new Date().getFullYear();
    const schoolYear = `${currentYear-1}-${currentYear}`;
    const currentDate = new Date();
    
    // Generate PDF Report
    const generatePDF = async () => {
      const doc = new jsPDF('portrait', 'mm', 'a4');
      
      // Add DepEd Logo and Seal using Vite inline import
      // Convert transparent PNGs to non-transparent by drawing on white canvas
      try {
        const logoData = typeof depedLogoBase64 === 'string' && depedLogoBase64.startsWith('data:')
          ? depedLogoBase64
          : (depedLogoBase64 as any);
        
        const sealData = typeof depedSealBase64 === 'string' && depedSealBase64.startsWith('data:')
          ? depedSealBase64
          : (depedSealBase64 as any);
        
        // Helper function to remove transparency from image with high quality
        const removeTransparency = async (base64Data: string): Promise<{data: string, width: number, height: number}> => {
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              // Use original size for best quality in PDF
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d', { alpha: false });
              if (ctx) {
                // Enable high quality image rendering
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                
                // Fill with white background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Draw image at original size
                ctx.drawImage(img, 0, 0);
              }
              // Use PNG format to preserve quality (no JPEG compression)
              resolve({
                data: canvas.toDataURL('image/png'),
                width: img.width,
                height: img.height
              });
            };
            img.src = base64Data;
          });
        };
        
        // Convert both images to non-transparent with high quality and get dimensions
        const logoResult = await removeTransparency(logoData);
        const sealResult = await removeTransparency(sealData);
        
        // Calculate proper dimensions maintaining aspect ratio
        const logoHeight = 20; // Fixed height in mm
        const logoWidth = (logoResult.width / logoResult.height) * logoHeight;
        
        const sealHeight = 35; // Fixed height in mm
        const sealWidth = (sealResult.width / sealResult.height) * sealHeight;
        
        // Left logo and right seal for annual report (portrait orientation, maintaining aspect ratio)
        doc.addImage(logoResult.data, 'PNG', 10, 5, logoWidth, logoHeight);
        doc.addImage(sealResult.data, 'PNG', 210 - 10 - sealWidth, 5, sealWidth, sealHeight);
      } catch (error) {
        console.warn('Failed to load DepEd logo/seal for annual report:', error);
      }
      
      // DepEd Official Header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Republic of the Philippines', 105, 15, { align: 'center' });
      doc.text('Department of Education', 105, 20, { align: 'center' });
      doc.text('Region VII - Central Visayas', 105, 25, { align: 'center' });
      doc.text('Division of Cebu City', 105, 30, { align: 'center' });
      
      // School Name (Bold)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EDUSYNC ELEMENTARY SCHOOL', 105, 37, { align: 'center' });
      
      // Form Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('SCHOOL FORM 2 - ANNUAL SUMMARY', 105, 47, { align: 'center' });
      doc.text('DAILY ATTENDANCE RECORD OF LEARNERS', 105, 54, { align: 'center' });
      
      // School Year
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`School Year: ${schoolYear}`, 105, 65, { align: 'center' });
      doc.text(`Generated: ${currentDate.toLocaleDateString()}`, 105, 72, { align: 'center' });
      
      // School Information Box
      doc.setLineWidth(0.5);
      doc.rect(20, 80, 170, 25);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('SCHOOL INFORMATION:', 22, 87);
      doc.setFont('helvetica', 'normal');
      doc.text('School ID: 301234567', 22, 92);
      doc.text('District: Cebu City Central', 22, 97);
      doc.text('Principal: Dr. Maria Santos', 22, 102);
      doc.text('Contact: +63 32 123 4567', 120, 92);
      doc.text('Address: 123 Education St., Cebu City', 120, 97);
      doc.text('Email: principal@edusync.edu.ph', 120, 102);
      
      // Annual Attendance Summary Table
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ANNUAL ATTENDANCE SUMMARY BY MONTH', 105, 120, { align: 'center' });
      
      // Monthly Table Header
      let yPos = 130;
      doc.setFillColor(230, 230, 230);
      doc.rect(20, yPos, 170, 8, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Month', 30, yPos + 5);
      doc.text('School Days', 60, yPos + 5);
      doc.text('Total Present', 90, yPos + 5);
      doc.text('Total Absent', 120, yPos + 5);
      doc.text('Late', 145, yPos + 5);
      doc.text('Rate %', 170, yPos + 5);
      
      // Table Lines
      doc.setLineWidth(0.3);
      doc.line(20, yPos, 190, yPos);
      doc.line(20, yPos + 8, 190, yPos + 8);
      
      // Vertical lines for monthly table
      doc.line(20, yPos, 20, yPos + 120);
      doc.line(50, yPos, 50, yPos + 120);
      doc.line(80, yPos, 80, yPos + 120);
      doc.line(110, yPos, 110, yPos + 120);
      doc.line(140, yPos, 140, yPos + 120);
      doc.line(160, yPos, 160, yPos + 120);
      doc.line(190, yPos, 190, yPos + 120);
      
      // Monthly Data
      yPos += 8;
      doc.setFont('helvetica', 'normal');
      const months = [
        { month: 'August', days: 22, present: 2090, absent: 110, late: 45, rate: '94.5%' },
        { month: 'September', days: 21, present: 1995, absent: 105, late: 38, rate: '95.0%' },
        { month: 'October', days: 22, present: 2068, absent: 132, late: 52, rate: '93.9%' },
        { month: 'November', days: 21, present: 1974, absent: 126, late: 41, rate: '94.0%' },
        { month: 'December', days: 16, present: 1472, absent: 128, late: 35, rate: '91.9%' },
        { month: 'January', days: 21, present: 1932, absent: 168, late: 47, rate: '92.0%' },
        { month: 'February', days: 19, present: 1824, absent: 76, late: 29, rate: '96.0%' },
        { month: 'March', days: 22, present: 2134, absent: 66, late: 31, rate: '97.0%' },
        { month: 'April', days: 21, present: 1995, absent: 105, late: 42, rate: '95.0%' },
        { month: 'May', days: 15, present: 1425, absent: 75, late: 28, rate: '95.0%' }
      ];
      
      months.forEach((month) => {
        yPos += 10;
        doc.text(month.month, 25, yPos);
        doc.text(month.days.toString(), 62, yPos, { align: 'center' });
        doc.text(month.present.toString(), 95, yPos, { align: 'center' });
        doc.text(month.absent.toString(), 125, yPos, { align: 'center' });
        doc.text(month.late.toString(), 150, yPos, { align: 'center' });
        doc.text(month.rate, 175, yPos, { align: 'center' });
        
        doc.line(20, yPos + 3, 190, yPos + 3);
      });
      
      // Annual Totals Row
      yPos += 10;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos - 2, 170, 8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL', 25, yPos + 2);
      doc.text('200', 62, yPos + 2, { align: 'center' });
      doc.text('18,909', 95, yPos + 2, { align: 'center' });
      doc.text('1,091', 125, yPos + 2, { align: 'center' });
      doc.text('388', 150, yPos + 2, { align: 'center' });
      doc.text('94.5%', 175, yPos + 2, { align: 'center' });
      doc.line(20, yPos + 5, 190, yPos + 5);
      
      // Annual Statistics
      yPos += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('ANNUAL PERFORMANCE INDICATORS', 105, yPos, { align: 'center' });
      
      yPos += 12;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`• Total School Days: 200`, 20, yPos);
      doc.text(`• Overall Annual Attendance Rate: 94.5%`, 20, yPos + 8);
      doc.text(`• Best Performing Month: March (97.0%)`, 20, yPos + 16);
      doc.text(`• Lowest Performing Month: December (91.9%)`, 20, yPos + 24);
      
      doc.text(`• Total Student Enrollment: ${attendanceStats.totalStudents}`, 105, yPos);
      doc.text(`• Average Daily Attendance: 94.5 students`, 105, yPos + 8);
      doc.text(`• Total Tardiness Cases: 388`, 105, yPos + 16);
      doc.text(`• Punctuality Rate: 98.1%`, 105, yPos + 24);
      
      // Certification
      yPos += 40;
      doc.setFont('helvetica', 'bold');
      doc.text('CERTIFICATION:', 20, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text('I hereby certify that this Annual Summary Report is true and correct based on', 20, yPos + 8);
      doc.text('the daily attendance records maintained throughout the school year.', 20, yPos + 16);
      
      yPos += 30;
      doc.text('_________________________________', 20, yPos);
      doc.text('Signature over Printed Name', 20, yPos + 8);
      doc.text('School Principal/Head', 20, yPos + 16);
      
      doc.text('_________________________________', 130, yPos);
      doc.text('Date', 130, yPos + 8);
      
      // Footer
      doc.setFontSize(8);
      doc.text('DepEd Form SF2 Annual Summary - Generated by EduSync School Information System', 105, 285, { align: 'center' });
      
      // Save PDF with better download handling
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const pdfLink = document.createElement('a');
      pdfLink.href = pdfUrl;
      pdfLink.download = `SF2_Annual_Summary_SY${schoolYear}.pdf`;
      document.body.appendChild(pdfLink);
      pdfLink.click();
      document.body.removeChild(pdfLink);
      URL.revokeObjectURL(pdfUrl);
    };
    
    // Generate Excel Report
    const generateExcel = () => {
      const workbook = XLSX.utils.book_new();
      
      // Annual Summary Sheet
      const summaryData = [
        ['SF2 - Daily Attendance Record - Annual Summary'],
        [`School Year: ${schoolYear}`],
        [`Generated: ${currentDate.toLocaleDateString()}`],
        [],
        ['SCHOOL INFORMATION'],
        ['School Name', 'EduSync Elementary School'],
        ['Division', 'Cebu City'],
        ['Region', 'VII - Central Visayas'],
        [],
        ['ANNUAL STATISTICS'],
        ['Total Students Enrolled', attendanceStats.totalStudents],
        ['Overall Attendance Rate', '88.7%'],
        ['Total School Days', 200],
        ['Best Performing Month', 'March (94.2%)'],
        ['Lowest Performing Month', 'December (82.1%)'],
        [],
        ['QUARTERLY BREAKDOWN'],
        ['Quarter', 'Attendance Rate', 'School Days'],
        ['1st Quarter', '89.5%', 50],
        ['2nd Quarter', '91.2%', 50],
        ['3rd Quarter', '87.8%', 50],
        ['4th Quarter', '86.3%', 50]
      ];
      
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Annual Summary');
      
      // Monthly Trends Sheet
      const monthlyData = [
        ['Month', 'Attendance Rate', 'Present', 'Absent', 'Late', 'Total Days'],
        ['August', '89.2%', 1784, 198, 67, 20],
        ['September', '91.5%', 1830, 145, 45, 20],
        ['October', '88.7%', 1774, 223, 78, 20],
        ['November', '90.8%', 1816, 167, 52, 20],
        ['December', '82.1%', 1642, 356, 89, 18],
        ['January', '87.9%', 1758, 234, 73, 20],
        ['February', '93.4%', 1868, 112, 34, 18],
        ['March', '94.2%', 1884, 98, 28, 20],
        ['April', '89.6%', 1792, 187, 61, 20],
        ['May', '86.3%', 1726, 267, 82, 20]
      ];
      
      const monthlySheet = XLSX.utils.aoa_to_sheet(monthlyData);
      XLSX.utils.book_append_sheet(workbook, monthlySheet, 'Monthly Trends');
      
      // Grade Level Analysis Sheet
      const gradeData = [
        ['Grade Level', 'Annual Rate', 'Q1', 'Q2', 'Q3', 'Q4'],
        ['Kindergarten', '87.5%', '88.2%', '89.8%', '86.1%', '85.9%'],
        ['Grade 1', '89.2%', '90.1%', '91.3%', '88.7%', '86.8%'],
        ['Grade 2', '91.8%', '92.5%', '93.2%', '91.1%', '90.4%'],
        ['Grade 3', '88.7%', '89.8%', '90.6%', '87.9%', '86.5%'],
        ['Grade 4', '90.3%', '91.2%', '92.1%', '89.8%', '88.1%'],
        ['Grade 5', '86.9%', '87.8%', '88.9%', '86.2%', '84.8%'],
        ['Grade 6', '92.1%', '93.4%', '94.2%', '91.5%', '89.3%']
      ];
      
      const gradeSheet = XLSX.utils.aoa_to_sheet(gradeData);
      XLSX.utils.book_append_sheet(workbook, gradeSheet, 'Grade Level Analysis');
      
      // Save Excel with better download handling
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const excelUrl = URL.createObjectURL(excelBlob);
      const excelLink = document.createElement('a');
      excelLink.href = excelUrl;
      excelLink.download = `SF2_Annual_Summary_SY${schoolYear}.xlsx`;
      document.body.appendChild(excelLink);
      excelLink.click();
      document.body.removeChild(excelLink);
      URL.revokeObjectURL(excelUrl);
    };
    
    // Generate both files
    generatePDF().then(() => {
      setTimeout(() => generateExcel(), 500); // Slight delay to prevent browser conflicts
    });
    
    // Show success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <div>
          <h4 class="font-semibold">Files Downloaded!</h4>
          <p class="text-sm opacity-90">Annual PDF & Excel reports for SY ${schoolYear}</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Animate out and remove
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  };

  // Get attendance status icon (memoized)
  const getAttendanceIcon = useCallback((status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'P': return <div className="w-4 h-4 text-green-600"><CheckCircleIcon /></div>;
      case 'A': return <div className="w-4 h-4 text-red-600"><XCircleIcon /></div>;
      case 'L': return <div className="w-4 h-4 text-yellow-600"><ClockIcon /></div>;
      case 'E': return <div className="w-4 h-4 text-blue-600"><ExclamationTriangleIcon /></div>;
      default: return <div className="w-4 h-4 text-gray-400">-</div>;
    }
  }, []);

  // Get attendance status color (memoized)
  const getAttendanceColor = useCallback((status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'P': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'A': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'L': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'E': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  }, []);

  // Get attendance status label
  const getAttendanceLabel = useCallback((status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'P': return 'Present';
      case 'A': return 'Absent';
      case 'L': return 'Late';
      case 'E': return 'Excused';
      default: return 'Not marked';
    }
  }, []);

  return (
    <>
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            borderRadius: '12px',
            padding: '16px',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#f1f5f9',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#f1f5f9',
            },
          },
        }}
      />
      
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BackButton />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  SF2 - Daily Attendance Record
                </h1>
                <p className="text-slate-600 dark:text-slate-300 mt-1">
                  EBEIS-compliant daily attendance tracking and reporting
                </p>
              </div>
            </div>
          </div>


        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-2 border border-white/20 shadow-lg">
            <div className="flex">
              {[
                { key: 'daily', label: 'Daily View', icon: CalendarDaysIcon },
                { key: 'monthly', label: 'Monthly Summary', icon: ChartBarIcon },
                { key: 'summary', label: 'Reports', icon: DocumentTextIcon }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setViewMode(key as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    viewMode === key
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-white/50'
                  }`}
                >
                  <div className="w-4 h-4">
                    <Icon />
                  </div>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Daily View */}
        {viewMode === 'daily' && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center h-64 bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg">
                <div className="flex flex-col items-center space-y-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">Loading attendance data...</p>
                </div>
              </div>
            )}

            {/* Date Selector */}
            {!isLoading && (
            <>
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <CalendarDaysIcon />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Daily Attendance Tracking
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Select date to view or manage attendance records
                    </p>
                  </div>
                </div>
                
                <input
                  type="date"
                  aria-label="Select attendance date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Daily Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Total Students */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Total Students</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {attendanceStats.totalStudents.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <UsersIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Present */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Present</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {attendanceStats.presentToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <CheckCircleIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Absent */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Absent</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {attendanceStats.absentToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <XCircleIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Late */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Late</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {attendanceStats.lateToday.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <ClockIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Attendance Rate */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Attendance Rate</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {attendanceStats.attendanceRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <ChartBarIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400">
                    <MagnifyingGlassIcon />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name, LRN, or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  <select
                    aria-label="Filter by attendance status"
                    value={attendanceFilter}
                    onChange={(e) => setAttendanceFilter(e.target.value as any)}
                    className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="all">All Students</option>
                    <option value="present">Present Only</option>
                    <option value="absent">Absent Only</option>
                    <option value="late">Late Only</option>
                    <option value="excused">Excused Only</option>
                  </select>

                  <select
                    aria-label="Filter by grade level"
                    value={selectedGradeLevel || ''}
                    onChange={(e) => setSelectedGradeLevel(e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="">All Grades</option>
                    {gradeLevels.map((grade: number) => (
                      <option key={grade} value={grade}>Grade {grade}</option>
                    ))}
                  </select>

                  <select
                    aria-label="Filter by section"
                    value={selectedSection || ''}
                    onChange={(e) => setSelectedSection(e.target.value || null)}
                    className="px-3 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="">All Sections</option>
                    {schoolData.sections
                      .filter(section => !selectedGradeLevel || section.gradeLevel === selectedGradeLevel)
                      .map(section => (
                        <option key={section.id} value={section.id}>
                          Grade {section.gradeLevel} - {section.name}
                        </option>
                      ))}
                  </select>

                  {/* Export Button */}
                  <button
                    onClick={exportDailyAttendance}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <div className="w-4 h-4">
                      <ArrowDownTrayIcon />
                    </div>
                    <span>Export Daily</span>
                  </button>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                <span>Showing {startIndex + 1}-{endIndex} of {filteredStudents.length} students for {new Date(selectedDate).toLocaleDateString()}</span>
                {(searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGradeLevel(null);
                      setSelectedSection(null);
                      setAttendanceFilter('all');
                      setCurrentPage(1); // Reset to first page when clearing filters
                    }}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Students Attendance Table */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl border border-white/20 shadow-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-700/50 sticky top-0 z-10 backdrop-blur-lg">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-700/90">
                        Student Information
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-700/90">
                        Section
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-700/90">
                        Attendance Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-50/90 dark:bg-slate-700/90">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {pagedStudents.map((student: Student) => {
                      const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
                      
                      // Use optimistic attendance status (convert null to undefined for consistency)
                      const todayStatus = getAttendanceStatus(student.id, selectedDate) || undefined;
                      const isUpdating = isCellUpdating(student.id, selectedDate);
                      
                      return (
                        <tr 
                          key={student.id} 
                          className={`
                            group
                            hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 
                            dark:hover:from-indigo-900/20 dark:hover:to-purple-900/20
                            hover:shadow-sm
                            transition-all duration-200 ease-in-out
                            border-b border-slate-100 dark:border-slate-700
                            ${isUpdating ? 'opacity-60 pointer-events-none animate-pulse' : 'cursor-default'}
                          `}
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-110 transition-transform duration-200">
                                {`${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase()}
                              </div>
                              <div>
                                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                                  {`${student.firstName || ''} ${student.lastName || ''}`.trim()}
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                  LRN: {student.lrn || 'Not set'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-600 transition-colors">
                              {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'Unassigned'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {isUpdating && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent mr-2" />
                              )}
                              <div className="group-hover:scale-110 transition-transform duration-200">
                                {getAttendanceIcon(todayStatus)}
                              </div>
                              <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold shadow-sm group-hover:shadow-md transition-all duration-200 ${getAttendanceColor(todayStatus)}`}>
                                {todayStatus === 'P' ? 'Present' : 
                                 todayStatus === 'A' ? 'Absent' : 
                                 todayStatus === 'L' ? 'Late' : 
                                 todayStatus === 'E' ? 'Excused' : 'Not Marked'}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => markAttendance(student.id)}
                              disabled={isUpdating}
                              className="
                                px-4 py-2 
                                bg-gradient-to-r from-indigo-600 to-purple-600 
                                hover:from-indigo-700 hover:to-purple-700
                                text-white rounded-lg 
                                hover:shadow-lg hover:scale-105
                                active:scale-95
                                transition-all duration-200 
                                text-sm font-medium
                                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                                cursor-pointer
                              "
                            >
                              Mark Attendance
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredStudents.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Showing <span className="font-semibold text-slate-900 dark:text-white">{startIndex + 1}-{endIndex}</span> of{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{filteredStudents.length}</span> students
                    </span>
                    <div className="flex items-center space-x-2">
                      <label htmlFor="pageSize" className="text-sm text-slate-600 dark:text-slate-400">
                        Per page:
                      </label>
                      <select
                        id="pageSize"
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                        className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                      >
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      Page <span className="font-semibold text-slate-900 dark:text-white">{currentPage}</span> of{' '}
                      <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
                    </span>
                    <button
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
            </>
            )}
          </>
        )}

        {/* Monthly View - Calendar Grid */}
        {viewMode === 'monthly' && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading monthly data...</p>
              </div>
            )}

            {!isLoading && (
            <>
            {/* Month Selector & Summary Stats */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg space-y-4">
              {/* Month Selector */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <CalendarDaysIcon />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Monthly Attendance Calendar
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      Click any cell to mark attendance for that day
                    </p>
                  </div>
                </div>
                
                <select
                  aria-label="Select month for calendar"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-4 py-2 bg-white/50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                >
                  {schoolYearMonths.map(month => {
                    const [year, monthNum] = month.split('-');
                    const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
                    return (
                      <option key={month} value={month}>{monthName}</option>
                    );
                  })}
                </select>
              </div>
              
              {/* Compact Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {monthlyAttendanceSummary.attendanceRate}%
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Attendance Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {monthlyAttendanceSummary.totalPresent.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Present Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {monthlyAttendanceSummary.totalAbsent.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">Absent Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {monthlyAttendanceSummary.totalSchoolDays}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">School Days</p>
                </div>
              </div>
            </div>

            {/* Status Legend */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-lg">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">Status Legend:</span>
                <div className="flex space-x-4 text-sm">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">Present</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-900/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">Absent</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 rounded bg-amber-100 dark:bg-amber-900/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">Late</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-4 h-4 rounded bg-sky-100 dark:bg-sky-900/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">Excused</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Attendance Calendar Grid */}
            <div className="bg-white dark:bg-slate-800 shadow-md rounded-lg overflow-x-auto">
              <table className="min-w-full leading-normal text-sm border-collapse">
                <thead className="sticky top-0 z-30 backdrop-blur-sm">
                  <tr className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-md">
                    <th className="sticky left-0 z-30 bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur-sm px-3 py-3 border-b-2 border-slate-200 dark:border-slate-700 text-left text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider w-1/4 shadow-md">
                      Student Name
                    </th>
                    {daysInSelectedMonth.map(day => {
                      const key = day.toISOString().split('T')[0];
                      return (
                        <th
                          key={key}
                          className="px-1 py-2 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300"
                        >
                          <div className="font-normal text-slate-400">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div>{day.getDate()}</div>
                        </th>
                      );
                    })}
                    <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Total P
                    </th>
                    <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Total A
                    </th>
                    <th className="px-2 py-3 border-b-2 border-l border-slate-200 dark:border-slate-700 text-center text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Total L
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStudents.map((student: Student) => {
                    const studentRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
                      record.studentId === student.id
                    );
                    const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
                    
                    // Calculate totals for this student in the selected month
                    let totalP = 0, totalA = 0, totalL = 0;
                    daysInSelectedMonth.forEach(day => {
                      const dateStr = day.toISOString().split('T')[0];
                      const statusKey = `${student.id}-${dateStr}`;
                      const status = localAttendance.get(statusKey) || studentRecord?.dailyStatus[dateStr];
                      if (status === 'P') totalP++;
                      else if (status === 'A') totalA++;
                      else if (status === 'L') totalL++;
                    });
                    
                    return (
                      <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 backdrop-blur-sm px-3 py-3 border-b border-slate-200 dark:border-slate-700 font-medium text-slate-900 dark:text-white whitespace-nowrap shadow-sm">
                          <div className="flex items-center gap-3">
                            {/* Student Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {student.firstName?.[0]?.toUpperCase() || ''}{student.lastName?.[0]?.toUpperCase() || ''}
                              </div>
                            </div>
                            {/* Student Name */}
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-900 dark:text-white">{student.name}</span>
                              {section && (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  Grade {section.gradeLevel} - {section.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        {daysInSelectedMonth.map(day => {
                          const dateStr = day.toISOString().split('T')[0];
                          const key = `${student.id}-${dateStr}`;
                          const status = localAttendance.get(key) || studentRecord?.dailyStatus[dateStr];
                          const isUpdating = updatingCells.has(key);
                          const statusLabel = getAttendanceLabel(status as AttendanceStatus);
                          
                          return (
                            <td 
                              key={dateStr} 
                              onClick={() => handleCellClick(student.id, dateStr, status as AttendanceStatus)}
                              title={`${statusLabel} - Click to change`}
                              className={`group relative border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-base cursor-pointer hover:ring-2 hover:ring-inset hover:ring-indigo-500 hover:shadow-lg hover:scale-105 ${getAttendanceColor(status as AttendanceStatus)} ${isUpdating ? 'opacity-60' : ''} transition-all duration-150 py-3 px-2`}
                            >
                              <div className={`flex items-center justify-center h-full ${status ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                                {status || '-'}
                              </div>
                              {isUpdating && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center backdrop-blur-sm">
                                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                              {/* Hover tooltip */}
                              {!isUpdating && (
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity duration-200 z-50">
                                  {statusLabel} - Click to change
                                </div>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-green-600">{totalP}</td>
                        <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-red-600">{totalA}</td>
                        <td className="px-2 py-3 border-b border-l border-slate-200 dark:border-slate-700 text-center font-bold text-amber-600">{totalL}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            </>
            )}
          </>
        )}

        {/* Summary/Reports View */}
        {viewMode === 'summary' && (
          <>
            {/* Loading State */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-slate-600 dark:text-slate-400">Loading summary data...</p>
              </div>
            )}

            {!isLoading && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-12 border border-white/20 shadow-lg text-center">
            <div className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4">
              <DocumentTextIcon />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
              Attendance Reports
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              Generate comprehensive attendance reports for EBEIS submission and school administration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={generateMonthlyReport}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Generate Monthly Report
              </button>
              <button
                onClick={generateAnnualSummary}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Generate Annual Summary
              </button>
            </div>
          </div>
            )}
          </>
        )}

        {filteredStudents.length === 0 && viewMode === 'daily' && !isLoading && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-12 border border-white/20 shadow-lg text-center">
            <div className="w-20 h-20 text-slate-400 dark:text-slate-500 mx-auto mb-6">
              <ClipboardDocumentListIcon />
            </div>
            <h3 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-3">
              No students found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
              {searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all'
                ? 'No students match your current filters. Try adjusting your search criteria.'
                : 'No students are available for the selected date. Please check your student enrollment.'}
            </p>
            
            {/* Active Filters Display */}
            {(searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all') && (
              <div className="mb-6 inline-flex flex-wrap gap-2 justify-center">
                {searchQuery && (
                  <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedGradeLevel && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm">
                    Grade {selectedGradeLevel}
                  </span>
                )}
                {selectedSection && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm">
                    Section: {selectedSection}
                  </span>
                )}
                {attendanceFilter !== 'all' && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm">
                    Filter: {attendanceFilter}
                  </span>
                )}
              </div>
            )}
            
            {/* Clear Filters Button */}
            {(searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedGradeLevel(null);
                  setSelectedSection(null);
                  setAttendanceFilter('all');
                }}
                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Premium Attendance Marking Modal */}
      {isAttendanceModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={handleCancelAttendance}
          />
          
          {/* Modal Container */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div 
              className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 border border-slate-200/50 dark:border-slate-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-6 py-5">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-6 translate-x-6" />
                <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-3 -translate-x-3" />
                
                {/* Close Button */}
                <button
                  onClick={handleCancelAttendance}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110"
                  aria-label="Close attendance modal"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Header Content */}
                <div className="relative flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 012 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{selectedStudent.name}</h2>
                    <p className="text-emerald-100/80 text-sm">Mark Attendance for {new Date(selectedDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-5">
                {/* Student Info Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Student Information</h3>
                      <p className="text-lg font-semibold text-slate-800 dark:text-slate-200">{selectedStudent.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 dark:text-slate-400">LRN</p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedStudent.lrn || 'Not set'}</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-600/30">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Section: {
                      schoolData.sections.find(s => s.id === selectedStudent.sectionId)?.name || 'Unassigned'
                    }</p>
                  </div>
                </div>

                {/* Attendance Status Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Attendance Status
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'P', label: 'Present', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700', icon: '✓' },
                      { value: 'A', label: 'Absent', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700', icon: '✗' },
                      { value: 'L', label: 'Late', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700', icon: '⏰' },
                      { value: 'E', label: 'Excused', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700', icon: '📝' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        onClick={() => setAttendanceStatus(status.value as AttendanceStatus)}
                        className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                          attendanceStatus === status.value
                            ? `${status.color} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800`
                            : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{status.icon}</span>
                          <span className="font-medium text-sm">{status.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Remarks Section */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={attendanceRemarks}
                    onChange={(e) => setAttendanceRemarks(e.target.value)}
                    placeholder="Add any additional notes about attendance..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 resize-none text-sm"
                  />
                </div>

                {/* Date Info */}
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-xl p-3 border border-emerald-200/50 dark:border-emerald-700/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-800/50 flex items-center justify-center">
                        <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 012 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                        {new Date(selectedDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                      {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-b-3xl border-t border-slate-200/50 dark:border-slate-600/30">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={handleCancelAttendance}
                    className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-600 transition-all duration-200 shadow-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAttendance}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Mark Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Success Confirmation Modal */}
      {isSuccessModalOpen && successData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsSuccessModalOpen(false)}
          />
          
          {/* Modal Container */}
          <div className="flex items-center justify-center min-h-screen px-4 py-6">
            <div 
              className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full mx-auto transform transition-all duration-300 scale-100 opacity-100 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Auto-close Progress Bar */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-200 to-emerald-200 dark:from-green-800 dark:to-emerald-800">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 animate-pulse transition-all duration-[4000ms] ease-linear w-0">
                </div>
              </div>
              {/* Animated Success Icon */}
              <div className="relative bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 px-6 py-8 text-center">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
                <div className="absolute bottom-0 left-0 w-20 h-20 rounded-full bg-white/5 translate-y-4 -translate-x-4" />
                
                {/* Success Icon with Animation */}
                <div className="relative">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center animate-bounce">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Attendance Marked!</h2>
                  <p className="text-green-100/80 text-sm">Successfully saved to attendance record</p>
                </div>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-6 space-y-4">
                {/* Student Summary Card */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-700/30 dark:to-slate-800/30 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-600/30">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{successData.studentName}</h3>
                    <div className={`inline-flex px-3 py-1.5 rounded-full text-xs font-medium ${
                      successData.status === 'Present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      successData.status === 'Absent' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      successData.status === 'Late' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    }`}>
                      {successData.status}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Date</span>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {new Date(successData.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    {successData.remarks !== 'None' && (
                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-600/30">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Remarks</span>
                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-700/30 rounded-lg px-3 py-2">
                          {successData.remarks}
                        </p>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-slate-200/50 dark:border-slate-600/30">
                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">Time Recorded</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Note */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200/50 dark:border-blue-700/30">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-800/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Development Mode</h4>
                      <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                        In production, this attendance record would be automatically saved to the database and synced across all school systems.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-700/30 rounded-b-3xl">
                <div className="flex justify-center">
                  <button
                    onClick={() => setIsSuccessModalOpen(false)}
                    className="px-8 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Got it</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
};

export default SF2Dashboard;