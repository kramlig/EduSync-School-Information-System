/**
 * Form 137 Manager
 * 
 * Main component that manages Form 137 view and edit modes
 * Handles navigation between viewing and editing states
 */

import React, { useState } from 'react';
import { AcademicHistory } from '../shared/FormTypes';
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
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [selectedRecord, setSelectedRecord] = useState<AcademicHistory | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEdit = (record: AcademicHistory) => {
    setSelectedRecord(record);
    setMode('edit');
  };

  const handleCreate = () => {
    setSelectedRecord(null);
    setMode('create');
  };

  const handleSave = (record: AcademicHistory) => {
    setMode('view');
    setRefreshKey(prev => prev + 1); // Force reload of view
  };

  const handleCancel = () => {
    setMode('view');
    setSelectedRecord(null);
  };

  const handlePrint = (record: AcademicHistory) => {
    // Print functionality
    window.print();
  };

  if (mode === 'edit' || mode === 'create') {
    return (
      <Form137Editor
        recordId={selectedRecord?.id}
        studentId={studentId}
        initialData={selectedRecord || undefined}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <Form137View
      key={refreshKey}
      studentId={studentId}
      schoolYear={schoolYear}
      onEdit={handleEdit}
      onPrint={handlePrint}
    />
  );
};

export default Form137Manager;
