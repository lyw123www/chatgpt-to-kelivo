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

    // 🔥 新方法：通过模拟点击复制按钮获取完整内容
    async function extractByClickingCopyButtons() {
        console.log('🔥 尝试通过复制按钮获取完整内容...');

        try {
            // 找到所有消息元素
            const messageElements = document.querySelectorAll('[data-message-author-role]');
            console.log(`找到 ${messageElements.length} 条消息`);

            if (messageElements.length === 0) {
                console.log('❌ 未找到消息元素');
                return null;
            }

            const messages = [];

            // 为每条消息提取内容
            for (let i = 0; i < messageElements.length; i++) {
                const msgElement = messageElements[i];
                const role = msgElement.getAttribute('data-message-author-role');

                console.log(`处理消息 ${i + 1}/${messageElements.length} [${role}]...`);

                // 🔥 触发鼠标悬停事件，让复制按钮显示出来
                msgElement.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
                msgElement.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

                // 等待一下让按钮显示
                await new Promise(resolve => setTimeout(resolve, 200));

                // 查找复制按钮 - 尝试多种选择器
                let copyButton = null;

                // 🔥 在消息元素及其父元素中查找
                const searchElements = [
                    msgElement,
                    msgElement.parentElement,
                    msgElement.parentElement?.parentElement
                ].filter(el => el !== null);

                // 在所有可能的元素中查找复制按钮
                for (const searchEl of searchElements) {
                    // 方法 1: 通过 aria-label 查找
                    copyButton = searchEl.querySelector('button[aria-label*="Copy"], button[aria-label*="copy"], button[aria-label*="复制"]');
                    if (copyButton) break;

                    // 方法 2: 通过 title 查找
                    copyButton = searchEl.querySelector('button[title*="Copy"], button[title*="copy"], button[title*="复制"]');
                    if (copyButton) break;

                    // 方法 3: 查找所有按钮，检查文本内容
                    const buttons = searchEl.querySelectorAll('button');
                    for (const btn of buttons) {
                        const text = btn.textContent.toLowerCase();
                        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
                        const title = (btn.getAttribute('title') || '').toLowerCase();
                        const innerHTML = btn.innerHTML.toLowerCase();

                        if (text.includes('copy') || text.includes('复制') ||
                            ariaLabel.includes('copy') || ariaLabel.includes('复制') ||
                            title.includes('copy') || title.includes('复制') ||
                            innerHTML.includes('copy') || innerHTML.includes('复制')) {
                            copyButton = btn;
                            break;
                        }
                    }
                    if (copyButton) break;

                    // 方法 4: 查找包含复制图标的按钮
                    for (const btn of buttons) {
                        const svg = btn.querySelector('svg');
                        if (svg) {
                            const svgClass = svg.getAttribute('class') || '';
                            const svgHTML = svg.innerHTML || '';
                            if (svgClass.includes('copy') || svgHTML.includes('clipboard')) {
                                copyButton = btn;
                                break;
                            }
                        }
                    }
                    if (copyButton) break;
                }

                if (copyButton) {
                    console.log(`  ✅ 找到复制按钮`);
                    console.log(`    aria-label: ${copyButton.getAttribute('aria-label')}`);
                    console.log(`    title: ${copyButton.getAttribute('title')}`);
                    console.log(`    class: ${copyButton.className}`);

                    // 通过模拟点击获取 Markdown 内容
                    const copiedContent = await getCopyButtonContent(copyButton, msgElement);

                    if (copiedContent && copiedContent.text && copiedContent.text.trim()) {
                        console.log(`  ✅ 成功获取内容，长度: ${copiedContent.text.length}`);

                        // 🔥 使用复制的内容（ChatGPT 的复制按钮会复制 Markdown 格式）
                        let content = copiedContent.text;

                        messages.push({ role, content });
                    } else {
                        console.log(`  ❌ 复制按钮点击失败，跳过此消息`);
                    }
                } else {
                    console.log(`  ❌ 未找到复制按钮，跳过此消息`);

                    // 调试：显示该消息及其父元素中所有按钮的信息
                    if (i < 2) {  // 只显示前 2 条消息的调试信息
                        for (const searchEl of searchElements) {
                            const allButtons = searchEl.querySelectorAll('button');
                            if (allButtons.length > 0) {
                                console.log(`  在 ${searchEl === msgElement ? '消息元素' : '父元素'} 中找到 ${allButtons.length} 个按钮:`);
                                allButtons.forEach((btn, btnIdx) => {
                                    console.log(`    按钮 ${btnIdx + 1}:`);
                                    console.log(`      aria-label: ${btn.getAttribute('aria-label')}`);
                                    console.log(`      title: ${btn.getAttribute('title')}`);
                                    console.log(`      textContent: ${btn.textContent.substring(0, 30)}`);
                                });
                            }
                        }
                    }
                }

                // 等待一下，避免过快
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            console.log(`✅ 通过复制按钮提取到 ${messages.length} 条消息`);
            return messages.length > 0 ? messages : null;

        } catch (error) {
            console.log('❌ 复制按钮方法失败:', error.message);
            return null;
        }
    }

    // 通过复制按钮获取内容（支持 Markdown 和 HTML）
    async function getCopyButtonContent(button, msgElement) {
        return new Promise((resolve) => {
            let copiedContent = { text: '', html: '', markdown: '' };
            let resolved = false;

            // 方法 1: 尝试直接读取剪贴板
            const tryReadClipboard = async () => {
                try {
                    if (navigator.clipboard && navigator.clipboard.readText) {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) {
                            return { text, html: '', markdown: text };
                        }
                    }
                } catch (e) {
                    // 忽略权限错误
                }
                return null;
            };

            // 方法 2: 监听复制事件，获取所有格式
            const copyListener = (e) => {
                if (!resolved) {
                    try {
                        // 获取纯文本
                        const plainText = e.clipboardData.getData('text/plain');

                        // 获取 HTML
                        const html = e.clipboardData.getData('text/html');

                        // 检查是否是 Markdown 格式
                        let markdown = plainText;
                        const hasMarkdownSyntax =
                            plainText.includes('```') ||
                            plainText.includes('**') ||
                            plainText.includes('- ') ||
                            plainText.includes('* ') ||
                            (plainText.includes('[') && plainText.includes(']('));

                        if (plainText && plainText.trim()) {
                            copiedContent = {
                                text: plainText,
                                html: html || '',
                                markdown: markdown,
                                hasMarkdownSyntax: hasMarkdownSyntax
                            };

                            console.log(`    ✅ 通过 copy 事件获取到内容`);
                            console.log(`      纯文本长度: ${plainText.length}`);
                            console.log(`      HTML 长度: ${html ? html.length : 0}`);
                            console.log(`      包含 Markdown 语法: ${hasMarkdownSyntax}`);

                            resolved = true;
                            document.removeEventListener('copy', copyListener);
                            resolve(copiedContent);
                        }
                    } catch (e) {
                        console.log('    读取剪贴板数据失败:', e.message);
                    }
                }
            };

            document.addEventListener('copy', copyListener);

            // 方法 3: 尝试多种点击方式
            const clickButton = async () => {
                try {
                    // 确保按钮可见
                    button.scrollIntoView({ behavior: 'auto', block: 'nearest' });

                    // 方式 1: 直接点击
                    button.click();
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // 检查是否成功
                    if (!resolved) {
                        let result = await tryReadClipboard();
                        if (result && result.text) {
                            console.log(`    ✅ 通过剪贴板 API 获取到内容，长度: ${result.text.length}`);
                            resolved = true;
                            document.removeEventListener('copy', copyListener);
                            resolve(result);
                            return;
                        }
                    }

                    // 方式 2: 触发鼠标事件
                    if (!resolved) {
                        button.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        button.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                        button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        await new Promise(resolve => setTimeout(resolve, 500));

                        // 再次检查
                        let result = await tryReadClipboard();
                        if (result && result.text) {
                            console.log(`    ✅ 通过剪贴板 API 获取到内容，长度: ${result.text.length}`);
                            resolved = true;
                            document.removeEventListener('copy', copyListener);
                            resolve(result);
                            return;
                        }
                    }

                } catch (e) {
                    console.log('    点击复制按钮失败:', e.message);
                }
            };

            // 执行点击
            clickButton();

            // 超时处理
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    document.removeEventListener('copy', copyListener);
                    console.log('    ⚠️ 复制超时，未获取到内容');
                    resolve(copiedContent);
                }
            }, 2000);
        });
    }

    // 从元素中提取内容（备用方法）
    function extractContentFromElement(element) {
        const contentSelectors = [
            '.markdown',
            '.whitespace-pre-wrap',
            '[class*="prose"]',
            'article',
            '[class*="message-content"]'
        ];

        for (const selector of contentSelectors) {
            const contentEl = element.querySelector(selector);
            if (contentEl) {
                return contentEl.textContent.trim();
            }
        }

        return element.textContent.trim();
    }

    // 🔥 新方法：使用 MutationObserver 监听 DOM 变化，确保所有内容加载完成
    async function waitForAllMessagesToLoad() {
        console.log('🔥 使用 MutationObserver 等待所有消息加载...');

        return new Promise((resolve) => {
            let messageCount = 0;
            let stableCount = 0;
            const maxStableCount = 5; // 连续 5 次不变才认为加载完成

            // 获取初始消息数量
            messageCount = document.querySelectorAll('[data-message-author-role]').length;
            console.log(`初始消息数量: ${messageCount}`);

            // 创建 MutationObserver
            const observer = new MutationObserver(() => {
                const newCount = document.querySelectorAll('[data-message-author-role]').length;

                if (newCount > messageCount) {
                    console.log(`检测到新消息: ${messageCount} -> ${newCount}`);
                    messageCount = newCount;
                    stableCount = 0; // 重置稳定计数
                } else {
                    stableCount++;
                }

                // 如果连续多次没有新消息，认为加载完成
                if (stableCount >= maxStableCount) {
                    console.log(`✅ 消息数量稳定在 ${messageCount}，停止监听`);
                    observer.disconnect();
                    resolve();
                }
            });

            // 监听整个 main 元素的变化
            const main = document.querySelector('main') || document.body;
            observer.observe(main, {
                childList: true,
                subtree: true
            });

            // 触发滚动以加载内容
            console.log('开始滚动以触发内容加载...');
            triggerScrollToLoadContent();

            // 设置超时，最多等待 30 秒
            setTimeout(() => {
                console.log('⚠️ 超时，停止等待');
                observer.disconnect();
                resolve();
            }, 30000);
        });
    }

    // 触发滚动以加载内容
    async function triggerScrollToLoadContent() {
        const main = document.querySelector('main');
        if (!main) return;

        // 快速滚动到底部和顶部多次，触发内容加载
        for (let i = 0; i < 3; i++) {
            // 滚动到底部
            main.scrollTop = main.scrollHeight;
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 滚动到顶部
            main.scrollTop = 0;
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // 最后停在中间
        main.scrollTop = main.scrollHeight / 2;
    }

    // 🔥 改进的滚动方法：逐个滚动到每条消息，确保内容完全加载
    async function scrollToLoadAllMessagesFromBottom() {
        console.log('🔥 开始逐个滚动加载所有消息内容...');

        // 先尝试找到所有消息元素
        let messageElements = document.querySelectorAll('[data-message-author-role]');
        console.log(`找到 ${messageElements.length} 条消息`);

        if (messageElements.length === 0) {
            console.log('⚠️ 未找到消息元素，跳过滚动');
            return;
        }

        const messageArray = Array.from(messageElements);

        // 🔥 关键改进：从第一条到最后一条，逐个滚动并等待内容加载
        console.log('开始逐个滚动每条消息，确保内容完全加载...');

        for (let i = 0; i < messageArray.length; i++) {
            const message = messageArray[i];
            const role = message.getAttribute('data-message-author-role');

            console.log(`滚动到消息 ${i + 1}/${messageArray.length} [${role}]...`);

            // 滚动到消息中央
            message.scrollIntoView({ behavior: 'auto', block: 'center' });

            // 🔥 等待 2 秒，确保内容完全渲染
            await new Promise(resolve => setTimeout(resolve, 2000));

            // 检查内容是否已加载
            const contentEl = message.querySelector('.markdown, .whitespace-pre-wrap, [class*="prose"]');
            if (contentEl) {
                const contentLength = contentEl.textContent.length;
                console.log(`  内容长度: ${contentLength} 字符`);
            }
        }

        console.log('✅ 所有消息已滚动完成');

        // 最后滚动到顶部
        console.log('滚动到顶部...');
        messageArray[0].scrollIntoView({ behavior: 'auto', block: 'start' });
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // 🔥 简化：只使用 scrollIntoView 方法
    async function ensureAllMessagesLoaded(progressCallback) {
        console.log('=== 开始加载所有消息 ===');

        // 🔥 使用新的 scrollIntoView 方法
        if (progressCallback) progressCallback('正在加载所有消息...');
        await scrollToLoadAllMessagesFromBottom();

        console.log('=== 消息加载完成 ===');
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
        // 🔥 只使用复制按钮方法获取 Markdown 格式内容
        if (progressCallback) progressCallback('通过复制按钮获取 Markdown 格式内容...');

        console.log('🔥 使用复制按钮方法获取 Markdown 格式内容');

        const copyMessages = await extractByClickingCopyButtons();

        if (copyMessages && copyMessages.length > 0) {
            console.log(`✅ 成功通过复制按钮获取 ${copyMessages.length} 条消息`);
            return copyMessages;
        }

        console.log('❌ 复制按钮方法失败，无法获取内容');
        throw new Error('无法通过复制按钮获取内容，请确保页面已完全加载');

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

        // 🔥 改用 for...of 循环，支持 async/await
        const messageArray = Array.from(messageElements);
        for (let index = 0; index < messageArray.length; index++) {
            const element = messageArray[index];

            // 🔥 滚动到当前消息，确保内容完全渲染
            try {
                element.scrollIntoView({ behavior: 'auto', block: 'center' });
                // 🔥 增加等待时间到 2000ms（2 秒），确保内容完全渲染
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (e) {
                console.warn(`滚动到消息 ${index + 1} 失败:`, e);
            }

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
                console.log(`  找到 markdown 容器，子元素数量: ${markdownEl.children.length}`);
            }

            // 方法2: 尝试 prose 容器
            if (!contentElement) {
                const proseEl = element.querySelector('[class*="prose"]');
                if (proseEl) {
                    contentElement = proseEl;
                    usedContentSelector = '[class*="prose"]';
                    console.log(`  找到 prose 容器，子元素数量: ${proseEl.children.length}`);
                }
            }

            // 方法3: 尝试 whitespace-pre-wrap
            if (!contentElement) {
                const preWrapEl = element.querySelector('.whitespace-pre-wrap');
                if (preWrapEl) {
                    contentElement = preWrapEl;
                    usedContentSelector = '.whitespace-pre-wrap';
                    console.log(`  找到 whitespace-pre-wrap 容器，子元素数量: ${preWrapEl.children.length}`);
                }
            }

            // 方法4: 查找 article 或主要内容容器
            if (!contentElement) {
                const articleEl = element.querySelector('article, [class*="message-content"]');
                if (articleEl) {
                    contentElement = articleEl;
                    usedContentSelector = 'article/message-content';
                    console.log(`  找到 article 容器，子元素数量: ${articleEl.children.length}`);
                }
            }

            // 方法5: 使用整个元素
            if (!contentElement) {
                contentElement = element;
                usedContentSelector = 'element itself';
                console.log(`  使用整个元素，子元素数量: ${element.children.length}`);
            }

            // 调试：输出内容元素的结构
            if (index < 3 && contentElement) {
                console.log(`  内容元素 HTML 预览:`, contentElement.outerHTML.substring(0, 800));
            }

            // 转换 HTML 为 Markdown
            if (contentElement) {
                const enableDebug = index < 3; // 只对前3条消息启用调试
                if (enableDebug) {
                    console.log(`  === 开始转换 HTML 为 Markdown (消息 ${index + 1}) ===`);
                }
                content = htmlToMarkdown(contentElement, enableDebug);
                if (enableDebug) {
                    console.log(`  === 转换完成，Markdown 长度: ${content.length} ===`);
                    console.log(`  Markdown 预览:\n${content.substring(0, 500)}`);
                }
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
                    progressCallback(`已提取 ${index + 1}/${messageArray.length} 条消息...`);
                }
            } else {
                console.log(`  ✗ 未找到内容`);
            }
        } // 🔥 改为 for 循环的结束

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
    function htmlToMarkdown(element, debug = false) {
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
            clone.querySelectorAll(selector).forEach(el => {
                if (debug) console.log(`  移除元素: ${el.tagName} - ${el.className}`);
                el.remove();
            });
        });

        if (debug) {
            console.log(`  克隆后的元素子节点数量: ${clone.childNodes.length}`);
            console.log(`  克隆后的元素子元素数量: ${clone.children.length}`);
        }

        let markdown = '';

        function processNode(node, listLevel = 0, debug = false) {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }

            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            const tag = node.tagName.toLowerCase();
            let result = '';

            if (debug && (tag === 'ul' || tag === 'ol' || tag === 'li')) {
                console.log(`    处理 ${tag} 元素，listLevel=${listLevel}, 子节点数=${node.childNodes.length}`);
            }

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
                    result = '\n' + processListItems(node, tag === 'ol', listLevel, debug) + '\n';
                    break;
                case 'li':
                    // 由 processListItems 处理
                    result = processChildren(node, listLevel);
                    break;
                case 'blockquote':
                    // 不使用 > 引用语法，避免与 Kelivo 的角色标记冲突
                    // 改用缩进或其他方式表示引用
                    const quoteContent = processChildren(node, listLevel);
                    result = '\n**引用：**\n' + quoteContent + '\n\n';
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

        function processChildren(node, listLevel = 0, debug = false) {
            let result = '';
            for (const child of node.childNodes) {
                result += processNode(child, listLevel, debug);
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

        function processListItems(listNode, isOrdered, listLevel, debug = false) {
            let result = '';
            let index = 1;
            const items = Array.from(listNode.children).filter(child =>
                child.tagName.toLowerCase() === 'li'
            );

            if (debug) {
                console.log(`    processListItems: 找到 ${items.length} 个 li 元素, listLevel=${listLevel}`);
            }

            items.forEach((li, liIndex) => {
                if (debug) {
                    console.log(`      处理 li ${liIndex + 1}/${items.length}, 子节点数=${li.childNodes.length}`);
                    console.log(`      li HTML 预览: ${li.outerHTML.substring(0, 200)}`);
                }

                const indent = '  '.repeat(listLevel);
                const marker = isOrdered ? `${index}. ` : '• ';

                // 直接处理 li 的内容，不增加 listLevel
                // 这样可以保留完整的格式
                let content = '';

                // 遍历 li 的所有子节点
                for (const child of li.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        const text = child.textContent;
                        if (debug && text.trim()) {
                            console.log(`        文本节点: "${text.trim().substring(0, 50)}"`);
                        }
                        content += text;
                    } else if (child.nodeType === Node.ELEMENT_NODE) {
                        const tag = child.tagName.toLowerCase();

                        if (debug) {
                            console.log(`        元素节点: <${tag}>`);
                        }

                        // 对于嵌套列表，递归处理
                        if (tag === 'ul' || tag === 'ol') {
                            content += '\n' + processListItems(child, tag === 'ol', listLevel + 1, debug);
                        } else {
                            // 其他元素正常处理
                            content += processNode(child, listLevel, debug);
                        }
                    }
                }

                content = content.trim();

                if (debug) {
                    console.log(`      li 内容长度: ${content.length}, 预览: "${content.substring(0, 100)}"`);
                }

                // 处理多行内容
                const lines = content.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                    // 第一行加上列表标记
                    result += indent + marker + lines[0] + '\n';

                    // 后续行缩进对齐
                    for (let i = 1; i < lines.length; i++) {
                        result += indent + '  ' + lines[i] + '\n';
                    }
                } else {
                    if (debug) {
                        console.log(`      ⚠️ li 内容为空，跳过`);
                    }
                }

                index++;
            });

            if (debug) {
                console.log(`    processListItems 完成，生成内容长度: ${result.length}`);
            }

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

        markdown = processNode(clone, 0, debug);

        // 清理多余的空行
        markdown = markdown.replace(/\n{3,}/g, '\n\n');

        if (debug) {
            console.log(`  最终 Markdown 长度: ${markdown.length}`);
        }

        return markdown.trim();
    }

    // 生成 Markdown（符合 Kelivo 导入格式）
    function generateMarkdown(messages, title) {
        let markdown = `# ${title}\n\n`;

        messages.forEach((msg, index) => {
            const roleLabel = msg.role === 'user' ? '用户' : '助手';

            // 🔥 处理消息内容中的引用，避免与角色标记冲突
            let content = msg.content;

            // 将 Markdown 引用 (> text) 转换为缩进格式
            // 使用 4 个空格缩进来表示引用内容
            const lines = content.split('\n');
            const processedLines = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (line.trim().startsWith('>')) {
                    // 移除 > 符号，添加 4 个空格缩进
                    const quotedText = line.replace(/^>\s*/, '');
                    processedLines.push(`    ${quotedText}`);
                } else {
                    processedLines.push(line);
                }
            }

            content = processedLines.join('\n');

            // 使用 > 标记角色（Kelivo 导入格式要求）
            markdown += `> ${roleLabel}\n\n${content}\n\n`;
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

