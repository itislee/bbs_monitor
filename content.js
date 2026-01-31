// 内容脚本：负责检测页面变化
(function() {
  console.log('BBS Monitor content script loaded');
  
  // 检查当前页面是否在监控列表中
  chrome.storage.sync.get(['monitoredUrls'], function(items) {
    if (!items.monitoredUrls || !Array.isArray(items.monitoredUrls)) {
      return;
    }
    
    const currentUrl = window.location.href;
    const isMonitored = items.monitoredUrls.some(url => 
      currentUrl.includes(url.replace(/^https?:\/\//, '').split('/')[0]) // 匹配域名
    );
    
    if (isMonitored) {
      console.log('Current page is being monitored:', currentUrl);
      startMonitoring();
    }
  });
  
  function startMonitoring() {
    // 初始化MutationObserver来检测DOM变化
    const observer = new MutationObserver(function(mutations) {
      let shouldNotify = false;
      
      mutations.forEach(function(mutation) {
        // 当页面内容发生变化时，标记需要检查
        if (mutation.type === 'childList' || mutation.type === 'characterData') {
          shouldNotify = true;
        }
      });
      
      if (shouldNotify) {
        // 避免过于频繁的通知
        debounce(notifyBackgroundCheck, 2000)();
      }
    });
    
    // 开始观察整个文档
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
    
    // 页面加载完成后立即检查一次
    setTimeout(notifyBackgroundCheck, 3000);
  }
  
  function notifyBackgroundCheck() {
    // 获取页面文本内容和HTML内容
    const pageText = getPageText();
    const pageHTML = getPageHTML();
    
    console.log('Sending page data to background:', {
      url: window.location.href,
      title: document.title,
      contentLength: pageText.length,
      htmlLength: pageHTML.length
    });
    
    // 通知后台脚本检查当前页面
    chrome.runtime.sendMessage({
      action: 'pageChanged',
      url: window.location.href,
      title: document.title,
      content: pageText, // 发送页面文本内容供关键字检测
      html: pageHTML   // 发送页面HTML内容供链接解析
    }).catch(error => {
      console.error('Error sending message to background:', error);
      // 忽略错误，可能是后台脚本尚未加载
    });
  }
  
  // 获取页面文本内容
  function getPageText() {
    // 移除脚本和样式标签，只获取纯文本内容
    const clone = document.cloneNode(true);
    const scripts = clone.querySelectorAll('script, style, noscript');
    scripts.forEach(script => script.remove());
    
    return clone.body.innerText || clone.body.textContent || '';
  }
  
  // 获取页面HTML内容
  function getPageHTML() {
    // 移除脚本标签以避免安全问题，保留HTML结构用于链接解析
    const clone = document.cloneNode(true);
    const scripts = clone.querySelectorAll('script');
    scripts.forEach(script => script.remove());
    
    return clone.documentElement.outerHTML;
  }
  
  // 防抖函数，避免过于频繁的调用
  let debounceTimer = null;
  function debounce(func, wait) {
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(debounceTimer);
        func(...args);
      };
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(later, wait);
    };
  }
})();