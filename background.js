// 后台脚本：负责定时检查、匹配和通知
let monitoringEnabled = true;
let checkIntervalId = null;
let checkInterval = 30000; // 默认30秒

// 安装时设置默认值
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({
    monitoredUrls: ['https://bbs.woa.com/forum/view/3835'],
    keywords: ['apple'],
    checkInterval: 30
  });
  
  chrome.storage.local.set({
    notifiedPosts: {},
    monitoringEnabled: true,
    lastCheckTime: null,
    notificationCount: 0
  });
});

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch(message.action) {
    case 'pageChanged':
      // 收到页面变化通知，检查内容
      checkPageContent(message.url, message.title, null, message.content);
      break;
    case 'settingsUpdated':
      // 更新设置
      updateSettings();
      break;
    case 'monitoringToggled':
      // 更新监控状态
      monitoringEnabled = message.enabled;
      updateMonitoringState();
      break;
  }
});

// 初始化
init();

function init() {
  // 获取初始设置
  updateSettings();
  
  // 恢复监控状态
  chrome.storage.local.get(['monitoringEnabled'], (result) => {
    monitoringEnabled = result.monitoringEnabled !== false;
    updateMonitoringState();
  });
  
  // 每分钟检查一次，看是否有新内容
  checkIntervalId = setInterval(checkAllMonitoredUrls, 60000);
}

function updateSettings() {
  chrome.storage.sync.get({
    monitoredUrls: [],
    keywords: [],
    checkInterval: 30
  }, (items) => {
    // 更新检查间隔
    if (items.checkInterval && items.checkInterval !== checkInterval / 1000) {
      checkInterval = items.checkInterval * 1000;
      updateMonitoringState(); // 重新设置定时器
    }
  });
}

function updateMonitoringState() {
  // 清除现有的定时器
  if (checkIntervalId) {
    clearInterval(checkIntervalId);
    checkIntervalId = null;
  }
  
  // 如果启用监控，则设置新的定时器
  if (monitoringEnabled) {
    checkIntervalId = setInterval(checkAllMonitoredUrls, checkInterval);
  }
}

async function checkAllMonitoredUrls() {
  if (!monitoringEnabled) return;
  
  chrome.storage.sync.get({
    monitoredUrls: []
  }, async (items) => {
    for (const url of items.monitoredUrls) {
      try {
        await checkSingleUrl(url);
      } catch (error) {
        console.error('Error checking URL:', url, error);
      }
    }
  });
}

async function checkSingleUrl(url) {
  try {
    // 使用fetch API获取页面内容
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BBS Monitor Extension)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    await checkPageContent(url, '', html);
  } catch (error) {
    console.error('Failed to fetch URL:', url, error.message);
  } finally {
    // 更新最后检查时间
    await chrome.storage.local.set({
      lastCheckTime: Date.now()
    });
  }
}

async function checkPageContent(url, title = '', html = null, contentFromTab = null) {
  if (!monitoringEnabled) return;
  
  // 如果没有提供HTML，尝试从当前页面获取
  if (!html && !contentFromTab) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BBS Monitor Extension)'
        }
      });
      
      if (!response.ok) return;
      html = await response.text();
    } catch (error) {
      console.error('Error fetching page content:', error);
      return;
    }
  }
  
  chrome.storage.sync.get({
    keywords: []
  }, async (items) => {
    const keywords = items.keywords;
    if (!keywords || keywords.length === 0) return;
    
    let textContent = '';
    
    if (contentFromTab) {
      // 如果有从内容脚本传来的页面内容，优先使用
      textContent = contentFromTab;
    } else {
      // 否则从HTML中提取文本内容
      // 在background环境中，使用正则表达式来移除HTML标签
      textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    
    // 检查页面内容中是否包含关键字
    const foundKeywords = [];
    for (const keyword of keywords) {
      if (textContent.toLowerCase().includes(keyword.toLowerCase())) {
        foundKeywords.push(keyword);
        
        const post = {
          title: title || `Keyword "${keyword}" found on page`,
          url: url,
          keyword: keyword,
          timestamp: Date.now()
        };
        
        await notifyIfNew(post);
      }
    }
    
    // 记录本次扫描结果
    if (foundKeywords.length > 0 || keywords.length > 0) {
      const scanResult = {
        url: url,
        timestamp: Date.now(),
        foundKeywords: foundKeywords,
        totalKeywords: keywords.length,
        contentLength: textContent.length
      };
      
      // 获取之前的扫描结果并添加新的结果
      const prevResults = await chrome.storage.local.get(['recentScanResults']);
      const recentResults = prevResults.recentScanResults || [];
      
      // 保留最近的10次扫描结果
      recentResults.push(scanResult);
      if (recentResults.length > 10) {
        recentResults.shift();
      }
      
      await chrome.storage.local.set({ recentScanResults: recentResults });
    }
  });
}

