// 在 ChatGPT 页面的控制台中运行此脚本，测试内容提取

console.log('=== 开始测试内容提取 ===');

// 查找第一个助手消息（通常包含列表）
const messages = document.querySelectorAll('[data-message-author-role="assistant"]');
if (messages.length === 0) {
    console.error('未找到助手消息');
} else {
    console.log(`找到 ${messages.length} 条助手消息`);
    
    // 测试第一条助手消息
    const firstMessage = messages[0];
    console.log('\n测试第一条助手消息:');
    
    // 查找内容容器
    const contentContainer = firstMessage.querySelector('.markdown, [class*="markdown"], [class*="prose"]');
    if (!contentContainer) {
        console.error('未找到内容容器');
    } else {
        console.log(`内容容器: ${contentContainer.className}`);
        console.log(`子元素数量: ${contentContainer.children.length}`);
        
        // 输出原始 HTML（前 1000 字符）
        console.log('\n原始 HTML:');
        console.log(contentContainer.outerHTML.substring(0, 1000));
        
        // 输出 innerText
        console.log('\ninnerText:');
        console.log(contentContainer.innerText.substring(0, 500));
        
        // 查找列表
        const lists = contentContainer.querySelectorAll('ul, ol');
        console.log(`\n找到 ${lists.length} 个列表`);
        
        lists.forEach((list, index) => {
            console.log(`\n列表 ${index + 1}:`);
            console.log(`  类型: ${list.tagName}`);
            console.log(`  直接子 li 数量: ${Array.from(list.children).filter(c => c.tagName === 'LI').length}`);
            console.log(`  所有 li 数量: ${list.querySelectorAll('li').length}`);
            
            // 输出每个 li 的文本
            const directLi = Array.from(list.children).filter(c => c.tagName === 'LI');
            directLi.forEach((li, liIndex) => {
                console.log(`  li ${liIndex + 1}: ${li.textContent.trim().substring(0, 80)}`);
            });
        });
    }
}

console.log('\n=== 测试完成 ===');

// 提供一个简单的提取函数供手动测试
window.testExtraction = function(messageIndex = 0) {
    const messages = document.querySelectorAll('[data-message-author-role]');
    if (messageIndex >= messages.length) {
        console.error(`消息索引 ${messageIndex} 超出范围（共 ${messages.length} 条消息）`);
        return;
    }
    
    const message = messages[messageIndex];
    const role = message.getAttribute('data-message-author-role');
    console.log(`\n测试消息 ${messageIndex + 1}: 角色=${role}`);
    
    const contentContainer = message.querySelector('.markdown, [class*="markdown"], [class*="prose"]');
    if (!contentContainer) {
        console.error('未找到内容容器');
        return;
    }
    
    console.log('内容容器 HTML:');
    console.log(contentContainer.outerHTML);
    
    console.log('\ninnerText:');
    console.log(contentContainer.innerText);
    
    return contentContainer;
};

console.log('\n提示：可以使用 testExtraction(索引) 来测试特定消息');
console.log('例如：testExtraction(0) 测试第一条消息');
console.log('      testExtraction(1) 测试第二条消息');

