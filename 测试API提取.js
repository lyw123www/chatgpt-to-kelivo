// 在 ChatGPT 控制台运行此脚本，尝试从内部数据获取完整对话

console.log('=== 尝试从 ChatGPT 内部数据获取对话 ===');

// 方法 1: 尝试从 window 对象获取数据
console.log('\n方法 1: 检查 window 对象...');
const windowKeys = Object.keys(window).filter(key => 
    key.toLowerCase().includes('chat') || 
    key.toLowerCase().includes('conversation') ||
    key.toLowerCase().includes('message') ||
    key.toLowerCase().includes('react') ||
    key.toLowerCase().includes('redux') ||
    key.toLowerCase().includes('store')
);
console.log('可能相关的 window 属性:', windowKeys);

// 方法 2: 尝试从 React 内部状态获取
console.log('\n方法 2: 尝试从 React 获取...');
try {
    // 查找 React Fiber 节点
    const mainElement = document.querySelector('main');
    if (mainElement) {
        const reactKey = Object.keys(mainElement).find(key => 
            key.startsWith('__reactFiber') || 
            key.startsWith('__reactProps') ||
            key.startsWith('__reactInternalInstance')
        );
        
        if (reactKey) {
            console.log('找到 React 键:', reactKey);
            const reactData = mainElement[reactKey];
            console.log('React 数据:', reactData);
        } else {
            console.log('未找到 React 键');
        }
    }
} catch (e) {
    console.log('React 方法失败:', e.message);
}

// 方法 3: 尝试拦截网络请求
console.log('\n方法 3: 检查网络请求...');
console.log('打开 Network 标签页，刷新页面，查找包含对话数据的请求');
console.log('通常是: /backend-api/conversation/xxx');

// 方法 4: 尝试从 localStorage/sessionStorage 获取
console.log('\n方法 4: 检查 localStorage...');
const localStorageKeys = Object.keys(localStorage);
console.log('localStorage 键数量:', localStorageKeys.length);
const relevantKeys = localStorageKeys.filter(key => 
    key.includes('chat') || 
    key.includes('conversation') || 
    key.includes('message')
);
console.log('可能相关的键:', relevantKeys);
relevantKeys.forEach(key => {
    try {
        const value = localStorage.getItem(key);
        console.log(`${key}:`, value.substring(0, 200));
    } catch (e) {
        console.log(`${key}: 无法读取`);
    }
});

// 方法 5: 从 URL 获取对话 ID，尝试直接请求 API
console.log('\n方法 5: 尝试直接请求 API...');
const urlMatch = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
if (urlMatch) {
    const conversationId = urlMatch[1];
    console.log('对话 ID:', conversationId);
    console.log('尝试请求:', `https://chatgpt.com/backend-api/conversation/${conversationId}`);
    
    // 尝试请求
    fetch(`https://chatgpt.com/backend-api/conversation/${conversationId}`, {
        credentials: 'include'
    })
    .then(response => {
        console.log('API 响应状态:', response.status);
        return response.json();
    })
    .then(data => {
        console.log('✅ 成功获取对话数据！');
        console.log('对话数据:', data);
        
        if (data.mapping) {
            const messages = [];
            Object.values(data.mapping).forEach(node => {
                if (node.message && node.message.content && node.message.content.parts) {
                    const role = node.message.author.role;
                    const content = node.message.content.parts.join('\n');
                    messages.push({ role, content });
                }
            });
            console.log(`\n提取到 ${messages.length} 条消息:`);
            messages.forEach((msg, i) => {
                console.log(`${i + 1}. [${msg.role}] ${msg.content.substring(0, 50)}...`);
            });
        }
    })
    .catch(error => {
        console.log('❌ API 请求失败:', error.message);
    });
} else {
    console.log('未找到对话 ID');
}

console.log('\n=== 测试完成 ===');
console.log('请查看上面的输出，找到可以获取完整对话的方法');

