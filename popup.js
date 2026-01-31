document.addEventListener('DOMContentLoaded', function() {
  // 获取DOM元素
  const toggleButton = document.getElementById('toggleMonitoring');
  const openOptionsButton = document.getElementById('openOptions');
  const showResultsButton = document.getElementById('showResults');
  const goBackButton = document.getElementById('goBack');
  const statusPage = document.getElementById('statusPage');
  const resultsPage = document.getElementById('resultsPage');
  const resultsContainer = document.getElementById('resultsContainer');
  const statusText = document.getElementById('statusText');
  const lastCheckInfo = document.getElementById('lastCheckInfo');
  const notificationCount = document.getElementById('notificationCount');
  const monitoredUrlCount = document.getElementById('monitoredUrlCount');
  const statusSection = document.getElementById('statusSection');
  const infoSection = document.getElementById('infoSection');

  // 获取当前监控状态和相关信息
  updatePopupInfo();

  // 检查徽章计数并在启动时决定显示哪个页面
  chrome.action.getBadgeText({}, function(badgeText) {
    const notificationCountNum = parseInt(badgeText) || 0;
    if (notificationCountNum > 0) {
      // 如果有通知，直接显示结果页面
      statusPage.style.display = 'none';
      resultsPage.style.display = 'block';
      goBackButton.style.display = 'block';
      loadResults();
      
      // 清空徽章数字
      chrome.action.setBadgeText({ text: '' });
    } else {
      // 否则显示状态页面
      statusPage.style.display = 'block';
      resultsPage.style.display = 'none';
      goBackButton.style.display = 'none';
    }
  });

  // 切换到结果页面
  showResultsButton.addEventListener('click', async function() {
    statusPage.style.display = 'none';
    resultsPage.style.display = 'block';
    goBackButton.style.display = 'block';
    await loadResults();
    
    // 清空徽章数字
    chrome.action.setBadgeText({ text: '' });
  });

  // 返回状态页面
  goBackButton.addEventListener('click', function() {
    statusPage.style.display = 'block';
    resultsPage.style.display = 'none';
    goBackButton.style.display = 'none';
  });

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

  // 加载结果页面内容
  async function loadResults() {
    const result = await chrome.storage.local.get(['notifiedPosts']);
    const notifiedPosts = result.notifiedPosts || {};
    const container = resultsContainer;
    
    // 将对象转换为数组并按时间排序（最新的在前面）
    const postsArray = Object.values(notifiedPosts);
    postsArray.sort((a, b) => b.timestamp - a.timestamp);
    
    if (postsArray.length === 0) {
      container.innerHTML = '<div class="empty-results">暂无匹配结果</div>';
      return;
    }
    
    // 清空容器
    container.innerHTML = '';
    
    // 创建结果列表
    postsArray.forEach(post => {
      const resultItem = document.createElement('div');
      resultItem.className = 'result-item';
      
      // 格式化时间
      const timeStr = new Date(post.timestamp).toLocaleString('zh-CN');
      
      // 高亮关键字
      const highlightedTitle = post.title.replace(
        new RegExp(`(${post.keyword})`, 'gi'), 
        '<span class="result-keyword">$1</span>'
      );
      
      resultItem.innerHTML = `
        <div class="result-title">${highlightedTitle}</div>
        <div class="result-time">${timeStr}</div>
      `;
      
      // 添加点击事件
      resultItem.addEventListener('click', function() {
        chrome.tabs.create({ url: post.url });
        window.close(); // 关闭popup窗口
      });
      
      container.appendChild(resultItem);
    });
  }

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
      const checkInterval = result.checkInterval || 10; // 默认10秒
      
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
  
  // 定期更新结果页面（仅当结果页面可见时）
  setInterval(async function() {
    if (resultsPage.style.display === 'block') {
      await loadResults();
    }
  }, 5000);
});