// ChatGPT to Kelivo - Content Script
// 在 ChatGPT 页面注入导出按钮

(function() {
    'use strict';

    // 创建浮动按钮
    function createExportButton() {
        const button = document.createElement('button');
        button.id = 'kelivo-export-btn';
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>导出到 Kelivo</span>
        `;
        
        button.onclick = handleExport;
        document.body.appendChild(button);
    }

    // 滚动到页面顶部以确保加载所有消息
    async function scrollToLoadAllMessages() {
        return new Promise((resolve) => {
            const scrollableElement = document.querySelector('main') ||
                                     document.querySelector('[class*="scroll"]') ||
                                     window;

            // 先滚动到顶部
            if (scrollableElement === window) {
                window.scrollTo(0, 0);
            } else {
                scrollableElement.scrollTop = 0;
            }

            // 等待一段时间让内容加载
            setTimeout(resolve, 1000);
        });
    }

    // 滚动到页面底部以确保加载所有消息
    async function scrollToLoadAllMessagesFromBottom() {
        return new Promise((resolve) => {
            const scrollableElement = document.querySelector('main') ||
                                     document.querySelector('[class*="scroll"]') ||
                                     window;

            // 滚动到底部
            if (scrollableElement === window) {
                window.scrollTo(0, document.body.scrollHeight);
            } else {
                scrollableElement.scrollTop = scrollableElement.scrollHeight;
            }

            // 等待一段时间让内容加载
            setTimeout(resolve, 1000);
        });
    }

    // 逐步滚动页面以加载所有消息
    async function ensureAllMessagesLoaded(progressCallback) {
        const scrollableElement = document.querySelector('main') ||
                                 document.querySelector('[class*="scroll"]') ||
                                 document.documentElement;

        // 先滚动到顶部
        if (progressCallback) progressCallback('正在滚动到顶部...');
        await scrollToLoadAllMessages();

        // 获取可滚动高度
        const scrollHeight = scrollableElement.scrollHeight || document.body.scrollHeight;
        const viewportHeight = scrollableElement.clientHeight || window.innerHeight;

        // 如果内容不需要滚动，直接返回
        if (scrollHeight <= viewportHeight * 1.5) {
            return;
        }

        // 分段滚动以触发懒加载
        const scrollSteps = Math.ceil(scrollHeight / viewportHeight);

        for (let i = 0; i < scrollSteps; i++) {
            const scrollTo = (i + 1) * viewportHeight;

            if (progressCallback) {
                progressCallback(`正在加载消息... (${i + 1}/${scrollSteps})`);
            }

            if (scrollableElement === document.documentElement || scrollableElement === window) {
                window.scrollTo(0, scrollTo);
            } else {
                scrollableElement.scrollTop = scrollTo;
            }

            // 等待内容加载
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 最后滚动到底部确保所有内容都加载
        if (progressCallback) progressCallback('正在加载最后的消息...');
        await scrollToLoadAllMessagesFromBottom();

        // 再次滚动到顶部，方便用户查看
        if (progressCallback) progressCallback('整理消息中...');
        await scrollToLoadAllMessages();
    }

    // 展开所有折叠的内容
    function expandAllCollapsedContent() {
        let expandedCount = 0;

        // 查找所有按钮
        const allButtons = document.querySelectorAll('button');

        allButtons.forEach(btn => {
            const text = btn.innerText?.toLowerCase() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';

            // 检查是否是展开/显示更多按钮
            if (text.includes('展开') || text.includes('expand') ||
                text.includes('显示更多') || text.includes('show more') ||
                ariaLabel.includes('展开') || ariaLabel.includes('expand')) {
                try {
                    btn.click();
                    expandedCount++;
                } catch (e) {
                    // 忽略点击错误
                }
            }
        });

        console.log(`展开了 ${expandedCount} 个折叠内容`);
    }

    // 等待所有消息渲染完成
    async function waitForMessagesRendered() {
        return new Promise((resolve) => {
            // 等待一段时间让流式输出完成
            setTimeout(resolve, 2000);
        });
    }

    // 提取对话内容
    async function extractConversation(progressCallback) {
        // 先确保所有消息都已加载
        await ensureAllMessagesLoaded(progressCallback);

        if (progressCallback) progressCallback('等待消息渲染完成...');

        // 等待消息渲染完成（特别是流式输出）
        await waitForMessagesRendered();

        // 展开所有折叠的内容
        expandAllCollapsedContent();

        // 再等待一下让展开的内容渲染
        await new Promise(resolve => setTimeout(resolve, 500));

        if (progressCallback) progressCallback('正在提取对话内容...');

        const messages = [];

        // ChatGPT 消息选择器（根据实际页面结构调整）
        const selectors = [
            '[data-message-author-role]',
            '.group.w-full',
            '[class*="conversation-turn"]'
        ];

        let messageElements = null;
        let usedSelector = '';
        for (const selector of selectors) {
            messageElements = document.querySelectorAll(selector);
            if (messageElements.length > 0) {
                usedSelector = selector;
                break;
            }
        }

        if (!messageElements || messageElements.length === 0) {
            throw new Error('未找到对话消息');
        }

        console.log(`使用选择器: ${usedSelector}`);
        console.log(`找到 ${messageElements.length} 个消息元素`);

        messageElements.forEach((element, index) => {
            // 判断角色
            let role = 'assistant';
            const roleAttr = element.getAttribute('data-message-author-role');

            if (roleAttr === 'user') {
                role = 'user';
            } else if (roleAttr === 'assistant') {
                role = 'assistant';
            } else if (element.classList.contains('user') ||
                       element.querySelector('[class*="user"]')) {
                role = 'user';
            }

            console.log(`消息 ${index + 1}: 角色=${role}, roleAttr=${roleAttr}`);

            // 调试：输出元素的 HTML 结构（仅前 500 字符）
            if (index < 3) {  // 只输出前3个消息的结构
                console.log(`  HTML 结构预览:`, element.outerHTML.substring(0, 500));
            }

            // 提取内容 - 优先使用 HTML 转 Markdown 保留格式
            let content = '';
            let contentElement = null;
            let usedContentSelector = '';

            // 方法1: 优先尝试 markdown 容器（最常见）
            const markdownEl = element.querySelector('.markdown, [class*="markdown"]');
            if (markdownEl) {
                contentElement = markdownEl;
                usedContentSelector = '.markdown';
            }

            // 方法2: 尝试 prose 容器
            if (!contentElement) {
                const proseEl = element.querySelector('[class*="prose"]');
                if (proseEl) {
                    contentElement = proseEl;
                    usedContentSelector = '[class*="prose"]';
                }
            }

            // 方法3: 尝试 whitespace-pre-wrap
            if (!contentElement) {
                const preWrapEl = element.querySelector('.whitespace-pre-wrap');
                if (preWrapEl) {
                    contentElement = preWrapEl;
                    usedContentSelector = '.whitespace-pre-wrap';
                }
            }

            // 方法4: 查找 article 或主要内容容器
            if (!contentElement) {
                const articleEl = element.querySelector('article, [class*="message-content"]');
                if (articleEl) {
                    contentElement = articleEl;
                    usedContentSelector = 'article/message-content';
                }
            }

            // 方法5: 使用整个元素
            if (!contentElement) {
                contentElement = element;
                usedContentSelector = 'element itself';
            }

            // 转换 HTML 为 Markdown
            if (contentElement) {
                content = htmlToMarkdown(contentElement);
            }

            // 如果 HTML 转换失败，回退到纯文本
            if (!content || content.trim().length === 0) {
                content = contentElement.innerText?.trim() || contentElement.textContent?.trim() || '';
                usedContentSelector += ' (fallback to text)';
            }

            // 清理内容：移除可能的按钮文本等噪音
            if (content) {
                // 移除常见的按钮文本
                const noisePatterns = [
                    /^(Copy code|复制代码|Edit|编辑|Regenerate|重新生成)\s*/gm,
                    /\n(Copy code|复制代码|Edit|编辑|Regenerate|重新生成)\s*$/gm
                ];

                for (const pattern of noisePatterns) {
                    content = content.replace(pattern, '');
                }

                content = content.trim();
            }

            console.log(`  内容选择器: ${usedContentSelector}, 内容长度: ${content.length}`);

            if (content) {
                // 过滤掉一些可能的噪音文本
                const isNoise = content.length < 2 ||
                               content.match(/^(ChatGPT|You|复制|Copy|编辑|Edit)$/i);

                if (!isNoise) {
                    messages.push({ role, content });
                    console.log(`  ✓ 已添加消息 ${messages.length}: ${content.substring(0, 50)}...`);
                } else {
                    console.log(`  ✗ 跳过噪音文本: ${content}`);
                }

                if (progressCallback && (index + 1) % 10 === 0) {
                    progressCallback(`已提取 ${index + 1}/${messageElements.length} 条消息...`);
                }
            } else {
                console.log(`  ✗ 未找到内容`);
            }
        });

        console.log(`成功提取 ${messages.length} 条消息`);
        console.log('消息详情:', messages.map((m, i) => `${i + 1}. [${m.role}] ${m.content.substring(0, 30)}...`));
        return messages;
    }

    // 获取对话标题
    function getConversationTitle() {
        // 方法1: 从侧边栏获取当前激活的对话标题
        const activeConversation = document.querySelector('nav a[aria-current="page"]');
        if (activeConversation) {
            const titleElement = activeConversation.querySelector('div[class*="truncate"]') ||
                                activeConversation.querySelector('div');
            if (titleElement && titleElement.innerText.trim()) {
                const title = titleElement.innerText.trim();
                if (title.length > 0 && !title.match(/^(New chat|新对话|ChatGPT)$/i)) {
                    console.log('从侧边栏获取标题:', title);
                    return title;
                }
            }
        }

        // 方法2: 使用页面 meta title
        const metaTitle = document.querySelector('meta[property="og:title"]');
        if (metaTitle && metaTitle.content && metaTitle.content.trim()) {
            const title = metaTitle.content.trim();
            if (title !== 'ChatGPT') {
                console.log('从 meta 标签获取标题:', title);
                return title;
            }
        }

        // 方法3: 使用页面 title
        if (document.title && document.title.trim() && document.title !== 'ChatGPT') {
            // 移除 " - ChatGPT" 后缀
            const title = document.title.replace(/\s*-\s*ChatGPT\s*$/, '').trim();
            if (title.length > 0) {
                console.log('从页面 title 获取标题:', title);
                return title;
            }
        }

        // 方法4: 从 URL 获取对话 ID 作为标题的一部分
        const urlMatch = window.location.pathname.match(/\/c\/([a-zA-Z0-9-]+)/);
        if (urlMatch) {
            const conversationId = urlMatch[1];
            const now = new Date();
            const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
            const title = `ChatGPT对话_${dateStr}_${conversationId.substring(0, 8)}`;
            console.log('使用对话ID生成标题:', title);
            return title;
        }

        // 默认标题
        const now = new Date();
        const title = `ChatGPT对话_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        console.log('使用默认标题:', title);
        return title;
    }

    // HTML 转 Markdown 的辅助函数
    function htmlToMarkdown(element) {
        if (!element) return '';

        // 克隆元素以避免修改原始 DOM
        const clone = element.cloneNode(true);

        // 移除不需要的元素（按钮、工具栏等）
        const removeSelectors = [
            'button',
            '[class*="copy"]',
            '[class*="toolbar"]',
            '[role="button"]',
            '.sr-only'
        ];
        removeSelectors.forEach(selector => {
            clone.querySelectorAll(selector).forEach(el => el.remove());
        });

        let markdown = '';

        function processNode(node, listLevel = 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            const tag = node.tagName.toLowerCase();
            let result = '';

            switch (tag) {
                case 'h1':
                    result = '\n# ' + getTextContent(node) + '\n\n';
                    break;
                case 'h2':
                    result = '\n## ' + getTextContent(node) + '\n\n';
                    break;
                case 'h3':
                    result = '\n### ' + getTextContent(node) + '\n\n';
                    break;
                case 'h4':
                    result = '\n#### ' + getTextContent(node) + '\n\n';
                    break;
                case 'h5':
                    result = '\n##### ' + getTextContent(node) + '\n\n';
                    break;
                case 'h6':
                    result = '\n###### ' + getTextContent(node) + '\n\n';
                    break;
                case 'p':
                    result = processChildren(node, listLevel) + '\n\n';
                    break;
                case 'br':
                    result = '\n';
                    break;
                case 'strong':
                case 'b':
                    result = '**' + getTextContent(node) + '**';
                    break;
                case 'em':
                case 'i':
                    result = '*' + getTextContent(node) + '*';
                    break;
                case 'code':
                    // 行内代码
                    if (node.parentElement.tagName.toLowerCase() !== 'pre') {
                        result = '`' + getTextContent(node) + '`';
                    } else {
                        result = getTextContent(node);
                    }
                    break;
                case 'pre':
                    // 代码块
                    const codeEl = node.querySelector('code');
                    if (codeEl) {
                        const language = extractLanguage(codeEl);
                        const code = getTextContent(codeEl);
                        result = '\n```' + language + '\n' + code + '\n```\n\n';
                    } else {
                        result = '\n```\n' + getTextContent(node) + '\n```\n\n';
                    }
                    break;
                case 'a':
                    const href = node.getAttribute('href') || '';
                    const text = getTextContent(node);
                    result = '[' + text + '](' + href + ')';
                    break;
                case 'ul':
                case 'ol':
                    result = '\n' + processListItems(node, tag === 'ol', listLevel) + '\n';
                    break;
                case 'li':
                    // 由 processListItems 处理
                    result = processChildren(node, listLevel);
                    break;
                case 'blockquote':
                    const lines = processChildren(node, listLevel).split('\n');
                    result = '\n' + lines.map(line => '> ' + line).join('\n') + '\n\n';
                    break;
                case 'hr':
                    result = '\n---\n\n';
                    break;
                case 'table':
                    result = processTable(node);
                    break;
                case 'img':
                    const alt = node.getAttribute('alt') || '';
                    const src = node.getAttribute('src') || '';
                    result = '![' + alt + '](' + src + ')';
                    break;
                case 'div':
                case 'span':
                case 'article':
                case 'section':
                    result = processChildren(node, listLevel);
                    break;
                default:
                    result = processChildren(node, listLevel);
            }

            return result;
        }

        function processChildren(node, listLevel = 0) {
            let result = '';
            for (const child of node.childNodes) {
                result += processNode(child, listLevel);
            }
            return result;
        }

        function getTextContent(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            let text = '';
            for (const child of node.childNodes) {
                if (child.nodeType === Node.TEXT_NODE) {
                    text += child.textContent;
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    const tag = child.tagName.toLowerCase();
                    if (tag === 'strong' || tag === 'b') {
                        text += '**' + getTextContent(child) + '**';
                    } else if (tag === 'em' || tag === 'i') {
                        text += '*' + getTextContent(child) + '*';
                    } else if (tag === 'code' && child.parentElement.tagName.toLowerCase() !== 'pre') {
                        text += '`' + getTextContent(child) + '`';
                    } else {
                        text += getTextContent(child);
                    }
                }
            }
            return text;
        }

        function processListItems(listNode, isOrdered, listLevel) {
            let result = '';
            let index = 1;
            const items = Array.from(listNode.children).filter(child =>
                child.tagName.toLowerCase() === 'li'
            );

            items.forEach(li => {
                const indent = '  '.repeat(listLevel);
                const marker = isOrdered ? `${index}. ` : '• ';
                const content = processChildren(li, listLevel + 1).trim();

                // 处理多行内容
                const lines = content.split('\n');
                result += indent + marker + lines[0] + '\n';
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        result += indent + '  ' + lines[i] + '\n';
                    }
                }

                index++;
            });

            return result;
        }

        function extractLanguage(codeElement) {
            // 尝试从 class 中提取语言
            const classes = codeElement.className.split(' ');
            for (const cls of classes) {
                if (cls.startsWith('language-')) {
                    return cls.substring(9);
                }
                if (cls.startsWith('lang-')) {
                    return cls.substring(5);
                }
            }
            return '';
        }

        function processTable(tableNode) {
            const rows = Array.from(tableNode.querySelectorAll('tr'));
            if (rows.length === 0) return '';

            let result = '\n';

            rows.forEach((row, rowIndex) => {
                const cells = Array.from(row.querySelectorAll('th, td'));
                result += '| ' + cells.map(cell => getTextContent(cell).trim()).join(' | ') + ' |\n';

                // 添加表头分隔符
                if (rowIndex === 0) {
                    result += '| ' + cells.map(() => '---').join(' | ') + ' |\n';
                }
            });

            return result + '\n';
        }

        markdown = processNode(clone);

        // 清理多余的空行
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        return markdown.trim();
    }

    // 生成 Markdown（符合 Kelivo 导入格式）
    function generateMarkdown(messages, title) {
        let markdown = `# ${title}\n\n`;

        messages.forEach((msg, index) => {
            const roleLabel = msg.role === 'user' ? '用户' : '助手';

            // 使用 > 标记角色（Kelivo 导入格式要求）
            markdown += `> ${roleLabel}\n\n${msg.content}\n\n`;
        });

        return markdown;
    }

    // 显示加载状态
    function showLoading(show, message = '导出中...') {
        const button = document.getElementById('kelivo-export-btn');
        if (!button) return;

        if (show) {
            button.disabled = true;
            button.innerHTML = `
                <div class="spinner"></div>
                <span>${message}</span>
            `;
        } else {
            button.disabled = false;
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>导出到 Kelivo</span>
            `;
        }
    }

    // 显示通知
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `kelivo-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 10);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // 显示服务器未运行的对话框
    function showServerNotRunningDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'kelivo-dialog-overlay';
        dialog.innerHTML = `
            <div class="kelivo-dialog">
                <div class="kelivo-dialog-icon">🚫</div>
                <h2 class="kelivo-dialog-title">导入服务器未运行</h2>
                <p class="kelivo-dialog-message">无法连接到 Kelivo 导入服务器，请先启动服务器</p>
                <div class="kelivo-dialog-steps">
                    <h3>操作步骤：</h3>
                    <ol>
                        <li><strong>双击运行</strong> <code>kelivo_import_server.exe</code></li>
                        <li>等待服务器启动（会显示"服务器已启动"）</li>
                        <li>返回此页面</li>
                        <li>重新点击"导出到 Kelivo"按钮</li>
                    </ol>
                </div>
                <div class="kelivo-dialog-note">
                    <strong>💡 提示：</strong>服务器启动后会显示一个黑色窗口，请保持窗口打开状态
                </div>
                <div class="kelivo-dialog-buttons">
                    <button class="kelivo-dialog-btn kelivo-dialog-btn-primary">
                        我知道了
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 添加关闭按钮事件监听
        const closeBtn = dialog.querySelector('.kelivo-dialog-btn-primary');
        closeBtn.addEventListener('click', () => {
            dialog.remove();
        });

        // 点击遮罩层也可以关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    // 显示 Kelivo 运行中的对话框
    function showKelivoRunningDialog(message) {
        const dialog = document.createElement('div');
        dialog.className = 'kelivo-dialog-overlay';
        dialog.innerHTML = `
            <div class="kelivo-dialog">
                <div class="kelivo-dialog-icon">⚠️</div>
                <h2 class="kelivo-dialog-title">Kelivo 应用正在运行</h2>
                <p class="kelivo-dialog-message">${message || '请先关闭 Kelivo 应用，然后重试'}</p>
                <div class="kelivo-dialog-steps">
                    <h3>操作步骤：</h3>
                    <ol>
                        <li>关闭 Kelivo 应用</li>
                        <li>返回此页面</li>
                        <li>重新点击"导出到 Kelivo"按钮</li>
                    </ol>
                </div>
                <div class="kelivo-dialog-buttons">
                    <button class="kelivo-dialog-btn kelivo-dialog-btn-primary">
                        我知道了
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(dialog);

        // 添加关闭按钮事件监听
        const closeBtn = dialog.querySelector('.kelivo-dialog-btn-primary');
        closeBtn.addEventListener('click', () => {
            dialog.remove();
        });

        // 点击遮罩层也可以关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                dialog.remove();
            }
        });
    }

    // 检查服务器状态
    async function checkServerStatus() {
        console.log('[Content] 开始检查服务器状态...');
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                action: 'checkServer'
            }, (response) => {
                console.log('[Content] 收到服务器检查响应:', response);
                if (response && response.success && response.running) {
                    console.log('[Content] ✅ 服务器正在运行');
                    resolve(true);
                } else {
                    console.log('[Content] ❌ 服务器未运行');
                    resolve(false);
                }
            });
        });
    }

    // 处理导出
    async function handleExport() {
        try {
            showLoading(true, '检查服务器状态...');

            // 先检查服务器是否运行
            const serverRunning = await checkServerStatus();

            if (!serverRunning) {
                showLoading(false);
                showServerNotRunningDialog();
                return;
            }

            showLoading(true, '准备导出...');

            // 提取对话（带进度回调）
            const messages = await extractConversation((progress) => {
                showLoading(true, progress);
            });

            if (messages.length === 0) {
                throw new Error('未找到对话内容');
            }

            console.log(`准备导出 ${messages.length} 条消息`);
            showLoading(true, '生成 Markdown...');

            // 获取标题
            const title = getConversationTitle();

            // 生成 Markdown
            const markdown = generateMarkdown(messages, title);

            showLoading(true, '发送到 Kelivo...');

            // 发送到 background script
            chrome.runtime.sendMessage({
                action: 'exportToKelivo',
                data: {
                    markdown: markdown,
                    title: title,
                    messageCount: messages.length
                }
            }, (response) => {
                showLoading(false);

                if (response && response.success) {
                    showNotification(`✅ 成功导出 ${messages.length} 条消息到 Kelivo！`, 'success');
                } else {
                    const errorMsg = response?.error || '导出失败';

                    // 检查是否是 Kelivo 运行中的错误
                    if (errorMsg.startsWith('KELIVO_RUNNING:')) {
                        const message = errorMsg.replace('KELIVO_RUNNING:', '');
                        showKelivoRunningDialog(message);
                    } else {
                        throw new Error(errorMsg);
                    }
                }
            });

        } catch (error) {
            showLoading(false);
            console.error('导出错误:', error);
            showNotification(`❌ 导出失败: ${error.message}`, 'error');
        }
    }

    // 初始化
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createExportButton);
        } else {
            createExportButton();
        }
    }

    init();
})();

