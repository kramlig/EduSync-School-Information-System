/**
 * EduSync LIS Helper - Background Service Worker
 * 
 * Handles:
 * - Extension lifecycle events
 * - Message routing between popup and content scripts
 * - Badge updates
 */

// ============================================================================
// LIFECYCLE EVENTS
// ============================================================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[EduSync LIS Helper] Extension installed:', details.reason);
  
  if (details.reason === 'install') {
    // First install - show welcome
    chrome.storage.local.set({ 
      installed: true, 
      installedAt: new Date().toISOString() 
    });
  }
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[EduSync LIS Helper] Background received:', message);
  
  switch (message.action) {
    case 'updateBadge':
      updateBadge(message.count);
      sendResponse({ success: true });
      break;
      
    case 'getTabInfo':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep channel open for async
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// ============================================================================
// BADGE MANAGEMENT
// ============================================================================

function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#2563eb' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================================================
// TAB EVENTS
// ============================================================================

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if we're on a DepEd LIS page
    if (tab.url.includes('deped.gov.ph')) {
      console.log('[EduSync LIS Helper] DepEd page detected:', tab.url);
      
      // Could inject additional scripts or update badge
      chrome.storage.local.get(['students'], (result) => {
        if (result.students && result.students.length > 0) {
          updateBadge(result.students.length);
        }
      });
    }
  }
});
