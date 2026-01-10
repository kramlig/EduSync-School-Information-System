/**
 * EduSync LIS Helper - Popup Script
 * 
 * Handles the extension popup UI:
 * - Tab 1: Import data from EduSync export and fill LIS forms
 * - Tab 2: Extract student data from LIS pages
 */

// ============================================================================
// STATE
// ============================================================================

let students = [];
let currentIndex = 0;
let schoolInfo = null;
let settings = {
  autoNext: true,
  confirmFill: false,
  highlightFields: true,
  devMode: false
};

// Extract tab state
let extractedStudents = [];
let extractedMetadata = null;

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabFill: document.getElementById('tab-fill'),
  tabExtract: document.getElementById('tab-extract'),
  
  // Status
  statusBar: document.getElementById('status-bar'),
  statusIcon: document.getElementById('status-icon'),
  statusText: document.getElementById('status-text'),
  
  // Import (Fill tab)
  fileInput: document.getElementById('file-input'),
  importBtn: document.getElementById('import-btn'),
  importStatus: document.getElementById('import-status'),
  studentCount: document.getElementById('student-count'),
  schoolName: document.getElementById('school-name'),
  clearBtn: document.getElementById('clear-btn'),
  
  // Actions (Fill tab)
  actionsSection: document.getElementById('actions-section'),
  searchLrnBtn: document.getElementById('search-lrn-btn'),
  autofillBtn: document.getElementById('autofill-btn'),
  batchModeBtn: document.getElementById('batch-mode-btn'),
  
  // Current Student (Fill tab)
  currentStudentSection: document.getElementById('current-student-section'),
  currentStudentInfo: document.getElementById('current-student-info'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  studentIndex: document.getElementById('student-index'),
  
  // Extract tab
  extractPageStatus: document.getElementById('extract-page-status'),
  extractPageIcon: document.getElementById('extract-page-icon'),
  extractPageText: document.getElementById('extract-page-text'),
  extractBtn: document.getElementById('extract-btn'),
  extractResult: document.getElementById('extract-result'),
  extractedCount: document.getElementById('extracted-count'),
  extractedSection: document.getElementById('extracted-section'),
  extractedPreview: document.getElementById('extracted-preview'),
  downloadJsonBtn: document.getElementById('download-json-btn'),
  copyJsonBtn: document.getElementById('copy-json-btn'),
  
  // Settings
  autoNextCheckbox: document.getElementById('auto-next'),
  confirmFillCheckbox: document.getElementById('confirm-fill'),
  highlightFieldsCheckbox: document.getElementById('highlight-fields'),
  devModeCheckbox: document.getElementById('dev-mode'),
  
  // Page Status
  pageStatus: document.getElementById('page-status'),
  pageStatusText: document.getElementById('page-status-text')
};

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved data
  await loadStoredData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Setup tab navigation
  setupTabs();
  
  // Check current page
  await checkCurrentPage();
  
  // Check extract page status
  await checkExtractPageStatus();
  
  // Update UI
  updateUI();

  // Also, ping the content script to check for a connection
  pingContentScript();
});

function setupTabs() {
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Update button states
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show/hide tab content
      if (elements.tabFill) {
        elements.tabFill.style.display = tabId === 'fill' ? 'block' : 'none';
      }
      if (elements.tabExtract) {
        elements.tabExtract.style.display = tabId === 'extract' ? 'block' : 'none';
      }
      
      // Re-check page status for extract tab
      if (tabId === 'extract') {
        checkExtractPageStatus();
      }
    });
  });
}

async function loadStoredData() {
  try {
    const result = await chrome.storage.local.get(['students', 'schoolInfo', 'currentIndex', 'settings']);
    
    if (result.students) {
      students = result.students;
    }
    if (result.schoolInfo) {
      schoolInfo = result.schoolInfo;
    }
    if (result.currentIndex !== undefined) {
      currentIndex = result.currentIndex;
    }
    if (result.settings) {
      settings = { ...settings, ...result.settings };
    }
    
    // Apply settings to checkboxes
    elements.autoNextCheckbox.checked = settings.autoNext;
    elements.confirmFillCheckbox.checked = settings.confirmFill;
    elements.highlightFieldsCheckbox.checked = settings.highlightFields;
    if (elements.devModeCheckbox) {
      elements.devModeCheckbox.checked = settings.devMode;
    }
    
  } catch (error) {
    console.error('Error loading stored data:', error);
  }
}

