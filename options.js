// 保存选项
document.getElementById('save').addEventListener('click', saveOptions);

// 页面加载时恢复选项
document.addEventListener('DOMContentLoaded', restoreOptions);

function saveOptions() {
  const monitoredUrls = document.getElementById('monitoredUrls').value.split('\n')
    .map(url => url.trim())
    .filter(url => url.length > 0);
  
  const keywords = document.getElementById('keywords').value.split(',')
    .map(keyword => keyword.trim())
    .filter(keyword => keyword.length > 0);
  
  const checkInterval = parseInt(document.getElementById('checkInterval').value) || 30;

  chrome.storage.sync.set({
    monitoredUrls: monitoredUrls,
    keywords: keywords,
    checkInterval: checkInterval
  }, () => {
    // 显示保存成功的状态
    const status = document.getElementById('status');
    status.textContent = '设置已保存';
    status.className = 'status success';
    status.style.display = 'block';
    
    // 2秒后隐藏状态信息
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
    
    // 向背景脚本发送更新信号
    chrome.runtime.sendMessage({action: "settingsUpdated"});
  });
}

function restoreOptions() {
  chrome.storage.sync.get({
    monitoredUrls: [],
    keywords: [],
    checkInterval: 30
  }, (items) => {
    document.getElementById('monitoredUrls').value = items.monitoredUrls.join('\n');
    document.getElementById('keywords').value = items.keywords.join(',');
    document.getElementById('checkInterval').value = items.checkInterval;
  });
}