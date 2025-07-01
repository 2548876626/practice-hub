// 题目训练系统 JavaScript
class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.selectedAnswer = null;
        this.correctCount = 0;
        this.answeredQuestions = [];
        this.wrongQuestions = [];
        this.favoriteQuestions = this.loadFavorites(); // 收藏的题目
        this.mode = 'sequential'; // sequential, random, wrong, favorites
        this.questionOrder = [];
        this.autoNextTimer = null; // 自动跳转定时器
        this.autoNextEnabled = true; // 自动跳转开关
        this.quizType = null; // 'choice' 或 'judgment'
        this.isQuizStarted = false; // 是否已开始答题

        this.init();
    }

    async init() {
        try {
            this.setupThemeDetection();
            this.setupResizeListener();
            this.showHomePage();
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    showHomePage() {
        document.getElementById('quizTypeSelector').style.display = 'block';
        document.getElementById('quizInterface').style.display = 'none';
        this.isQuizStarted = false;
    }

    async startQuiz(type) {
        this.quizType = type;
        this.isQuizStarted = true;

        // 隐藏主页，显示答题界面
        document.getElementById('quizTypeSelector').style.display = 'none';
        document.getElementById('quizInterface').style.display = 'block';

        // 更新标题
        const title = type === 'choice' ? '📝 选择题练习' : '⚡ 判断题练习';
        document.getElementById('quizTitle').textContent = title;

        try {
            await this.loadQuestions();
            this.setupQuestionOrder();
            this.displayQuestion();
            this.updateStats();

            // 显示自动跳转控制面板
            document.getElementById('autoNextControls').classList.add('show');
        } catch (error) {
            console.error('加载题目失败:', error);
            document.getElementById('questionText').textContent = '加载题目失败，请检查数据文件';
        }
    }

    setupResizeListener() {
        // 监听窗口大小变化，更新按钮布局
        window.addEventListener('resize', () => {
            this.updateButtons();
        });
    }

    setupThemeDetection() {
        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleThemeChange = (e) => {
            console.log('主题模式:', e.matches ? '暗色' : '浅色');
            // CSS变量会自动应用，无需额外处理
        };

        // 初始检测
        handleThemeChange(mediaQuery);

        // 监听变化（使用现代API）
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleThemeChange);
        } else {
            // 兼容旧版浏览器
            mediaQuery.addListener(handleThemeChange);
        }
    }

    async loadQuestions() {
        try {
            const fileName = this.quizType === 'choice' ? 'questions_data.json' : 'judgment_questions.json';
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.questions = await response.json();
            const typeText = this.quizType === 'choice' ? '选择题' : '判断题';
            console.log(`成功加载 ${this.questions.length} 道${typeText}`);
        } catch (error) {
            console.error('加载题目失败:', error);
            // 如果加载失败，使用示例数据
            this.questions = this.getSampleQuestions();
        }
    }

    getSampleQuestions() {
        if (this.quizType === 'choice') {
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
        } else {
            return [
                {
                    "id": 1,
                    "question": "电压型逆变电路输出电压波形是幅值一定的矩形波，而电流波形则不一定（由负阻决定）。",
                    "options": ["正确", "错误"],
                    "correctAnswer": 0,
                    "explanation": ""
                },
                {
                    "id": 2,
                    "question": "电力晶体管属电压驱动型开关管",
                    "options": ["正确", "错误"],
                    "correctAnswer": 1,
                    "explanation": ""
                }
            ];
        }
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
            case 'favorites':
                this.questionOrder = [...this.favoriteQuestions];
                if (this.questionOrder.length === 0) {
                    alert('暂无收藏题目，切换到顺序练习模式');
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

        // 更新收藏状态
        this.updateFavoriteButton(questionIndex);

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

        // 检测是否为判断题（只有两个选项且为"正确"/"错误"）
        const isJudgmentQuestion = options.length === 2 &&
            (options.includes('正确') && options.includes('错误'));

        options.forEach((option, index) => {
            const li = document.createElement('li');
            li.className = 'option';
            li.onclick = () => this.selectOption(index);

            if (isJudgmentQuestion) {
                // 判断题使用 ✓ 和 ✗ 符号
                const symbol = option === '正确' ? '✓' : '✗';
                const color = option === '正确' ? '#28a745' : '#dc3545';
                li.innerHTML = `
                    <div class="option-label" style="background: ${color};">${symbol}</div>
                    <div class="option-text">${option}</div>
                `;
            } else {
                // 选择题使用 A、B、C、D
                li.innerHTML = `
                    <div class="option-label">${String.fromCharCode(65 + index)}</div>
                    <div class="option-text">${option}</div>
                `;
            }

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

        // 如果答对了且开启自动跳转，则自动跳转到下一题
        if (isCorrect && this.autoNextEnabled) {
            this.autoNextTimer = setTimeout(() => {
                this.nextQuestion();
            }, 300); // 0.3秒后自动跳转
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

    cancelAutoNext() {
        if (this.autoNextTimer) {
            clearTimeout(this.autoNextTimer);
            this.autoNextTimer = null;
        }
    }

    toggleAutoNext() {
        this.autoNextEnabled = !this.autoNextEnabled;
        const toggle = document.getElementById('autoNextToggle');
        if (this.autoNextEnabled) {
            toggle.classList.add('active');
        } else {
            toggle.classList.remove('active');
            this.cancelAutoNext(); // 取消当前的自动跳转
        }
    }

    // 收藏相关方法
    loadFavorites() {
        try {
            const saved = localStorage.getItem('quiz_favorites');
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('加载收藏失败:', error);
            return [];
        }
    }

    saveFavorites() {
        try {
            localStorage.setItem('quiz_favorites', JSON.stringify(this.favoriteQuestions));
        } catch (error) {
            console.error('保存收藏失败:', error);
        }
    }

    toggleFavorite() {
        const questionIndex = this.questionOrder[this.currentQuestionIndex];
        const isFavorited = this.favoriteQuestions.includes(questionIndex);

        if (isFavorited) {
            // 取消收藏
            const index = this.favoriteQuestions.indexOf(questionIndex);
            this.favoriteQuestions.splice(index, 1);
        } else {
            // 添加收藏
            this.favoriteQuestions.push(questionIndex);
        }

        this.saveFavorites();
        this.updateFavoriteButton(questionIndex);

        // 如果当前在收藏模式且取消了收藏，需要更新题目列表
        if (this.mode === 'favorites' && !isFavorited) {
            this.setupQuestionOrder();
            if (this.currentQuestionIndex >= this.questionOrder.length) {
                this.currentQuestionIndex = Math.max(0, this.questionOrder.length - 1);
            }
            if (this.questionOrder.length > 0) {
                this.displayQuestion();
            }
        }
    }

    updateFavoriteButton(questionIndex) {
        const favoriteBtn = document.getElementById('favoriteBtn');
        const favoriteIcon = document.getElementById('favoriteIcon');
        const isFavorited = this.favoriteQuestions.includes(questionIndex);

        if (isFavorited) {
            favoriteBtn.classList.add('favorited');
            favoriteIcon.textContent = '★';
            favoriteBtn.title = '取消收藏';
        } else {
            favoriteBtn.classList.remove('favorited');
            favoriteIcon.textContent = '☆';
            favoriteBtn.title = '收藏题目';
        }
    }

    hideResult() {
        const resultPanel = document.getElementById('resultPanel');
        resultPanel.className = 'result-panel';
    }

    updateButtons() {
        const submitBtn = document.getElementById('submitBtn');
        const nextBtn = document.getElementById('nextBtn');
        const nextOnlyBtn = document.getElementById('nextOnlyBtn');
        const prevBtn = document.getElementById('prevBtn');

        const hasAnswered = document.getElementById('resultPanel').classList.contains('show');
        const isLastQuestion = this.currentQuestionIndex >= this.questionOrder.length - 1;

        // 检测是否为移动端
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // 移动端布局：上一题 | 下一题 | 提交答案（三个按钮网格布局）
            nextOnlyBtn.style.display = 'inline-block';
            nextOnlyBtn.disabled = isLastQuestion;

            // 移动端始终显示提交按钮，答题后变为下一题按钮
            if (hasAnswered) {
                // 已提交答案，提交按钮变为下一题按钮
                submitBtn.innerHTML = '➡️ 下一题';
                submitBtn.disabled = isLastQuestion;
                submitBtn.setAttribute('onclick', 'nextQuestion()');
                nextBtn.style.display = 'none';
            } else {
                // 未提交答案，显示提交按钮
                submitBtn.innerHTML = '✅ 提交答案';
                submitBtn.disabled = this.selectedAnswer === null;
                submitBtn.setAttribute('onclick', 'submitAnswer()');
                nextBtn.style.display = 'none';
            }
        } else {
            // 桌面端布局：保持原有逻辑
            // 重置提交按钮文本和事件
            submitBtn.innerHTML = '✅ 提交答案';
            submitBtn.setAttribute('onclick', 'submitAnswer()');

            if (hasAnswered) {
                submitBtn.style.display = 'none';
                nextBtn.style.display = 'inline-block';
                nextBtn.disabled = isLastQuestion;
                nextOnlyBtn.style.display = 'none';
            } else {
                submitBtn.style.display = 'inline-block';
                submitBtn.disabled = this.selectedAnswer === null;
                nextBtn.style.display = 'none';
                nextOnlyBtn.style.display = 'inline-block';
                nextOnlyBtn.disabled = isLastQuestion;
            }
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
        document.getElementById('totalQuestions').textContent = this.questions.length;
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
        const modeIndex = mode === 'sequential' ? 0 :
                         mode === 'random' ? 1 :
                         mode === 'wrong' ? 2 : 3;
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

function toggleAutoNext() {
    window.quizApp.toggleAutoNext();
}

function toggleFavorite() {
    window.quizApp.toggleFavorite();
}

function startQuiz(type) {
    window.quizApp.startQuiz(type);
}

function backToHome() {
    window.quizApp.showHomePage();
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.quizApp = new QuizApp();
});
