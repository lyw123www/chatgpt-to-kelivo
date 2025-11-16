// 在 ChatGPT 控制台运行此脚本，检查页面结构

console.log('=== 检查页面结构 ===');

// 1. 检查是否有"显示更多"按钮
console.log('\n1. 检查"显示更多"按钮...');
const showMoreButtons = document.querySelectorAll('button');
const relevantButtons = Array.from(showMoreButtons).filter(btn => {
    const text = btn.textContent.toLowerCase();
    return text.includes('show') || 
           text.includes('more') || 
           text.includes('显示') || 
           text.includes('展开') ||
           text.includes('load') ||
           text.includes('加载');
});
console.log(`找到 ${relevantButtons.length} 个可能的按钮:`, relevantButtons.map(b => b.textContent));

// 2. 检查消息数量
console.log('\n2. 检查消息数量...');
const messages = document.querySelectorAll('[data-message-author-role]');
console.log(`找到 ${messages.length} 条消息`);

// 3. 检查是否有虚拟滚动容器
console.log('\n3. 检查虚拟滚动容器...');
const scrollContainers = document.querySelectorAll('[class*="scroll"], [class*="virtual"]');
console.log(`找到 ${scrollContainers.length} 个滚动容器`);
scrollContainers.forEach((container, i) => {
    console.log(`容器 ${i + 1}:`, container.className);
    console.log(`  scrollHeight: ${container.scrollHeight}`);
    console.log(`  clientHeight: ${container.clientHeight}`);
});

// 4. 检查 main 元素
console.log('\n4. 检查 main 元素...');
const main = document.querySelector('main');
if (main) {
    console.log('main 元素:');
    console.log(`  scrollHeight: ${main.scrollHeight}`);
    console.log(`  clientHeight: ${main.clientHeight}`);
    console.log(`  scrollTop: ${main.scrollTop}`);
    console.log(`  子元素数量: ${main.children.length}`);
}

// 5. 检查是否有懒加载标记
console.log('\n5. 检查懒加载标记...');
const lazyElements = document.querySelectorAll('[data-lazy], [loading="lazy"], [class*="lazy"]');
console.log(`找到 ${lazyElements.length} 个懒加载元素`);

// 6. 检查每条消息的内容长度
console.log('\n6. 检查每条消息的内容长度...');
messages.forEach((msg, i) => {
    const role = msg.getAttribute('data-message-author-role');
    const contentEl = msg.querySelector('.markdown, .whitespace-pre-wrap');
    if (contentEl) {
        const textLength = contentEl.textContent.length;
        const htmlLength = contentEl.innerHTML.length;
        console.log(`消息 ${i + 1} [${role}]: 文本长度=${textLength}, HTML长度=${htmlLength}`);
        
        // 检查是否有省略号或截断标记
        const text = contentEl.textContent;
        if (text.includes('...') || text.includes('…')) {
            console.log(`  ⚠️ 可能被截断（包含省略号）`);
        }
    }
});

// 7. 检查是否有折叠的内容
console.log('\n7. 检查折叠内容...');
const collapsedElements = document.querySelectorAll('[class*="collapse"], [class*="hidden"], [style*="display: none"]');
console.log(`找到 ${collapsedElements.length} 个可能折叠的元素`);

// 8. 尝试获取完整的 HTML
console.log('\n8. 获取完整的对话 HTML...');
const conversationContainer = document.querySelector('main') || document.body;
const fullHTML = conversationContainer.innerHTML;
console.log(`完整 HTML 长度: ${fullHTML.length} 字符`);

// 9. 检查是否有分页
console.log('\n9. 检查分页...');
const paginationElements = document.querySelectorAll('[class*="page"], [class*="pagination"]');
console.log(`找到 ${paginationElements.length} 个分页元素`);

// 10. 手动滚动测试
console.log('\n10. 手动滚动测试...');
console.log('请手动滚动页面，看看是否有更多消息加载');
console.log('然后再次运行此脚本，对比消息数量');

console.log('\n=== 检查完成 ===');