function setupEventListeners() {
  // Import (Fill tab)
  elements.importBtn.addEventListener('click', () => elements.fileInput.click());
  elements.fileInput.addEventListener('change', handleFileImport);
  elements.clearBtn.addEventListener('click', clearData);
  
  // Navigation (Fill tab)
  elements.prevBtn.addEventListener('click', () => navigateStudent(-1));
  elements.nextBtn.addEventListener('click', () => navigateStudent(1));
  
  // Actions (Fill tab)
  elements.searchLrnBtn.addEventListener('click', handleSearchLrn);
  elements.autofillBtn.addEventListener('click', handleAutofill);
  elements.batchModeBtn.addEventListener('click', handleBatchMode);
  
  // Extract tab
  if (elements.extractBtn) {
    elements.extractBtn.addEventListener('click', handleExtractStudents);
  }
  if (elements.downloadJsonBtn) {
    elements.downloadJsonBtn.addEventListener('click', handleDownloadJson);
  }
  if (elements.copyJsonBtn) {
    elements.copyJsonBtn.addEventListener('click', handleCopyJson);
  }
  
  // Settings
  elements.autoNextCheckbox.addEventListener('change', saveSettings);
  elements.confirmFillCheckbox.addEventListener('change', saveSettings);
  elements.highlightFieldsCheckbox.addEventListener('change', saveSettings);
  if (elements.devModeCheckbox) {
    elements.devModeCheckbox.addEventListener('change', saveSettings);
  }
}
async function pingContentScript() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) {
    updateExtractPageStatus('error', '❌ No active tab found.');
    return;
  }

  // Send a ping and expect a pong
  chrome.tabs.sendMessage(tab.id, { action: 'ping' }, (response) => {
    if (chrome.runtime.lastError) {
      // This error means the content script is not available
      updateExtractPageStatus('error', '❌ Connection failed. Refresh the LIS page.');
      if (elements.extractBtn) elements.extractBtn.disabled = true;
    } else if (response && response.status === 'ready') {
      // Success! Now check if we are on the login page
      if (response.onLoginPage) {
        updateExtractPageStatus('warning', '⚠️ Please log in to LIS first.');
        if (elements.extractBtn) elements.extractBtn.disabled = true;
      } else {
        updateExtractPageStatus('ok', '✅ Ready to extract from this page.');
        if (elements.extractBtn) elements.extractBtn.disabled = false;
      }
    } else {
      updateExtractPageStatus('error', '❌ Page not responsive. Refresh the LIS page.');
      if (elements.extractBtn) elements.extractBtn.disabled = true;
    }
  });
}
// ============================================================================
// FILE IMPORT
// ============================================================================

async function handleFileImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Validate data structure
    if (!data.students || !Array.isArray(data.students)) {
      throw new Error('Invalid file format. Expected EduSync export with students array.');
    }
    
    // Store data
    students = data.students;
    schoolInfo = data.school || { name: 'Unknown School' };
    currentIndex = 0;
    
    // Save to storage
    await chrome.storage.local.set({
      students,
      schoolInfo,
      currentIndex
    });
    
    // Update UI
    updateUI();
    
    showStatus('success', `✅ Loaded ${students.length} students`);
    
  } catch (error) {
    console.error('Import error:', error);
    showStatus('error', `❌ Import failed: ${error.message}`);
  }
  
  // Reset file input
  event.target.value = '';
}

async function clearData() {
  if (!confirm('Clear all imported data?')) return;
  
  students = [];
  schoolInfo = null;
  currentIndex = 0;
  
  await chrome.storage.local.remove(['students', 'schoolInfo', 'currentIndex']);
  
  updateUI();
  showStatus('inactive', 'No data loaded');
}

