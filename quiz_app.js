// 题目训练系统 JavaScript
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.correctCount = 0;
        this.answeredQuestions = [];
        this.wrongQuestions = [];
        this.mode = 'sequential'; // sequential, random, wrong
        this.questionOrder = [];
        this.autoNextTimer = null; // 自动跳转定时器

        this.init();
    }

    async init() {
        try {
            await this.loadQuestions();
            this.setupQuestionOrder();
            this.displayQuestion();
            this.updateStats();
        } catch (error) {
            console.error('初始化失败:', error);
            document.getElementById('questionText').textContent = '加载题目失败，请检查questions_data.json文件';
        }
    }

    async loadQuestions() {
        try {
            const response = await fetch('questions_data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.questions = await response.json();
            console.log(`成功加载 ${this.questions.length} 道题目`);
        } catch (error) {
            console.error('加载题目失败:', error);
            // 如果加载失败，使用示例数据
            this.questions = this.getSampleQuestions();
        }
    }

    getSampleQuestions() {
        return [
            {
                "id": 1,
                "question": "晶闸管属于",
                "options": ["不可控器件", "半控器件", "全控器件"],
                "correctAnswer": 1,
                "explanation": ""
            },
            {
                "id": 2,
                "question": "电力二极管属于",
                "options": ["全控器件", "不可控器件", "半控器件"],
                "correctAnswer": 1,
                "explanation": ""
            }
        ];
    }

    setupQuestionOrder() {
        switch (this.mode) {
            case 'sequential':
                this.questionOrder = Array.from({length: this.questions.length}, (_, i) => i);
                break;
            case 'random':
                this.questionOrder = this.shuffleArray(Array.from({length: this.questions.length}, (_, i) => i));
                break;
            case 'wrong':
                this.questionOrder = [...this.wrongQuestions];
                if (this.questionOrder.length === 0) {
                    alert('暂无错题，切换到顺序练习模式');
                    this.mode = 'sequential';
                    this.setupQuestionOrder();
                    return;
                }
                break;
        }
        this.currentQuestionIndex = 0;
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    displayQuestion() {
        if (this.questionOrder.length === 0) {
            document.getElementById('questionText').textContent = '没有可用的题目';
            return;
        }

        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const question = this.questions[questionIndex];
        
        if (!question) {
            console.error('题目不存在:', questionIndex);
            return;
        }

        // 更新题目编号和文本
        document.getElementById('questionNumber').textContent = `第 ${this.currentQuestionIndex + 1} 题`;
        document.getElementById('questionText').textContent = question.question;

        // 处理图片
        const imageContainer = document.getElementById('questionImage');
        const imageElement = document.getElementById('questionImg');
        
        if (question.hasImage && question.imageUrl) {
            imageElement.src = question.imageUrl;
            imageContainer.style.display = 'block';
        } else {
            imageContainer.style.display = 'none';
        }

        // 生成选项
        this.displayOptions(question.options);

        // 重置状态
        this.selectedAnswer = null;
        this.cancelAutoNext(); // 清除可能存在的自动跳转定时器
        this.hideResult();
        this.updateButtons();
        this.updateProgress();
    }

    displayOptions(options) {
        const optionsList = document.getElementById('optionsList');
        optionsList.innerHTML = '';

        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.onclick = () => this.selectOption(index);
            
            li.innerHTML = `
                <div class="option-label">${String.fromCharCode(65 + index)}</div>
                <div class="option-text">${option}</div>
            `;
            
            optionsList.appendChild(li);
        });
    }

    selectOption(index) {
        // 移除之前的选择
        document.querySelectorAll('.option').forEach(option => {
            option.classList.remove('selected');
        });

        // 添加新选择
        document.querySelectorAll('.option')[index].classList.add('selected');
        this.selectedAnswer = index;
        
        // 启用提交按钮
        document.getElementById('submitBtn').disabled = false;
    }

    submitAnswer() {
        if (this.selectedAnswer === null) return;

        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const question = this.questions[questionIndex];
        const isCorrect = this.selectedAnswer === question.correctAnswer;

        // 标记选项
        const options = document.querySelectorAll('.option');
        options.forEach((option, index) => {
            if (index === question.correctAnswer) {
                option.classList.add('correct');
            } else if (index === this.selectedAnswer && !isCorrect) {
                option.classList.add('incorrect');
            }
        });

        // 更新统计
        if (!this.answeredQuestions.includes(questionIndex)) {
            this.answeredQuestions.push(questionIndex);
            if (isCorrect) {
                this.correctCount++;
                // 从错题列表中移除
                const wrongIndex = this.wrongQuestions.indexOf(questionIndex);
                if (wrongIndex > -1) {
                    this.wrongQuestions.splice(wrongIndex, 1);
                }
            } else {
                // 添加到错题列表
                if (!this.wrongQuestions.includes(questionIndex)) {
                    this.wrongQuestions.push(questionIndex);
                }
            }
        }

        // 显示结果
        this.showResult(isCorrect, question);
        this.updateStats();
        this.updateButtons();

        // 如果答对了，显示倒计时并自动跳转到下一题
        if (isCorrect) {
            this.showAutoNextCountdown();
        }
    }

    showResult(isCorrect, question) {
        const resultPanel = document.getElementById('resultPanel');
        const resultText = document.getElementById('resultText');

        resultPanel.className = 'result-panel show';
        if (isCorrect) {
            resultPanel.classList.add('result-correct');
            resultText.innerHTML = `
                <strong>✅ 回答正确！</strong><br>
                ${question.explanation || '继续加油！'}
            `;
        } else {
            resultPanel.classList.add('result-incorrect');
            resultText.innerHTML = `
                <strong>❌ 回答错误</strong><br>
                正确答案是：<strong>${String.fromCharCode(65 + question.correctAnswer)}. ${question.options[question.correctAnswer]}</strong><br>
                ${question.explanation || ''}
            `;
        }
    }

    showAutoNextCountdown() {
        const resultText = document.getElementById('resultText');
        let countdown = 2;

        const updateCountdown = () => {
            const currentContent = resultText.innerHTML;
            const baseContent = currentContent.replace(/<div class="auto-next">.*?<\/div>/s, '');

            if (countdown > 0) {
                resultText.innerHTML = baseContent + `
                    <div class="auto-next" style="margin-top: 10px; padding: 8px; background: rgba(255,255,255,0.2); border-radius: 5px; font-size: 14px;">
                        🚀 ${countdown}秒后自动跳转到下一题... <button onclick="window.quizApp.cancelAutoNext()" style="margin-left: 10px; padding: 2px 8px; border: none; border-radius: 3px; background: white; color: #333; cursor: pointer;">取消</button>
                    </div>
                `;
                countdown--;
                this.autoNextTimer = setTimeout(updateCountdown, 1000);
            } else {
                this.nextQuestion();
            }
        };

        updateCountdown();
    }

    cancelAutoNext() {
        if (this.autoNextTimer) {
            clearTimeout(this.autoNextTimer);
            this.autoNextTimer = null;

            // 移除倒计时显示
            const resultText = document.getElementById('resultText');
            const currentContent = resultText.innerHTML;
            resultText.innerHTML = currentContent.replace(/<div class="auto-next">.*?<\/div>/s, '');
        }
    }

    hideResult() {
        const resultPanel = document.getElementById('resultPanel');
        resultPanel.className = 'result-panel';
    }

    updateButtons() {
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        const prevBtn = document.getElementById('prevBtn');

        if (this.selectedAnswer !== null && submitBtn.style.display !== 'none') {
            // 已选择答案，显示提交按钮
            submitBtn.style.display = 'inline-block';
            nextBtn.style.display = 'none';
        } else if (document.getElementById('resultPanel').classList.contains('show')) {
            // 已提交答案，显示下一题按钮
            submitBtn.style.display = 'none';
            nextBtn.style.display = 'inline-block';
        }

        // 上一题按钮
        prevBtn.disabled = this.currentQuestionIndex === 0;
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.questionOrder.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
        } else {
            this.showFinalResults();
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
        }
    }

    showFinalResults() {
        const accuracy = this.answeredQuestions.length > 0 ? 
            Math.round((this.correctCount / this.answeredQuestions.length) * 100) : 0;
        
        alert(`练习完成！\n总题数：${this.questionOrder.length}\n答对：${this.correctCount}题\n正确率：${accuracy}%`);
    }

    updateStats() {
        document.getElementById('totalQuestions').textContent = this.questionOrder.length;
        document.getElementById('currentQuestion').textContent = this.currentQuestionIndex + 1;
        document.getElementById('correctCount').textContent = this.correctCount;
        
        const accuracy = this.answeredQuestions.length > 0 ? 
            Math.round((this.correctCount / this.answeredQuestions.length) * 100) : 0;
        document.getElementById('accuracy').textContent = accuracy + '%';
    }

    updateProgress() {
        const progress = ((this.currentQuestionIndex + 1) / this.questionOrder.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
    }

    resetQuiz() {
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.correctCount = 0;
        this.answeredQuestions = [];
        this.setupQuestionOrder();
        this.displayQuestion();
        this.updateStats();
    }
}

// 模式切换函数
function setMode(mode, buttonElement) {
    // 更新按钮状态
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // 如果没有传入按钮元素，通过模式查找
    if (!buttonElement) {
        const buttons = document.querySelectorAll('.mode-btn');
        const modeIndex = mode === 'sequential' ? 0 : mode === 'random' ? 1 : 2;
        buttonElement = buttons[modeIndex];
    }

    if (buttonElement) {
        buttonElement.classList.add('active');
    }

    // 切换模式
    if (window.quizApp) {
        window.quizApp.mode = mode;
        window.quizApp.setupQuestionOrder();
        window.quizApp.displayQuestion();
        window.quizApp.updateStats();
    }
}

// 全局函数
function submitAnswer() {
    window.quizApp.submitAnswer();
}

function nextQuestion() {
    window.quizApp.nextQuestion();
}

function previousQuestion() {
    window.quizApp.previousQuestion();
}

function resetQuiz() {
    window.quizApp.resetQuiz();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
