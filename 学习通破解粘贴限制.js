// ==UserScript==
// @name         超星/学习通 终极粘贴限制破解
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动解除超星、学习通等平台富文本编辑器（如答题、作业、讨论区）的粘贴限制，让你自由复制粘贴。支持动态加载的内容。
// @author       Your AI Assistant
// @match        *://*.chaoxing.com/*
// @match        *://*.fanya.chaoxing.com/*
// @match        *://*.mooc.chaoxing.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // --- 核心破解函数 ---
    // 这个函数会查找页面上所有的iframe和可编辑区域，并解除它们的限制
    function unlockPaste() {
        // 解除所有 iframe 内的限制
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe, index) => {
            // 使用一个自定义属性来防止重复处理同一个iframe
            if (iframe.getAttribute('data-unlocked')) {
                return;
            }
            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (!iframeDoc) return;

                const eventsToBlock = ['paste', 'copy', 'cut', 'keydown', 'mousedown', 'dragstart', 'drop'];
                eventsToBlock.forEach(eventName => {
                    iframeDoc.addEventListener(eventName, event => {
                        event.stopPropagation();
                    }, true); // 使用捕获阶段，抢先拦截
                });

                // 标记为已处理
                iframe.setAttribute('data-unlocked', 'true');
                console.log(`[粘贴破解] 已成功处理第 ${index + 1} 个 iframe。`);

            } catch (error) {
                // 跨域iframe会报错，直接忽略
            }
        });

        // 解除主页面上普通输入框和可编辑元素的限制
        const inputs = document.querySelectorAll('input, textarea, [contenteditable="true"]');
        inputs.forEach(input => {
            if (input.getAttribute('data-unlocked')) {
                return;
            }
            const eventsToBlock = ['paste', 'copy', 'cut', 'drop'];
            eventsToBlock.forEach(eventName => {
                input.addEventListener(eventName, event => {
                    event.stopPropagation();
                }, true);
            });
            input.setAttribute('data-unlocked', 'true');
        });
    }

    // --- 脚本执行逻辑 ---
    console.log('[粘贴破解] 脚本已启动，正在监控页面...');

    // 1. 页面加载完成后，立即执行一次
    unlockPaste();

    // 2. 设置一个定时器，周期性地执行破解函数
    //    这是为了处理那些通过JS动态加载出来的新输入框（非常常见）
    setInterval(unlockPaste, 2000); // 每2秒检查一次，性能影响极小

})();