// ============================================================================
// NAVIGATION
// ============================================================================

function navigateStudent(direction) {
  const newIndex = currentIndex + direction;
  
  if (newIndex >= 0 && newIndex < students.length) {
    currentIndex = newIndex;
    chrome.storage.local.set({ currentIndex });
    updateCurrentStudent();
  }
}

// ============================================================================
// ACTIONS
// ============================================================================

async function handleSearchLrn() {
  const student = students[currentIndex];
  if (!student) return;
  
  // Send message to content script to search by LRN
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'searchLrn',
    lrn: student.lrn
  });
}

async function handleAutofill() {
  const student = students[currentIndex];
  if (!student) return;
  
  if (settings.confirmFill) {
    const confirm = window.confirm(`Auto-fill data for ${student.name}?`);
    if (!confirm) return;
  }
  
  // Get active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we're on a valid page
  const isLisPage = tab?.url?.includes('lis.deped.gov.ph') || tab?.url?.includes('deped.gov.ph');
  const isDevMode = settings.devMode;
  
  if (!isLisPage && !isDevMode) {
    showStatus('error', '❌ Please navigate to DepEd LIS website first, or enable Dev mode');
    return;
  }
  
  // In dev mode on non-LIS pages, we need to inject the content script dynamically
  if (!isLisPage && isDevMode) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['content/content.css']
      });
      // Give it a moment to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error('Failed to inject content script:', err);
      showStatus('error', `❌ Can't inject script: ${err.message}`);
      return;
    }
  }
  
  // Send message to content script to auto-fill
  try {
    chrome.tabs.sendMessage(tab.id, {
      action: 'autofill',
      student: student,
      settings: {
        highlight: settings.highlightFields
      }
    }, (response) => {
      // Check for Chrome runtime errors (content script not loaded)
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        showStatus('error', '❌ Content script not loaded. Try refreshing the page.');
        return;
      }
      
      if (response?.success) {
        showStatus('success', `✅ Filled ${response.filledFields?.length || 0} fields for ${student.name}`);
        
        if (settings.autoNext && currentIndex < students.length - 1) {
          setTimeout(() => navigateStudent(1), 500);
        }
      } else {
        const errorMsg = response?.error || 'No fields found. Make sure you\'re on a student form page.';
        showStatus('error', `❌ ${errorMsg}`);
      }
    });
  } catch (error) {
    console.error('Autofill error:', error);
    showStatus('error', `❌ ${error.message}`);
  }
}

async function handleBatchMode() {
  // Send message to content script to enable batch mode
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, {
    action: 'enableBatchMode',
    students: students,
    settings: settings
  });
  
  showStatus('active', '📋 Batch mode enabled on page');
}

// ============================================================================
// SETTINGS
// ============================================================================

async function saveSettings() {
  settings = {
    autoNext: elements.autoNextCheckbox.checked,
    confirmFill: elements.confirmFillCheckbox.checked,
    highlightFields: elements.highlightFieldsCheckbox.checked,
    devMode: elements.devModeCheckbox?.checked || false
  };
  
  await chrome.storage.local.set({ settings });
  
  // Re-check page status when dev mode changes
  await checkCurrentPage();
}

// ============================================================================
// PAGE STATUS
// ============================================================================

async function checkCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  
  const isLisPage = url.includes('lis.deped.gov.ph') || url.includes('deped.gov.ph');
  const isDevMode = settings.devMode;
  
  if (isLisPage) {
    updatePageStatus('ok', `✅ On DepEd LIS - ${new URL(url).hostname}`);
  } else if (isDevMode) {
    updatePageStatus('warning', `⚠️ Dev mode - testing on: ${new URL(url).hostname || 'unknown'}`);
  } else {
    updatePageStatus('error', `❌ Not on LIS. Go to lis.deped.gov.ph`);
  }
  
  return isLisPage || isDevMode;
}

function updatePageStatus(type, text) {
  if (elements.pageStatus && elements.pageStatusText) {
    elements.pageStatus.className = `page-status status-${type}`;
    elements.pageStatusText.textContent = text;
  }
}

