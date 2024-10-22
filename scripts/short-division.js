// file: scripts/short-division.js

console.log(`Short Division Practice - Script Loaded at ${new Date().toLocaleString()}`);

const diagnosticsMode = false;

// Define short division problems (dividend ÷ divisor)
const divisionProblems = [
    { dividend: 12, divisor: 2, quotient: 6 },
    { dividend: 15, divisor: 3, quotient: 5 },
    { dividend: 20, divisor: 4, quotient: 5 },
    { dividend: 18, divisor: 3, quotient: 6 },
    { dividend: 24, divisor: 6, quotient: 4 },
    { dividend: 30, divisor: 5, quotient: 6 },
    { dividend: 28, divisor: 4, quotient: 7 },
    { dividend: 16, divisor: 2, quotient: 8 },
    { dividend: 21, divisor: 3, quotient: 7 },
    { dividend: 25, divisor: 5, quotient: 5 },
    // Add more problems as needed
];

// Session Tracking Variables
let currentProblemIndex = 0;
let flaggedProblems = [];
let totalQuestions = 0;
let correctAnswers = 0;
let currentStreak = 0;
let maxStreak = 0;
let totalResponseTime = 0;
let averageResponseTime = 0;
let startTime = Date.now();

// DOM Elements
const feedbackDiv = document.getElementById('feedback');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');
const flaggedProgressElement = document.getElementById('flagged-progress');
const sessionProgressElement = document.getElementById('session-progress');
const sleepIndicator = document.getElementById('sleep-indicator');
const toggleButtons = document.querySelectorAll('.toggle-button');

// Load progress from localStorage
function loadProgress() {
    console.log('Loading progress from localStorage');
    try {
        const savedData = localStorage.getItem('shortDivisionProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentProblemIndex = parsedData.currentProblemIndex || 0;
            correctAnswers = parsedData.correctAnswers || 0;
            totalQuestions = parsedData.totalQuestions || 0;
            currentStreak = parsedData.currentStreak || 0;
            maxStreak = parsedData.maxStreak || 0;
            totalResponseTime = parsedData.totalResponseTime || 0;
            averageResponseTime = parsedData.averageResponseTime || 0;
            flaggedProblems = parsedData.flaggedProblems || [];
            console.log('Loaded flaggedProblems:', flaggedProblems);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Save progress to localStorage
function saveProgress() {
    console.log('Saving progress to localStorage');
    try {
        const dataToSave = {
            currentProblemIndex,
            correctAnswers,
            totalQuestions,
            currentStreak,
            maxStreak,
            totalResponseTime,
            averageResponseTime,
            flaggedProblems,
        };
        localStorage.setItem('shortDivisionProgress', JSON.stringify(dataToSave));
        console.log('Progress saved:', dataToSave);
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Select a random problem, giving preference to flagged problems
function selectProblem() {
    if (flaggedProblems.length > 0) {
        // Select from flagged problems first
        const randomFlaggedIndex = Math.floor(Math.random() * flaggedProblems.length);
        return flaggedProblems[randomFlaggedIndex];
    } else {
        // Select a random problem from all available problems
        const randomIndex = Math.floor(Math.random() * divisionProblems.length);
        return divisionProblems[randomIndex];
    }
}

// Display the selected problem
function displayProblem() {
    resetSleepTimer(); // Reset sleep timer on new question

    const problem = selectProblem();
    questionElement.textContent = `${problem.dividend} ÷ ${problem.divisor}`;
    answerInput.focus();

    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(problem);
        }, 500);
    }
}

// Handle answer submission
function handleSubmit() {
    resetSleepTimer(); // Reset sleep timer on submission

    const userAnswer = parseInt(answerInput.value, 10);
    const problem = selectProblem();
    const correctAnswer = problem.quotient;
    const answerStartTime = Date.now(); // Start time for response

    console.log(`User answered: ${userAnswer} for ${problem.dividend} ÷ ${problem.divisor}, correct answer: ${correctAnswer}`);

    let isCorrect = false;

    if (userAnswer === correctAnswer) {
        isCorrect = true;
        correctAnswers++;
        currentStreak++;
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }
        showCorrectFeedback();
        removeFromFlagged(problem);
        moveToNextProblem();
    } else {
        isCorrect = false;
        currentStreak = 0;
        showWrongFeedback(correctAnswer);
        addToFlagged(problem);
    }

    totalQuestions++;
    const answerEndTime = Date.now(); // End time for response
    const responseTime = (answerEndTime - answerStartTime) / 1000; // in seconds
    totalResponseTime += responseTime;
    averageResponseTime = (totalResponseTime / totalQuestions).toFixed(2);

    updateSessionStats(isCorrect, responseTime);
    updateSessionProgressDisplay();
    saveProgress();

    answerInput.value = '';
}

// Show correct feedback
function showCorrectFeedback() {
    feedbackDiv.innerHTML = '✅ Correct!';
    console.log('Displayed correct feedback.');

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
    }, 1000);
}

