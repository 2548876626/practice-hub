// ==================== 学习通助手 v3.8 (弹窗&稳定性终极修复版) ====================

(function() {
    // --- 防止脚本重复运行 ---
    const SCRIPT_ID = 'chaoxing-extractor-container';
    if (document.getElementById(SCRIPT_ID)) {
        alert('脚本已经运行，请勿重复执行！');
        return;
    }

    // --- 1. 创建UI界面 ---
    const container = document.createElement('div');
    container.id = SCRIPT_ID;
    container.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; z-index: 9999; 
        background-color: white; border: 1px solid #ccc; border-radius: 8px; 
        padding: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); 
        font-family: Arial, sans-serif; width: 180px;
    `;

    const title = document.createElement('h3');
    title.innerText = '学习通助手 v3.8';
    title.style.cssText = 'margin: 0 0 10px 0; text-align: center; color: #333;';

    const extractButton = document.createElement('button');
    extractButton.innerText = '提取题库 (稳定版)';
    extractButton.style.cssText = `
        display: block; width: 100%; padding: 8px; margin-bottom: 5px; 
        border: 1px solid #4CAF50; background-color: #4CAF50; color: white; 
        border-radius: 4px; cursor: pointer;
    `;

    const stopButton = document.createElement('button');
    stopButton.innerText = '关闭脚本';
    stopButton.style.cssText = `
        display: block; width: 100%; padding: 8px; 
        border: 1px solid #f44336; background-color: #f44336; color: white; 
        border-radius: 4px; cursor: pointer;
    `;

    container.appendChild(title);
    container.appendChild(extractButton);
    container.appendChild(stopButton);
    document.body.appendChild(container);

    console.log('✅ 学习通助手 v3.8 已加载，已修复弹窗拦截和按钮失效问题。');

    // --- 2. 核心功能：提取数据 ---
    function extractData() {
        // **【弹窗修复】** 立即打开新窗口，绕过拦截
        console.log('正在预先打开结果窗口...');
        const newWindow = window.open('', '_blank');
        if (!newWindow) {
            alert('打开新窗口失败！请检查并暂时禁用浏览器的弹窗拦截功能，然后重试。');
            return;
        }
        newWindow.document.title = '学习通题目提取结果';
        newWindow.document.body.innerHTML = '<pre>正在提取数据，请稍候...</pre>';
        
        // 使用setTimeout来给浏览器一点时间渲染新窗口，然后开始耗时操作
        setTimeout(() => {
            console.log('🚀 开始提取题目和答案...');
            let fullContent = '';
            const reviewPageContainer = document.querySelector('.mark_table.padTop60');

            if (reviewPageContainer) {
                console.log('检测到考试查阅页面模式。');
                const allElements = reviewPageContainer.querySelectorAll('h2.type_tit, div[id^="question"]');
                if (allElements.length === 0) {
                     alert('在查阅页面容器中未找到任何大题标题或题目块！');
                     newWindow.close(); // 关闭无用的窗口
                     return;
                }
                let questionCounter = 1; 
                allElements.forEach(element => {
                    if (element.matches('h2.type_tit')) {
                        fullContent += `\n========================================\n【${element.innerText.trim()}】\n========================================\n\n`;
                    } else if (element.matches('div[id^="question"]')) {
                        const questionData = extractReviewPageData(element);
                        fullContent += `----------------------------------------\n题号: ${questionCounter++}\n题干: ${questionData.title}\n`;
                        if (questionData.options) { fullContent += `选项:\n${questionData.options}\n`; }
                        fullContent += `答案:\n${questionData.answer}\n\n`;
                    }
                });
            } else if (document.querySelectorAll('.TiMu').length > 0) {
                // 标准答题页逻辑
                console.log('检测到标准答题页面模式。');
                const questionBlocks = document.querySelectorAll('.TiMu');
                questionBlocks.forEach((block, index) => {
                    const questionData = extractStandardPageData(block);
                    fullContent += `----------------------------------------\n题号: ${index + 1}\n题干: ${questionData.title}\n`;
                    if (questionData.options) { fullContent += `选项:\n${questionData.options}\n`; }
                    fullContent += `答案: ${questionData.answer}\n\n`;
                });
            } else {
                alert('当前页面未找到任何题目！请确认您在正确的答题或试卷页面。');
                newWindow.close();
                return;
            }
            
            if (fullContent.trim() === '') {
                alert('提取失败，未能获取任何有效内容。请检查页面结构。');
                newWindow.document.body.innerHTML = '<pre>提取失败，未能获取任何有效内容。</pre>';
                return;
            }

            console.log('✅ 提取完成！正在将结果写入新窗口...');
            // 将结果写入已打开的窗口
            newWindow.document.body.innerHTML = `<pre style="white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', Courier, monospace; font-size: 14px;">${fullContent}</pre>`;
            newWindow.focus(); // 将新窗口置于顶层

        }, 100); // 延迟100毫秒执行
    }

    // --- 3. 提取函数 (所有提取逻辑均完整且无变化) ---
    function extractReviewPageData(block) {
        let data = { title: '未找到题干', options: null, answer: '未找到答案' };
        const titleElement = block.querySelector('.qtContent');
        if (titleElement) data.title = getComplexContent(titleElement);
        
        const choiceOptionsList = block.querySelector('ul.mark_letter');
        if (choiceOptionsList) {
            data.options = Array.from(choiceOptionsList.querySelectorAll('li')).map(li => li.innerText.trim()).join('\n');
            const answerElement = block.querySelector('.mark_key .rightAnswerContent');
            if (answerElement) data.answer = answerElement.innerText.trim();
            else data.answer = "未找到选择/判断题答案";
        } else {
            const answerContainers = block.querySelectorAll('dd.rightAnswerContent');
            if (answerContainers.length > 0) {
                data.answer = Array.from(answerContainers)
                                   .map(container => getComplexContent(container, "答案"))
                                   .join('\n');
            } else {
                 data.answer = "未找到非选择题答案";
            }
        }
        return data;
    }
    
    function getComplexContent(container, contentType = "内容") {
        const images = container.querySelectorAll('img');
        let content = '';
        if (images.length > 0) {
            const imageUrls = Array.from(images).map(img => `[图片${contentType}: ${img.src}]`);
            const textContent = container.innerText.trim();
            content = imageUrls.join('\n');
            if(textContent) { content += `\n[补充文字: ${textContent}]`; }
        } else {
            content = container.innerText.trim();
        }
        return content || `[未找到任何文本或图片${contentType}]`;
    }

    function extractStandardPageData(block) {
        let data = { title: '未找到题干', options: null, answer: '未找到答案' };
        const titleElement = block.querySelector('.Zy_TItle, .zy_title, div[class^="subject_stem"]');
        if (titleElement) data.title = getTitleWithImages(titleElement);
        const optionElements = block.querySelectorAll('.Zy_ulTop > li');
        if (optionElements.length > 0) data.options = Array.from(optionElements).map(li => li.innerText.trim()).join('\n');
        const answerElement = block.querySelector('.Py_answer span:first-child');
        if (answerElement) {
            const answerText = answerElement.innerText.trim();
            data.answer = answerText.includes('：') ? answerText.split('：')[1].trim() : answerText;
        }
        return data;
    }

    function getTitleWithImages(titleContainer) {
        let content = '';
        titleContainer.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) { content += node.textContent; } 
            else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === 'IMG') { content += ` [图片: ${node.src}] `; } 
                else { content += node.textContent; }
            }
        });
        return content.replace(/\s+/g, ' ').trim();
    }
    
    // --- 4. 关闭脚本函数 ---
    function stopScript() {
        const ui = document.getElementById(SCRIPT_ID);
        if (ui) {
            ui.remove();
        }
        console.log('👋 脚本已停止，UI界面已移除。');
    }

    // --- 5. 绑定事件 ---
    extractButton.addEventListener('click', extractData);
    stopButton.addEventListener('click', stopScript);

})();