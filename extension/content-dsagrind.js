console.log("DSA Grind Auto-Sync: Loaded on DSA Grind");

function syncQueue() {
  chrome.storage.local.get({ completedQueue: [] }, (data) => {
    const queue = data.completedQueue;
    if (queue && queue.length > 0) {
      console.log("DSA Grind Sync: Found problems to sync", queue);
      
      // Dispatch a custom event to the page
      window.postMessage({
        type: 'DSA_GRIND_SYNC',
        completed: queue
      }, '*');

      // Optimistically clear the queue
      chrome.storage.local.set({ completedQueue: [] });
    }
  });
}

// Check immediately on load
syncQueue();

// Check when window gets focus
window.addEventListener('focus', syncQueue);

// Listen for storage changes in case they submit while DSA Grind is open
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.completedQueue) {
    syncQueue();
  }
});
