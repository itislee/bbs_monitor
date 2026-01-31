document.addEventListener('DOMContentLoaded', function() {
  const statusEl = document.getElementById('status');
  const lastCheckEl = document.getElementById('lastCheck');
  const matchCountEl = document.getElementById('matchCount');
  const urlCountEl = document.getElementById('urlCount');
  const keywordCountEl = document.getElementById('keywordCount');
  const viewResultsBtn = document.getElementById('viewResults');
  const optionsBtn = document.getElementById('optionsBtn');
  const manualCheckBtn = document.getElementById('manualCheck');
  
  // Load settings and stats
  function updateStats() {
    chrome.storage.local.get(['lastCheckTime', 'matchCount'], function(localResult) {
      chrome.storage.sync.get(['monitoredUrls', 'keywords'], function(syncResult) {
        // Update last check time
        if (localResult.lastCheckTime) {
          const date = new Date(localResult.lastCheckTime);
          lastCheckEl.textContent = `Last Check: ${date.toLocaleTimeString()}`;
        } else {
          lastCheckEl.textContent = 'Last Check: Never';
        }
        
        // Update match count
        matchCountEl.textContent = `Matches Found: ${localResult.matchCount || 0}`;
        
        // Update URL count
        const urls = syncResult.monitoredUrls || [];
        urlCountEl.textContent = `URLs Monitored: ${urls.length}`;
        
        // Update keyword count
        const keywords = syncResult.keywords || [];
        keywordCountEl.textContent = `Keywords: ${keywords.length}`;
      });
    });
    
    // Check if monitor is active
    chrome.alarms.get('webMonitorCheck', function(alarm) {
      if (alarm) {
        statusEl.textContent = 'Monitor Active';
        statusEl.className = 'status active';
      } else {
        statusEl.textContent = 'Monitor Inactive';
        statusEl.className = 'status inactive';
      }
    });
  }
  
  // Initial update
  updateStats();
  
  // View results button
  viewResultsBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
  });
  
  // Options button
  optionsBtn.addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
  
  // Manual check button
  manualCheckBtn.addEventListener('click', function() {
    // Send message to background to perform manual check
    chrome.runtime.sendMessage({action: 'manualCheck'}, function(response) {
      if (response && response.success) {
        // Update UI to show check initiated
        const originalText = manualCheckBtn.textContent;
        manualCheckBtn.textContent = 'Checking...';
        setTimeout(() => {
          manualCheckBtn.textContent = originalText;
          updateStats(); // Refresh stats after a delay
        }, 2000);
      }
    });
  });
});