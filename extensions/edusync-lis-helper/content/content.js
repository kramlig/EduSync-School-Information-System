/**
 * EduSync LIS Helper - Content Script
 * 
 * Runs on DepEd LIS pages to:
 * - Detect form fields
 * - Auto-fill student data
 * - Provide visual feedback
 * 
 * NOTE: Field selectors need to be updated based on actual LIS page structure.
 * These are placeholder selectors that need to be mapped to real LIS fields.
 */

// ============================================================================
// FIELD MAPPINGS
// ============================================================================

/**
 * Map EduSync fields to LIS form field selectors.
 * UPDATE THESE based on actual DepEd LIS page inspection!
 * 
 * To find the correct selectors:
 * 1. Open DepEd LIS in Chrome
 * 2. Right-click on a form field
 * 3. Click "Inspect"
 * 4. Note the field's id, name, or unique class
 */
const FIELD_MAPPINGS = {
  // Student Basic Info
  lrn: {
    selectors: ['#lrn', 'input[name="lrn"]', 'input[name="LRN"]', '#txtLRN'],
    type: 'text'
  },
  lastName: {
    selectors: ['#lastName', 'input[name="lastName"]', 'input[name="lname"]', '#txtLastName'],
    type: 'text'
  },
  firstName: {
    selectors: ['#firstName', 'input[name="firstName"]', 'input[name="fname"]', '#txtFirstName'],
    type: 'text'
  },
  middleName: {
    selectors: ['#middleName', 'input[name="middleName"]', 'input[name="mname"]', '#txtMiddleName'],
    type: 'text'
  },
  extensionName: {
    selectors: ['#extName', 'input[name="extName"]', 'input[name="suffix"]', '#txtExtName'],
    type: 'text'
  },
  
  // Demographics
  birthdate: {
    selectors: ['#birthdate', 'input[name="birthdate"]', 'input[name="dob"]', '#txtBirthDate'],
    type: 'date'
  },
  gender: {
    selectors: ['#gender', 'select[name="gender"]', 'select[name="sex"]', '#ddlSex'],
    type: 'select',
    valueMap: {
      'Male': ['M', 'Male', 'MALE', '1'],
      'Female': ['F', 'Female', 'FEMALE', '2']
    }
  },
  
  // Address
  region: {
    selectors: ['#region', 'select[name="region"]', '#ddlRegion'],
    type: 'select'
  },
  province: {
    selectors: ['#province', 'select[name="province"]', '#ddlProvince'],
    type: 'select'
  },
  municipality: {
    selectors: ['#municipality', 'select[name="municipality"]', '#ddlMunicipality'],
    type: 'select'
  },
  barangay: {
    selectors: ['#barangay', 'select[name="barangay"]', '#ddlBarangay'],
    type: 'select'
  },
  streetAddress: {
    selectors: ['#street', 'input[name="street"]', 'input[name="address"]', '#txtStreet'],
    type: 'text'
  },
  
  // Parent/Guardian
  fatherName: {
    selectors: ['#fatherName', 'input[name="fatherName"]', '#txtFatherName'],
    type: 'text'
  },
  motherName: {
    selectors: ['#motherName', 'input[name="motherName"]', '#txtMotherName'],
    type: 'text'
  },
  guardianName: {
    selectors: ['#guardianName', 'input[name="guardianName"]', '#txtGuardianName'],
    type: 'text'
  },
  contactNumber: {
    selectors: ['#contact', 'input[name="contact"]', 'input[name="phone"]', '#txtContact'],
    type: 'text'
  },
  
  // Academic
  gradeLevel: {
    selectors: ['#gradeLevel', 'select[name="gradeLevel"]', '#ddlGradeLevel'],
    type: 'select'
  },
  section: {
    selectors: ['#section', 'input[name="section"]', 'select[name="section"]', '#ddlSection'],
    type: 'text'
  }
};

// ============================================================================
// STATE
// ============================================================================

let isInitialized = false;
let batchModeEnabled = false;
let batchStudents = [];
let currentBatchIndex = 0;

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
  if (isInitialized) return;
  
  console.log('[EduSync LIS Helper] Content script loaded');
  
  // Add floating toolbar
  createFloatingToolbar();
  
  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
  
  isInitialized = true;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

