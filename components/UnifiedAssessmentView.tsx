import React, { useState, useMemo } from 'react';
import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import type { AuthUser, StudentUser, ParentUser, CoreValueMarking } from '../types';
import { SchoolDataHook } from '../hooks/useSchoolData';
import GradesView from './GradesView';
import GradebookView from './GradebookView';
import CoreValuesGradebookView from './CoreValuesGradebookView';
import GradeDistributionChart from './GradeDistributionChart';
import BehaviorDistributionChart from './BehaviorDistributionChart';
import CorrelationScatterPlot from './CorrelationScatterPlot';
import PrintableReport from './PrintableReport';

// Helper: Convert gradeLevel string to numeric value (for filtering)
const normalizeGradeLevel = (gradeLevel: string | number): number | null => {
  if (typeof gradeLevel === 'number') return gradeLevel;
  if (gradeLevel === 'Kindergarten') return 0;
  const match = gradeLevel.match(/Grade (\d+)/);
  return match ? parseInt(match[1], 10) : null;
};

interface UnifiedAssessmentViewProps {
  schoolData: SchoolDataHook;
  session: { user: AuthUser | StudentUser | ParentUser, type: 'staff' | 'student' | 'parent' };
  forceStudentId?: string;
}

type TabType = 'overview' | 'academic-gradebook' | 'core-values-gradebook' | 'deep-analytics';
type FilterType = 'all' | 'honor' | 'needs-improvement' | 'incomplete';

