// File: js/subs01.js
// Subtraction Practice Logic

const diagnosticsMode = false;

const subtractionProblems = [];
for (let num1 = 12; num1 >= 2; num1--) {
    const questions = [];
    for (let num2 = 1; num2 < num1; num2++) {
        questions.push({
            a: num1,
            b: num2,
            correctAttempts: 0,
            isInitiallyCorrect: true
        });
    }
    subtractionProblems.push({ num1, questions });
}

let currentProblemIndex = 0;
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
        const savedData = localStorage.getItem('subtractionProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentProblemIndex = parsedData.currentProblemIndex || 0;
            parsedData.subtractionProblems.forEach((savedProblem, index) => {
                if (subtractionProblems[index]) {
                    subtractionProblems[index].questions.forEach((question, qIndex) => {
                        question.correctAttempts = savedProblem.questions[qIndex].correctAttempts;
                        question.isInitiallyCorrect = savedProblem.questions[qIndex].isInitiallyCorrect;
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function saveProgress() {
    try {
        const dataToSave = {
            currentProblemIndex,
            subtractionProblems
        };
        localStorage.setItem('subtractionProgress', JSON.stringify(dataToSave));
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

function displayQuestion() {
    if (currentProblemIndex >= subtractionProblems.length) {
        questionElement.textContent = '✅';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        return;
    }

    const currentProblem = subtractionProblems[currentProblemIndex];

    if (!isRandomPhase) {
        if (currentQuestionIndex >= currentProblem.questions.length) {
            initiateRandomPhase();
            return;
        }

        currentQuestion = currentProblem.questions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestion.a} - ${currentQuestion.b}`;
    } else {
        if (randomQuestionsPool.length === 0) {
            currentProblemIndex++;
            currentQuestionIndex = 0;
            isRandomPhase = false;
            saveProgress();
            displayQuestion();
            return;
        }

        const randomIndex = Math.floor(Math.random() * randomQuestionsPool.length);
        currentQuestion = randomQuestionsPool[randomIndex];
        questionElement.textContent = `${currentQuestion.a} - ${currentQuestion.b}`;
    }

    answerInput.focus();

    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(currentQuestion);
        }, 500);
    }
}

function initiateRandomPhase() {
    const currentProblem = subtractionProblems[currentProblemIndex];
    randomQuestionsPool = currentProblem.questions.filter(q => !q.isInitiallyCorrect || q.correctAttempts < getRequiredAttempts(q));
    isRandomPhase = true;
    displayQuestion();
}

function handleSubmit() {
    const userAnswer = parseInt(answerInput.value, 10);
    const correctAnswer = currentQuestion.a - currentQuestion.b;

    if (!isRandomPhase) {
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
            currentQuestion.correctAttempts++;
            if (currentQuestion.correctAttempts >= getRequiredAttempts(currentQuestion)) {
                const index = randomQuestionsPool.indexOf(currentQuestion);
                if (index > -1) {
                    randomQuestionsPool.splice(index, 1);
                }
            }
            clearFeedback();
            saveProgress();
            displayQuestion();
        } else {
            showWrongFeedback(correctAnswer);
            isReinforcementMode = true;
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
        localStorage.removeItem('subtractionProgress');
        window.location.reload();
    }
}

function autoSubmitCorrectAnswer(question) {
    if (!diagnosticsMode) return;
    if (!question) return;

    const correctAnswer = question.a - question.b;
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
