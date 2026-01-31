document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleMonitoring');
  const statusText = document.getElementById('statusText');
  const statusDiv = document.getElementById('status');

  // 获取当前监控状态
  chrome.storage.local.get(['monitoringEnabled'], function(result) {
    const isEnabled = result.monitoringEnabled !== false; // 默认为true
    updateUI(isEnabled);
  });

  // 切换监控状态
  toggleButton.addEventListener('click', function() {
    chrome.storage.local.get(['monitoringEnabled'], function(result) {
      const isEnabled = result.monitoringEnabled !== false;
      const newStatus = !isEnabled;
      
      chrome.storage.local.set({monitoringEnabled: newStatus}, function() {
        updateUI(newStatus);
        
        // 通知背景脚本状态变化
        chrome.runtime.sendMessage({
          action: "monitoringToggled",
          enabled: newStatus
        });
      });
    });
  });

  function updateUI(isEnabled) {
    if (isEnabled) {
      statusText.textContent = '运行中';
      statusDiv.className = 'status enabled';
      toggleButton.textContent = '停止监控';
      toggleButton.classList.add('toggle-on');
      toggleButton.classList.remove('toggle-off');
    } else {
      statusText.textContent = '已停止';
      statusDiv.className = 'status disabled';
      toggleButton.textContent = '开始监控';
      toggleButton.classList.add('toggle-off');
      toggleButton.classList.remove('toggle-on');
    }
  }
});