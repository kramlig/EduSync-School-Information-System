// Run this in the browser console to clear React Query cache and reload

// Clear React Query cache
window.location.href = window.location.href.split('?')[0] + '?clearCache=' + Date.now();

// Force reload
setTimeout(() => {
  window.location.reload(true);
}, 100);
