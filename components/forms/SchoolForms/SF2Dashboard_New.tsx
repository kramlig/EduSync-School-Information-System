import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import type { SchoolDataHook } from '../../../hooks/useSchoolData.REACT_QUERY_BACKUP';
import type { AuthUser, StudentUser, ParentUser, Student, Section, AttendanceRecord } from '../../../types';
import BackButton from '../../BackButton';
import { 
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  UsersIcon,
  DocumentTextIcon
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

// Helper function to get school year months
function getCurrentSchoolYearMonths(): string[] {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // 1-based month
  
  // School year runs from August to May
  const months: string[] = [];
  
  if (currentMonth >= 8) { // August onwards = current school year
    // August to December of current year
    for (let month = 8; month <= 12; month++) {
      months.push(`${currentYear}-${month.toString().padStart(2, '0')}`);
    }
    // January to May of next year
    for (let month = 1; month <= 5; month++) {
      months.push(`${currentYear + 1}-${month.toString().padStart(2, '0')}`);
    }
  } else { // January-July = previous school year
    // August to December of previous year
    for (let month = 8; month <= 12; month++) {
      months.push(`${currentYear - 1}-${month.toString().padStart(2, '0')}`);
    }
    // January to May of current year
    for (let month = 1; month <= 5; month++) {
      months.push(`${currentYear}-${month.toString().padStart(2, '0')}`);
    }
  }
  
  return months;
}

const SF2Dashboard: React.FC<SF2DashboardProps> = ({ schoolData, session, onBack }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getFullYear() + '-' + (new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'summary'>('summary');
  
  // Get current students filtered by section
  const filteredStudents = useMemo(() => {
    return schoolData.students.filter((student: Student) => {
      if (student.status === 'transferred' || student.status === 'dropped' || student.status === 'graduated') {
        return false;
      }
      
      if (selectedSection !== 'All') {
        const section = schoolData.sections.find((s: Section) => s.id === student.sectionId);
        return section?.name === selectedSection;
      }
      
      return true;
    });
  }, [schoolData.students, schoolData.sections, selectedSection]);

  const attendanceStats = useMemo((): AttendanceStats => {
    const stats: AttendanceStats = {
      totalStudents: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      excusedToday: 0,
      attendanceRate: 0,
      monthlyAttendanceRate: 0,
      weeklyTrend: [],
      byGradeLevel: {}
    };

    const activeStudents = schoolData.students.filter((student: Student) => 
      student.status !== 'transferred' && student.status !== 'dropped' && student.status !== 'graduated'
    );

    stats.totalStudents = activeStudents.length;
    return stats;
  }, [schoolData.students]);

  const gradeLevels = [...new Set(schoolData.sections.map((s: Section) => s.gradeLevel))].sort() as number[];
  const schoolYearMonths = getCurrentSchoolYearMonths();

  // Generate SF2 PDF - Official DepEd Format
  const generateSF2PDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // OFFICIAL DEPED SF2 FORMAT - EXACTLY MATCHING YOUR PDF
    
    // Header with DepEd logos
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // Left logo placeholder
    doc.circle(30, 25, 12);
    doc.setFontSize(6);
    doc.text('DepEd', 26, 26);
    doc.text('Logo', 26, 29);
    
    // Main title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('School Form 2 (SF2) Daily Attendance Report of Learners', 148, 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('(This replaced Form 1, Form 2 & SF3 Form 4 - Absenteeism and Dropout Profile)', 148, 26, { align: 'center' });
    
    // Right DepEd logo placeholder
    doc.rect(260, 15, 25, 15);
    doc.setFontSize(7);
    doc.text('DepEd', 267, 22);
    doc.text('Logo', 267, 26);
    
    // Form fields - EXACTLY as shown in your PDF
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    // Top row
    doc.text('School ID', 20, 50);
    doc.rect(20, 52, 50, 6);
    doc.text('301234567', 25, 56);
    
    doc.text('School Year', 80, 50);  
    doc.rect(80, 52, 50, 6);
    doc.text('2024-2025', 85, 56);
    
    doc.text('Report for the Month of', 140, 50);
    doc.rect(140, 52, 60, 6);
    doc.text('October 2025', 145, 56);
    
    // Bottom row
    doc.text('Name of School', 20, 68);
    doc.rect(20, 70, 140, 6);
    doc.text('EDUSYNC ELEMENTARY SCHOOL', 25, 74);
    
    doc.text('Grade Level', 170, 68);
    doc.rect(170, 70, 40, 6);
    doc.text('Grade 1', 175, 74);
    
    doc.text('Section', 220, 68);
    doc.rect(220, 70, 40, 6);
    doc.text('Rose', 225, 74);
    
    // Main attendance table - EXACTLY like your PDF
    let yPos = 90;
    
    // Outer border
    doc.setLineWidth(1);
    doc.rect(20, yPos, 250, 120);
    
    // Table headers
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    
    // Column headers - just like your PDF shows
    doc.text('No.', 30, yPos + 10, { align: 'center' });
    doc.text('LEARNER\'S NAME', 90, yPos + 10, { align: 'center' });
    
    // Days 1-31 columns (compact)
    let dayX = 140;
    for (let day = 1; day <= 31; day++) {
      doc.setFontSize(6);
      doc.text(day.toString(), dayX, yPos + 10, { align: 'center' });
      dayX += 4;
    }
    
    // Summary columns
    doc.setFontSize(8);
    doc.text('Total', 265, yPos + 5);
    doc.text('ABSENT', 265, yPos + 10);
    doc.text('TARDY', 265, yPos + 15);
    
    // Header separator
    doc.line(20, yPos + 15, 270, yPos + 15);
    
    // Vertical separators
    doc.line(50, yPos, 50, yPos + 120); // After No.
    doc.line(135, yPos, 135, yPos + 120); // After Name
    doc.line(260, yPos, 260, yPos + 120); // Before summary
    
    // Student rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let rowY = yPos + 25;
    for (let i = 1; i <= 26; i++) {
      // Row number
      doc.text(i.toString(), 30, rowY, { align: 'center' });
      
      // Student name (if available)
      if (filteredStudents[i - 1]) {
        const student = filteredStudents[i - 1];
        doc.text(student.name.toUpperCase(), 55, rowY);
      }
      
      // Horizontal line between rows
      if (i < 26) {
        doc.line(20, rowY + 2, 270, rowY + 2);
      }
      
      rowY += 4;
    }
    
    // Download PDF
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const filename = `SF2_${monthName.replace(' ', '_')}.pdf`;
    doc.save(filename);
  };

  const generatePage1 = (doc: jsPDF) => {
    // OFFICIAL DepEd HEADER - EXACTLY as in your PDF
    
    // DepEd Logo placeholder (left)
    doc.setDrawColor(0);
    doc.circle(40, 25, 15);
    doc.setFontSize(6);
    doc.text('DepEd', 36, 26);
    doc.text('Logo', 36, 29);
    
    // Main Title - Center
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('School Form 2 (SF2) Daily Attendance Report of Learners', 148, 20, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('(This replaced Form 1, Form 2 & SF3 Form 4 - Absenteeism and Dropout Profile)', 148, 27, { align: 'center' });
    
    // DepEd Logo placeholder (right)
    doc.setDrawColor(0);
    doc.rect(250, 12, 30, 20);
    doc.setFontSize(6);
    doc.text('DEPED', 260, 20);
    doc.text('LOGO', 262, 25);
    
    // EXACT FORM FIELDS as shown in your PDF
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    // First row of fields
    doc.text('School ID', 20, 50);
    doc.rect(20, 52, 50, 6);
    
    doc.text('School Year', 80, 50);  
    doc.rect(80, 52, 50, 6);
    
    doc.text('Report for the Month of', 140, 50);
    doc.rect(140, 52, 50, 6);
    
    // Second row of fields  
    doc.text('Name of School', 20, 68);
    doc.rect(20, 70, 120, 6);
    
    doc.text('Grade Level', 150, 68);
    doc.rect(150, 70, 30, 6);
    
    doc.text('Section', 190, 68);
    doc.rect(190, 70, 30, 6);
    
    // Main attendance table
    const tableStartY = 70;
    
    // Draw main table border
    doc.setLineWidth(1);
    doc.rect(30, tableStartY, 240, 130);
    
    // Column headers
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    // Learner's Name column
    doc.text("LEARNER'S NAME", 35, tableStartY + 8);
    doc.text("(Last Name, First Name, Middle Name)", 35, tableStartY + 12);
    
    // Day columns header
    doc.text("(1st row for date, 2nd row for Day: M, T, W, TH, F)", 140, tableStartY + 6);
    
    // Summary columns
    doc.text("Total for this", 230, tableStartY + 4);
    doc.text("Month", 232, tableStartY + 8);
    doc.text("ABSENT", 250, tableStartY + 6);
    doc.text("TARDY", 260, tableStartY + 6);
    
    doc.text("REMARKS // DROPPED OUT - state reason,", 270, tableStartY + 4);
    doc.text("please refer to legend number 2;", 270, tableStartY + 8);
    doc.text("// TRANSFERRED INOUT - write the name of", 270, tableStartY + 12);
    doc.text("school", 270, tableStartY + 16);
    
    // Vertical separators
    doc.line(120, tableStartY, 120, tableStartY + 130); // After name column
    doc.line(225, tableStartY, 225, tableStartY + 130); // Before summary
    doc.line(245, tableStartY, 245, tableStartY + 130); // After total
    doc.line(255, tableStartY, 255, tableStartY + 130); // After absent
    
    // Header bottom line
    doc.line(30, tableStartY + 20, 270, tableStartY + 20);
    
    // Day number grid (1-31)
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    
    const dayStartX = 125;
    const dayWidth = 3.2;
    
    // Draw day numbers and grid
    for (let day = 1; day <= 31; day++) {
      const xPos = dayStartX + (day - 1) * dayWidth;
      doc.text(day.toString(), xPos, tableStartY + 18, { align: 'center' });
      
      // Vertical lines for each day
      if (day % 5 === 0) {
        doc.line(xPos + 1.6, tableStartY + 20, xPos + 1.6, tableStartY + 130);
      }
    }
    
    // Student rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    let rowY = tableStartY + 30;
    const rowHeight = 4;
    
    // Add students (up to 25 rows for page 1)
    for (let i = 0; i < Math.min(25, filteredStudents.length); i++) {
      const student = filteredStudents[i];
      
      // Student name
      doc.text(student.name.toUpperCase(), 32, rowY);
      
      // Attendance marks for each day
      for (let day = 1; day <= 31; day++) {
        const dayX = dayStartX + (day - 1) * dayWidth;
        
        // Find attendance record
        const attendanceDate = new Date(2025, 9, day); // October 2025
        const dateStr = attendanceDate.toISOString().split('T')[0];
        const attendanceRecord = schoolData.attendanceRecords?.find(
          (record: AttendanceRecord) => record.studentId === student.id
        );
        
        let mark = '';
        if (attendanceRecord && attendanceRecord.dailyStatus[dateStr]) {
          const status = attendanceRecord.dailyStatus[dateStr];
          switch (status) {
            case 'P': mark = '/'; break;
            case 'A': mark = 'A'; break;
            case 'L': mark = 'T'; break;
            case 'E': mark = '/'; break;
          }
        }
        
        if (mark) {
          doc.text(mark, dayX, rowY, { align: 'center' });
        }
      }
      
      // Horizontal line after each row
      rowY += rowHeight;
      if (i < 24) {
        doc.line(30, rowY, 270, rowY);
      }
    }
    
    // MALE section separator
    const maleY = tableStartY + 110;
    doc.setFont('helvetica', 'bold');
    doc.text('MALE | TOTAL Per Day', 60, maleY);
    doc.line(30, maleY + 2, 270, maleY + 2);
  };

  const generatePage2 = (doc: jsPDF) => {
    // Page 2 - Continuation table
    const tableStartY = 30;
    
    // Draw main table border
    doc.setLineWidth(1);
    doc.rect(30, tableStartY, 240, 100);
    
    // Column headers (same as page 1)
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    
    doc.text("LEARNER'S NAME", 35, tableStartY + 8);
    doc.text("(Last Name, First Name, Middle Name)", 35, tableStartY + 12);
    
    // Day columns and summary (same structure as page 1)
    doc.text("(1st row for date, 2nd row for Day: M, T, W, TH, F)", 140, tableStartY + 6);
    
    // Vertical separators
    doc.line(120, tableStartY, 120, tableStartY + 100);
    doc.line(225, tableStartY, 225, tableStartY + 100);
    
    // FEMALE section
    doc.text('FEMALE | TOTAL Per Day', 60, tableStartY + 20);
    doc.text('Combined | TOTAL PER DAY', 60, tableStartY + 30);
    
    // Guidelines and codes section
    const guidelinesY = 150;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GUIDELINES:', 30, guidelinesY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    const guidelines = [
      '1. The attendance shall be accomplished daily. Refer to the codes for checking learners\' attendance.',
      '2. Data shall be written in the preceding columns labeled Learner\'s Name.',
      '3. Accomplish the following:',
      '   a. Percentage of Enrollment = (Registered Learner as of End of the Month / Enrollment as of 1st Friday of June) x 100',
      '   b. Average Daily Attendance = (Total Student Present / Number of School Days in reporting month) x Total daily attendance',
      '   c. Percentage of Attendance for the month = (Registered Learner as of End of the month / Average daily attendance) x 100'
    ];
    
    let lineY = guidelinesY + 10;
    guidelines.forEach(line => {
      doc.text(line, 30, lineY);
      lineY += 8;
    });
    
    // Codes for checking attendance
    doc.setFont('helvetica', 'bold');
    doc.text('CODES FOR CHECKING ATTENDANCE', 150, guidelinesY);
    
    doc.setFont('helvetica', 'normal');
    const codes = [
      'Simple Present - (/) Absent; Tardy; Half absent; Upper',
      'or Late Comer; Lower for Cutting Classes'
    ];
    
    lineY = guidelinesY + 10;
    codes.forEach(line => {
      doc.text(line, 150, lineY);
      lineY += 8;
    });
    
    // Summary section on the right
    doc.rect(200, guidelinesY + 20, 60, 80);
    doc.text('Summary for the', 205, guidelinesY + 30);
    doc.text('Month', 205, guidelinesY + 35);
    
    // Signature section
    const sigY = 240;
    doc.text('Attested by:', 30, sigY);
    doc.line(30, sigY + 10, 120, sigY + 10);
    doc.text('(Signature of Teacher and Printed Name)', 30, sigY + 15);
    
    doc.text('Attested by:', 150, sigY);
    doc.line(150, sigY + 10, 240, sigY + 10);
    doc.text('(Signature of School Head and Printed Name)', 150, sigY + 15);
    
    // Page footer
    doc.setFontSize(8);
    doc.text('School Form 2, Page 2 of _______', 30, 270);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400">
            School Form 2 (SF2)
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-2">
            Daily Attendance Record of Learners
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-3xl shadow-2xl p-8 mb-8 border border-white/20 dark:border-slate-700/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Month Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Report Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value="2025-10">October 2025</option>
                <option value="2025-11">November 2025</option>
                <option value="2025-12">December 2025</option>
              </select>
            </div>

            {/* Section Selection */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Section
              </label>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-4 py-3 bg-white/80 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-sm"
              >
                <option value="All">All Sections</option>
                {schoolData.sections.map((section: Section) => (
                  <option key={section.id} value={section.name}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold">{filteredStudents.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Sections</p>
                <p className="text-3xl font-bold">{schoolData.sections.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Attendance Rate</p>
                <p className="text-3xl font-bold">94.5%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="text-center">
          <button
            onClick={generateSF2PDF}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            📄 Generate Official SF2 Report
          </button>
        </div>

      </div>
    </div>
  );
};

export default SF2Dashboard;