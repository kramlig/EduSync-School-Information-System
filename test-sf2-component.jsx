/**
 * SF2 Dashboard Manual Test
 * 
 * This script tests the SF2Dashboard component with mock data
 * to verify functionality without needing full authentication flow
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import SF2Dashboard from '../components/forms/SchoolForms/SF2Dashboard';

// Mock school data for testing
const mockSchoolData = {
  students: [
    { 
      id: 's1', 
      name: 'DELA CRUZ, JUAN A.', 
      sectionId: 'sec1',
      lrn: '123456789001',
      status: 'active'
    },
    { 
      id: 's2', 
      name: 'SANTOS, MARIA B.', 
      sectionId: 'sec1',
      lrn: '123456789002',
      status: 'active'
    },
    { 
      id: 's3', 
      name: 'GARCIA, PEDRO C.', 
      sectionId: 'sec1',
      lrn: '123456789003',
      status: 'active'
    }
  ],
  sections: [
    {
      id: 'sec1',
      name: 'Grade 1 - Rose',
      gradeLevel: 1,
      adviser: 'Ms. Ana Cruz'
    }
  ],
  attendanceRecords: [
    {
      studentId: 's1',
      dailyStatus: {
        '2025-10-01': 'P',
        '2025-10-02': 'P',
        '2025-10-03': 'A',
        '2025-10-04': 'P',
        '2025-10-05': 'L'
      }
    },
    {
      studentId: 's2',
      dailyStatus: {
        '2025-10-01': 'P',
        '2025-10-02': 'P',
        '2025-10-03': 'P',
        '2025-10-04': 'P',
        '2025-10-05': 'P'
      }
    },
    {
      studentId: 's3',
      dailyStatus: {
        '2025-10-01': 'P',
        '2025-10-02': 'A',
        '2025-10-03': 'P',
        '2025-10-04': 'L',
        '2025-10-05': 'P'
      }
    }
  ],
  loading: false,
  error: null
};

// Mock session
const mockSession = {
  user: {
    id: 'teacher1',
    name: 'Test Teacher',
    email: 'teacher@test.com'
  },
  type: 'staff'
};

// Test component
function SF2Test() {
  return (
    <div style={{ padding: '20px' }}>
      <h1>SF2 Dashboard Manual Test</h1>
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px' }}>
        <SF2Dashboard 
          schoolData={mockSchoolData}
          session={mockSession}
          onBack={() => console.log('Back button clicked')}
        />
      </div>
    </div>
  );
}

// Render test
const container = document.getElementById('sf2-test');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<SF2Test />);
  console.log('✅ SF2Dashboard test component rendered');
} else {
  console.error('❌ Test container not found');
}

// Export for manual testing
window.testSF2 = {
  mockSchoolData,
  mockSession,
  SF2Dashboard
};

console.log('🧪 SF2 Test loaded. Check window.testSF2 for manual testing');