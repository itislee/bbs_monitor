// 结果页面脚本
document.addEventListener('DOMContentLoaded', function() {
  loadResults();
});

function loadResults() {
  chrome.storage.local.get(['notifiedPosts'], function(result) {
    const notifiedPosts = result.notifiedPosts || {};
    const container = document.getElementById('results-container');
    
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
      
      resultItem.innerHTML = `
        <div class="result-title">${post.title}</div>
        <div class="result-url">${post.url}</div>
        <div class="result-keyword">关键字: ${post.keyword}</div>
        <div class="result-time">${timeStr}</div>
      `;
      
      // 添加点击事件
      resultItem.addEventListener('click', function() {
        chrome.tabs.create({ url: post.url });
        window.close(); // 关闭结果页面
      });
      
      container.appendChild(resultItem);
    });
  });
}

// 定期刷新结果
setInterval(loadResults, 5000); // 每5秒刷新一次