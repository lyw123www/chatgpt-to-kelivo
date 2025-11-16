// 在 ChatGPT 控制台运行此脚本，检查复制按钮的实现

console.log('=== 检查复制按钮 ===');

// 1. 找到所有按钮
console.log('\n1. 查找所有按钮...');
const allButtons = document.querySelectorAll('button');
console.log(`总共找到 ${allButtons.length} 个按钮`);

// 2. 找到所有可能的复制按钮
console.log('\n2. 查找复制按钮...');
const copyButtonsList = Array.from(allButtons).filter(btn => {
    const ariaLabel = btn.getAttribute('aria-label') || '';
    const title = btn.getAttribute('title') || '';
    const text = btn.textContent || '';
    const innerHTML = btn.innerHTML || '';

    return ariaLabel.toLowerCase().includes('copy') ||
           title.toLowerCase().includes('copy') ||
           text.toLowerCase().includes('copy') ||
           ariaLabel.includes('复制') ||
           title.includes('复制') ||
           innerHTML.includes('copy') ||
           innerHTML.includes('复制');
});

console.log(`找到 ${copyButtonsList.length} 个复制按钮`);

// 3. 显示前 5 个复制按钮的详细信息
console.log('\n3. 前 5 个复制按钮的详细信息:');
copyButtonsList.slice(0, 5).forEach((btn, i) => {
    console.log(`\n按钮 ${i + 1}:`);
    console.log('  aria-label:', btn.getAttribute('aria-label'));
    console.log('  title:', btn.getAttribute('title'));
    console.log('  class:', btn.className);
    console.log('  textContent:', btn.textContent.substring(0, 50));
    console.log('  innerHTML:', btn.innerHTML.substring(0, 100));
});

// 2. 检查第一个复制按钮的结构
if (copyButtonsList.length > 0) {
    const firstButton = copyButtonsList[0];
    console.log('\n2. 第一个复制按钮的信息:');
    console.log('  aria-label:', firstButton.getAttribute('aria-label'));
    console.log('  title:', firstButton.getAttribute('title'));
    console.log('  class:', firstButton.className);
    console.log('  父元素:', firstButton.parentElement?.tagName, firstButton.parentElement?.className);
    
    // 查找按钮关联的消息元素
    let messageElement = firstButton.closest('[data-message-author-role]');
    if (messageElement) {
        console.log('  关联的消息角色:', messageElement.getAttribute('data-message-author-role'));
        console.log('  消息 ID:', messageElement.getAttribute('data-message-id'));
    }
}

// 3. 模拟点击复制按钮，看看会发生什么
console.log('\n3. 尝试拦截复制事件...');

// 监听复制事件
let copiedText = '';
const copyListener = (e) => {
    copiedText = e.clipboardData.getData('text/plain');
    console.log('✅ 拦截到复制内容，长度:', copiedText.length);
    console.log('前 200 字符:', copiedText.substring(0, 200));
};

document.addEventListener('copy', copyListener);

// 4. 尝试模拟点击第一个复制按钮
if (copyButtonsList.length > 0) {
    console.log('\n4. 模拟点击第一个复制按钮...');
    const firstButton = copyButtonsList[0];
    
    // 尝试触发点击
    setTimeout(() => {
        firstButton.click();
        
        setTimeout(() => {
            if (copiedText) {
                console.log('✅ 成功获取复制内容！');
                console.log('完整内容长度:', copiedText.length);
                console.log('完整内容:', copiedText);
            } else {
                console.log('❌ 未能获取复制内容');
                console.log('可能需要手动点击复制按钮');
            }
            
            // 清理监听器
            document.removeEventListener('copy', copyListener);
        }, 500);
    }, 1000);
}

// 5. 检查是否有 data-clipboard-text 属性
console.log('\n5. 检查 data-clipboard-text 属性...');
const elementsWithClipboard = document.querySelectorAll('[data-clipboard-text]');
console.log(`找到 ${elementsWithClipboard.length} 个带 data-clipboard-text 的元素`);

// 6. 检查每条消息的复制按钮
console.log('\n6. 检查每条消息及其父元素的按钮...');
const messages = document.querySelectorAll('[data-message-author-role]');
messages.forEach((msg, i) => {
    const role = msg.getAttribute('data-message-author-role');

    // 检查消息内部的按钮
    const buttonsInside = msg.querySelectorAll('button');
    console.log(`\n消息 ${i + 1} [${role}]:`);
    console.log(`  内部按钮数量: ${buttonsInside.length}`);

    // 检查消息的父元素
    const parent = msg.parentElement;
    if (parent) {
        const buttonsInParent = parent.querySelectorAll('button');
        console.log(`  父元素按钮数量: ${buttonsInParent.length}`);

        // 显示父元素中的按钮信息
        buttonsInParent.forEach((btn, btnIdx) => {
            const ariaLabel = btn.getAttribute('aria-label') || '';
            const title = btn.getAttribute('title') || '';
            if (ariaLabel.toLowerCase().includes('copy') || title.toLowerCase().includes('copy')) {
                console.log(`    按钮 ${btnIdx + 1}: aria-label="${ariaLabel}", title="${title}"`);
            }
        });
    }

    // 检查消息的兄弟元素
    const nextSibling = msg.nextElementSibling;
    if (nextSibling) {
        const buttonsInSibling = nextSibling.querySelectorAll('button');
        if (buttonsInSibling.length > 0) {
            console.log(`  下一个兄弟元素按钮数量: ${buttonsInSibling.length}`);
        }
    }
});

// 7. 检查复制按钮是否需要悬停才显示
console.log('\n7. 检查复制按钮的显示方式...');
console.log('请将鼠标悬停在一条消息上，然后再次运行此脚本');
console.log('对比前后的按钮数量变化');

console.log('\n=== 检查完成 ===');
console.log('提示：如果自动点击失败，请手动点击一个复制按钮，然后查看控制台输出');

