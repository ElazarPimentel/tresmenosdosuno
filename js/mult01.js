// File: js/mult01.js
// I love chocolate
// Thank you Ada Lovelace ...

const diagnosticsMode = false;

const multiplicationTables = [];
for (let table = 2; table <= 12; table++) {
    const questions = [];
    for (let multiplier = 2; multiplier <= 12; multiplier++) {
        questions.push({
            a: table,
            b: multiplier,
            correctAttempts: 0,
            isInitiallyCorrect: true
        });
    }
    multiplicationTables.push({ table, questions });
}

let currentTableIndex = 0;
let currentQuestionIndex = 0;
let randomQuestionsPool = [];
let isRandomPhase = false;
let isReinforcementMode = false;
let currentQuestion = null;

const feedbackDiv = document.getElementById('feedback');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');

function loadProgress() {
    try {
        const savedData = localStorage.getItem('multiplicationProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentTableIndex = parsedData.currentTableIndex || 0;
            parsedData.multiplicationTables.forEach((savedTable, index) => {
                if (multiplicationTables[index]) {
                    multiplicationTables[index].questions.forEach((question, qIndex) => {
                        question.correctAttempts = savedTable.questions[qIndex].correctAttempts;
                        question.isInitiallyCorrect = savedTable.questions[qIndex].isInitiallyCorrect;
                    });
                }
            });
        }
    } catch (error) {
    }
}

function saveProgress() {
    try {
        const dataToSave = {
            currentTableIndex,
            multiplicationTables
        };
        localStorage.setItem('multiplicationProgress', JSON.stringify(dataToSave));
    } catch (error) {
    }
}

function displayQuestion() {
    if (currentTableIndex >= multiplicationTables.length) {
        questionElement.textContent = '✅';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        return;
    }

    const currentTable = multiplicationTables[currentTableIndex];

    if (!isRandomPhase) {
        if (currentQuestionIndex >= currentTable.questions.length) {
            initiateRandomPhase();
            return;
        }

        currentQuestion = currentTable.questions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
    } else {
        if (randomQuestionsPool.length === 0) {
            currentTableIndex++;
            currentQuestionIndex = 0;
            isRandomPhase = false;
            saveProgress();
            displayQuestion();
            return;
        }

        const randomIndex = Math.floor(Math.random() * randomQuestionsPool.length);
        currentQuestion = randomQuestionsPool[randomIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
    }

    answerInput.focus();

    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(currentQuestion);
        }, 500);
    }
}

function initiateRandomPhase() {
    const currentTable = multiplicationTables[currentTableIndex];
    randomQuestionsPool = currentTable.questions.filter(q => !q.isInitiallyCorrect || q.correctAttempts < getRequiredAttempts(q));
    isRandomPhase = true;
    displayQuestion();
}

function handleSubmit() {
    const userAnswer = parseInt(answerInput.value, 10);
    const currentTable = multiplicationTables[currentTableIndex];

    if (!isRandomPhase) {
        if (currentQuestionIndex >= currentTable.questions.length) {
            initiateRandomPhase();
            return;
        }

        const correctAnswer = currentQuestion.a * currentQuestion.b;

        if (!isReinforcementMode) {
            if (userAnswer === correctAnswer) {
                currentQuestion.isInitiallyCorrect = true;
                clearFeedback();
                currentQuestionIndex++;
                displayQuestion();
            } else {
                currentQuestion.isInitiallyCorrect = false;
                showWrongFeedback(correctAnswer);
                flagForRandomPhase(currentQuestion);
                isReinforcementMode = true;
            }
        } else {
            if (userAnswer === correctAnswer) {
                isReinforcementMode = false;
                clearFeedback();
                currentQuestionIndex++;
                displayQuestion();
            } else {
                showWrongFeedback(correctAnswer);
            }
        }
    } else {
        if (randomQuestionsPool.length === 0) {
            return;
        }

        const correctAnswer = currentQuestion.a * currentQuestion.b;
        const requiredAttempts = getRequiredAttempts(currentQuestion);

        if (!isReinforcementMode) {
            if (userAnswer === correctAnswer) {
                currentQuestion.correctAttempts++;
                clearFeedback();
                if (currentQuestion.correctAttempts >= requiredAttempts) {
                    const index = randomQuestionsPool.indexOf(currentQuestion);
                    if (index > -1) {
                        randomQuestionsPool.splice(index, 1);
                        setTimeout(() => {
                            clearFeedback();
                        }, 2000);
                    }
                }
                saveProgress();
                displayQuestion();
            } else {
                currentQuestion.correctAttempts = 0;
                showWrongFeedback(correctAnswer);
                isReinforcementMode = true;
            }
        } else {
            if (userAnswer === correctAnswer) {
                currentQuestion.correctAttempts++;
                isReinforcementMode = false;
                clearFeedback();
                if (currentQuestion.correctAttempts >= requiredAttempts) {
                    const index = randomQuestionsPool.indexOf(currentQuestion);
                    if (index > -1) {
                        randomQuestionsPool.splice(index, 1);
                        setTimeout(() => {
                            clearFeedback();
                        }, 2000);
                    }
                }
                saveProgress();
                displayQuestion();
            } else {
                showWrongFeedback(correctAnswer);
            }
        }
    }

    answerInput.value = '';
}

function getRequiredAttempts(question) {
    return question.isInitiallyCorrect ? 1 : 3;
}

function showWrongFeedback(correctAnswer) {
    feedbackDiv.innerHTML = '❌';
    setTimeout(() => {
        feedbackDiv.innerHTML = `❌ ${correctAnswer}`;
    }, 0);

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
        isReinforcementMode = true;
        answerInput.focus();
        if (diagnosticsMode) {
            autoSubmitCorrectAnswer(currentQuestion);
        }
    }, 2000);
}

function flagForRandomPhase(question) {
    if (!randomQuestionsPool.includes(question)) {
        randomQuestionsPool.push(question);
    }
    saveProgress();
}

function clearFeedback() {
    feedbackDiv.innerHTML = '';
}

function handleReset() {
    if (confirm('❓')) {
        localStorage.removeItem('multiplicationProgress');
        window.location.reload();
    }
}

function autoSubmitCorrectAnswer(question) {
    if (!diagnosticsMode) return;
    if (!question) return;

    const correctAnswer = question.a * question.b;
    answerInput.value = correctAnswer;

    handleSubmit();
}

submitButton.addEventListener('click', handleSubmit);
answerInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});
resetButton.addEventListener('click', handleReset);

loadProgress();
displayQuestion();