// ============================================================================
// UI UPDATES
// ============================================================================

function updateUI() {
  const hasData = students.length > 0;
  
  // Update status
  if (hasData) {
    showStatus('active', `✅ ${students.length} students loaded`);
  } else {
    showStatus('inactive', 'No data loaded');
  }
  
  // Show/hide sections
  elements.importStatus.classList.toggle('hidden', !hasData);
  elements.actionsSection.style.display = hasData ? 'block' : 'none';
  elements.currentStudentSection.style.display = hasData ? 'block' : 'none';
  
  // Update stats
  if (hasData) {
    elements.studentCount.textContent = students.length;
    elements.schoolName.textContent = schoolInfo?.name || 'Unknown';
  }
  
  // Enable/disable action buttons
  elements.searchLrnBtn.disabled = !hasData;
  elements.autofillBtn.disabled = !hasData;
  elements.batchModeBtn.disabled = !hasData;
  
  // Update current student
  if (hasData) {
    updateCurrentStudent();
  }
}

function updateCurrentStudent() {
  const student = students[currentIndex];
  if (!student) return;
  
  // Update student card
  elements.currentStudentInfo.innerHTML = `
    <div class="name">${student.name || 'Unknown'}</div>
    <div class="lrn">LRN: ${student.lrn || 'N/A'}</div>
    <div class="details">
      <span>Grade ${student.gradeLevel || '-'}</span>
      <span>${student.section || '-'}</span>
      <span>${student.gender || '-'}</span>
    </div>
  `;
  
  // Update navigation
  elements.studentIndex.textContent = `${currentIndex + 1} of ${students.length}`;
  elements.prevBtn.disabled = currentIndex === 0;
  elements.nextBtn.disabled = currentIndex === students.length - 1;
}

function showStatus(type, message) {
  const icons = {
    active: '🟢',
    inactive: '⚪',
    success: '✅',
    error: '❌',
    warning: '⚠️'
  };
  
  elements.statusBar.className = `status-bar status-${type === 'success' ? 'active' : type === 'error' ? 'warning' : type}`;
  elements.statusIcon.textContent = icons[type] || '⚪';
  elements.statusText.textContent = message;
}

// ============================================================================
// EXTRACT TAB - LIS → EduSync
// ============================================================================

async function checkExtractPageStatus() {
  if (!elements.extractPageStatus) return;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';
  
  const isLisPage = url.includes('lis.deped.gov.ph') || url.includes('deped.gov.ph');
  const isDevMode = settings.devMode;
  
  if (isLisPage) {
    updateExtractPageStatus('ok', '✅ On DepEd LIS - Ready to extract');
    if (elements.extractBtn) elements.extractBtn.disabled = false;
  } else if (isDevMode) {
    updateExtractPageStatus('warning', '⚠️ Dev mode - Can try extraction');
    if (elements.extractBtn) elements.extractBtn.disabled = false;
  } else {
    updateExtractPageStatus('error', '❌ Navigate to DepEd LIS to extract data');
    if (elements.extractBtn) elements.extractBtn.disabled = true;
  }
}

function updateExtractPageStatus(type, text) {
  if (!elements.extractPageStatus) return;
  
  const icons = { ok: '✅', warning: '⚠️', error: '❌' };
  elements.extractPageStatus.className = `extract-status status-${type}`;
  if (elements.extractPageIcon) elements.extractPageIcon.textContent = icons[type] || '🔍';
  if (elements.extractPageText) elements.extractPageText.textContent = text;
}

async function handleExtractStudents() {
  showStatus('active', '🔄 Extracting students...');
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Check if we need to inject the content script
  const isLisPage = tab?.url?.includes('lis.deped.gov.ph') || tab?.url?.includes('deped.gov.ph');
  
  if (!isLisPage && settings.devMode) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js']
      });
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (err) {
      console.error('Failed to inject content script:', err);
    }
  }
  
  // Send extract message to content script
  chrome.tabs.sendMessage(tab.id, { action: 'extractStudents' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('Runtime error:', chrome.runtime.lastError);
      showStatus('error', '❌ Could not connect to page. Try refreshing.');
      return;
    }
    
    if (response?.success && response.students?.length > 0) {
      extractedStudents = response.students;
      extractedMetadata = response.metadata || {};
      
      showStatus('success', `✅ Extracted ${extractedStudents.length} students`);
      displayExtractedStudents();
    } else {
      showStatus('error', `❌ ${response?.error || 'No students found on this page'}`);
    }
  });
}

