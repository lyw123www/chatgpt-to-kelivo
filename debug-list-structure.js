// 在 ChatGPT 页面的控制台中运行此脚本，检查列表结构

console.log('=== 开始检查列表结构 ===');

// 查找所有消息
const messages = document.querySelectorAll('[data-message-author-role]');
console.log(`找到 ${messages.length} 条消息`);

messages.forEach((msg, msgIndex) => {
    const role = msg.getAttribute('data-message-author-role');
    console.log(`\n消息 ${msgIndex + 1}: 角色=${role}`);
    
    // 查找内容容器
    const contentContainer = msg.querySelector('.markdown, [class*="markdown"], [class*="prose"]');
    if (!contentContainer) {
        console.log('  ⚠️ 未找到内容容器');
        return;
    }
    
    console.log(`  内容容器: ${contentContainer.className}`);
    console.log(`  子元素数量: ${contentContainer.children.length}`);
    
    // 查找所有列表
    const lists = contentContainer.querySelectorAll('ul, ol');
    console.log(`  找到 ${lists.length} 个列表`);
    
    lists.forEach((list, listIndex) => {
        const listType = list.tagName.toLowerCase();
        console.log(`\n  列表 ${listIndex + 1}: <${listType}>`);
        console.log(`    直接子元素数量: ${list.children.length}`);
        
        // 查找所有 li
        const listItems = list.querySelectorAll('li');
        console.log(`    所有 li 数量（包括嵌套）: ${listItems.length}`);
        
        // 只查找直接子 li
        const directLi = Array.from(list.children).filter(child => child.tagName.toLowerCase() === 'li');
        console.log(`    直接子 li 数量: ${directLi.length}`);
        
        // 输出每个 li 的信息
        directLi.forEach((li, liIndex) => {
            console.log(`\n    li ${liIndex + 1}/${directLi.length}:`);
            console.log(`      子节点数量: ${li.childNodes.length}`);
            console.log(`      子元素数量: ${li.children.length}`);
            
            // 输出子节点类型
            const nodeTypes = [];
            li.childNodes.forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text) {
                        nodeTypes.push(`TEXT: "${text.substring(0, 30)}"`);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    nodeTypes.push(`<${node.tagName.toLowerCase()}>`);
                }
            });
            console.log(`      子节点: ${nodeTypes.join(', ')}`);
            
            // 输出文本内容预览
            const textContent = li.textContent.trim();
            console.log(`      文本内容: "${textContent.substring(0, 100)}"`);
            
            // 输出 HTML 结构
            console.log(`      HTML: ${li.outerHTML.substring(0, 200)}`);
        });
    });
});

console.log('\n=== 检查完成 ===');

// 额外：检查是否有隐藏的元素
console.log('\n=== 检查隐藏元素 ===');
const allLi = document.querySelectorAll('li');
console.log(`页面上所有 li 元素数量: ${allLi.length}`);

let hiddenCount = 0;
allLi.forEach(li => {
    const style = window.getComputedStyle(li);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        hiddenCount++;
        console.log(`  隐藏的 li: ${li.textContent.substring(0, 50)}`);
    }
});
console.log(`隐藏的 li 数量: ${hiddenCount}`);

// 检查是否有折叠的内容
console.log('\n=== 检查折叠内容 ===');
const collapsedElements = document.querySelectorAll('[aria-expanded="false"], .collapsed, [class*="collapse"]');
console.log(`可能折叠的元素数量: ${collapsedElements.length}`);
collapsedElements.forEach((el, index) => {
    console.log(`  折叠元素 ${index + 1}: ${el.tagName}.${el.className}`);
});

