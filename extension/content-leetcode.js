console.log("DSA Grind Auto-Sync: Loaded on LeetCode");

function getSlugFromUrl() {
  const match = window.location.pathname.match(/\/problems\/([^\/]+)/);
  return match ? match[1] : null;
}

let hasSynced = false;

const observer = new MutationObserver(() => {
  // Try to find the Accepted text in the result pane
  const resultTextEl = document.querySelector('[data-e2e-locator="submission-result"]') || document.querySelector('.text-green-s');
  let isAccepted = false;

  if (resultTextEl && resultTextEl.textContent.includes('Accepted')) {
    isAccepted = true;
  } else {
    // Fallback: look through spans
    const spans = Array.from(document.querySelectorAll('span, div'));
    for (const span of spans) {
      if (span.textContent === 'Accepted' && (span.className.includes('green') || span.className.includes('success'))) {
        isAccepted = true;
        break;
      }
    }
  }

  if (isAccepted && !hasSynced) {
    hasSynced = true;
    const slug = getSlugFromUrl();
    if (slug) {
      const problemId = 'lc:' + slug;
      console.log("DSA Grind Sync: Detected Accepted for", problemId);

      chrome.storage.local.get({ completedQueue: [] }, (data) => {
        const queue = new Set(data.completedQueue);
        queue.add(problemId);
        chrome.storage.local.set({ completedQueue: Array.from(queue) }, () => {
          showToast(`✅ Synced ${slug} to DSA Grind`);
        });
      });
    }
  }
});

// Start observing the document
observer.observe(document.body, { childList: true, subtree: true });

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #6d55dd;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 2147483647;
    font-family: sans-serif;
    font-weight: bold;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    transition: opacity 0.3s;
  `;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
function injectCompanyTags() {
  const titleElement = document.querySelector('.text-title-large a') || document.querySelector('[data-cy="question-title"]');
  if (titleElement && !document.querySelector('.dsa-grind-badge-container')) {
    const badgeContainer = document.createElement('div');
    badgeContainer.className = 'dsa-grind-badge-container';
    badgeContainer.style.cssText = "display: flex; gap: 8px; margin-top: 10px;";
    
    // Default mock company until integrated with background storage
    const companies = ["Amazon"]; 
    
    companies.forEach(company => {
      const badge = document.createElement('span');
      badge.textContent = `🔥 ${company}`;
      badge.style.cssText = "background: rgba(255, 153, 0, 0.15); color: #ff9900; padding: 4px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; border: 1px solid rgba(255, 153, 0, 0.3);";
      badgeContainer.appendChild(badge);
    });

    titleElement.insertAdjacentElement('afterend', badgeContainer);
  }
}

setInterval(injectCompanyTags, 2000);
