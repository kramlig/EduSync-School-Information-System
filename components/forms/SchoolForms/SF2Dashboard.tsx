import { useState, useEffect, useMemo } from 'react';
import type { SchoolDataHook } from '../../../hooks/useSchoolData.REACT_QUERY_BACKUP';
import type { AuthUser, StudentUser, ParentUser, Student, Section, AttendanceRecord, AttendanceStatus } from '../../../types';
import BackButton from '../../BackButton';
import { 
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
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

  const gradeLevels = [...new Set(schoolData.sections.map((s: Section) => s.gradeLevel))].sort() as number[];
  const schoolYearMonths = getCurrentSchoolYearMonths();

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
    
    // Show export success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <div>
          <h4 class="font-semibold">Export Successful</h4>
          <p class="text-sm opacity-90">Daily attendance data downloaded</p>
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

  // Mark student attendance
  const markAttendance = (studentId: string) => {
    const student = schoolData.students.find(s => s.id === studentId);
    if (student) {
      setSelectedStudent(student);
      setAttendanceStatus('P'); // Default to present
      setAttendanceRemarks('');
      setIsAttendanceModalOpen(true);
    }
  };

  // Save attendance
  const handleSaveAttendance = () => {
    if (!selectedStudent) return;
    
    // In a real application, this would save to the database
    const statusNames = {
      'P': 'Present',
      'A': 'Absent', 
      'L': 'Late',
      'E': 'Excused'
    };

    // Set success data for the confirmation modal
    setSuccessData({
      studentName: selectedStudent.name,
      status: statusNames[attendanceStatus],
      date: selectedDate,
      remarks: attendanceRemarks || 'None'
    });
    
    // Close attendance modal and show success modal
    setIsAttendanceModalOpen(false);
    setIsSuccessModalOpen(true);
    
    // Auto-close success modal after 4 seconds
    setTimeout(() => {
      setIsSuccessModalOpen(false);
    }, 4000);
    
    // Reset form data
    setSelectedStudent(null);
    setAttendanceRemarks('');
  };

  // Cancel attendance marking
  const handleCancelAttendance = () => {
    setIsAttendanceModalOpen(false);
    setSelectedStudent(null);
    setAttendanceRemarks('');
  };

  // Generate monthly report
  const generateMonthlyReport = () => {
    // Show professional notification
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <div>
          <h4 class="font-semibold">Monthly Report Generated</h4>
          <p class="text-sm opacity-90">${monthName} attendance report</p>
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

  // Generate annual summary  
  const generateAnnualSummary = () => {
    // Show professional notification
    const currentYear = new Date().getFullYear();
    
    // Create a temporary success notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-xl shadow-2xl transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
        </svg>
        <div>
          <h4 class="font-semibold">Annual Summary Generated</h4>
          <p class="text-sm opacity-90">SY ${currentYear-1}-${currentYear} comprehensive report</p>
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

  // Get attendance status icon
  const getAttendanceIcon = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'P': return <div className="w-4 h-4 text-green-600"><CheckCircleIcon /></div>;
      case 'A': return <div className="w-4 h-4 text-red-600"><XCircleIcon /></div>;
      case 'L': return <div className="w-4 h-4 text-yellow-600"><ClockIcon /></div>;
      case 'E': return <div className="w-4 h-4 text-blue-600"><ExclamationTriangleIcon /></div>;
      default: return <div className="w-4 h-4 text-gray-400">-</div>;
    }
  };

  // Get attendance status color
  const getAttendanceColor = (status: AttendanceStatus | undefined) => {
    switch (status) {
      case 'P': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'A': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'L': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'E': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  return (
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
            {/* Date Selector */}
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
                <span>Showing {filteredStudents.length} of {attendanceStats.totalStudents} students for {new Date(selectedDate).toLocaleDateString()}</span>
                {(searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedGradeLevel(null);
                      setSelectedSection(null);
                      setAttendanceFilter('all');
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
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50/50 dark:bg-slate-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Student Information
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Section
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Attendance Status
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-slate-600 dark:text-slate-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {filteredStudents.map((student: Student) => {
                      const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
                      const attendanceRecord = schoolData.attendanceRecords.find((record: AttendanceRecord) => 
                        record.studentId === student.id
                      );
                      const todayStatus = attendanceRecord?.dailyStatus[selectedDate];
                      
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors duration-200">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                                {student.name}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                LRN: {student.lrn || 'Not set'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                            {section ? `Grade ${section.gradeLevel} - ${section.name}` : 'Unassigned'}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              {getAttendanceIcon(todayStatus)}
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getAttendanceColor(todayStatus)}`}>
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
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-800/30 transition-all duration-200 text-sm"
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
            </div>
          </>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && (
          <>
            {/* Month Selector */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <ChartBarIcon />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                      Monthly Attendance Summary
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300">
                      View attendance trends and statistics by month
                    </p>
                  </div>
                </div>
                
                <select
                  aria-label="Select month for summary"
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
            </div>

            {/* Monthly Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Monthly Attendance Rate */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Monthly Rate</p>
                    <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                      {monthlyAttendanceSummary.attendanceRate}%
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <ChartBarIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Present Days */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Present Days</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {monthlyAttendanceSummary.totalPresent.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <CheckCircleIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Absent Days */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Absent Days</p>
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                      {monthlyAttendanceSummary.totalAbsent.toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <XCircleIcon />
                    </div>
                  </div>
                </div>
              </div>

              {/* School Days */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">School Days</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {monthlyAttendanceSummary.totalSchoolDays}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center">
                    <div className="w-6 h-6 text-white">
                      <CalendarDaysIcon />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Level Breakdown */}
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-6 border border-white/20 shadow-lg">
              <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
                <div className="w-5 h-5 mr-2">
                  <ChartBarIcon />
                </div>
                Attendance by Grade Level - {monthlyAttendanceSummary.month} {monthlyAttendanceSummary.year}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {gradeLevels.map((gradeLevel: number) => {
                  const gradeData = monthlyAttendanceSummary.byGradeLevel[gradeLevel];
                  return (
                    <div key={gradeLevel} className="text-center p-4 bg-slate-50/50 dark:bg-slate-700/50 rounded-xl">
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                        {gradeData?.rate || 0}%
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-300">Grade {gradeLevel}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {gradeData?.present || 0} / {gradeData?.total || 0}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Summary/Reports View */}
        {viewMode === 'summary' && (
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

        {filteredStudents.length === 0 && viewMode === 'daily' && (
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-lg rounded-2xl p-12 border border-white/20 shadow-lg text-center">
            <div className="w-16 h-16 text-slate-400 dark:text-slate-500 mx-auto mb-4">
              <ClipboardDocumentListIcon />
            </div>
            <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">
              No students found
            </h3>
            <p className="text-slate-500 dark:text-slate-400">
              {searchQuery || selectedGradeLevel || selectedSection || attendanceFilter !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No students available for the selected date.'}
            </p>
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
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                {/* Header Content */}
                <div className="relative flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white">{selectedStudent.name}</h2>
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
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  );
};

export default SF2Dashboard;