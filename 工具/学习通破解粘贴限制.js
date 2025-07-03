// ==UserScript==
// @name         超星/学习通 终极粘贴破解 (纯文本模式)
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  自动解除超星、学习通平台的粘贴限制，并强制以【纯文本】方式粘贴，去除所有格式。支持动态加载的内容。
// @author       Your AI Assistant
// @match        *://*.chaoxing.com/*
// @match        *://*.fanya.chaoxing.com/*
// @match        *://*.mooc.chaoxing.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    function applyUnlock(docContext, elementDescription) {
        // 使用一个自定义属性来防止重复绑定事件
        if (docContext.body && docContext.body.getAttribute('data-unlocked-paste')) {
            return false; // 如果已经处理过，就跳过
        }

        // --- 1. 拦截并处理“粘贴”事件 ---
        docContext.addEventListener('paste', event => {
            // 阻止网站自己的限制脚本和浏览器的默认粘贴行为
            event.stopPropagation();
            event.preventDefault();

            // 从剪贴板获取纯文本内容
            const text = (event.clipboardData || window.clipboardData).getData('text/plain');

            // 将纯文本插入到光标位置
            // execCommand 虽然有点旧，但在这里非常可靠和简单
            docContext.execCommand('insertText', false, text);
            
            console.log(`[粘贴破解] 已成功将纯文本粘贴到 "${elementDescription}"`);
        }, true); // true 表示在捕获阶段执行，确保最先响应

        // --- 2. 拦截其他可能被限制的事件 ---
        const otherEvents = ['copy', 'cut', 'keydown', 'mousedown', 'dragstart', 'drop'];
        otherEvents.forEach(eventName => {
            docContext.addEventListener(eventName, event => {
                // 只阻止事件传播，不阻止默认行为（比如正常的按键、拖拽选择）
                event.stopPropagation();
            }, true);
        });
        
        // 标记为已处理
        if (docContext.body) {
           docContext.body.setAttribute('data-unlocked-paste', 'true');
        }
        return true;
    }
    
    // --- 核心监控和执行函数 ---
    function runUnlocker() {
        // --- 处理所有 iframe ---
        document.querySelectorAll('iframe').forEach((iframe, index) => {
            // 检查iframe是否已被处理，避免重复操作
            if (iframe.getAttribute('data-unlocked-frame')) return;

            try {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    if(applyUnlock(iframeDoc, `Iframe #${index+1}`)) {
                       iframe.setAttribute('data-unlocked-frame', 'true'); // 标记这个iframe
                    }
                }
            } catch (e) {
                // 跨域iframe会报错，忽略即可
            }
        });
        
        // --- 处理主页面上的可编辑区域 ---
        // 主要是为了以防万一有非iframe的输入区
        applyUnlock(document, '主页面');
    }

    // --- 脚本启动 ---
    console.log('[粘贴破解] 纯文本粘贴脚本已启动，正在监控页面...');

    // 页面加载完成后，立即执行一次
    runUnlocker();

    // 设置一个定时器，周期性地执行，以处理动态加载的编辑器
    setInterval(runUnlocker, 2000); // 每2秒检查一次

})();