function handleMessage(message, sender, sendResponse) {
  console.log('[EduSync LIS Helper] Received message:', message.action);
  
  switch (message.action) {
    case 'searchLrn':
      searchByLrn(message.lrn);
      sendResponse({ success: true });
      break;
      
    case 'autofill':
      const result = autofillForm(message.student, message.settings);
      sendResponse(result);
      break;
      
    case 'enableBatchMode':
      enableBatchMode(message.students, message.settings);
      sendResponse({ success: true });
      break;
      
    case 'extractStudents':
      const extractResult = extractStudentsFromPage();
      sendResponse(extractResult);
      break;
      
    case 'ping':
      sendResponse({ success: true, message: 'Content script active' });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true; // Keep channel open for async response
}

// ============================================================================
// SEARCH BY LRN
// ============================================================================

function searchByLrn(lrn) {
  console.log('[EduSync LIS Helper] Searching for LRN:', lrn);
  
  // Try to find and fill the LRN search field
  const searchField = findElement([
    '#searchLrn',
    'input[name="searchLrn"]',
    'input[placeholder*="LRN"]',
    'input[placeholder*="Search"]',
    '#txtSearch'
  ]);
  
  if (searchField) {
    searchField.value = lrn;
    searchField.dispatchEvent(new Event('input', { bubbles: true }));
    searchField.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Try to trigger search button
    const searchButton = findElement([
      'button[type="submit"]',
      '#btnSearch',
      'button:contains("Search")',
      'input[type="submit"]'
    ]);
    
    if (searchButton) {
      searchButton.click();
    }
    
    showNotification(`🔍 Searching for LRN: ${lrn}`, 'info');
  } else {
    showNotification('❌ Could not find search field', 'error');
  }
}

// ============================================================================
// AUTO-FILL FORM
// ============================================================================

function autofillForm(student, settings = {}) {
  console.log('[EduSync LIS Helper] Auto-filling form for:', student.name);
  
  const filledFields = [];
  const errors = [];
  
  // Map student data to field mappings
  const dataToFill = {
    lrn: student.lrn,
    lastName: student.lastName || extractLastName(student.name),
    firstName: student.firstName || extractFirstName(student.name),
    middleName: student.middleName || '',
    extensionName: student.extensionName || student.suffix || '',
    birthdate: student.birthdate,
    gender: student.gender || student.sex,
    region: student.region,
    province: student.province,
    municipality: student.municipality || student.city,
    barangay: student.barangay,
    streetAddress: student.streetAddress || student.address,
    fatherName: student.fatherName,
    motherName: student.motherName,
    guardianName: student.guardianName,
    contactNumber: student.contactNumber || student.phone,
    gradeLevel: student.gradeLevel,
    section: student.section
  };
  
  // Fill each field
  for (const [fieldKey, value] of Object.entries(dataToFill)) {
    if (!value) continue;
    
    const mapping = FIELD_MAPPINGS[fieldKey];
    if (!mapping) continue;
    
    const element = findElement(mapping.selectors);
    if (!element) {
      console.log(`[EduSync LIS Helper] Field not found: ${fieldKey}`);
      continue;
    }
    
    try {
      fillField(element, value, mapping, settings.highlight);
      filledFields.push(fieldKey);
    } catch (error) {
      console.error(`[EduSync LIS Helper] Error filling ${fieldKey}:`, error);
      errors.push({ field: fieldKey, error: error.message });
    }
  }
  
  // Show result notification
  if (filledFields.length > 0) {
    showNotification(`✅ Filled ${filledFields.length} fields for ${student.name}`, 'success');
  } else {
    showNotification('⚠️ No fields could be filled. Check if you\'re on the correct page.', 'warning');
  }
  
  return {
    success: filledFields.length > 0,
    filledFields,
    errors
  };
}

function fillField(element, value, mapping, highlight = true) {
  const tagName = element.tagName.toLowerCase();
  const inputType = element.type?.toLowerCase();
  
  if (tagName === 'select' || mapping.type === 'select') {
    // Handle dropdown
    fillSelect(element, value, mapping.valueMap);
  } else if (inputType === 'date' || mapping.type === 'date') {
    // Handle date input
    element.value = formatDate(value);
  } else {
    // Handle text input
    element.value = value;
  }
  
  // Trigger events
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
  
  // Highlight filled field
  if (highlight) {
    highlightField(element);
  }
}

function fillSelect(selectElement, value, valueMap = {}) {
  const options = Array.from(selectElement.options);
  
  // Try direct match first
  let option = options.find(o => 
    o.value.toLowerCase() === value.toString().toLowerCase() ||
    o.text.toLowerCase() === value.toString().toLowerCase()
  );
  
  // Try value map
  if (!option && valueMap) {
    for (const [key, possibleValues] of Object.entries(valueMap)) {
      if (key.toLowerCase() === value.toString().toLowerCase()) {
        option = options.find(o => 
          possibleValues.some(v => 
            o.value.toLowerCase() === v.toLowerCase() ||
            o.text.toLowerCase() === v.toLowerCase()
          )
        );
        break;
      }
    }
  }
  
  // Try partial match
  if (!option) {
    option = options.find(o => 
      o.text.toLowerCase().includes(value.toString().toLowerCase()) ||
      value.toString().toLowerCase().includes(o.text.toLowerCase())
    );
  }
  
  if (option) {
    selectElement.value = option.value;
  }
}

// ============================================================================
// BATCH MODE
// ============================================================================

function enableBatchMode(students, settings) {
  batchModeEnabled = true;
  batchStudents = students;
  currentBatchIndex = 0;
  
  updateFloatingToolbar();
  showNotification(`📋 Batch mode enabled: ${students.length} students`, 'info');
}

function processBatchNext() {
  if (!batchModeEnabled || currentBatchIndex >= batchStudents.length) {
    showNotification('✅ Batch processing complete!', 'success');
    batchModeEnabled = false;
    updateFloatingToolbar();
    return;
  }
  
  const student = batchStudents[currentBatchIndex];
  autofillForm(student, { highlight: true });
  currentBatchIndex++;
  updateFloatingToolbar();
}

// ============================================================================
// FLOATING TOOLBAR
// ============================================================================

function createFloatingToolbar() {
  const toolbar = document.createElement('div');
  toolbar.id = 'edusync-toolbar';
  toolbar.innerHTML = `
    <div class="edusync-toolbar-header">
      <span>📚 EduSync</span>
      <button class="edusync-minimize">−</button>
    </div>
    <div class="edusync-toolbar-content">
      <div class="edusync-status">Ready</div>
      <button class="edusync-btn" id="edusync-fill-next">Fill Next</button>
      <button class="edusync-btn" id="edusync-skip">Skip</button>
    </div>
  `;
  
  document.body.appendChild(toolbar);
  
  // Event listeners
  toolbar.querySelector('.edusync-minimize').addEventListener('click', () => {
    toolbar.classList.toggle('minimized');
  });
  
  toolbar.querySelector('#edusync-fill-next').addEventListener('click', processBatchNext);
  toolbar.querySelector('#edusync-skip').addEventListener('click', () => {
    currentBatchIndex++;
    updateFloatingToolbar();
    showNotification('⏭️ Skipped to next student', 'info');
  });
}

function updateFloatingToolbar() {
  const toolbar = document.getElementById('edusync-toolbar');
  if (!toolbar) return;
  
  const status = toolbar.querySelector('.edusync-status');
  const fillBtn = toolbar.querySelector('#edusync-fill-next');
  
  if (batchModeEnabled) {
    status.textContent = `Student ${currentBatchIndex + 1} of ${batchStudents.length}`;
    fillBtn.disabled = currentBatchIndex >= batchStudents.length;
  } else {
    status.textContent = 'Ready';
    fillBtn.disabled = true;
  }
}

// ============================================================================
// UTILITIES
// ============================================================================

function findElement(selectors) {
  for (const selector of selectors) {
    try {
      const element = document.querySelector(selector);
      if (element) return element;
    } catch (e) {
      // Invalid selector, skip
    }
  }
  return null;
}

function highlightField(element) {
  element.style.backgroundColor = '#fef3c7';
  element.style.border = '2px solid #f59e0b';
  element.style.transition = 'all 0.3s ease';
  
  setTimeout(() => {
    element.style.backgroundColor = '#dcfce7';
    element.style.border = '2px solid #22c55e';
  }, 500);
}

function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  
  // Return in YYYY-MM-DD format
  return date.toISOString().split('T')[0];
}

