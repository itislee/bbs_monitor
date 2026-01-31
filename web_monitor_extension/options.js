document.addEventListener('DOMContentLoaded', function() {
  const urlsContainer = document.getElementById('urlsContainer');
  const addUrlBtn = document.getElementById('addUrlBtn');
  const keywordsInput = document.getElementById('keywords');
  const checkIntervalInput = document.getElementById('checkInterval');
  const saveBtn = document.getElementById('saveBtn');
  
  // Load saved settings
  chrome.storage.sync.get(['monitoredUrls', 'keywords', 'checkInterval'], function(result) {
    // Load URLs
    const urls = result.monitoredUrls || [''];
    urls.forEach((url, index) => {
      addUrlInput(url, index === urls.length - 1);
    });
    
    // Load keywords
    if (result.keywords) {
      keywordsInput.value = result.keywords.join(', ');
    }
    
    // Load check interval
    if (result.checkInterval) {
      checkIntervalInput.value = result.checkInterval;
    }
  });
  
  // Add URL input field
  function addUrlInput(value = '', autoFocus = false) {
    const div = document.createElement('div');
    div.className = 'url-input';
    div.innerHTML = `
      <input type="text" class="url-field" placeholder="Enter URL to monitor (e.g., https://example.com)" value="${value}">
      <button class="remove-btn">-</button>
    `;
    
    urlsContainer.appendChild(div);
    
    const urlField = div.querySelector('.url-field');
    const removeBtn = div.querySelector('.remove-btn');
    
    if (autoFocus) {
      urlField.focus();
    }
    
    removeBtn.addEventListener('click', function() {
      if (urlsContainer.children.length > 1) {
        urlsContainer.removeChild(div);
      } else {
        urlField.value = '';
      }
    });
  }
  
  // Add URL button
  addUrlBtn.addEventListener('click', function() {
    addUrlInput('', true);
  });
  
  // Save settings
  saveBtn.addEventListener('click', function() {
    const urls = Array.from(urlsContainer.querySelectorAll('.url-field'))
      .map(input => input.value.trim())
      .filter(url => url !== '');
    
    const keywords = keywordsInput.value
      .split(',')
      .map(keyword => keyword.trim())
      .filter(keyword => keyword !== '');
    
    const checkInterval = parseInt(checkIntervalInput.value) || 300;
    
    chrome.storage.sync.set({
      monitoredUrls: urls,
      keywords: keywords,
      checkInterval: checkInterval
    }, function() {
      // Show confirmation
      const originalText = saveBtn.textContent;
      saveBtn.textContent = 'Saved!';
      setTimeout(() => {
        saveBtn.textContent = originalText;
      }, 2000);
      
      // Notify background script to update alarm
      chrome.runtime.sendMessage({action: 'updateAlarm'});
    });
  });
});