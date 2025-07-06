// ==UserScript==
// @name         全功能解题助手 v4.1 (智能混合模式)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  新增智能混合模式，自动判断并填充填空题与选择题。
// @author       AI & 您
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    if (document.getElementById('unified-helper-panel')) return;

    // --- 1. 创建UI界面 (新增混合模式选项卡) ---
    function createUnifiedUI() {
        const panel = document.createElement('div');
        panel.id = 'unified-helper-panel';
        panel.innerHTML = `
            <div class="helper-header">
                <span>全功能助手 v4.1</span>
                <div class="header-buttons"><span class="helper-toggle-btn" title="最小化">-</span><span class="helper-close-btn" title="关闭">×</span></div>
            </div>
            <div class="helper-tabs">
                <button id="tab-mixed-mode" class="helper-tab-btn active">智能混合</button>
                <button id="tab-fill-in-blank" class="helper-tab-btn">仅填空</button>
                <button id="tab-multiple-choice" class="helper-tab-btn">仅选择</button>
            </div>
            <div class="helper-content">
                <!-- 混合模式界面 -->
                <div id="content-mixed-mode" class="tab-content active">
                    <p class="helper-desc">粘贴所有答案，脚本将自动判断题型并填充。</p>
                    <textarea class="answer-textarea" id="mixed-answer-textarea" placeholder="频率\nA\n36\nB,C..."></textarea>
                    <button id="fill-all-btn" class="helper-btn fill">一键填充所有题目</button>
                </div>
                <!-- 填空题界面 -->
                <div id="content-fill-in-blank" class="tab-content">
                    <p class="helper-desc">仅用于处理填空题。</p>
                    <textarea class="answer-textarea" id="fib-answer-textarea" placeholder="第一空: 答案A..."></textarea>
                    <button id="fill-fib-btn" class="helper-btn fill">填充填空</button>
                    <button id="clear-fib-btn" class="helper-btn clear">清除填空</button>
                </div>
                <!-- 选择题界面 -->
                <div id="content-multiple-choice" class="tab-content">
                    <p class="helper-desc">仅用于处理选择题。</p>
                    <textarea class="answer-textarea" id="mc-answer-textarea" placeholder="A\nB\nA,C..."></textarea>
                    <button id="fill-mc-btn" class="helper-btn fill">填充选择</button>
                    <button id="clear-mc-btn" class="helper-btn clear">清除选择</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
        addUnifiedStyles();
        addUnifiedEventListeners();
        addDragLogic(panel);
    }

    // --- 2. 核心功能区 (模块化) ---
    // A. 填空题模块
    const fillInBlankModule = {
        cleanAnswers: (rawText) => { /* ... (代码同v4.0) ... */ if(!rawText||!rawText.trim())return[];const t=rawText.split("\n"),e=[];return t.forEach(t=>{let n=t.trim();if(n){const a=/^[【\[\(（]?\s*(\d+|[一二三四五六七八九十]+)\s*[】\]\)）]?\s*[:：、.]\s*|^[【\[\(（]?\s*(第[一二三四五六七八九十]+空|答案|答)\s*[】\]\)）]?\s*[:：、.]?\s*/;let r=n.replace(a,"");r.trim()?e.push(r.trim()):/^\d+$/.test(n)&&e.push(n)}}),e },
        process: (mode, answers) => {
            if (mode === 'fill' && !answers) answers = fillInBlankModule.cleanAnswers(document.getElementById('fib-answer-textarea').value);
            if (mode === 'fill' && answers.length === 0) { alert('未提取到有效填空题答案！'); return 0; }
            let count = 0, i = 0, notFound = 0;
            while (true) {
                const iframe = document.getElementById(`ueditor_${i++}`);
                if (!iframe) { if (++notFound >= 5) break; continue; }
                notFound = 0;
                if (mode === 'fill' && count >= answers.length) break;
                try {
                    const el = iframe.contentDocument.querySelector('p') || iframe.contentDocument.body;
                    if (el) {
                        el.textContent = (mode === 'fill') ? answers[count] : '';
                        iframe.style.outline = (mode === 'fill') ? '3px solid #28a745' : 'none';
                        count++;
                    }
                } catch (e) {}
            }
            return count;
        }
    };

    // B. 选择题模块
    const multipleChoiceModule = {
        process: (mode, answers) => {
            if (mode === 'clear' && !confirm('确定要清除所有选择题答案吗？')) return 0;
            if (mode === 'fill' && !answers) answers = document.getElementById('mc-answer-textarea').value.split('\n').filter(l => l.trim());
            if (mode === 'fill' && answers.length === 0) { alert('请输入选择题答案！'); return 0; }
            let count = 0;
            const questions = document.querySelectorAll('.TiMu');
            if (questions.length === 0 && mode === 'fill') { alert('未找到题目（.TiMu）。'); return 0; }
            questions.forEach((block) => {
                const inputs = block.querySelectorAll('input[type="radio"], input[type="checkbox"]');
                if(inputs.length === 0) return; // 如果这个.TiMu里没有选项，就跳过，不消耗答案
                if (mode === 'fill') {
                    if (count >= answers.length) return;
                    const targets = answers[count].trim().toUpperCase().split(',').map(s => s.trim());
                    inputs.forEach(input => {
                        if (targets.includes(input.value.toUpperCase())) {
                            if (!input.checked) input.click();
                            const li = input.closest('li');
                            if (li) li.style.backgroundColor = '#d4edda';
                        }
                    });
                    count++;
                } else {
                    inputs.forEach(input => {
                        if (input.checked) input.checked = false;
                        const li = input.closest('li');
                        if (li) li.style.backgroundColor = '';
                    });
                }
            });
            return (mode === 'fill') ? count : questions.length;
        }
    };
    
    // C. 智能混合模式模块 (新)
    const mixedModeModule = {
        process: () => {
            const rawText = document.getElementById('mixed-answer-textarea').value;
            const allLines = rawText.split('\n').filter(l => l.trim());
            if (allLines.length === 0) { alert('请粘贴混合答案！'); return; }

            const fibAnswers = [];
            const mcAnswers = [];
            
            // **智能判断引擎**
            const mcRegex = /^[A-G](?:\s*,\s*[A-G])*$/i; // A | A,C | A, C, D
            allLines.forEach(line => {
                if (mcRegex.test(line.trim())) {
                    mcAnswers.push(line.trim());
                } else {
                    fibAnswers.push(line.trim()); // 其他所有情况都归为填空题
                }
            });

            console.log("判断结果：", {填空题: fibAnswers, 选择题: mcAnswers});

            // 依次执行填充
            const fibFilled = fillInBlankModule.process('fill', fibAnswers);
            const mcFilled = multipleChoiceModule.process('fill', mcAnswers);
            
            alert(`智能填充完成！\n\n- 填空题：找到 ${fibAnswers.length} 个答案，成功填充 ${fibFilled} 个。\n- 选择题：找到 ${mcAnswers.length} 个答案，成功操作 ${mcFilled} 道题。`);
        }
    };

    // --- 3. UI控制与事件绑定 ---
    function addUnifiedEventListeners() {
        document.getElementById('tab-mixed-mode').addEventListener('click', () => switchTab('mixed-mode'));
        document.getElementById('tab-fill-in-blank').addEventListener('click', () => switchTab('fill-in-blank'));
        document.getElementById('tab-multiple-choice').addEventListener('click', () => switchTab('multiple-choice'));

        document.getElementById('fill-all-btn').addEventListener('click', mixedModeModule.process);
        document.getElementById('fill-fib-btn').addEventListener('click', () => alert(`填空题操作完成！成功填充 ${fillInBlankModule.process('fill')} 个。`));
        document.getElementById('clear-fib-btn').addEventListener('click', () => alert(`填空题操作完成！成功清除 ${fillInBlankModule.process('clear')} 个。`));
        document.getElementById('fill-mc-btn').addEventListener('click', () => alert(`选择题操作完成！成功操作 ${multipleChoiceModule.process('fill')} 道题。`));
        document.getElementById('clear-mc-btn').addEventListener('click', () => alert(`选择题操作完成！成功清除 ${multipleChoiceModule.process('clear')} 道题的选择。`));

        document.querySelector('#unified-helper-panel .helper-toggle-btn').addEventListener('click', togglePanel);
        document.querySelector('#unified-helper-panel .helper-close-btn').addEventListener('click', removePanel);
    }

    function switchTab(id) {
        document.querySelectorAll('.helper-tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`tab-${id}`).classList.add('active');
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.getElementById(`content-${id}`).classList.add('active');
    }
    
    function togglePanel() { /* ... (代码同v4.0) ... */ const e=document.getElementById("unified-helper-panel"),t=e.querySelector(".helper-toggle-btn");e.classList.toggle("minimized"),t.textContent=e.classList.contains("minimized")?"+":"-" }
    function removePanel() { /* ... (代码同v4.0) ... */ confirm("确定要彻底关闭助手吗？")&&(document.getElementById("unified-helper-panel").remove(),document.getElementById("unified-helper-styles").remove()) }
    function addDragLogic(panel) { /* ... (代码同v4.0) ... */ const e=panel.querySelector(".helper-header");let t,n,l=!1;e.addEventListener("mousedown",o=>{o.target.classList.contains("helper-toggle-btn")||o.target.classList.contains("helper-close-btn")||(l=!0,t=o.clientX-panel.offsetLeft,n=o.clientY-panel.offsetTop,e.style.cursor="grabbing")}),document.addEventListener("mousemove",o=>{l&&(panel.style.left=`${o.clientX-t}px`,panel.style.top=`${o.clientY-n}px`)}),document.addEventListener("mouseup",()=>{l=!1,e.style.cursor="grab"}) }

    // --- 4. CSS样式 ---
    function addUnifiedStyles() {
        const style = document.createElement('style');
        style.id = 'unified-helper-styles';
        style.textContent = `
            #unified-helper-panel { position: fixed; bottom: 20px; right: 20px; z-index: 10000; background-color: #fff; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: sans-serif; width: 280px; }
            #unified-helper-panel.minimized .helper-tabs, #unified-helper-panel.minimized .helper-content { display: none; }
            .helper-header { padding: 10px; background-color: #f7f7f7; border-bottom: 1px solid #eee; border-radius: 8px 8px 0 0; display: flex; justify-content: space-between; align-items: center; font-weight: bold; cursor: grab; }
            .header-buttons { display: flex; align-items: center; gap: 8px; }
            .helper-toggle-btn, .helper-close-btn { cursor: pointer; font-size: 20px; color: #aaa; line-height: 1; user-select: none; }
            .helper-close-btn:hover, .helper-toggle-btn:hover { color: #333; }
            .helper-tabs { display: flex; background-color: #f1f1f1; }
            .helper-tab-btn { flex: 1; padding: 10px; border: none; background-color: transparent; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; transition: all 0.2s; }
            .helper-tab-btn.active { border-bottom-color: #007bff; font-weight: bold; color: #007bff; }
            .helper-content { padding: 15px; }
            .tab-content { display: none; }
            .tab-content.active { display: block; animation: fadeIn 0.3s; }
            @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
            .helper-desc { font-size: 13px; color: #666; margin: 0 0 10px 0; line-height: 1.4; }
            .answer-textarea { width: 100%; height: 120px; box-sizing: border-box; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; margin-bottom: 10px; }
            .helper-btn { width: 100%; padding: 10px; border: none; border-radius: 5px; cursor: pointer; color: white; font-size: 15px; margin-bottom: 8px; }
            .helper-btn.fill { background-color: #28a745; }
            .helper-btn.clear { background-color: #dc3545; }
            #fill-all-btn { background-color: #ff9800; }
        `;
        document.head.appendChild(style);
    }
    
    // --- 启动脚本 ---
    createUnifiedUI();
})();