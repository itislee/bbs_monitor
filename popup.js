document.addEventListener('DOMContentLoaded', function() {
  const toggleButton = document.getElementById('toggleMonitoring');
  const openOptionsButton = document.getElementById('openOptions');
  const statusText = document.getElementById('statusText');
  const lastCheckInfo = document.getElementById('lastCheckInfo');
  const notificationCount = document.getElementById('notificationCount');
  const monitoredUrlCount = document.getElementById('monitoredUrlCount');
  const statusSection = document.getElementById('statusSection');
  const infoSection = document.getElementById('infoSection');

  // 获取当前监控状态和相关信息
  updatePopupInfo();

  // 切换监控状态
  toggleButton.addEventListener('click', function() {
    chrome.storage.local.get(['monitoringEnabled'], function(result) {
      const isEnabled = result.monitoringEnabled !== false;
      const newStatus = !isEnabled;
      
      chrome.storage.local.set({monitoringEnabled: newStatus}, function() {
        updatePopupInfo();
        
        // 通知背景脚本状态变化
        chrome.runtime.sendMessage({
          action: "monitoringToggled",
          enabled: newStatus
        });
      });
    });
  });

  // 打开选项页面
  openOptionsButton.addEventListener('click', function() {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      // 对于较老版本的Chrome
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
  
  // 打开结果页面
  const openResultsButton = document.getElementById('openResults');
  openResultsButton.addEventListener('click', function() {
    // 打开结果页面
    chrome.tabs.create({ url: chrome.runtime.getURL('results.html') });
    window.close(); // 关闭popup窗口
  });

  function updatePopupInfo() {
    // 获取监控状态
    chrome.storage.local.get(['monitoringEnabled', 'lastCheckTime', 'notificationCount'], function(result) {
      const isEnabled = result.monitoringEnabled !== false;
      const lastCheckTime = result.lastCheckTime;
      const notificationCountValue = result.notificationCount || 0;
      
      // 更新监控状态
      if (isEnabled) {
        statusText.textContent = '运行中';
        statusSection.className = 'section status-section status-enabled';
        toggleButton.textContent = '停止监控';
        toggleButton.classList.add('toggle-on');
        toggleButton.classList.remove('toggle-off');
      } else {
        statusText.textContent = '已停止';
        statusSection.className = 'section status-section status-disabled';
        toggleButton.textContent = '开始监控';
        toggleButton.classList.add('toggle-off');
        toggleButton.classList.remove('toggle-on');
      }
      
      // 更新上次检查时间
      if (lastCheckTime) {
        const date = new Date(lastCheckTime);
        lastCheckInfo.textContent = `上次检查: ${formatDateTime(date)}`;
      } else {
        lastCheckInfo.textContent = '上次检查: 未开始';
      }
      
      // 更新通知计数
      notificationCount.textContent = `通知数: ${notificationCountValue}`;
    });
    
    // 获取监控URL数量和检查间隔
    chrome.storage.sync.get(['monitoredUrls', 'checkInterval'], function(result) {
      const urls = result.monitoredUrls || [];
      const checkInterval = result.checkInterval || 30; // 默认30秒
      
      monitoredUrlCount.textContent = `监控URL数: ${urls.length} | 检查间隔: ${checkInterval}秒`;
    });
    
    // 获取最近的检测结果
    chrome.storage.local.get(['recentScanResults'], function(result) {
      const recentResults = result.recentScanResults || [];
      if (recentResults.length > 0) {
        // 显示最近一次扫描的结果摘要
        const latestResult = recentResults[recentResults.length - 1];
        const resultElement = document.getElementById('scanResultInfo');
        if (resultElement) {
          resultElement.textContent = `上次扫描: ${latestResult.foundKeywords.length}个关键字匹配`;
          resultElement.title = `匹配的关键字: ${latestResult.foundKeywords.join(', ')}`;
        }
      }
    });
  }
  
  // 格式化日期时间的辅助函数
  function formatDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  
  // 每5秒更新一次信息
  setInterval(updatePopupInfo, 5000);
});