// Show wrong feedback with correct answer
function showWrongFeedback(correctAnswer) {
    feedbackDiv.innerHTML = `❌ Incorrect. The correct answer is ${correctAnswer}.`;
    console.log(`Displayed wrong feedback: The correct answer is ${correctAnswer}.`);

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
    }, 2000);
}

// Add problem to flaggedProblems
function addToFlagged(problem) {
    const exists = flaggedProblems.some(
        (p) => p.dividend === problem.dividend && p.divisor === problem.divisor
    );
    if (!exists) {
        flaggedProblems.push(problem);
        console.log(`Added to flaggedProblems: ${problem.dividend} ÷ ${problem.divisor}`);
        updateFlaggedProgressDisplay();
        saveProgress();
    }
}

// Remove problem from flaggedProblems
function removeFromFlagged(problem) {
    flaggedProblems = flaggedProblems.filter(
        (p) => !(p.dividend === problem.dividend && p.divisor === problem.divisor)
    );
    console.log(`Removed from flaggedProblems: ${problem.dividend} ÷ ${problem.divisor}`);
    updateFlaggedProgressDisplay();
    saveProgress();
}

// Update flagged progress display
function updateFlaggedProgressDisplay() {
    if (flaggedProblems.length === 0) {
        flaggedProgressElement.innerHTML = 'No flagged questions. Keep it up! 🎉';
    } else {
        const progress = flaggedProblems.map(p => `${p.dividend} ÷ ${p.divisor}`).join('<br>');
        flaggedProgressElement.innerHTML = progress;
    }
    console.log('Updated flagged progress display:', flaggedProgressElement.innerHTML);
}

// Update session stats
function updateSessionStats(isCorrect, responseTime) {
    // Mastery rate is calculated in displaySessionProgress
}

// Update session progress display
function updateSessionProgressDisplay() {
    const masteryRate = totalQuestions > 0 ? ((correctAnswers / totalQuestions) * 100).toFixed(1) : '0.0';
    const masteryText = `Mastery: ${masteryRate}% 🏅`;

    const questionsAnsweredText = `Questions Answered: ${totalQuestions} | Correct: ${correctAnswers}`;

    const streakText = `Streak: ${currentStreak} 🔥`;

    const avgResponseTimeText = `Avg Response Time: ${averageResponseTime}s ⏱️`;

    // Clear previous stats
    sessionProgressElement.innerHTML = '';

    // Append new stats
    sessionProgressElement.innerHTML += `${masteryText}<br>`;
    sessionProgressElement.innerHTML += `${questionsAnsweredText}<br>`;
    sessionProgressElement.innerHTML += `Streak: ${currentStreak} 🔥<br>`;
    sessionProgressElement.innerHTML += `${avgResponseTimeText}`;
    console.log('Updated session progress display:', sessionProgressElement.innerHTML);
}

// Move to the next problem
function moveToNextProblem() {
    displayProblem();
}

// Handle reset button
function handleReset() {
    if (confirm('Are you sure you want to reset your progress?')) {
        console.log('Resetting progress.');
        localStorage.removeItem('shortDivisionProgress');
        window.location.reload();
    }
}

// Auto-submit correct answer for diagnostics mode
function autoSubmitCorrectAnswer(problem) {
    if (!diagnosticsMode) return;
    if (!problem) return;

    const correctAnswer = problem.quotient;
    answerInput.value = correctAnswer;
    console.log(`Auto-submitting correct answer for ${problem.dividend} ÷ ${problem.divisor}: ${correctAnswer}`);
    handleSubmit();
}

// Sleep Indicator Functions
let sleepTimer = null;
const sleepTimeout = 4000; // 4 seconds

function showSleepIndicator() {
    sleepIndicator.hidden = false;
}

function hideSleepIndicator() {
    sleepIndicator.hidden = true;
}

function resetSleepTimer() {
    hideSleepIndicator();
    if (sleepTimer) {
        clearTimeout(sleepTimer);
    }
    sleepTimer = setTimeout(showSleepIndicator, sleepTimeout);
}

// Event Listeners
submitButton.addEventListener('click', handleSubmit);
answerInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});
resetButton.addEventListener('click', handleReset);

// Toggle Visibility of Progress Boxes
toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const targetBox = document.getElementById(targetId);
        if (targetBox.style.display === 'none') {
            targetBox.style.display = 'block';
            button.textContent = 'Hide';
        } else {
            targetBox.style.display = 'none';
            button.textContent = 'Show';
        }
    });
});

// Initialize on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    displayProblem();
    updateFlaggedProgressDisplay();
    updateSessionProgressDisplay(); // Initialize session stats display
    resetSleepTimer(); // Start sleep timer on load
});