function extractLastName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(',');
  return parts[0]?.trim() || '';
}

function extractFirstName(fullName) {
  if (!fullName) return '';
  const parts = fullName.split(',');
  if (parts.length > 1) {
    const nameParts = parts[1].trim().split(' ');
    return nameParts[0] || '';
  }
  return '';
}

function showNotification(message, type = 'info') {
  // Remove existing notification
  const existing = document.getElementById('edusync-notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.id = 'edusync-notification';
  notification.className = `edusync-notification edusync-notification-${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// ============================================================================
// STUDENT EXTRACTION (LIS → EduSync)
// ============================================================================

/**
 * Extract students from the current LIS page
 * Supports multiple page formats: SF1 list, student tables, enrollment pages
 */
function extractStudentsFromPage() {
  console.log('[EduSync LIS Helper] Extracting students from page...');
  
  const students = [];
  const metadata = extractPageMetadata();
  
  // Try different extraction strategies
  let extracted = false;
  
  // Strategy 1: Look for data tables with student info
  extracted = extractFromDataTables(students);
  
  // Strategy 2: Look for SF1-style lists
  if (!extracted || students.length === 0) {
    extracted = extractFromSF1List(students);
  }
  
  // Strategy 3: Look for any table with LRN column
  if (!extracted || students.length === 0) {
    extracted = extractFromGenericTable(students);
  }
  
  // Strategy 4: Look for card/list layouts
  if (!extracted || students.length === 0) {
    extracted = extractFromCardLayout(students);
  }
  
  if (students.length > 0) {
    showNotification(`✅ Extracted ${students.length} students`, 'success');
    return { success: true, students, metadata };
  } else {
    showNotification('❌ No students found on this page', 'error');
    return { success: false, error: 'No student data found on this page. Try navigating to a student list or SF1 page.', students: [], metadata };
  }
}

/**
 * Extract page metadata (school, grade, section info)
 */
function extractPageMetadata() {
  const metadata = {
    schoolId: '',
    schoolName: '',
    region: '',
    division: '',
    schoolYear: '',
    gradeLevel: '',
    section: '',
    pageUrl: window.location.href
  };
  
  // Try to find school name
  const schoolSelectors = [
    '.school-name', '#schoolName', 'h1.school', '.header-school',
    '[data-school-name]', '.school-header'
  ];
  for (const sel of schoolSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      metadata.schoolName = el.textContent.trim();
      break;
    }
  }
  
  // Try to find grade level from page
  const gradeMatch = document.body.textContent.match(/Grade\s*(\d+|K|Kinder)/i);
  if (gradeMatch) {
    metadata.gradeLevel = gradeMatch[1];
  }
  
  // Try to find section name
  const sectionSelectors = [
    '.section-name', '#sectionName', '.section-header',
    '[data-section]'
  ];
  for (const sel of sectionSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      metadata.section = el.textContent.trim();
      break;
    }
  }
  
  // Try to find school year
  const yearMatch = document.body.textContent.match(/S\.Y\.?\s*(\d{4}\s*[-–]\s*\d{4})/i) ||
                    document.body.textContent.match(/School Year:?\s*(\d{4}\s*[-–]\s*\d{4})/i);
  if (yearMatch) {
    metadata.schoolYear = yearMatch[1].replace(/\s+/g, '');
  }
  
  console.log('[EduSync LIS Helper] Extracted metadata:', metadata);
  return metadata;
}

/**
 * Strategy 1: Extract from data tables
 */
function extractFromDataTables(students) {
  // Look for DataTables or similar
  const tables = document.querySelectorAll('table.dataTable, table.data-table, .dataTables_wrapper table');
  
  for (const table of tables) {
    const extracted = extractFromTable(table, students);
    if (extracted) return true;
  }
  
  return false;
}

/**
 * Strategy 2: Extract from SF1-style lists
 */
function extractFromSF1List(students) {
  // SF1 pages often have specific class names or IDs
  const sf1Tables = document.querySelectorAll(
    '#sf1Table, .sf1-table, table[data-type="sf1"], .enrollment-table'
  );
  
  for (const table of sf1Tables) {
    const extracted = extractFromTable(table, students);
    if (extracted) return true;
  }
  
  return false;
}

/**
 * Strategy 3: Extract from any table with LRN column
 */
function extractFromGenericTable(students) {
  const allTables = document.querySelectorAll('table');
  
  for (const table of allTables) {
    // Check if this table has an LRN column
    const headers = Array.from(table.querySelectorAll('th, thead td'));
    const headerTexts = headers.map(h => h.textContent?.toLowerCase().trim() || '');
    
    const hasLRN = headerTexts.some(h => h.includes('lrn') || h.includes('learner') || h.includes('reference'));
    const hasName = headerTexts.some(h => h.includes('name') || h.includes('learner'));
    
    if (hasLRN || hasName) {
      const extracted = extractFromTable(table, students);
      if (extracted) return true;
    }
  }
  
  return false;
}

/**
 * Strategy 4: Extract from card/list layouts
 */
function extractFromCardLayout(students) {
  // Look for repeated card/list items
  const cardSelectors = [
    '.student-card', '.learner-card', '.student-item',
    '[data-student-id]', '.student-row'
  ];
  
  for (const selector of cardSelectors) {
    const cards = document.querySelectorAll(selector);
    if (cards.length > 0) {
      for (const card of cards) {
        const student = extractStudentFromCard(card);
        if (student && student.lrn) {
          students.push(student);
        }
      }
      if (students.length > 0) return true;
    }
  }
  
  return false;
}
