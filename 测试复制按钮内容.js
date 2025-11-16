// 在 ChatGPT 控制台运行此脚本，测试复制按钮复制的内容格式

console.log('=== 测试复制按钮内容格式 ===');

// 监听复制事件
document.addEventListener('copy', (e) => {
    console.log('\n✅ 检测到复制事件！');
    
    // 获取纯文本
    const plainText = e.clipboardData.getData('text/plain');
    console.log('\n📝 纯文本内容:');
    console.log('长度:', plainText.length);
    console.log('前 500 字符:', plainText.substring(0, 500));
    console.log('完整内容:', plainText);
    
    // 获取 HTML
    const html = e.clipboardData.getData('text/html');
    console.log('\n📄 HTML 内容:');
    console.log('长度:', html.length);
    console.log('前 500 字符:', html.substring(0, 500));
    if (html) {
        console.log('完整 HTML:', html);
    } else {
        console.log('⚠️ 没有 HTML 内容');
    }
    
    // 检查是否有 Markdown
    console.log('\n🔍 检查内容格式:');
    if (plainText.includes('```')) {
        console.log('✅ 包含代码块标记 ```');
    }
    if (plainText.includes('**')) {
        console.log('✅ 包含粗体标记 **');
    }
    if (plainText.includes('- ') || plainText.includes('* ')) {
        console.log('✅ 包含列表标记');
    }
    if (plainText.includes('[') && plainText.includes('](')) {
        console.log('✅ 包含链接标记 []()');
    }
    
    // 检查所有可用的数据类型
    console.log('\n📋 剪贴板中所有可用的数据类型:');
    const types = e.clipboardData.types;
    types.forEach(type => {
        console.log(`  - ${type}`);
        const data = e.clipboardData.getData(type);
        console.log(`    长度: ${data.length}`);
    });
});

console.log('\n👆 请手动点击一个消息的复制按钮，然后查看上面的输出');
console.log('提示：点击 assistant 的消息复制按钮（通常包含更多格式）');

