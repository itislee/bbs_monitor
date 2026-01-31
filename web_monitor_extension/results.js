document.addEventListener('DOMContentLoaded', function() {
  const resultsBody = document.getElementById('resultsBody');
  const refreshBtn = document.getElementById('refreshBtn');
  const clearBtn = document.getElementById('clearBtn');
  
  // Load results from storage
  function loadResults() {
    chrome.storage.local.get(['matches'], function(result) {
      const matches = result.matches || [];
      
      // Clear current results
      resultsBody.innerHTML = '';
      
      if (matches.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" class="empty-message">No matches found yet. Configure URLs and keywords in options.</td>';
        resultsBody.appendChild(row);
        return;
      }
      
      // Sort matches by time (newest first)
      matches.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      // Add each match to the table
      matches.forEach(function(match) {
        const row = document.createElement('tr');
        
        // Format the context to highlight the keyword
        let context = match.context || '';
        if (match.keyword && context.toLowerCase().includes(match.keyword.toLowerCase())) {
          const regex = new RegExp(`(${match.keyword})`, 'gi');
          context = context.replace(regex, '<span class="keyword-highlight">$1</span>');
        }
        
        row.innerHTML = `
          <td>${match.keyword}</td>
          <td><a href="${match.url}" target="_blank" class="url-link">${match.url}</a></td>
          <td>${context}</td>
          <td class="timestamp">${new Date(match.timestamp).toLocaleString()}</td>
        `;
        
        resultsBody.appendChild(row);
      });
    });
  }
  
  // Clear all results
  function clearResults() {
    if (confirm('Are you sure you want to clear all match results?')) {
      chrome.storage.local.set({matches: []}, function() {
        loadResults();
      });
    }
  }
  
  // Event listeners
  refreshBtn.addEventListener('click', loadResults);
  clearBtn.addEventListener('click', clearResults);
  
  // Initial load
  loadResults();
});