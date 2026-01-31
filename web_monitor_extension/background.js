// Web Monitor Background Script

// Initialize extension
chrome.runtime.onInstalled.addListener(function() {
  console.log('Web Monitor installed');
  
  // Set default settings
  chrome.storage.sync.get(['monitoredUrls', 'keywords', 'checkInterval'], function(result) {
    if (!result.monitoredUrls) {
      chrome.storage.sync.set({
        monitoredUrls: [],
        keywords: [],
        checkInterval: 300 // Default to 5 minutes
      });
    }
  });
  
  // Start monitoring if settings exist
  startMonitoring();
});

// Listen for messages from popup or options
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateAlarm') {
    startMonitoring();
    sendResponse({success: true});
  } else if (request.action === 'manualCheck') {
    performCheck().then(() => {
      sendResponse({success: true});
    }).catch(error => {
      console.error('Manual check failed:', error);
      sendResponse({success: false, error: error.message});
    });
    return true; // Keep message channel open for async response
  }
  return false;
});

// Start monitoring with alarm
function startMonitoring() {
  chrome.storage.sync.get(['monitoredUrls', 'keywords', 'checkInterval'], function(result) {
    const urls = result.monitoredUrls || [];
    const keywords = result.keywords || [];
    const interval = result.checkInterval || 300; // Default to 5 minutes
    
    if (urls.length > 0 && keywords.length > 0) {
      // Clear existing alarm
      chrome.alarms.clear('webMonitorCheck');
      
      // Create new alarm
      chrome.alarms.create('webMonitorCheck', {
        delayInMinutes: 1, // First check after 1 minute
        periodInMinutes: interval / 60 // Subsequent checks based on user setting
      });
      
      console.log(`Monitoring started: ${urls.length} URLs, ${keywords.length} keywords, every ${interval} seconds`);
    } else {
      // Clear alarm if no URLs or keywords
      chrome.alarms.clear('webMonitorCheck');
      console.log('Monitoring stopped: no URLs or keywords configured');
    }
  });
}

// Alarm listener
chrome.alarms.onAlarm.addListener(function(alarm) {
  if (alarm.name === 'webMonitorCheck') {
    performCheck();
  }
});

// Main check function
async function performCheck() {
  console.log('Performing web check...');
  
  // Get settings
  const settings = await chrome.storage.sync.get(['monitoredUrls', 'keywords']);
  const urls = settings.monitoredUrls || [];
  const keywords = settings.keywords || [];
  
  if (urls.length === 0 || keywords.length === 0) {
    console.log('No URLs or keywords to monitor');
    return;
  }
  
  let allMatches = [];
  
  // Process each URL
  for (const url of urls) {
    try {
      const content = await fetchPageContent(url);
      const matches = findKeywordMatches(content, keywords, url);
      
      if (matches.length > 0) {
        allMatches = allMatches.concat(matches);
        console.log(`Found ${matches.length} matches in ${url}`);
      }
    } catch (error) {
      console.error(`Error checking ${url}:`, error);
    }
  }
  
  // Save matches to storage
  if (allMatches.length > 0) {
    await saveMatches(allMatches);
    
    // Show notification
    showNotification(allMatches);
  }
  
  // Update stats
  await updateStats(allMatches.length);
  
  console.log(`Check completed. Found ${allMatches.length} total matches.`);
}

// Fetch page content
async function fetchPageContent(url) {
  // Using Chrome's fetch API to get page content
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Web Monitor Extension) AppleWebKit/537.36'
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const content = await response.text();
  return content;
}

// Find keyword matches in content
function findKeywordMatches(content, keywords, url) {
  const matches = [];
  
  // Extract text content from HTML
  const doc = new DOMParser().parseFromString(content, 'text/html');
  const textContent = doc.body ? doc.body.innerText : content;
  
  // Search for each keyword
  keywords.forEach(keyword => {
    if (keyword.trim() !== '') {
      const regex = new RegExp(keyword.trim(), 'gi');
      let match;
      
      while ((match = regex.exec(textContent)) !== null) {
        // Get surrounding context (100 characters before and after)
        const startIndex = Math.max(0, match.index - 100);
        const endIndex = Math.min(textContent.length, match.index + match[0].length + 100);
        const context = textContent.substring(startIndex, endIndex).trim();
        
        matches.push({
          keyword: keyword.trim(),
          url: url,
          context: context,
          timestamp: new Date().toISOString()
        });
      }
    }
  });
  
  return matches;
}

// Save matches to storage
async function saveMatches(newMatches) {
  const result = await chrome.storage.local.get(['matches']);
  let existingMatches = result.matches || [];
  
  // Combine new matches with existing ones
  const allMatches = newMatches.concat(existingMatches);
  
  // Keep only the most recent 100 matches
  const latestMatches = allMatches
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 100);
  
  await chrome.storage.local.set({matches: latestMatches});
}

// Show notification for new matches
function showNotification(matches) {
  const count = matches.length;
  
  // Update badge
  chrome.action.setBadgeText({text: count.toString()});
  chrome.action.setBadgeBackgroundColor({color: '#FF0000'});
  
  // Create notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icon48.png', // You'll need to add this icon
    title: `Web Monitor: ${count} New Matches Found`,
    message: `Found ${count} matches across monitored websites.`,
    priority: 2,
    requireInteraction: false
  });
}

// Update statistics
async function updateStats(matchCount) {
  const timestamp = Date.now();
  
  await chrome.storage.local.set({
    lastCheckTime: timestamp,
    matchCount: matchCount
  });
}

// Handle extension startup
chrome.runtime.onStartup.addListener(function() {
  console.log('Web Monitor started');
  startMonitoring();
});