function displayExtractedStudents() {
  if (!elements.extractResult) return;
  
  // Show result section
  elements.extractResult.classList.remove('hidden');
  
  // Update count
  if (elements.extractedCount) {
    elements.extractedCount.textContent = extractedStudents.length;
  }
  
  // Update section info
  if (elements.extractedSection) {
    elements.extractedSection.textContent = extractedMetadata?.section || extractedMetadata?.gradeLevel || 'Unknown';
  }
  
  // Build preview table
  if (elements.extractedPreview) {
    const previewHtml = `
      <table class="preview-table">
        <thead>
          <tr>
            <th>LRN</th>
            <th>Name</th>
            <th>Sex</th>
          </tr>
        </thead>
        <tbody>
          ${extractedStudents.slice(0, 5).map(s => `
            <tr>
              <td class="lrn">${s.lrn || '-'}</td>
              <td>${s.fullName || s.name || '-'}</td>
              <td>${s.sex || s.gender || '-'}</td>
            </tr>
          `).join('')}
          ${extractedStudents.length > 5 ? `
            <tr class="more-row">
              <td colspan="3">... and ${extractedStudents.length - 5} more students</td>
            </tr>
          ` : ''}
        </tbody>
      </table>
    `;
    elements.extractedPreview.innerHTML = previewHtml;
  }
}

function buildExportData() {
  return {
    exportType: 'lis-extract',
    exportedAt: new Date().toISOString(),
    exportedFrom: 'EduSync LIS Helper Extension',
    metadata: {
      schoolId: extractedMetadata?.schoolId || '',
      schoolName: extractedMetadata?.schoolName || 'Unknown School',
      region: extractedMetadata?.region || '',
      division: extractedMetadata?.division || '',
      schoolYear: extractedMetadata?.schoolYear || '',
      gradeLevel: extractedMetadata?.gradeLevel || '',
      section: extractedMetadata?.section || ''
    },
    students: extractedStudents.map(s => ({
      lrn: s.lrn || '',
      lastName: s.lastName || '',
      firstName: s.firstName || '',
      middleName: s.middleName || '',
      fullName: s.fullName || s.name || '',
      sex: s.sex || s.gender || '',
      birthDate: s.birthDate || s.birthdate || '',
      age: s.age || null,
      motherTongue: s.motherTongue || '',
      address: s.address || '',
      barangay: s.barangay || '',
      municipality: s.municipality || '',
      province: s.province || '',
      fatherName: s.fatherName || '',
      motherName: s.motherName || '',
      guardianName: s.guardianName || '',
      contactNumber: s.contactNumber || ''
    })),
    totalCount: extractedStudents.length
  };
}

async function handleDownloadJson() {
  if (extractedStudents.length === 0) {
    showStatus('error', '❌ No students to export');
    return;
  }
  
  const exportData = buildExportData();
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const filename = `lis-extract-${extractedMetadata?.gradeLevel || 'students'}-${new Date().toISOString().split('T')[0]}.json`;
  
  // Use Chrome downloads API
  chrome.downloads.download({
    url: url,
    filename: filename,
    saveAs: true
  }, (downloadId) => {
    if (downloadId) {
      showStatus('success', '✅ Download started!');
    } else {
      showStatus('error', '❌ Download failed');
    }
  });
}

async function handleCopyJson() {
  if (extractedStudents.length === 0) {
    showStatus('error', '❌ No students to copy');
    return;
  }
  
  const exportData = buildExportData();
  
  try {
    await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    showStatus('success', '✅ Copied to clipboard!');
  } catch (err) {
    showStatus('error', '❌ Failed to copy');
  }
}
