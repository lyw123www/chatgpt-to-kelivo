// 在 ChatGPT 页面的控制台中运行此脚本，测试滚动功能

console.log('=== 开始测试滚动功能 ===');

// 查找滚动容器
const scrollableElement = document.querySelector('main') ||
                         document.querySelector('[class*="scroll"]') ||
                         document.documentElement;

console.log('滚动容器:', scrollableElement.tagName);
console.log('容器类名:', scrollableElement.className);

// 显示当前滚动信息
function showScrollInfo(label) {
    console.log(`\n${label}:`);
    console.log('  scrollHeight:', scrollableElement.scrollHeight);
    console.log('  clientHeight:', scrollableElement.clientHeight);
    console.log('  scrollTop:', scrollableElement.scrollTop);
    console.log('  window.innerHeight:', window.innerHeight);
    console.log('  document.body.scrollHeight:', document.body.scrollHeight);
    console.log('  document.documentElement.scrollHeight:', document.documentElement.scrollHeight);
}

// 滚动到底部
async function scrollToBottom() {
    console.log('\n🔽 开始滚动到底部...');
    
    for (let i = 0; i < 5; i++) {
        const scrollHeight = scrollableElement.scrollHeight || document.body.scrollHeight;
        console.log(`\n第 ${i + 1} 次滚动，当前高度: ${scrollHeight}`);
        
        // 滚动到底部
        if (scrollableElement === document.documentElement || scrollableElement === window) {
            window.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        } else {
            scrollableElement.scrollTo({
                top: scrollHeight,
                behavior: 'smooth'
            });
        }
        
        // 等待内容加载
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 检查是否有新内容加载
        const newScrollHeight = scrollableElement.scrollHeight || document.body.scrollHeight;
        if (newScrollHeight > scrollHeight) {
            console.log(`✅ 检测到新内容: ${scrollHeight} -> ${newScrollHeight}`);
        } else {
            console.log('⚠️ 没有新内容加载');
            if (i >= 2) {
                console.log('⚠️ 连续 3 次没有新内容，停止');
                break;
            }
        }
        
        showScrollInfo(`第 ${i + 1} 次滚动后`);
    }
    
    console.log('\n✅ 滚动到底部完成');
}

// 滚动到顶部
async function scrollToTop() {
    console.log('\n🔼 开始滚动到顶部...');
    
    if (scrollableElement === document.documentElement || scrollableElement === window) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    } else {
        scrollableElement.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✅ 滚动到顶部完成');
}

// 主测试函数
async function testScroll() {
    console.log('\n=== 开始测试 ===');
    
    showScrollInfo('初始状态');
    
    await scrollToBottom();
    
    console.log('\n等待 2 秒...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    showScrollInfo('滚动到底部后');
    
    await scrollToTop();
    
    console.log('\n等待 1 秒...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showScrollInfo('滚动到顶部后');
    
    // 查找消息数量
    const messages = document.querySelectorAll('[data-message-author-role]');
    console.log(`\n找到 ${messages.length} 条消息`);
    
    console.log('\n=== 测试完成 ===');
    console.log('\n如果 scrollHeight 还是很小（接近 clientHeight），说明 ChatGPT 的懒加载机制有问题');
    console.log('可能的原因：');
    console.log('1. 对话确实很短（只有几条消息）');
    console.log('2. ChatGPT 的 DOM 结构变化了');
    console.log('3. 需要更长的等待时间');
    console.log('4. 需要使用不同的滚动方法');
}

// 运行测试
testScroll();

// 提供手动测试函数
window.testScrollToBottom = scrollToBottom;
window.testScrollToTop = scrollToTop;
window.testShowScrollInfo = () => showScrollInfo('当前状态');

console.log('\n提示：可以手动调用以下函数：');
console.log('  testScrollToBottom() - 滚动到底部');
console.log('  testScrollToTop() - 滚动到顶部');
console.log('  testShowScrollInfo() - 显示当前滚动信息');

