(function() {
    // --- 防止脚本重复运行 ---
    if (document.getElementById('chaoxing-extractor-container')) {
        alert('脚本已经运行，请勿重复执行！');
        return;
    }

    // --- 1. 创建UI界面 (这部分代码没有变化) ---
    const container = document.createElement('div');
    container.id = 'chaoxing-extractor-container';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.backgroundColor = 'white';
    container.style.border = '1px solid #ccc';
    container.style.borderRadius = '8px';
    container.style.padding = '10px';
    container.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
    container.style.fontFamily = 'Arial, sans-serif';

    const title = document.createElement('h3');
    title.innerText = '学习通助手 v2.0';
    title.style.margin = '0 0 10px 0';
    title.style.textAlign = 'center';
    title.style.color = '#333';

    const extractButton = document.createElement('button');
    extractButton.innerText = '提取题库';
    extractButton.style.display = 'block';
    extractButton.style.width = '100%';
    extractButton.style.padding = '8px';
    extractButton.style.marginBottom = '5px';
    extractButton.style.border = '1px solid #4CAF50';
    extractButton.style.backgroundColor = '#4CAF50';
    extractButton.style.color = 'white';
    extractButton.style.borderRadius = '4px';
    extractButton.style.cursor = 'pointer';

    const stopButton = document.createElement('button');
    stopButton.innerText = '关闭脚本';
    stopButton.style.display = 'block';
    stopButton.style.width = '100%';
    stopButton.style.padding = '8px';
    stopButton.style.border = '1px solid #f44336';
    stopButton.style.backgroundColor = '#f44336';
    stopButton.style.color = 'white';
    stopButton.style.borderRadius = '4px';
    stopButton.style.cursor = 'pointer';

    container.appendChild(title);
    container.appendChild(extractButton);
    container.appendChild(stopButton);
    document.body.appendChild(container);

    console.log('✅ 学习通题库提取脚本 v2.0 已加载，支持图片提取和复杂题干。');

    // --- 2. 核心功能：提取数据 ---
    function extractData() {
        console.log('🚀 开始提取题目和答案... 正在加强题干提取并检查图片...');
        const questionBlocks = document.querySelectorAll('.TiMu');

        if (questionBlocks.length === 0) {
            alert('当前页面未找到任何题目！请确认您在正确的答题或试卷页面。');
            return;
        }

        let fullContent = '';

        questionBlocks.forEach((block, index) => {
            // **【重大改进】** 提取题干、选项和答案的逻辑
            const questionData = extractQuestionData(block, index);
            
            // 格式化输出
            fullContent += `----------------------------------------\n`;
            fullContent += `题号: ${index + 1}\n`;
            fullContent += `题干: ${questionData.title}\n`;
            fullContent += `选项:\n${questionData.options}\n`;
            fullContent += `答案: ${questionData.answer}\n\n`;
        });
        
        console.log('✅ 提取完成！正在打开新窗口显示结果...');
        displayResults(fullContent);
    }

    // **【新增函数】** 用于从单个题目块中提取所有信息
    function extractQuestionData(block, index) {
        let data = {
            title: '未找到题干',
            options: '未找到选项',
            answer: '未找到答案'
        };

        // **1. 提取题干 (加强版，支持图片)**
        // 尝试多种可能的选择器来定位题干容器，提高成功率
        const titleSelectors = ['.Zy_TItle', '.zy_title', 'div[class^="subject_stem"]'];
        let titleElement = null;
        for (const selector of titleSelectors) {
            titleElement = block.querySelector(selector);
            if (titleElement) break; // 找到就停止
        }
        
        if (titleElement) {
            // 使用内部函数处理包含图片的复杂题干
            data.title = getTitleWithImages(titleElement);
        }

        // **2. 提取选项**
        const optionElements = block.querySelectorAll('.Zy_ulTop > li');
        if (optionElements.length > 0) {
            data.options = Array.from(optionElements).map(li => li.innerText.trim()).join('\n');
        }

        // **3. 提取答案**
        const answerElement = block.querySelector('.Py_answer span:first-child');
        if (answerElement) {
            const answerText = answerElement.innerText.trim();
            data.answer = answerText.includes('：') ? answerText.split('：')[1].trim() : answerText;
        }

        return data;
    }

    // **【新增函数】** 专门处理题干中的文字和图片
    function getTitleWithImages(titleContainer) {
        let content = '';
        // 遍历题干容器的所有子节点
        titleContainer.childNodes.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                // 如果是文本节点，直接添加文本
                content += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // 如果是元素节点
                if (node.tagName === 'IMG') {
                    // 如果是图片，添加一个标记和图片的URL
                    content += ` [图片: ${node.src}] `;
                } else {
                    // 如果是其他元素(如<p>, <span>), 添加其内部文本
                    content += node.textContent;
                }
            }
        });
        // 清理多余的换行和空格，让格式更整洁
        return content.replace(/\s+/g, ' ').trim();
    }


    // --- 3. 显示结果 (无变化) ---
    function displayResults(data) {
        const newWindow = window.open('', '_blank');
        newWindow.document.title = '学习通题目提取结果';
        newWindow.document.body.innerHTML = `<pre>${data}</pre>`;
    }

    // --- 4. 停止脚本 (无变化) ---
    function stopScript() {
        document.body.removeChild(container);
        console.log('👋 脚本已停止，UI界面已移除。');
    }

    // --- 5. 绑定事件 (无变化) ---
    extractButton.addEventListener('click', extractData);
    stopButton.addEventListener('click', stopScript);

})();