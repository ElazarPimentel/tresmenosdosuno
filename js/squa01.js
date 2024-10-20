// file: js/squa01.js
// I love chocolate

document.addEventListener('DOMContentLoaded', function() {
    const questionElement = document.getElementById('question');
    const answerInput = document.getElementById('answer-input');
    const submitButton = document.getElementById('submit-button');
    const feedbackElement = document.getElementById('feedback');
    const resetButton = document.getElementById('reset-button');

    const maxNumber = 20; // Highest perfect square to practice
    let currentQuestion;
    let currentMode = 'sequential';
    let sequentialIndex = 1;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = 3;
    const requiredCorrectForMastery = 3;
    const spacedRepetitionInterval = 5; // Number of questions before revisiting

    let progress = {
        correct: 0,
        total: 0,
        masteredNumbers: {},
        errorFocusQueue: [],
        spacedRepetitionQueue: []
    };

    function loadProgress() {
        const savedProgress = localStorage.getItem('squareRootProgress');
        if (savedProgress) {
            progress = JSON.parse(savedProgress);
        }
    }

    function saveProgress() {
        localStorage.setItem('squareRootProgress', JSON.stringify(progress));
    }

    function generateQuestion() {
        // Clear the feedback from the previous question
        feedbackElement.textContent = "";

        let number;
        
        switch(currentMode) {
            case 'sequential':
                number = sequentialIndex;
                break;
            case 'errorFocus':
                if (progress.errorFocusQueue.length > 0) {
                    number = progress.errorFocusQueue.shift();
                } else {
                    currentMode = 'random';
                }
                break;
            case 'spacedRepetition':
                if (progress.spacedRepetitionQueue.length > 0) {
                    number = progress.spacedRepetitionQueue.shift();
                } else {
                    currentMode = 'random';
                }
                break;
            case 'random':
                number = Math.floor(Math.random() * maxNumber) + 1;
                break;
        }

        if (!number) {
            number = Math.floor(Math.random() * maxNumber) + 1;
        }

        const square = number * number;
        currentQuestion = { number, square };
        questionElement.textContent = `What is the square root of ${square}?`;
    }

    function checkAnswer() {
        const userAnswer = parseInt(answerInput.value);
        if (isNaN(userAnswer)) {
            feedbackElement.textContent = "Please enter a valid number.";
            return;
        }

        progress.total++;
        if (userAnswer === currentQuestion.number) {
            handleCorrectAnswer();
            generateQuestion(); // Immediately generate next question for correct answers
        } else {
            handleIncorrectAnswer();
            setTimeout(generateQuestion, 2000); // 2000ms delay for incorrect answers
        }

        saveProgress();
        answerInput.value = '';
    }

    function handleCorrectAnswer() {
        progress.correct++;
        feedbackElement.textContent = "Correct! Well done!";
        consecutiveErrors = 0;

        if (!progress.masteredNumbers[currentQuestion.number]) {
            progress.masteredNumbers[currentQuestion.number] = 1;
        } else {
            progress.masteredNumbers[currentQuestion.number]++;
        }

        if (progress.masteredNumbers[currentQuestion.number] >= requiredCorrectForMastery) {
            progress.spacedRepetitionQueue.push(currentQuestion.number);
        }

        if (currentMode === 'sequential' && sequentialIndex < maxNumber) {
            sequentialIndex++;
        } else if (currentMode === 'sequential') {
            currentMode = 'random';
        }
    }

    function handleIncorrectAnswer() {
        feedbackElement.textContent = `Incorrect. The square root of ${currentQuestion.square} is ${currentQuestion.number}.`;
        consecutiveErrors++;

        if (!progress.errorFocusQueue.includes(currentQuestion.number)) {
            progress.errorFocusQueue.push(currentQuestion.number);
        }

        if (consecutiveErrors >= maxConsecutiveErrors) {
            currentMode = 'sequential';
            sequentialIndex = 1;
            consecutiveErrors = 0;
            feedbackElement.textContent += " Returning to sequential mode for review.";
        }
    }

    function resetProgress() {
        if (confirm("Are you sure you want to reset your progress?")) {
            progress = {
                correct: 0,
                total: 0,
                masteredNumbers: {},
                errorFocusQueue: [],
                spacedRepetitionQueue: []
            };
            currentMode = 'sequential';
            sequentialIndex = 1;
            consecutiveErrors = 0;
            saveProgress();
            feedbackElement.textContent = "Progress reset. Starting over...";
            setTimeout(generateQuestion, 2000);
        }
    }

    submitButton.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    resetButton.addEventListener('click', resetProgress);

    loadProgress();
    generateQuestion();
});