const UnifiedAssessmentView: React.FC<UnifiedAssessmentViewProps> = ({ schoolData, session, forceStudentId }) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [currentPrintStudents, setCurrentPrintStudents] = useState<string[]>([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Unified Filter State (shared across ALL tabs)
  const [selectedSectionId, setSelectedSectionId] = useState<string>('all');
  const [performanceFilter, setPerformanceFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');
  
  const { students = [], grades = [], learningAreas = [], coreValues = [], coreValueGrades = [], sections = [] } = schoolData;
  
  const isStudentView = session.type === 'student';
  const isParentView = session.type === 'parent';
  const isTeacherView = session.type === 'staff' && (session.user as AuthUser).role === 'teacher';

  // Get teacher's assignments if they are a teacher
  const teacherAssignments = isTeacherView ? (session.user as AuthUser).assignments || [] : [];
  const teacherGradeLevels = teacherAssignments.map(a => a.gradeLevel);
  const teacherLearningAreaIds = teacherAssignments.map(a => a.learningAreaId);

  // Filter sections based on teacher's grade level assignments
  const availableSections = isTeacherView
    ? sections.filter(s => teacherGradeLevels.includes(s.gradeLevel))
    : sections;

  // Filter learning areas based on teacher's assignments
  const availableLearningAreas = isTeacherView
    ? learningAreas.filter(la => teacherLearningAreaIds.includes(la.id))
    : learningAreas;

  // Base students based on user type
  const baseStudents = isStudentView 
    ? students.filter(s => s.id === session.user.id)
    : isParentView 
    ? students.filter(s => s.id === forceStudentId)
    : isTeacherView
    ? students.filter(s => {
        // Teachers can only see students in sections they teach (matching grade levels)
        const studentSection = sections.find(sec => sec.id === s.sectionId);
        return studentSection && teacherGradeLevels.includes(studentSection.gradeLevel);
      })
    : students;

  // Apply filters to students
  const visibleStudents = React.useMemo(() => {
    let filtered = [...baseStudents];

    // Filter by section
    if (selectedSectionId !== 'all') {
      filtered = filtered.filter(s => s.sectionId === selectedSectionId);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(s => 
        s.firstName?.toLowerCase().includes(query) ||
        s.lastName?.toLowerCase().includes(query) ||
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query)
      );
    }

    // Filter by performance
    if (performanceFilter !== 'all') {
      filtered = filtered.filter(student => {
        const studentGrades = grades.filter(g => g.studentId === student.id);
        const finalGrades = studentGrades
          .map(g => g.finalGrade)
          .filter((g): g is number => typeof g === 'number');
        
        if (performanceFilter === 'honor') {
          const average = finalGrades.length > 0
            ? finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length
            : 0;
          return average >= 90;
        }
        
        if (performanceFilter === 'needs-improvement') {
          const average = finalGrades.length > 0
            ? finalGrades.reduce((sum, g) => sum + g, 0) / finalGrades.length
            : 0;
          return average > 0 && average < 75;
        }
        
        if (performanceFilter === 'incomplete') {
          const expectedGrades = (learningAreas?.length || 0) * 4; // 4 quarters
          return finalGrades.length < expectedGrades;
        }
        
        return true;
      });
    }

    return filtered;
  }, [baseStudents, selectedSectionId, searchQuery, performanceFilter, grades, availableLearningAreas]);

  // Report Cards handlers
  const handleToggleStudent = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    setSelectedStudents(visibleStudents.map(s => s.id));
  };

  const handleDeselectAll = () => {
    setSelectedStudents([]);
  };

  const handleBulkPrint = (studentIds: string[]) => {
    if (studentIds.length > 0) {
      setCurrentPrintStudents(studentIds);
      setShowPrintModal(true);
    }
  };

  const handlePrintSelected = () => {
    if (selectedStudents.length > 0) {
      handleBulkPrint(selectedStudents);
    }
  };

  const handlePrintSingleStudent = (studentId: string) => {
    setCurrentPrintStudents([studentId]);
    setShowPrintModal(true);
  };

  // PDF Export Handler with Chart Images
  const handleExportPDF = async () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const sectionName = selectedSectionId === 'all' ? 'All-Sections' : sections.find(s => s.id === selectedSectionId)?.name || 'Unknown';
    
    // Show loading state
    console.log('📄 Generating PDF with charts...');
    
    const doc = new jsPDF();
    let yPos = 20;
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229); // Purple
    doc.text('Deep Analytics Report', 20, yPos);
    
    // Metadata
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPos);
    doc.text(`Section: ${sectionName}`, 120, yPos);
    
    // Academic Performance Section
    yPos += 15;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Academic Performance', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    const academicData = [
      ['Total Students', analytics.academic.totalStudents.toString()],
      ['Average Grade', `${analytics.academic.avgGrade}%`],
      ['Honor Roll', `${analytics.academic.honorRoll} (${analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.honorRoll / analytics.academic.totalStudents) * 100) : 0}%)`],
      ['Passing', `${analytics.academic.passing}`],
      ['Failing', `${analytics.academic.failing}`],
      ['Completion Rate', `${analytics.academic.avgCompletion}%`]
    ];
    
    academicData.forEach(([label, value]) => {
      doc.text(`${label}:`, 25, yPos);
      doc.text(value, 100, yPos);
      yPos += 6;
    });
    
    // Behavioral Performance Section
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Behavioral Performance', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    const behavioralData = [
      ['Exemplary Behavior', `${analytics.behavioral.exemplary} (${analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.exemplary / analytics.academic.totalStudents) * 100) : 0}%)`],
      ['Good Standing', `${analytics.behavioral.goodStanding} (${analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.goodStanding / analytics.academic.totalStudents) * 100) : 0}%)`],
      ['Needs Support', `${analytics.behavioral.behaviorSupport} (${analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.behaviorSupport / analytics.academic.totalStudents) * 100) : 0}%)`]
    ];
    
    behavioralData.forEach(([label, value]) => {
      doc.text(`${label}:`, 25, yPos);
      doc.text(value, 100, yPos);
      yPos += 6;
    });
    
    // Risk Assessment Section
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Risk Assessment', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(10);
    doc.text(`Critical Risk: ${deepAnalytics.riskAssessment.criticalRisk}`, 25, yPos);
    yPos += 6;
    doc.text(`High Risk: ${deepAnalytics.riskAssessment.highRisk}`, 25, yPos);
    yPos += 6;
    doc.text(`Moderate Risk: ${deepAnalytics.riskAssessment.moderateRisk}`, 25, yPos);
    yPos += 6;
    doc.text(`Declining Students: ${deepAnalytics.riskAssessment.decliningStudents}`, 25, yPos);
    
    // Top At-Risk Students
    if (deepAnalytics.riskAssessment.atRiskStudents.length > 0) {
      yPos += 10;
      doc.setFontSize(12);
      doc.text('At-Risk Students (Top 5)', 20, yPos);
      
      yPos += 8;
      doc.setFontSize(9);
      doc.text('Name', 25, yPos);
      doc.text('Recent Avg', 100, yPos);
      doc.text('Risk Level', 140, yPos);
      yPos += 5;
      
      deepAnalytics.riskAssessment.atRiskStudents.slice(0, 5).forEach(student => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(student.student.name.substring(0, 30), 25, yPos);
        doc.text(`${student.recentAvg}%`, 100, yPos);
        doc.text(student.riskLevel.toUpperCase(), 140, yPos);
        yPos += 6;
      });
    }
    
    // Subject Performance
    if (yPos > 200) {
      doc.addPage();
      yPos = 20;
    }
    
    yPos += 10;
    doc.setFontSize(14);
    doc.text('Subject Performance', 20, yPos);
    
    yPos += 8;
    doc.setFontSize(9);
    doc.text('Subject', 25, yPos);
    doc.text('Average', 100, yPos);
    doc.text('Difficulty', 140, yPos);
    yPos += 5;
    
    deepAnalytics.subjectPerformance.slice(0, 10).forEach(subject => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(subject.subject.substring(0, 30), 25, yPos);
      doc.text(`${subject.average}%`, 100, yPos);
      doc.text(subject.difficulty.toUpperCase(), 140, yPos);
      yPos += 6;
    });
    
    // Capture and Add Charts
    try {
      // Add new page for charts
      doc.addPage();
      yPos = 20;
      
      doc.setFontSize(16);
      doc.setTextColor(79, 70, 229);
      doc.text('Visual Analytics', 20, yPos);
      yPos += 15;
      
      // Capture Grade Distribution Chart
      const gradeChartElement = document.getElementById('grade-distribution-chart');
      if (gradeChartElement) {
        console.log('📊 Capturing Grade Distribution Chart...');
        const gradeCanvas = await html2canvas(gradeChartElement, {
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: gradeChartElement.scrollWidth,
          windowHeight: gradeChartElement.scrollHeight
        } as any);
        
        const gradeImgData = gradeCanvas.toDataURL('image/png');
        const imgWidth = 85; // Half page width
        const imgHeight = (gradeCanvas.height * imgWidth) / gradeCanvas.width;
        
        doc.addImage(gradeImgData, 'PNG', 15, yPos, imgWidth, imgHeight);
      }
      
      // Capture Behavior Distribution Chart
      const behaviorChartElement = document.getElementById('behavior-distribution-chart');
      if (behaviorChartElement) {
        console.log('📊 Capturing Behavior Distribution Chart...');
        const behaviorCanvas = await html2canvas(behaviorChartElement, {
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: behaviorChartElement.scrollWidth,
          windowHeight: behaviorChartElement.scrollHeight
        } as any);
        
        const behaviorImgData = behaviorCanvas.toDataURL('image/png');
        const imgWidth = 85;
        const imgHeight = (behaviorCanvas.height * imgWidth) / behaviorCanvas.width;
        
        // Place next to the first chart
        doc.addImage(behaviorImgData, 'PNG', 105, yPos, imgWidth, imgHeight);
      }
      
      // Calculate yPos after charts
      const maxChartHeight = 80; // Approximate height
      yPos += maxChartHeight + 15;
      
      // Check if we need a new page for correlation chart
      if (yPos > 200) {
        doc.addPage();
        yPos = 20;
      }
      
      // Capture Correlation Scatter Plot
      const correlationChartElement = document.getElementById('correlation-scatter-plot');
      if (correlationChartElement) {
        console.log('📊 Capturing Correlation Scatter Plot...');
        const correlationCanvas = await html2canvas(correlationChartElement, {
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: correlationChartElement.scrollWidth,
          windowHeight: correlationChartElement.scrollHeight
        } as any);
        
        const correlationImgData = correlationCanvas.toDataURL('image/png');
        const imgWidth = 170; // Full width
        const imgHeight = (correlationCanvas.height * imgWidth) / correlationCanvas.width;
        
        // Center the chart
        doc.addImage(correlationImgData, 'PNG', 20, yPos, imgWidth, imgHeight);
      }
      
      console.log('✅ Charts captured successfully');
    } catch (error) {
      console.warn('⚠️ Could not capture charts:', error);
      // Continue with PDF generation even if charts fail
    }
    
    // Footer (update page count after adding chart pages)
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 95, 285);
      doc.text('EduSync School Information System', 20, 285);
    }
    
    // Save
    doc.save(`Deep-Analytics-Report_${sectionName}_${timestamp}.pdf`);
    console.log(`✅ Successfully exported PDF with charts: Deep-Analytics-Report_${sectionName}_${timestamp}.pdf`);
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const sectionName = selectedSectionId === 'all' ? 'All-Sections' : sections.find(s => s.id === selectedSectionId)?.name || 'Unknown';
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Summary Dashboard
    const summaryData = [
      ['Deep Analytics Report'],
      ['Generated', new Date().toLocaleDateString()],
      ['Section', sectionName],
      [''],
      ['Academic Performance'],
      ['Metric', 'Value', 'Percentage'],
      ['Total Students', analytics.academic.totalStudents, ''],
      ['Average Grade', analytics.academic.avgGrade + '%', ''],
      ['Honor Roll (≥90%)', analytics.academic.honorRoll, analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.honorRoll / analytics.academic.totalStudents) * 100) + '%' : '0%'],
      ['Passing (≥75%)', analytics.academic.passing, analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.passing / analytics.academic.totalStudents) * 100) + '%' : '0%'],
      ['Failing (<75%)', analytics.academic.failing, analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.failing / analytics.academic.totalStudents) * 100) + '%' : '0%'],
      ['Completion Rate', analytics.academic.avgCompletion + '%', ''],
      [''],
      ['Behavioral Performance'],
      ['Metric', 'Value', 'Percentage'],
      ['Exemplary Behavior', analytics.behavioral.exemplary, analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.exemplary / analytics.academic.totalStudents) * 100) + '%' : '0%'],
      ['Good Standing', analytics.behavioral.goodStanding, analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.goodStanding / analytics.academic.totalStudents) * 100) + '%' : '0%'],
      ['Needs Support', analytics.behavioral.behaviorSupport, analytics.academic.totalStudents > 0 ? Math.round((analytics.behavioral.behaviorSupport / analytics.academic.totalStudents) * 100) + '%' : '0%']
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');
    
    // Sheet 2: Risk Assessment
    const riskData = [
      ['At-Risk Students'],
      ['Student Name', 'LRN', 'Recent Average', 'Overall Average', 'Risk Level', 'Declining', 'Needs Intervention'],
      ...deepAnalytics.riskAssessment.atRiskStudents.map(student => [
        student.student.name,
        student.student.lrn || 'N/A',
        student.recentAvg + '%',
        student.overallAvg + '%',
        student.riskLevel.toUpperCase(),
        student.isDeclining ? 'Yes' : 'No',
        student.needsIntervention ? 'Yes' : 'No'
      ])
    ];
    const wsRisk = XLSX.utils.aoa_to_sheet(riskData);
    XLSX.utils.book_append_sheet(wb, wsRisk, 'Risk Assessment');
    
    // Sheet 3: Subject Performance
    const subjectData = [
      ['Subject Performance'],
      ['Subject', 'Average Grade', 'Passing Students', 'Failing Students', 'Total Students', 'Difficulty Level'],
      ...deepAnalytics.subjectPerformance.map(subject => [
        subject.subject,
        subject.average + '%',
        subject.passing,
        subject.failing,
        subject.total,
        subject.difficulty.toUpperCase()
      ])
    ];
    const wsSubjects = XLSX.utils.aoa_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, wsSubjects, 'Subject Performance');
    
    // Sheet 4: Improvement Tracking
    const improvementData = [
      ['Student Improvement Tracking'],
      ['Student Name', 'LRN', 'Q1 Average', 'Q4 Average', 'Improvement', 'Improvement %', 'Category', 'Status'],
      ...deepAnalytics.improvementTracking.topImprovers.map(item => [
        item.student.name,
        item.student.lrn || 'N/A',
        item.q1Avg + '%',
        item.q4Avg + '%',
        (item.improvement > 0 ? '+' : '') + item.improvement + '%',
        (item.improvementPercent > 0 ? '+' : '') + item.improvementPercent + '%',
        item.category.toUpperCase(),
        item.category === 'significant' ? 'Improving' : item.category === 'stable' ? 'Stable' : 'Declining'
      ])
    ];
    const wsImprovement = XLSX.utils.aoa_to_sheet(improvementData);
    XLSX.utils.book_append_sheet(wb, wsImprovement, 'Improvement Tracking');
    
    // Sheet 5: Correlation Insights
    const correlationData = [
      ['Correlation Insights'],
      ['Category', 'Count', 'Description'],
      ['High Achievers', analytics.correlation.highAchievers, 'Excellent grades + exemplary behavior'],
      ['At-Risk Students', analytics.correlation.atRisk, 'Low grades + behavioral concerns'],
      ['Academic Support', analytics.correlation.academicStrugglesGoodBehavior, 'Good behavior but struggling grades'],
      ['Behavior Support', analytics.correlation.goodGradesBehaviorConcerns, 'Good grades but behavioral issues'],
      [''],
      ['Correlation Strength', analytics.correlation.correlationStrength, '']
    ];
    const wsCorrelation = XLSX.utils.aoa_to_sheet(correlationData);
    XLSX.utils.book_append_sheet(wb, wsCorrelation, 'Correlations');
    
    // Save workbook
    XLSX.writeFile(wb, `Deep-Analytics-Complete_${sectionName}_${timestamp}.xlsx`);
    console.log(`✅ Successfully exported Excel: Deep-Analytics-Complete_${sectionName}_${timestamp}.xlsx`);
  };

  // CSV Export Handler for Deep Analytics
  const handleExportDeepAnalytics = (exportType: 'overview' | 'risk-assessment' | 'subject-performance' | 'improvement-tracking' | 'all') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const sectionName = selectedSectionId === 'all' ? 'All-Sections' : sections.find(s => s.id === selectedSectionId)?.name || 'Unknown';
    
    if (exportType === 'overview' || exportType === 'all') {
      // Export Overview Summary
      const overviewData = [
        {
          'Report Type': 'Deep Analytics Overview',
          'Generated Date': new Date().toLocaleDateString(),
          'Section': sectionName,
          'Total Students': analytics.academic.totalStudents,
          'Average Grade': `${analytics.academic.avgGrade}%`,
          'Honor Roll': analytics.academic.honorRoll,
          'Passing': analytics.academic.passing,
          'Failing': analytics.academic.failing,
          'Avg Completion': `${analytics.academic.avgCompletion}%`,
          'Exemplary Behavior': analytics.behavioral.exemplary,
          'Good Standing': analytics.behavioral.goodStanding,
          'Needs Support': analytics.behavioral.behaviorSupport
        }
      ];
      
      const csv = Papa.unparse(overviewData);
      downloadCSV(csv, `Deep-Analytics-Overview_${sectionName}_${timestamp}.csv`);
    }
    
    if (exportType === 'risk-assessment' || exportType === 'all') {
      // Export At-Risk Students
      const riskData = deepAnalytics.riskAssessment.atRiskStudents.map(student => ({
        'Student Name': student.student.name,
        'LRN': student.student.lrn || 'N/A',
        'Recent Average': `${student.recentAvg}%`,
        'Overall Average': `${student.overallAvg}%`,
        'Risk Level': student.riskLevel.toUpperCase(),
        'Declining': student.isDeclining ? 'Yes' : 'No',
        'Needs Intervention': student.needsIntervention ? 'Yes' : 'No'
      }));
      
      const csv = Papa.unparse(riskData);
      downloadCSV(csv, `Risk-Assessment_${sectionName}_${timestamp}.csv`);
    }
    
    if (exportType === 'subject-performance' || exportType === 'all') {
      // Export Subject Performance
      const subjectData = deepAnalytics.subjectPerformance.map(subject => ({
        'Subject': subject.subject,
        'Average Grade': `${subject.average}%`,
        'Passing Students': subject.passing,
        'Failing Students': subject.failing,
        'Total Students': subject.total,
        'Difficulty Level': subject.difficulty.toUpperCase()
      }));
      
      const csv = Papa.unparse(subjectData);
      downloadCSV(csv, `Subject-Performance_${sectionName}_${timestamp}.csv`);
    }
    
    if (exportType === 'improvement-tracking' || exportType === 'all') {
      // Export Student Improvement Tracking
      const improvementData = deepAnalytics.improvementTracking.topImprovers.map(item => ({
        'Student Name': item.student.name,
        'LRN': item.student.lrn || 'N/A',
        'Q1 Average': `${item.q1Avg}%`,
        'Q4 Average': `${item.q4Avg}%`,
        'Improvement': `${item.improvement > 0 ? '+' : ''}${item.improvement}%`,
        'Improvement Percent': `${item.improvementPercent > 0 ? '+' : ''}${item.improvementPercent}%`,
        'Category': item.category.toUpperCase(),
        'Status': item.category === 'significant' ? 'Improving' : item.category === 'stable' ? 'Stable' : 'Declining'
      }));
      
      const csv = Papa.unparse(improvementData);
      downloadCSV(csv, `Improvement-Tracking_${sectionName}_${timestamp}.csv`);
    }
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success feedback
    console.log(`✅ Successfully exported: ${filename}`);
  };

  // Calculate analytics for Overview tab (uses lifted filter state)
  const analytics = useMemo(() => {
    let visibleStudents = isStudentView 
      ? students.filter(s => s.id === session.user.id)
      : isParentView 
      ? students.filter(s => s.id === forceStudentId)
      : isTeacherView
      ? students.filter(s => {
          // Teachers can only see students in sections they teach (matching grade levels)
          const studentSection = sections.find(sec => sec.id === s.sectionId);
          return studentSection && teacherGradeLevels.includes(studentSection.gradeLevel);
        })
      : students;

    // Apply section filter (from lifted state)
    if (selectedSectionId !== 'all') {
      visibleStudents = visibleStudents.filter(s => s.sectionId === selectedSectionId);
    }

    // Apply search filter (from lifted state)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      visibleStudents = visibleStudents.filter(student => {
        const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
        const email = student.email || '';
        return name.toLowerCase().includes(query) ||
               email.toLowerCase().includes(query) ||
               student.lrn?.toLowerCase().includes(query);
      });
    }

    // Academic Performance Metrics
    const studentsWithGrades = visibleStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      
      // Calculate average - prefer finalGrade, fallback to computing from quarters
      const averagesForCalculation = studentGrades
        .map(g => {
          // If finalGrade exists, use it
          if (typeof g.finalGrade === 'number' && g.finalGrade > 0) {
            return g.finalGrade;
          }
          // Otherwise compute from quarterly grades
          const quarters = [g.q1, g.q2, g.q3, g.q4].filter(
            (q): q is number => typeof q === 'number' && q > 0
          );
          if (quarters.length > 0) {
            return Math.round(quarters.reduce((sum, q) => sum + q, 0) / quarters.length);
          }
          return null;
        })
        .filter((avg): avg is number => avg !== null);
      
      const average = averagesForCalculation.length > 0
        ? Math.round(averagesForCalculation.reduce((sum, g) => sum + g, 0) / averagesForCalculation.length)
        : 0;
      
      // Get student's grade level to calculate completion accurately
      const studentSection = sections?.find(s => s.id === student.sectionId);
      const studentGradeLevel = studentSection?.gradeLevel;
      const numericGradeLevel = studentGradeLevel ? normalizeGradeLevel(studentGradeLevel) : null;
      
      // Filter learning areas by student's grade level (and teacher's assignments if applicable)
      const applicableLearningAreas = availableLearningAreas?.filter(la => {
        if (!studentGradeLevel || !la.gradeLevel || !Array.isArray(la.gradeLevel)) {
          return true; // Fallback: include all if grade level data is missing
        }
        return numericGradeLevel !== null && la.gradeLevel.includes(numericGradeLevel);
      }) || [];
      
      const totalPossibleGrades = applicableLearningAreas.length * 4;
      const completedGrades = studentGrades.reduce((sum, g) => {
        return sum + ['q1', 'q2', 'q3', 'q4'].filter(q => g[q as keyof typeof g] !== undefined).length;
      }, 0);
      // Cap completion at 100% (shouldn't exceed total possible)
      const completion = totalPossibleGrades > 0 
        ? Math.min(100, Math.round((completedGrades / totalPossibleGrades) * 100))
        : 0;

      return { student, average, completion, hasGrades: averagesForCalculation.length > 0 };
    });

    // Calculate metrics ALWAYS from the base filtered set (section + search)
    // These counts should show ALL students in the current view, not affected by performance filter
    const totalStudents = visibleStudents.length;
    const honorRoll = studentsWithGrades.filter(s => s.average >= 90).length;
    const passing = studentsWithGrades.filter(s => s.average >= 75 && s.average > 0).length;
    const failing = studentsWithGrades.filter(s => s.average < 75 && s.average > 0).length;
    const avgGrade = studentsWithGrades.filter(s => s.hasGrades).length > 0
      ? Math.round(studentsWithGrades.filter(s => s.hasGrades).reduce((sum, s) => sum + s.average, 0) / studentsWithGrades.filter(s => s.hasGrades).length)
      : 0;
    const avgCompletion = visibleStudents.length > 0
      ? Math.round(studentsWithGrades.reduce((sum, s) => sum + s.completion, 0) / visibleStudents.length)
      : 0;

    // Core Values Performance Metrics
    const studentsWithValues = visibleStudents.map(student => {
      const studentCoreValues = coreValueGrades.filter(g => g.studentId === student.id);
      
      let totalMarkings = 0;
      let aoCount = 0;
      let soCount = 0;
      let roCount = 0;
      let noCount = 0;
      let hasAnyMarking = false;

      studentCoreValues.forEach(cvGrade => {
        const coreValue = coreValues.find(cv => cv.id === cvGrade.coreValueId);
        if (!coreValue || !coreValue.behaviors) return;

        (['q1', 'q2', 'q3', 'q4'] as const).forEach(quarter => {
          const quarterData = cvGrade[quarter];
          if (quarterData) {
            coreValue.behaviors.forEach(behavior => {
              const marking = quarterData[behavior] as CoreValueMarking | undefined;
              if (marking) {
                hasAnyMarking = true;
                totalMarkings++;
                if (marking === 'AO') aoCount++;
                else if (marking === 'SO') soCount++;
                else if (marking === 'RO') roCount++;
                else if (marking === 'NO') noCount++;
              }
            });
          }
        });
      });

      const totalPossibleMarkings = coreValues.reduce((sum, cv) => sum + (cv.behaviors?.length || 0), 0) * 4;
      const valueCompletion = totalPossibleMarkings > 0
        ? Math.round((totalMarkings / totalPossibleMarkings) * 100)
        : 0;

      const isExemplary = hasAnyMarking && noCount === 0 && roCount === 0 && aoCount > soCount;
      const isGood = hasAnyMarking && noCount === 0 && (roCount <= 1 || (aoCount + soCount) > roCount);
      const needsSupport = noCount > 0 || roCount > 2;

      return { 
        student, 
        hasAnyMarking, 
        isExemplary, 
        isGood, 
        needsSupport,
        valueCompletion,
        aoCount,
        soCount,
        roCount,
        noCount
      };
    });

    const exemplary = studentsWithValues.filter(s => s.isExemplary).length;
    const goodStanding = studentsWithValues.filter(s => s.isGood && !s.isExemplary).length;
    const behaviorSupport = studentsWithValues.filter(s => s.needsSupport).length;
    const avgValueCompletion = totalStudents > 0
      ? Math.round(studentsWithValues.reduce((sum, s) => sum + s.valueCompletion, 0) / totalStudents)
      : 0;

    // Correlation Insights
    const studentsWithBoth = studentsWithGrades.map(sg => {
      const sv = studentsWithValues.find(v => v.student.id === sg.student.id);
      return { ...sg, ...sv };
    }).filter(s => s.hasGrades && s.hasAnyMarking);

    const highAchievers = studentsWithBoth.filter(s => s.average >= 90 && s.isExemplary).length;
    const atRisk = studentsWithBoth.filter(s => s.average < 75 && s.needsSupport).length;
    const academicStrugglesGoodBehavior = studentsWithBoth.filter(s => s.average < 75 && (s.isExemplary || s.isGood)).length;
    const goodGradesBehaviorConcerns = studentsWithBoth.filter(s => s.average >= 85 && s.needsSupport).length;

    // Calculate correlation coefficient (simplified)
    const correlationStrength = studentsWithBoth.length > 5 ? 'Strong' : studentsWithBoth.length > 0 ? 'Moderate' : 'Insufficient data';

    return {
      academic: {
        totalStudents,
        honorRoll,
        passing,
        failing,
        avgGrade,
        avgCompletion
      },
      behavioral: {
        exemplary,
        goodStanding,
        behaviorSupport,
        avgValueCompletion
      },
      correlation: {
        highAchievers,
        atRisk,
        academicStrugglesGoodBehavior,
        goodGradesBehaviorConcerns,
        correlationStrength,
        studentsWithBoth
      }
    };
  }, [students, grades, availableLearningAreas, coreValues, coreValueGrades, session, forceStudentId, isStudentView, isParentView, selectedSectionId, performanceFilter, searchQuery]);

  // Tier 3: Deep Analytics Calculations (now uses unified filters)
  const deepAnalytics = useMemo(() => {
    let visibleStudents = isStudentView 
      ? students.filter(s => s.id === session.user.id)
      : isParentView 
      ? students.filter(s => s.id === forceStudentId)
      : isTeacherView
      ? students.filter(s => {
          // Teachers can only see students in sections they teach (matching grade levels)
          const studentSection = sections.find(sec => sec.id === s.sectionId);
          return studentSection && teacherGradeLevels.includes(studentSection.gradeLevel);
        })
      : students;

    // Use unified section filter
    if (selectedSectionId !== 'all') {
      visibleStudents = visibleStudents.filter(s => s.sectionId === selectedSectionId);
    }

    // Use unified search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      visibleStudents = visibleStudents.filter(s => 
        s.firstName?.toLowerCase().includes(query) ||
        s.lastName?.toLowerCase().includes(query) ||
        s.name?.toLowerCase().includes(query) ||
        s.email?.toLowerCase().includes(query) ||
        s.lrn?.toLowerCase().includes(query)
      );
    }

    // Quarterly Trend Analysis
    const quarterlyTrends = ['q1', 'q2', 'q3', 'q4'].map(quarter => {
      const quarterKey = quarter as 'q1' | 'q2' | 'q3' | 'q4';
      const quarterGrades = visibleStudents.map(student => {
        const studentGrades = grades.filter(g => g.studentId === student.id);
        const quarterGradesOnly = studentGrades
          .map(g => g[quarterKey])
          .filter((g): g is number => typeof g === 'number');
        
        return quarterGradesOnly.length > 0
          ? Math.round(quarterGradesOnly.reduce((sum, g) => sum + g, 0) / quarterGradesOnly.length)
          : 0;
      }).filter(avg => avg > 0);

      const average = quarterGrades.length > 0
        ? Math.round(quarterGrades.reduce((sum, g) => sum + g, 0) / quarterGrades.length)
        : 0;

      const passing = quarterGrades.filter(g => g >= 75).length;
      const failing = quarterGrades.filter(g => g < 75).length;

      return {
        quarter,
        average,
        passing,
        failing,
        total: quarterGrades.length
      };
    });

    // Calculate quarter-over-quarter growth
    const growthRates = quarterlyTrends.slice(1).map((current, index) => {
      const previous = quarterlyTrends[index];
      const growth = previous.average > 0 
        ? Math.round(((current.average - previous.average) / previous.average) * 100)
        : 0;
      return {
        from: previous.quarter,
        to: current.quarter,
        growth,
        direction: growth > 0 ? 'up' : growth < 0 ? 'down' : 'stable'
      };
    });

    // Risk Assessment - Students at risk of failing
    const atRiskStudents = visibleStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const recentGrades = [
        studentGrades.map(g => g.q3).filter((g): g is number => typeof g === 'number'),
        studentGrades.map(g => g.q4).filter((g): g is number => typeof g === 'number')
      ].flat();

      const recentAvg = recentGrades.length > 0
        ? Math.round(recentGrades.reduce((sum, g) => sum + g, 0) / recentGrades.length)
        : 0;

      const allGrades = ['q1', 'q2', 'q3', 'q4'].flatMap(q => {
        const qKey = q as 'q1' | 'q2' | 'q3' | 'q4';
        return studentGrades.map(g => g[qKey]).filter((g): g is number => typeof g === 'number');
      });

      const overallAvg = allGrades.length > 0
        ? Math.round(allGrades.reduce((sum, g) => sum + g, 0) / allGrades.length)
        : 0;

      // Declining trend detection
      const q1Avg = studentGrades.map(g => g.q1).filter((g): g is number => typeof g === 'number');
      const q4Avg = studentGrades.map(g => g.q4).filter((g): g is number => typeof g === 'number');
      const q1Average = q1Avg.length > 0 ? q1Avg.reduce((sum, g) => sum + g, 0) / q1Avg.length : 0;
      const q4Average = q4Avg.length > 0 ? q4Avg.reduce((sum, g) => sum + g, 0) / q4Avg.length : 0;
      const isDeclining = q1Average > 0 && q4Average > 0 && q4Average < q1Average - 5;

      const riskLevel = recentAvg < 70 ? 'critical' : recentAvg < 75 ? 'high' : isDeclining ? 'moderate' : 'low';

      return {
        student,
        recentAvg,
        overallAvg,
        riskLevel,
        isDeclining,
        needsIntervention: riskLevel === 'critical' || riskLevel === 'high'
      };
    });

    const criticalRisk = atRiskStudents.filter(s => s.riskLevel === 'critical').length;
    const highRisk = atRiskStudents.filter(s => s.riskLevel === 'high').length;
    const moderateRisk = atRiskStudents.filter(s => s.riskLevel === 'moderate').length;
    const decliningStudents = atRiskStudents.filter(s => s.isDeclining).length;

    // Performance Predictions for next quarter
    const predictions = visibleStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const quarterAverages = ['q1', 'q2', 'q3', 'q4'].map(q => {
        const qKey = q as 'q1' | 'q2' | 'q3' | 'q4';
        const qGrades = studentGrades.map(g => g[qKey]).filter((g): g is number => typeof g === 'number');
        return qGrades.length > 0 ? qGrades.reduce((sum, g) => sum + g, 0) / qGrades.length : 0;
      }).filter(avg => avg > 0);

      if (quarterAverages.length < 2) {
        return { student, predicted: 0, confidence: 'low', trend: 'insufficient data' };
      }

      // Simple linear regression for trend
      const sum = quarterAverages.reduce((acc, val) => acc + val, 0);
      const avg = sum / quarterAverages.length;
      const lastTwo = quarterAverages.slice(-2);
      const trend = lastTwo[1] > lastTwo[0] ? 'improving' : lastTwo[1] < lastTwo[0] ? 'declining' : 'stable';
      const trendRate = lastTwo[0] > 0 ? ((lastTwo[1] - lastTwo[0]) / lastTwo[0]) * 100 : 0;

      const predicted = Math.max(0, Math.min(100, Math.round(quarterAverages[quarterAverages.length - 1] + trendRate)));
      const confidence = quarterAverages.length >= 3 ? 'high' : 'moderate';

      return { student, predicted, confidence, trend, currentAvg: Math.round(avg) };
    });

    const predictedPassing = predictions.filter(p => p.predicted >= 75).length;
    const predictedFailing = predictions.filter(p => p.predicted < 75 && p.predicted > 0).length;
    const improving = predictions.filter(p => p.trend === 'improving').length;
    const declining = predictions.filter(p => p.trend === 'declining').length;

    // Subject-wise Performance Analysis
    const subjectPerformance = availableLearningAreas.map(la => {
      const subjectGrades = grades.filter(g => g.learningAreaId === la.id);
      const allQuarterGrades = ['q1', 'q2', 'q3', 'q4'].flatMap(q => {
        const qKey = q as 'q1' | 'q2' | 'q3' | 'q4';
        return subjectGrades.map(g => g[qKey]).filter((g): g is number => typeof g === 'number');
      });

      const average = allQuarterGrades.length > 0
        ? Math.round(allQuarterGrades.reduce((sum, g) => sum + g, 0) / allQuarterGrades.length)
        : 0;

      const passing = subjectGrades.filter(g => {
        const finalGrade = g.finalGrade;
        return typeof finalGrade === 'number' && finalGrade >= 75;
      }).length;

      const failing = subjectGrades.filter(g => {
        const finalGrade = g.finalGrade;
        return typeof finalGrade === 'number' && finalGrade < 75;
      }).length;

      return {
        subject: la.name,
        average,
        passing,
        failing,
        total: subjectGrades.length,
        difficulty: average < 75 ? 'high' : average < 85 ? 'moderate' : 'low'
      };
    }).sort((a, b) => a.average - b.average); // Sort by difficulty

    // Improvement Tracking
    const improvementTracking = visibleStudents.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const q1Grades = studentGrades.map(g => g.q1).filter((g): g is number => typeof g === 'number');
      const q4Grades = studentGrades.map(g => g.q4).filter((g): g is number => typeof g === 'number');

      const q1Avg = q1Grades.length > 0 ? q1Grades.reduce((sum, g) => sum + g, 0) / q1Grades.length : 0;
      const q4Avg = q4Grades.length > 0 ? q4Grades.reduce((sum, g) => sum + g, 0) / q4Grades.length : 0;

      const improvement = q1Avg > 0 && q4Avg > 0 ? Math.round(q4Avg - q1Avg) : 0;
      const improvementPercent = q1Avg > 0 ? Math.round((improvement / q1Avg) * 100) : 0;

      return {
        student,
        q1Avg: Math.round(q1Avg),
        q4Avg: Math.round(q4Avg),
        improvement,
        improvementPercent,
        category: improvement > 5 ? 'significant' : improvement > 0 ? 'modest' : improvement < -5 ? 'declining' : 'stable'
      };
    }).sort((a, b) => b.improvement - a.improvement);

    const significantImprovement = improvementTracking.filter(i => i.category === 'significant').length;
    const decliningPerformance = improvementTracking.filter(i => i.category === 'declining').length;

    // Smart Recommendations
    const recommendations: Array<{ type: string; priority: string; message: string; count: number }> = [];

    if (criticalRisk > 0) {
      recommendations.push({
        type: 'intervention',
        priority: 'critical',
        message: `${criticalRisk} student(s) at critical risk - immediate intervention required`,
        count: criticalRisk
      });
    }

    if (decliningStudents > 3) {
      recommendations.push({
        type: 'monitoring',
        priority: 'high',
        message: `${decliningStudents} student(s) showing declining trends - implement monitoring`,
        count: decliningStudents
      });
    }

    const hardestSubjects = subjectPerformance.filter(s => s.difficulty === 'high');
    if (hardestSubjects.length > 0) {
      recommendations.push({
        type: 'curriculum',
        priority: 'moderate',
        message: `${hardestSubjects.length} subject(s) need curriculum review: ${hardestSubjects.map(s => s.subject).join(', ')}`,
        count: hardestSubjects.length
      });
    }

    if (improving > declining) {
      recommendations.push({
        type: 'positive',
        priority: 'low',
        message: `Positive trend: ${improving} student(s) improving vs ${declining} declining`,
        count: improving
      });
    }

    return {
      quarterlyTrends,
      growthRates,
      riskAssessment: {
        criticalRisk,
        highRisk,
        moderateRisk,
        decliningStudents,
        atRiskStudents: atRiskStudents.filter(s => s.needsIntervention)
      },
      predictions: {
        predictedPassing,
        predictedFailing,
        improving,
        declining,
        topPredictions: predictions.sort((a, b) => b.predicted - a.predicted).slice(0, 10)
      },
      subjectPerformance,
      improvementTracking: {
        significantImprovement,
        decliningPerformance,
        topImprovers: improvementTracking.slice(0, 10),
        needsSupport: improvementTracking.filter(i => i.category === 'declining').slice(0, 10)
      },
      recommendations
    };
  }, [students, grades, availableLearningAreas, session, forceStudentId, isStudentView, isParentView, selectedSectionId, searchQuery]);

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview & Analytics', icon: '📊' },
    { id: 'academic-gradebook' as TabType, label: 'Academic Gradebook', icon: '📚' },
    { id: 'core-values-gradebook' as TabType, label: 'Core Values Gradebook', icon: '🌟' },
    // Report Cards tab hidden - use dedicated Form 138 dashboard instead
    // { id: 'report-cards' as TabType, label: 'Report Cards', icon: '📄' },
    { id: 'deep-analytics' as TabType, label: 'Deep Analytics', icon: '🔬' }
  ];

  return (
    <div className="space-y-6">
      {/* Report Cards Notice Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="w-6 h-6 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-blue-900">📄 Looking for Report Cards (Form 138)?</h3>
          <p className="text-sm text-blue-800 mt-1">
            Report card generation has been moved to a dedicated dashboard for better organization. 
            Please visit <strong>Grades & Reports → Form 138 Dashboard</strong> to generate and print official DepEd Form 138 report cards.
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-2">
        <div className="flex flex-wrap gap-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Filters Section (controls both analytics and student list) */}
          {!(isStudentView || isParentView) && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-4">
              <div className="flex flex-col gap-4">
                {/* Performance Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filter:</span>
                  <button
                    onClick={() => setPerformanceFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      performanceFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    All ({analytics.academic.totalStudents})
                  </button>
                  <button
                    onClick={() => setPerformanceFilter('honor')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      performanceFilter === 'honor'
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    🌟 Honor Roll ({analytics.academic.honorRoll})
                  </button>
                  <button
                    onClick={() => setPerformanceFilter('needs-improvement')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      performanceFilter === 'needs-improvement'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    ⚠️ Needs Attention ({analytics.academic.failing})
                  </button>
                  <button
                    onClick={() => setPerformanceFilter('incomplete')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      performanceFilter === 'incomplete'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    📝 Incomplete ({analytics.academic.totalStudents - analytics.academic.passing})
                  </button>
                </div>

                {/* Section and Search Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl shadow-sm">
                  {/* Section Dropdown - Enhanced */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="section-filter" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                      </svg>
                      Section:
                    </label>
                    <select
                      id="section-filter"
                      value={selectedSectionId}
                      onChange={(e) => setSelectedSectionId(e.target.value)}
                      className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <option value="all">{isTeacherView ? 'All My Sections' : 'All Sections'}</option>
                      {availableSections?.map((section) => (
                        <option key={section.id} value={section.id}>
                          Grade {section.gradeLevel} - {section.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quarter Dropdown - NEW */}
                  <div className="flex items-center gap-2">
                    <label htmlFor="quarter-filter" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                      </svg>
                      Quarter:
                    </label>
                    <select
                      id="quarter-filter"
                      value={selectedQuarter}
                      onChange={(e) => setSelectedQuarter(e.target.value as 'all' | 'q1' | 'q2' | 'q3' | 'q4')}
                      className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
                    >
                      <option value="all">All Quarters</option>
                      <option value="q1">Quarter 1</option>
                      <option value="q2">Quarter 2</option>
                      <option value="q3">Quarter 3</option>
                      <option value="q4">Quarter 4</option>
                    </select>
                  </div>

                  {/* Search Input - Enhanced */}
                  <div className="flex-1 min-w-[280px]">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by student name, email, or ID..."
                        className="w-full pl-10 pr-10 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Clear Filters Button - Enhanced */}
                  {(selectedSectionId !== 'all' || selectedQuarter !== 'all' || performanceFilter !== 'all' || searchQuery) && (
                    <button
                      onClick={() => {
                        setSelectedSectionId('all');
                        setSelectedQuarter('all');
                        setPerformanceFilter('all');
                        setSearchQuery('');
                      }}
                      className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear All
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Simplified Overview Analytics - 6 Key Metrics */}
          {!(isStudentView || isParentView) && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">� Quick Overview</h2>
              
              {/* 6 Essential Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Students */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Students</p>
                      <p className="text-4xl font-bold mt-2">{analytics.academic.totalStudents}</p>
                    </div>
                    <div className="bg-blue-400/30 rounded-full p-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-blue-100">
                    Class Average: {analytics.academic.avgGrade}%
                  </div>
                </div>

                {/* Honor Roll */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Honor Roll</p>
                      <p className="text-4xl font-bold mt-2">{analytics.academic.honorRoll}</p>
                    </div>
                    <div className="bg-green-400/30 rounded-full p-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-green-100">
                    {analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.honorRoll / analytics.academic.totalStudents) * 100) : 0}% of class (≥90%)
                  </div>
                </div>

                {/* At-Risk Students */}
                <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-sm font-medium">At-Risk Students</p>
                      <p className="text-4xl font-bold mt-2">{analytics.correlation.atRisk}</p>
                    </div>
                    <div className="bg-red-400/30 rounded-full p-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-red-100">
                    Low grades + behavior concerns
                  </div>
                </div>

                {/* Completion Rate */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Completion Rate</p>
                      <p className="text-4xl font-bold mt-2">{analytics.academic.avgCompletion}%</p>
                    </div>
                    <div className="bg-purple-400/30 rounded-full p-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-purple-100">
                    Graded + Evaluated
                  </div>
                </div>

                {/* Exemplary Behavior */}
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-indigo-100 text-sm font-medium">Exemplary Behavior</p>
                      <p className="text-4xl font-bold mt-2">{analytics.behavioral.exemplary}</p>
                    </div>
                    <div className="bg-indigo-400/30 rounded-full p-3">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-indigo-100">
                    All Outstanding (AO)
                  </div>
                </div>

                {/* High Achievers */}
                <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-5 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-sm font-medium">High Achievers</p>
                      <p className="text-4xl font-bold mt-2">{analytics.correlation.highAchievers}</p>
                    </div>
                    <div className="bg-amber-400/30 rounded-full p-3">
                      <span className="text-4xl">🏆</span>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-amber-100">
                    Excellent grades + behavior
                  </div>
                </div>
              </div>

              {/* Call to Action - Deep Analytics */}
              <button
                onClick={() => setActiveTab('deep-analytics')}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 px-6 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                <span className="text-2xl">�</span>
                <span>View Detailed Analytics & Insights</span>
                <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}

          {/* Student List (Enhanced GradesView with lifted filter state) */}
          <div>
            <GradesView 
              schoolData={schoolData} 
              session={session} 
              forceStudentId={forceStudentId}
              selectedSectionId={selectedSectionId}
              onSectionChange={setSelectedSectionId}
              performanceFilter={performanceFilter}
              onPerformanceChange={setPerformanceFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          </div>
        </div>
      )}

      {activeTab === 'academic-gradebook' && (
        <div>
          {/* Mini Analytics Bar */}
          {!(isStudentView || isParentView) && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Students Graded:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.passing + analytics.academic.failing}/{analytics.academic.totalStudents}</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Section Average:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.avgGrade}%</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Completion:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">{analytics.academic.avgCompletion}%</span>
                </div>
              </div>
            </div>
          )}
          {/* Only render gradebook for staff and students, not parents */}
          {!isParentView && (
            <GradebookView 
              schoolData={schoolData} 
              session={session as { user: AuthUser | StudentUser, type: 'staff' | 'student' }}
              selectedSectionId={selectedSectionId}
              onSectionChange={setSelectedSectionId}
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
          {isParentView && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Parent View Only</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This detailed gradebook view is not available for parent accounts. Please use the Overview tab to see your child's performance.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'core-values-gradebook' && (
        <div>
          {/* Mini Analytics Bar */}
          {!(isStudentView || isParentView) && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Students Evaluated:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">
                    {analytics.behavioral.exemplary + analytics.behavioral.goodStanding + analytics.behavioral.behaviorSupport}/{analytics.academic.totalStudents}
                  </span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Exemplary:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{analytics.behavioral.exemplary}</span>
                </div>
                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Needs Support:</span>
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{analytics.behavioral.behaviorSupport}</span>
                </div>
              </div>
            </div>
          )}
          {/* Only render gradebook for staff and students, not parents */}
          {!isParentView && (
            <CoreValuesGradebookView 
              schoolData={schoolData} 
              session={session as { user: AuthUser | StudentUser, type: 'staff' | 'student' }}
              selectedSectionId={selectedSectionId}
              onSectionChange={setSelectedSectionId}
              selectedQuarter={selectedQuarter}
              onQuarterChange={setSelectedQuarter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}
          {isParentView && (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Parent View Only</h3>
              <p className="text-slate-600 dark:text-slate-400">
                This detailed gradebook view is not available for parent accounts. Please use the Overview tab to see your child's behavior assessment.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'report-cards' && (
        <div className="space-y-6">
          {/* Report Cards Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">📄 Report Cards (DepEd Form 138)</h2>
                <p className="text-indigo-100">Generate and print official report cards for students</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{visibleStudents.length}</div>
                <div className="text-sm text-indigo-100">Students</div>
              </div>
            </div>
          </div>

          {/* Filters Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filter Students
            </h3>
            
            <div className="flex flex-wrap items-center gap-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 p-4 rounded-xl shadow-sm">
              {/* Performance Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="report-performance-filter" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  Performance:
                </label>
                <select
                  id="report-performance-filter"
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value as FilterType)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <option value="all">All Students</option>
                  <option value="honor">🏆 Honor Roll (≥90%)</option>
                  <option value="needs-improvement">⚠️ Needs Improvement (&lt;75%)</option>
                  <option value="incomplete">📝 Incomplete Grades</option>
                </select>
              </div>

              {/* Section Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="report-section-filter" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
                  </svg>
                  Section:
                </label>
                <select
                  id="report-section-filter"
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <option value="all">{isTeacherView ? 'All My Sections' : 'All Sections'}</option>
                  {availableSections?.map((section) => (
                    <option key={section.id} value={section.id}>
                      Grade {section.gradeLevel} - {section.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quarter Filter */}
              <div className="flex items-center gap-2">
                <label htmlFor="report-quarter-filter" className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                  Quarter:
                </label>
                <select
                  id="report-quarter-filter"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value as 'all' | 'q1' | 'q2' | 'q3' | 'q4')}
                  className="px-4 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <option value="all">All Quarters</option>
                  <option value="q1">Quarter 1</option>
                  <option value="q2">Quarter 2</option>
                  <option value="q3">Quarter 3</option>
                  <option value="q4">Quarter 4</option>
                </select>
              </div>

              {/* Search Input */}
              <div className="flex-1 min-w-[280px]">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student name, email, or ID..."
                    className="w-full pl-10 pr-10 py-2 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm hover:shadow-md transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                      title="Clear search"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {/* Clear Filters Button */}
              {(selectedSectionId !== 'all' || selectedQuarter !== 'all' || performanceFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setSelectedSectionId('all');
                    setSelectedQuarter('all');
                    setPerformanceFilter('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={() => {
                  const selectedIds = visibleStudents.map(s => s.id);
                  handleBulkPrint(selectedIds);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                <span>🖨️</span>
                <span>Print All ({visibleStudents.length})</span>
              </button>
              
              <button
                onClick={handlePrintSelected}
                disabled={selectedStudents.length === 0}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors shadow-md ${
                  selectedStudents.length > 0
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>✓</span>
                <span>Print Selected ({selectedStudents.length})</span>
              </button>

              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                <span>☑️</span>
                <span>Select All</span>
              </button>

              <button
                onClick={handleDeselectAll}
                className="flex items-center gap-2 px-6 py-3 bg-slate-400 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors shadow-md"
              >
                <span>□</span>
                <span>Deselect All</span>
              </button>
            </div>

            {/* Student Selection List */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
                Select Students for Report Cards
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto p-2">
                {visibleStudents.map(student => {
                  const studentGrades = grades.filter(g => g.studentId === student.id);
                  
                  // Calculate general average - prefer finalGrade, fallback to computing from quarters
                  const averagesForCalculation = studentGrades
                    .map(g => {
                      // If finalGrade exists, use it
                      if (typeof g.finalGrade === 'number' && g.finalGrade > 0) {
                        return g.finalGrade;
                      }
                      // Otherwise compute from quarterly grades
                      const quarters = [g.q1, g.q2, g.q3, g.q4].filter(
                        (q): q is number => typeof q === 'number' && q > 0
                      );
                      if (quarters.length > 0) {
                        return Math.round(quarters.reduce((sum, q) => sum + q, 0) / quarters.length);
                      }
                      return null;
                    })
                    .filter((avg): avg is number => avg !== null);
                  
                  const average = averagesForCalculation.length > 0
                    ? Math.round(averagesForCalculation.reduce((sum, g) => sum + g, 0) / averagesForCalculation.length)
                    : 0;
                  
                  // Count total quarterly grades entered (Q1, Q2, Q3, Q4)
                  const totalQuarterlyGrades = studentGrades.reduce((count, grade) => {
                    let quarterCount = 0;
                    if (typeof grade.q1 === 'number' && grade.q1 > 0) quarterCount++;
                    if (typeof grade.q2 === 'number' && grade.q2 > 0) quarterCount++;
                    if (typeof grade.q3 === 'number' && grade.q3 > 0) quarterCount++;
                    if (typeof grade.q4 === 'number' && grade.q4 > 0) quarterCount++;
                    return count + quarterCount;
                  }, 0);
                  
                  // Calculate expected grades based on subjects this student actually has
                  // Count how many subjects (learning areas) this student has grade records for
                  const studentSubjectCount = studentGrades.length;
                  const totalExpectedGrades = studentSubjectCount * 4; // 4 quarters per subject
                  
                  const isSelected = selectedStudents.includes(student.id);
                  
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md'
                          : 'border-slate-200 dark:border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <div 
                        onClick={() => handleToggleStudent(student.id)}
                        className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer ${
                        isSelected 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                      }`}>
                        {isSelected && '✓'}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 dark:text-white truncate">
                          {student.firstName && student.lastName 
                            ? `${student.firstName} ${student.lastName}`
                            : student.name || 'No Name'}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {student.lrn ? `Student: ${student.lrn}` : 'No Student ID'}
                        </div>
                      </div>

                      <div className="text-right flex items-center gap-2">
                        <div>
                          <div className={`text-lg font-bold ${
                            average >= 90 ? 'text-indigo-600' :
                            average >= 75 ? 'text-green-600' :
                            average > 0 ? 'text-red-600' :
                            'text-slate-400'
                          }`}>
                            {average > 0 ? `${average}%` : '--'}
                          </div>
                          <div className="text-xs text-slate-500">
                            {totalQuarterlyGrades}/{totalExpectedGrades} grades
                          </div>
                        </div>
                        
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrintSingleStudent(student.id);
                          }}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                          title="Print Report Card"
                        >
                          🖨️ Print
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h4 className="font-bold text-slate-800 dark:text-white mb-3">📋 Instructions</h4>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              <li>• <strong>Select Students:</strong> Click on student cards to select/deselect</li>
              <li>• <strong>Print All:</strong> Generates report cards for all students in one batch</li>
              <li>• <strong>Print Selected:</strong> Generates report cards only for selected students</li>
              <li>• <strong>Format:</strong> Uses official DepEd Form 138 format with grades and core values</li>
              <li>• <strong>Printing:</strong> Opens print preview in a new window - use browser's print function</li>
            </ul>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{visibleStudents.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Total Students</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{selectedStudents.length}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Selected</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {visibleStudents.filter(s => {
                  const studentGrades = grades.filter(g => g.studentId === s.id);
                  return studentGrades.length === (learningAreas?.length || 0) * 4;
                }).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Complete Grades</div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 text-center">
              <div className="text-2xl font-bold text-amber-600">
                {visibleStudents.filter(s => {
                  const studentGrades = grades.filter(g => g.studentId === s.id);
                  return studentGrades.length < (learningAreas?.length || 0) * 4;
                }).length}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">Incomplete Grades</div>
            </div>
          </div>
        </div>
      )}

      {/* Deep Analytics Tab - Tier 3 */}
      {activeTab === 'deep-analytics' && !(isStudentView || isParentView) && (
        <div className="space-y-6">
          {/* Header with Export Actions */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">🔬 Deep Analytics & Insights</h2>
              
              {/* Export Buttons */}
              <div className="flex items-center gap-3">
                {/* CSV Export Dropdown */}
                <div className="relative group">
                  <button className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                
                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="py-2">
                    <button
                      onClick={() => handleExportDeepAnalytics('overview')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="text-lg">�</span>
                      <div>
                        <div className="font-medium">Overview Summary</div>
                        <div className="text-xs text-slate-500">Academic & behavioral metrics</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExportDeepAnalytics('risk-assessment')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="text-lg">⚠️</span>
                      <div>
                        <div className="font-medium">Risk Assessment</div>
                        <div className="text-xs text-slate-500">At-risk student details</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExportDeepAnalytics('subject-performance')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="text-lg">📚</span>
                      <div>
                        <div className="font-medium">Subject Performance</div>
                        <div className="text-xs text-slate-500">Per-subject analytics</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleExportDeepAnalytics('improvement-tracking')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2"
                    >
                      <span className="text-lg">📈</span>
                      <div>
                        <div className="font-medium">Improvement Tracking</div>
                        <div className="text-xs text-slate-500">Student progress trends</div>
                      </div>
                    </button>
                    
                    <div className="border-t border-slate-200 dark:border-slate-700 my-2"></div>
                    
                    <button
                      onClick={() => handleExportDeepAnalytics('all')}
                      className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700 flex items-center gap-2 font-medium"
                    >
                      <span className="text-lg">💾</span>
                      <div>
                        <div className="font-medium">Export All CSV</div>
                        <div className="text-xs text-slate-500">Download all reports</div>
                      </div>
                    </button>
                  </div>
                </div>
                </div>

                {/* PDF Export Button */}
                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-2 bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                  title="Export as PDF"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>

                {/* Excel Export Button */}
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-2 bg-green-500/90 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 font-medium"
                  title="Export as Excel"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Excel
                </button>
              </div>
            </div>
            <p className="text-purple-100">Advanced analytics, predictions, and AI-powered recommendations</p>
          </div>

          {/* Comprehensive Analytics - All Stat Cards */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">📚 Academic Performance Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Students</p>
                    <p className="text-3xl font-bold mt-1">{analytics.academic.totalStudents}</p>
                  </div>
                  <div className="bg-blue-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm">
                  <span className="text-blue-100">Average: {analytics.academic.avgGrade}%</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Honor Roll</p>
                    <p className="text-3xl font-bold mt-1">{analytics.academic.honorRoll}</p>
                  </div>
                  <div className="bg-green-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-green-100">
                  {analytics.academic.totalStudents > 0 ? Math.round((analytics.academic.honorRoll / analytics.academic.totalStudents) * 100) : 0}% of class (≥90%)
                </div>
              </div>

              <div className="bg-gradient-to-br from-lime-500 to-lime-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lime-100 text-sm font-medium">Passing</p>
                    <p className="text-3xl font-bold mt-1">{analytics.academic.passing}</p>
                  </div>
                  <div className="bg-lime-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-lime-100">≥75% average</div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Completion</p>
                    <p className="text-3xl font-bold mt-1">{analytics.academic.avgCompletion}%</p>
                  </div>
                  <div className="bg-purple-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-purple-100">
                  {analytics.academic.totalStudents - analytics.academic.passing - analytics.academic.failing} incomplete
                </div>
              </div>
            </div>
          </div>

          {/* Behavioral Performance Cards */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🌟 Behavioral Performance Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm font-medium">Exemplary</p>
                    <p className="text-3xl font-bold mt-1">{analytics.behavioral.exemplary}</p>
                  </div>
                  <div className="bg-indigo-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-indigo-100">Mostly "Always Observed"</div>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-teal-100 text-sm font-medium">Good Standing</p>
                    <p className="text-3xl font-bold mt-1">{analytics.behavioral.goodStanding}</p>
                  </div>
                  <div className="bg-teal-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-teal-100">Positive behavior</div>
              </div>

              <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-sm font-medium">Needs Support</p>
                    <p className="text-3xl font-bold mt-1">{analytics.behavioral.behaviorSupport}</p>
                  </div>
                  <div className="bg-amber-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-amber-100">Behavioral concerns</div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white rounded-lg p-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-cyan-100 text-sm font-medium">Values Completion</p>
                    <p className="text-3xl font-bold mt-1">{analytics.behavioral.avgValueCompletion}%</p>
                  </div>
                  <div className="bg-cyan-400/30 rounded-full p-3">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="mt-2 text-sm text-cyan-100">Values assessed</div>
              </div>
            </div>
          </div>

          {/* Correlation Insights Panel */}
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">🔍 Detailed Insights & Correlations</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-purple-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">High Achievers</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.highAchievers}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Excellent grades + exemplary behavior
                    </p>
                  </div>
                  <span className="text-3xl">🏆</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-red-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">At-Risk Students</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.atRisk}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Low grades + behavioral concerns
                    </p>
                  </div>
                  <span className="text-3xl">⚠️</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-blue-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Academic Support</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.academicStrugglesGoodBehavior}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Good behavior but struggling grades
                    </p>
                  </div>
                  <span className="text-3xl">📚</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-md border-l-4 border-amber-500">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Behavior Support</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{analytics.correlation.goodGradesBehaviorConcerns}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Good grades but behavioral issues
                    </p>
                  </div>
                  <span className="text-3xl">🤝</span>
                </div>
              </div>
            </div>

            {/* AI Insight Banner */}
            {analytics.correlation.correlationStrength !== 'Insufficient data' && (
              <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 dark:text-white mb-2">Key Insight:</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      <strong>{analytics.correlation.correlationStrength} correlation</strong> detected between academic performance and behavioral assessment. 
                      {analytics.correlation.highAchievers > 0 && (
                        <> Students with exemplary behavior tend to perform {analytics.academic.avgGrade >= 85 ? 'significantly' : 'notably'} better academically.</>
                      )}
                      {analytics.correlation.atRisk > 0 && (
                        <> {analytics.correlation.atRisk} student{analytics.correlation.atRisk > 1 ? 's need' : ' needs'} immediate intervention in both areas.</>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Visual Analytics Charts */}
          <div id="deep-analytics-charts">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
              📊 Visual Analytics
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Grade Distribution Chart */}
              <div id="grade-distribution-chart">
                <GradeDistributionChart
                data={[
                  { range: '90-100', count: analytics.academic.honorRoll, color: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' },
                  { range: '85-89', count: analytics.academic.passing - analytics.academic.honorRoll > 0 ? Math.floor((analytics.academic.passing - analytics.academic.honorRoll) / 2) : 0, color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
                  { range: '80-84', count: analytics.academic.passing - analytics.academic.honorRoll > 0 ? Math.ceil((analytics.academic.passing - analytics.academic.honorRoll) / 2) : 0, color: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
                  { range: '75-79', count: analytics.academic.passing - (analytics.academic.honorRoll + Math.floor((analytics.academic.passing - analytics.academic.honorRoll) / 2) + Math.ceil((analytics.academic.passing - analytics.academic.honorRoll) / 2)), color: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)' },
                  { range: 'Below 75', count: analytics.academic.failing, color: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
                ]}
                title="Academic Grade Distribution"
                />
              </div>

              {/* Behavior Distribution Chart */}
              <div id="behavior-distribution-chart">
                <BehaviorDistributionChart
                data={[
                  { label: 'Exemplary (AO)', count: analytics.behavioral.exemplary, color: 'linear-gradient(135deg, #a855f7 0%, #9333ea 100%)', icon: '⭐' },
                  { label: 'Good Standing (SO)', count: analytics.behavioral.goodStanding, color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', icon: '👍' },
                  { label: 'Needs Support (RO/NO)', count: analytics.behavioral.behaviorSupport, color: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)', icon: '🆘' },
                ]}
                title="Core Values Assessment Distribution"
                />
              </div>
            </div>

            {/* Correlation Scatter Plot */}
            <div className="mb-6" id="correlation-scatter-plot">
              <CorrelationScatterPlot
                data={analytics.correlation.studentsWithBoth.map(s => {
                  const aoCount = s.aoCount || 0;
                  const soCount = s.soCount || 0;
                  const roCount = s.roCount || 0;
                  const noCount = s.noCount || 0;
                  const totalMarkings = aoCount + soCount + roCount + noCount;
                  
                  // Handle both name formats
                  const studentName = s.student.firstName && s.student.lastName
                    ? `${s.student.firstName} ${s.student.lastName}`
                    : s.student.name || 'Unknown Student';
                  
                  return {
                    id: s.student.id,
                    name: studentName,
                    academic: s.average,
                    behavioral: totalMarkings > 0 
                      ? Math.round(((aoCount * 100 + soCount * 75) / (totalMarkings * 100)) * 100)
                      : 0,
                    category: (s.average >= 90 && s.isExemplary 
                      ? 'high-achiever' 
                      : s.average < 75 && s.needsSupport 
                      ? 'at-risk'
                      : s.average < 75 && (s.isExemplary || s.isGood)
                      ? 'academic-support'
                      : s.average >= 85 && s.needsSupport
                      ? 'behavior-support'
                      : 'normal') as 'high-achiever' | 'at-risk' | 'academic-support' | 'behavior-support' | 'normal'
                  };
                })}
                title="Academic vs Behavioral Performance Correlation"
              />
            </div>
          </div>

          {/* Quarterly Trend Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              📈 Quarterly Trend Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {deepAnalytics.quarterlyTrends.map((qt, idx) => (
                <div key={qt.quarter} className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 rounded-lg p-4">
                  <div className="text-sm font-semibold text-indigo-600 dark:text-indigo-300 mb-2">
                    {qt.quarter.toUpperCase()}
                  </div>
                  <div className="text-3xl font-bold text-slate-800 dark:text-white mb-1">
                    {qt.average}%
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div>✅ Passing: {qt.passing}</div>
                    <div>⚠️ Failing: {qt.failing}</div>
                    <div>👥 Total: {qt.total}</div>
                  </div>
                  {idx > 0 && deepAnalytics.growthRates[idx - 1] && (
                    <div className={`mt-2 text-xs font-semibold ${
                      deepAnalytics.growthRates[idx - 1].direction === 'up' ? 'text-green-600' :
                      deepAnalytics.growthRates[idx - 1].direction === 'down' ? 'text-red-600' :
                      'text-slate-600'
                    }`}>
                      {deepAnalytics.growthRates[idx - 1].direction === 'up' && '↗️'}
                      {deepAnalytics.growthRates[idx - 1].direction === 'down' && '↘️'}
                      {deepAnalytics.growthRates[idx - 1].direction === 'stable' && '→'}
                      {' '}{deepAnalytics.growthRates[idx - 1].growth > 0 ? '+' : ''}{deepAnalytics.growthRates[idx - 1].growth}%
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Growth Chart Visualization */}
            <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
              <div className="flex items-end justify-around gap-4 h-48">
                {deepAnalytics.quarterlyTrends.map((qt) => {
                  const maxAvg = Math.max(...deepAnalytics.quarterlyTrends.map(q => q.average), 1);
                  const heightPercent = maxAvg > 0 ? Math.max((qt.average / maxAvg) * 100, 5) : 5;
                  
                  return (
                    <div key={qt.quarter} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                      <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {qt.average}%
                      </div>
                      <div className="w-full flex items-end" style={{ height: '160px' }}>
                        <div 
                          className="w-full bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all hover:from-indigo-700 hover:to-indigo-500 shadow-md"
                          style={{ 
                            height: `${heightPercent}%`,
                            minHeight: '20px'
                          }}
                        />
                      </div>
                      <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {qt.quarter.toUpperCase()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Risk Assessment Dashboard */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              ⚠️ Student Risk Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Critical Risk</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.riskAssessment.criticalRisk}</div>
                <div className="text-xs opacity-75">Immediate intervention needed</div>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">High Risk</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.riskAssessment.highRisk}</div>
                <div className="text-xs opacity-75">Close monitoring required</div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Moderate Risk</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.riskAssessment.moderateRisk}</div>
                <div className="text-xs opacity-75">Support recommended</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Declining Trends</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.riskAssessment.decliningStudents}</div>
                <div className="text-xs opacity-75">Performance dropping</div>
              </div>
            </div>

            {/* At-Risk Students List */}
            {deepAnalytics.riskAssessment.atRiskStudents.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  Students Requiring Intervention ({deepAnalytics.riskAssessment.atRiskStudents.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                  {deepAnalytics.riskAssessment.atRiskStudents.slice(0, 12).map(student => (
                    <div 
                      key={student.student.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        student.riskLevel === 'critical' ? 'bg-red-50 border-red-500 dark:bg-red-900/20' :
                        'bg-orange-50 border-orange-500 dark:bg-orange-900/20'
                      }`}
                    >
                      <div className="font-medium text-sm text-slate-800 dark:text-white">
                        {student.student.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        Recent: {student.recentAvg}% | Overall: {student.overallAvg}%
                      </div>
                      <div className={`text-xs font-semibold mt-1 ${
                        student.riskLevel === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>
                        {student.riskLevel.toUpperCase()} RISK
                        {student.isDeclining && ' • DECLINING'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Performance Predictions */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              🔮 Performance Predictions (Next Quarter)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Predicted Passing</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.predictions.predictedPassing}</div>
                <div className="text-xs opacity-75">Expected to pass (≥75%)</div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Predicted Failing</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.predictions.predictedFailing}</div>
                <div className="text-xs opacity-75">May need intervention</div>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Improving</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.predictions.improving}</div>
                <div className="text-xs opacity-75">Upward trend detected</div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Declining</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.predictions.declining}</div>
                <div className="text-xs opacity-75">Downward trend detected</div>
              </div>
            </div>

            {/* Top Predicted Performers */}
            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Top 10 Predicted Performers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {deepAnalytics.predictions.topPredictions.map((pred, idx) => (
                  <div 
                    key={pred.student.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                        {pred.student.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Current: {pred.currentAvg}% → Predicted: {pred.predicted}%
                      </div>
                    </div>
                    <div className={`flex-shrink-0 text-xs font-semibold px-2 py-1 rounded ${
                      pred.trend === 'improving' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      pred.trend === 'declining' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                    }`}>
                      {pred.trend === 'improving' && '↗️'}
                      {pred.trend === 'declining' && '↘️'}
                      {pred.trend === 'stable' && '→'}
                      {' '}{pred.trend}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Subject Performance Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              📖 Subject Performance Analysis
            </h3>
            <div className="space-y-3">
              {deepAnalytics.subjectPerformance.map((subject, idx) => {
                const maxTotal = Math.max(...deepAnalytics.subjectPerformance.map(s => s.total));
                const passingRate = subject.total > 0 ? Math.round((subject.passing / subject.total) * 100) : 0;
                
                return (
                  <div key={subject.subject} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          idx < 3 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          idx < 6 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        }`}>
                          {subject.difficulty.toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {subject.subject}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-800 dark:text-white">
                          {subject.average}%
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          {passingRate}% passing rate
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            subject.difficulty === 'high' ? 'bg-red-500' :
                            subject.difficulty === 'moderate' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${(subject.average / 100) * 100}%` }}
                        />
                      </div>
                      <div className="flex gap-4 text-xs text-slate-600 dark:text-slate-300">
                        <span>✅ {subject.passing}</span>
                        <span>❌ {subject.failing}</span>
                        <span>👥 {subject.total}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Improvement Tracking */}
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              📊 Student Improvement Tracking (Q1 vs Q4)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Significant Improvement</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.improvementTracking.significantImprovement}</div>
                <div className="text-xs opacity-75">Students improving by &gt;5%</div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg p-4">
                <div className="text-sm font-medium opacity-90">Declining Performance</div>
                <div className="text-4xl font-bold my-2">{deepAnalytics.improvementTracking.decliningPerformance}</div>
                <div className="text-xs opacity-75">Students declining by &gt;5%</div>
              </div>
            </div>

            {/* Top Improvers */}
            <div className="mb-6">
              <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                🏆 Top 10 Improvers
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {deepAnalytics.improvementTracking.topImprovers.map((student, idx) => (
                  <div 
                    key={student.student.id}
                    className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      #{idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                        {student.student.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300">
                        Q1: {student.q1Avg}% → Q4: {student.q4Avg}%
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-green-600 dark:text-green-400 font-bold">
                      +{student.improvement}%
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Students Needing Support */}
            {deepAnalytics.improvementTracking.needsSupport.length > 0 && (
              <div>
                <h4 className="font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  ⚠️ Students Needing Support (Declining)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {deepAnalytics.improvementTracking.needsSupport.map(student => (
                    <div 
                      key={student.student.id}
                      className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-800 dark:text-white truncate">
                          {student.student.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300">
                          Q1: {student.q1Avg}% → Q4: {student.q4Avg}%
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-red-600 dark:text-red-400 font-bold">
                        {student.improvement}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI-Powered Recommendations */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              🤖 AI-Powered Recommendations
            </h3>
            <div className="space-y-3">
              {deepAnalytics.recommendations.map((rec, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${
                    rec.priority === 'critical' ? 'bg-red-500/20 border-red-300' :
                    rec.priority === 'high' ? 'bg-orange-500/20 border-orange-300' :
                    rec.priority === 'moderate' ? 'bg-yellow-500/20 border-yellow-300' :
                    'bg-green-500/20 border-green-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-bold ${
                      rec.priority === 'critical' ? 'bg-red-300 text-red-900' :
                      rec.priority === 'high' ? 'bg-orange-300 text-orange-900' :
                      rec.priority === 'moderate' ? 'bg-yellow-300 text-yellow-900' :
                      'bg-green-300 text-green-900'
                    }`}>
                      {rec.priority.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{rec.message}</div>
                      <div className="text-sm opacity-90 mt-1">
                        Type: {rec.type} • Count: {rec.count}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {deepAnalytics.recommendations.length === 0 && (
                <div className="text-center py-8 opacity-75">
                  <div className="text-4xl mb-2">✨</div>
                  <div>All metrics are healthy! No immediate recommendations.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Print Modal */}
      {showPrintModal && currentPrintStudents.length > 0 && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-auto">
          <div className="min-h-screen p-4">
            <div className="max-w-[95vw] lg:max-w-[1200px] mx-auto bg-white rounded-lg shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
                <h3 className="text-lg font-semibold text-slate-800">
                  DepEd Form 138 - Report Card {currentPrintStudents.length > 1 && `(${currentPrintStudents.length} students)`}
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={async () => {
                      const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 80);
                      
                      try {
                        const html2canvas = (await import('html2canvas')).default;
                        const { jsPDF } = await import('jspdf');
                        
                        const pdf = new jsPDF({ unit: 'in', format: 'letter', orientation: 'landscape' });
                        let isFirstPage = true;
                        
                        document.body.classList.add('pdf-export');
                        
                        // Process each student
                        for (const studentId of currentPrintStudents) {
                          const page1 = document.getElementById(`page-1-${studentId}`) as HTMLElement | null;
                          const page2 = document.getElementById(`page-2-${studentId}`) as HTMLElement | null;
                          
                          if (!page1 || !page2) continue;
                          
                          const cnvOpts = {
                            scale: 2,
                            useCORS: true,
                            allowTaint: false,
                            backgroundColor: '#ffffff',
                            scrollY: 0,
                          } as const;
                          
                          const [c1, c2] = await Promise.all([
                            html2canvas(page1, cnvOpts),
                            html2canvas(page2, cnvOpts),
                          ]);
                          
                          const img1 = c1.toDataURL('image/jpeg', 0.98);
                          const img2 = c2.toDataURL('image/jpeg', 0.98);
                          
                          if (!isFirstPage) {
                            pdf.addPage('letter', 'landscape');
                          }
                          pdf.addImage(img1, 'JPEG', 0, 0, 11, 8.5);
                          pdf.addPage('letter', 'landscape');
                          pdf.addImage(img2, 'JPEG', 0, 0, 11, 8.5);
                          
                          isFirstPage = false;
                        }
                        
                        document.body.classList.remove('pdf-export');
                        
                        const filename = currentPrintStudents.length === 1
                          ? `Form138_${slug(visibleStudents.find(s => s.id === currentPrintStudents[0])?.name || 'student')}_${slug(String(schoolData.settings.schoolYear))}.pdf`
                          : `Form138_Multiple_Students_${slug(String(schoolData.settings.schoolYear))}.pdf`;
                        
                        pdf.save(filename);
                      } catch (error) {
                        console.error('PDF generation error:', error);
                        document.body.classList.remove('pdf-export');
                      }
                    }}
                    className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span className="text-sm">Download PDF</span>
                  </button>
                  <button
                    onClick={() => setShowPrintModal(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                {currentPrintStudents.map((studentId, index) => {
                  const student = visibleStudents.find(s => s.id === studentId);
                  if (!student) return null;
                  return (
                    <div key={studentId} className={index > 0 ? 'mt-8 pt-8 border-t-4 border-slate-300' : ''}>
                      {currentPrintStudents.length > 1 && (
                        <div className="bg-slate-100 px-6 py-3 mb-4">
                          <h4 className="font-semibold text-slate-700">
                            Student {index + 1} of {currentPrintStudents.length}: {student.name}
                          </h4>
                        </div>
                      )}
                      <PrintableReport
                        student={student}
                        schoolData={schoolData}
                        hideDownloadButton={true}
                        studentIndex={index}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedAssessmentView;
