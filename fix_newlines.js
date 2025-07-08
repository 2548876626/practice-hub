/**
 * 文本换行符处理工具函数
 * 用于修复JSON数据中的换行符显示问题
 */

// 通用的文本换行符处理函数
function formatTextWithLineBreaks(text, useHTML = true) {
    if (!text || typeof text !== 'string') return '';
    
    if (useHTML) {
        // 将 \n 转换为 <br> 标签
        return text.replace(/\\n/g, '<br>');
    } else {
        // 将 \n 转换为实际换行符（用于 CSS white-space: pre-line）
        return text.replace(/\\n/g, '\n');
    }
}

// 安全的HTML转义函数（防止XSS攻击）
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 安全的换行符处理函数
function safeFormatTextWithLineBreaks(text) {
    if (!text) return '';
    return escapeHtml(text).replace(/\\n/g, '<br>');
}

// 处理更复杂的文本格式
function advancedTextFormatter(text) {
    if (!text) return '';
    
    return text
        .replace(/\\n/g, '<br>')           // 换行符转换
        .replace(/\\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;')  // 制表符转换
        .replace(/\s{2,}/g, '&nbsp;&nbsp;'); // 多个空格保持
}

// 批量处理JSON数据中的文本字段
function processQuestionData(questions) {
    if (!Array.isArray(questions)) return questions;
    
    return questions.map(question => {
        const processedQuestion = { ...question };
        
        // 处理常见的文本字段
        const textFields = ['problem', 'solution', 'thinking', 'title'];
        
        textFields.forEach(field => {
            if (processedQuestion[field] && typeof processedQuestion[field] === 'string') {
                // 这里不修改原始数据，只是标记需要处理
                console.log(`字段 ${field} 需要换行符处理:`, processedQuestion[field]);
            }
        });
        
        return processedQuestion;
    });
}

// 测试函数
function testNewlineProcessing() {
    const testText = "第一行\\n第二行\\n\\n第三行（空行前）";
    
    console.log('原始文本:', testText);
    console.log('HTML处理:', formatTextWithLineBreaks(testText, true));
    console.log('纯文本处理:', formatTextWithLineBreaks(testText, false));
    console.log('安全处理:', safeFormatTextWithLineBreaks(testText));
}

// 导出函数（如果在模块环境中使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        formatTextWithLineBreaks,
        escapeHtml,
        safeFormatTextWithLineBreaks,
        advancedTextFormatter,
        processQuestionData
    };
}

// 在浏览器环境中添加到全局对象
if (typeof window !== 'undefined') {
    window.TextFormatter = {
        formatTextWithLineBreaks,
        escapeHtml,
        safeFormatTextWithLineBreaks,
        advancedTextFormatter,
        processQuestionData,
        testNewlineProcessing
    };
}

console.log('文本换行符处理工具已加载');
