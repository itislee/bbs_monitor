// 结果页面脚本
let currentPage = 1;
const itemsPerPage = 5; // 每页显示5个项目
let allPosts = []; // 存储所有帖子的全局变量

document.addEventListener('DOMContentLoaded', function() {
  loadResults();
  
  // 为分页按钮添加事件监听器
  document.getElementById('prev-page').addEventListener('click', goToPrevPage);
  document.getElementById('next-page').addEventListener('click', goToNextPage);
});

function loadResults() {
  chrome.storage.local.get(['notifiedPosts'], function(result) {
    const notifiedPosts = result.notifiedPosts || {};
    
    // 将对象转换为数组并按时间排序（最新的在前面）
    allPosts = Object.values(notifiedPosts);
    allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    // 重置到第一页
    currentPage = 1;
    
    // 显示当前页
    renderPage();
  });
}

function renderPage() {
  const container = document.getElementById('results-container');
  const paginationContainer = document.getElementById('pagination-container');
  
  if (allPosts.length === 0) {
    container.innerHTML = '<div class="empty-results">暂无匹配结果</div>';
    paginationContainer.style.display = 'none';
    return;
  }
  
  // 计算总页数
  const totalPages = Math.ceil(allPosts.length / itemsPerPage);
  
  // 计算当前页的起始和结束索引
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, allPosts.length);
  const currentPosts = allPosts.slice(startIndex, endIndex);
  
  // 清空容器
  container.innerHTML = '';
  
  // 创建结果列表
  currentPosts.forEach(post => {
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
      window.close(); // 关闭结果页面
    });
    
    container.appendChild(resultItem);
  });
  
  // 更新分页信息
  updatePaginationInfo(totalPages);
}

function updatePaginationInfo(totalPages) {
  const paginationContainer = document.getElementById('pagination-container');
  const pageInfo = document.getElementById('pagination-info');
  const prevBtn = document.getElementById('prev-page');
  const nextBtn = document.getElementById('next-page');
  
  // 显示分页信息
  pageInfo.textContent = `第 ${currentPage} 页，共 ${totalPages} 页 (${allPosts.length} 条记录)`;
  
  // 更新按钮状态
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
  
  prevBtn.classList.toggle('disabled', currentPage <= 1);
  nextBtn.classList.toggle('disabled', currentPage >= totalPages);
  
  // 显示分页控件
  paginationContainer.style.display = 'block';
}

function goToPrevPage() {
  if (currentPage > 1) {
    currentPage--;
    renderPage();
  }
}

function goToNextPage() {
  const totalPages = Math.ceil(allPosts.length / itemsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderPage();
  }
}

// 定期刷新结果
setInterval(loadResults, 5000); // 每5秒刷新一次