function findMatchingPosts(content, keywords, baseUrl) {
  const posts = [];
  
  // 根据常见BBS结构查找帖子
  // 这里使用正则表达式匹配常见的帖子结构
  const postPatterns = [
    /<a[^>]*href=['"]([^'"]*thread[^'"]*)['"][^>]*>([^<]*)<\/a>/gi, // 包含thread的链接
    /<a[^>]*href=['"]([^'"]*post[^'"]*)['"][^>]*>([^<]*)<\/a>/gi,  // 包含post的链接
    /<a[^>]*href=['"]([^'"]*viewtopic[^'"]*)['"][^>]*>([^<]*)<\/a>/gi, // 包含viewtopic的链接
    /<div[^>]*class=["'].*thread.*["'][^>]*>[\s\S]*?<a[^>]*href=['"]([^'"]*)['"][^>]*>([^<]*)<\/a>/gi, // 带thread类的div
  ];
  
  for (const pattern of postPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const postUrl = match[1];
      const postTitle = match[2];
      
      // 检查标题是否包含关键字
      for (const keyword of keywords) {
        if (postTitle.toLowerCase().includes(keyword.toLowerCase())) {
          const fullPostUrl = new URL(postUrl, baseUrl).href;
          
          posts.push({
            title: postTitle,
            url: fullPostUrl,
            keyword: keyword,
            timestamp: Date.now()
          });
          break; // 找到匹配的关键字后跳出内层循环
        }
      }
    }
  }
  
  // 也检查所有文本内容中是否包含关键字
  for (const keyword of keywords) {
    const regex = new RegExp(keyword, 'gi');
    let match;
    while ((match = regex.exec(content)) !== null) {
      // 由于我们无法精确定位帖子，这里只是示例
      // 实际实现可能需要更复杂的解析
      break; // 避免太多假匹配
    }
  }
  
  return posts;
}

async function notifyIfNew(post) {
  // 获取已通知的帖子列表
  const result = await chrome.storage.local.get(['notifiedPosts', 'notificationCount']);
  const notifiedPosts = result.notifiedPosts || {};
  let notificationCount = result.notificationCount || 0;
  
  // 生成帖子的唯一标识符
  const postId = `${post.url}-${post.keyword}`;
  
  // 检查是否已经通知过
  if (notifiedPosts[postId]) {
    console.log(`Already notified about keyword "${post.keyword}" on page:`, post.url);
    return; // 已经通知过，不再重复
  }
  
  // 标记为已通知
  notifiedPosts[postId] = {
    timestamp: Date.now(),
    title: post.title,
    url: post.url,
    keyword: post.keyword
  };
  
  // 增加通知计数
  notificationCount++;
  
  await chrome.storage.local.set({ 
    notifiedPosts,
    notificationCount
  });
  
  console.log(`Found keyword "${post.keyword}" on page:`, post.url);
  
  // 尝试创建通知，但如果失败也不影响其他功能
  try {
    chrome.action.setBadgeText({ text: notificationCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
  } catch (badgeError) {
    console.error('Error updating badge:', badgeError);
  }
}

// 监听通知点击事件
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.storage.local.get([`notification_${notificationId}`], (result) => {
    const url = result[`notification_${notificationId}`];
    if (url) {
      chrome.tabs.create({ url: url });
    }
    chrome.notifications.clear(notificationId);
  });
});

// 监听通知按钮点击事件
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // "打开帖子"按钮
    chrome.storage.local.get([`notification_${notificationId}`], (result) => {
      const url = result[`notification_${notificationId}`];
      if (url) {
        chrome.tabs.create({ url: url });
      }
      chrome.notifications.clear(notificationId);
    });
  } else { // "忽略"按钮
    chrome.notifications.clear(notificationId);
  }
});