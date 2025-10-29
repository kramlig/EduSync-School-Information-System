/**
 * Form 137 Manager
 * 
 * Main component that manages Form 137 view and edit modes
 * Handles navigation between viewing and editing states
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AcademicHistory } from '../shared/FormTypes';
import { useSchoolData } from '../../../hooks/useSchoolData';
import Breadcrumb from '../../Breadcrumb';
import Form137View from './Form137View';
import Form137Editor from './Form137Editor';

interface Form137ManagerProps {
  studentId: string;
  schoolYear?: string;
  initialMode?: 'view' | 'edit' | 'create';
  onClose?: () => void;
}

export const Form137Manager: React.FC<Form137ManagerProps> = ({
  studentId,
  schoolYear,
  initialMode = 'view',
  onClose
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [selectedRecord, setSelectedRecord] = useState<AcademicHistory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  // Get school data to find student name
  const { students } = useSchoolData(['students']);
  const student = students.find(s => s.id === studentId);
  const studentName = student ? `${student.firstName} ${student.lastName}` : 'Student Record';

  const handleEdit = (record: AcademicHistory) => {
    setSelectedRecord(record);
    setMode('edit');
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setMode('create');
  };

  const handleSave = (_record: AcademicHistory) => {
    setMode('view');
    setRefreshKey(prev => prev + 1); // Force reload of view
  };

  const handleCancel = () => {
    // If we're in create mode or don't have a valid studentId, go back to dashboard
    if (mode === 'create' || !studentId) {
      navigate('/forms/137');
      return;
    }
    
    // Otherwise, go back to view mode
    setMode('view');
    setSelectedRecord(null);
  };

  const handlePrint = (_record: AcademicHistory) => {
    // Print functionality
    window.print();
  };

  // Custom breadcrumb items based on mode
  const customBreadcrumbs = [
    { label: 'Dashboard', path: '/', isClickable: true },
    { label: 'Grades & Reports', path: '/grades', isClickable: true },
    { label: 'Permanent Records (Form 137)', path: '/grades/form137', isClickable: true },
    { 
      label: mode === 'create' ? 'New Form 137' : studentName, 
      path: location.pathname, 
      isClickable: false 
    },
    ...(mode === 'edit' ? [{ label: 'Edit', path: location.pathname, isClickable: false }] : [])
  ];

  if (mode === 'edit' || mode === 'create') {
    return (
      <>
        <Breadcrumb customItems={customBreadcrumbs} />
        <Form137Editor
          recordId={selectedRecord?.id}
          studentId={studentId}
          initialData={selectedRecord || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </>
    );
  }

  return (
    <>
      <Breadcrumb customItems={customBreadcrumbs} />
      <Form137View
        key={refreshKey}
        studentId={studentId}
        schoolYear={schoolYear}
        onEdit={handleEdit}
        onPrint={handlePrint}
      />
    </>
  );
};

export default Form137Manager;
