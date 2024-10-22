// file: scripts/perfect-square-roots-practice.js

console.log(`Perfect Square Roots Practice - Script Loaded at ${new Date().toLocaleString()}`);

const diagnosticsMode = false;
let currentPhase = '';

// Define multiplication tables from 2x to 12x
const multiplicationTables = [];
for (let table = 2; table <= 12; table++) {
    const questions = [];
    for (let multiplier = 2; multiplier <= 12; multiplier++) {
        questions.push({
            a: table,
            b: multiplier,
            correctAttempts: 0,
            isInitiallyCorrect: true,
            troubleRight: 0,
            troubleWrong: 0,
            lastWrongAnswer: null, // Added property
        });
    }
    multiplicationTables.push({ table, questions });
}
console.log('Initialized multiplicationTables:', multiplicationTables);

// Define perfect square roots
const perfectSquareRoots = [
    { number: 4, squareRoot: 2 },
    { number: 9, squareRoot: 3 },
    { number: 16, squareRoot: 4 },
    { number: 25, squareRoot: 5 },
    { number: 36, squareRoot: 6 },
    { number: 49, squareRoot: 7 },
    { number: 64, squareRoot: 8 },
    { number: 81, squareRoot: 9 },
    { number: 100, squareRoot: 10 },
];

let currentTableIndex = 0;
let currentQuestionIndex = 0; // To track multiplication questions within a table
let randomQuestionsPool = [];
let isRandomPhase = false;
let isReinforcementMode = false;
let currentQuestion = null;
let flaggedCombinations = [];

// Session Tracking Variables
let totalQuestions = 0;
let correctAnswers = 0;
let squareRootsLearned = 0;
let currentStreak = 0;
let maxStreak = 0;
let totalResponseTime = 0;
let averageResponseTime = 0;
let startTime = Date.now();

// Sleep Indicator Timer
let sleepTimer = null;
const sleepTimeout = 4000; // 4 seconds

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
        const savedData = localStorage.getItem('perfectSquareRootsProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentTableIndex = parsedData.currentTableIndex || 0;
            currentQuestionIndex = parsedData.currentQuestionIndex || 0;
            squareRootsLearned = parsedData.squareRootsLearned || 0;
            parsedData.perfectSquareRoots.forEach((savedItem, index) => {
                if (perfectSquareRoots[index]) {
                    perfectSquareRoots[index].troubleRight = savedItem.troubleRight || 0;
                    perfectSquareRoots[index].troubleWrong = savedItem.troubleWrong || 0;
                    perfectSquareRoots[index].lastWrongAnswer = savedItem.lastWrongAnswer || null;
                }
            });
            flaggedCombinations = parsedData.flaggedCombinations || [];
            console.log('Loaded flaggedCombinations:', flaggedCombinations);
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
            currentTableIndex,
            currentQuestionIndex,
            squareRootsLearned,
            perfectSquareRoots: perfectSquareRoots.map(ps => ({
                troubleRight: ps.troubleRight,
                troubleWrong: ps.troubleWrong,
                lastWrongAnswer: ps.lastWrongAnswer
            })),
            flaggedCombinations,
        };
        localStorage.setItem('perfectSquareRootsProgress', JSON.stringify(dataToSave));
        console.log('Progress saved:', dataToSave);
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

// Determine frequency based on troublesome index
function determineFrequency(troublesomeIndex) {
    if (troublesomeIndex >= 0.5) {
        return 3;
    } else if (troublesomeIndex >= 0.25) {
        return 2;
    } else {
        return 0;
    }
}

// Update flagged questions display
function updateFlaggedProgressDisplay() {
    if (flaggedCombinations.length === 0) {
        flaggedProgressElement.innerHTML = 'No flagged questions. Keep it up! 🎉';
    } else {
        const progress = flaggedCombinations.map(f => `${f.a}×${f.b}: ${f.remainingAppearances} left, TI: ${(f.troublesomeIndex * 100).toFixed(1)}%`).join('<br>');
        flaggedProgressElement.innerHTML = progress;
    }
    console.log('Updated flagged progress display:', flaggedProgressElement.innerHTML);
}

// Update session stats display
function updateSessionProgressDisplay() {
    const masteryRate = ((correctAnswers / totalQuestions) * 100).toFixed(1) || 0;
    const masteryText = `Mastery: ${masteryRate}% 🏅`;

    const questionsAnsweredText = `Questions Answered: ${totalQuestions} | Correct: ${correctAnswers}`;

    const squareRootsLearnedText = `Square Roots Learned: ${squareRootsLearned}`;

    const streakText = `Streak: ${currentStreak} 🔥`;

    const avgResponseTimeText = `Avg Response Time: ${averageResponseTime}s ⏱️`;

    // Clear previous stats
    sessionProgressElement.innerHTML = '';

    // Append new stats
    sessionProgressElement.innerHTML += `${masteryText}<br>`;
    sessionProgressElement.innerHTML += `${questionsAnsweredText}<br>`;
    sessionProgressElement.innerHTML += `${squareRootsLearnedText}<br>`;
    sessionProgressElement.innerHTML += `${streakText}<br>`;
    sessionProgressElement.innerHTML += `${avgResponseTimeText}`;
    console.log('Updated session progress display:', sessionProgressElement.innerHTML);
}

// Display the current question based on phase
function displayQuestion() {
    resetSleepTimer(); // Reset sleep timer on new question

    if (currentTableIndex >= perfectSquareRoots.length) {
        questionElement.textContent = '🎉 You have mastered all perfect square roots!';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        console.log('All perfect square roots completed.');
        return;
    }

    const currentItem = perfectSquareRoots[currentTableIndex];
    console.log(`Displaying number ${currentItem.number}, square root index ${currentTableIndex}`);

    if (!isRandomPhase) {
        if (currentQuestionIndex >= 2) { // After two multiplication questions
            currentQuestionIndex = 0;
            currentPhase = 'perfectSquare';
            askPerfectSquare(currentItem);
            return;
        }

        // Ask two multiplication questions sequentially
        const multiplier = currentQuestionIndex + 2; // Starting from 2
        currentQuestion = { a: currentItem.squareRoot, b: currentItem.squareRoot };
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
        console.log('Next multiplication question:', `${currentQuestion.a} × ${currentQuestion.b}`);
    } else {
        if (randomQuestionsPool.length === 0) {
            isRandomPhase = false;
            currentTableIndex++;
            currentQuestionIndex = 0;
            displayQuestion();
            return;
        }

        const randomIndex = Math.floor(Math.random() * randomQuestionsPool.length);
        currentQuestion = randomQuestionsPool[randomIndex];
        questionElement.textContent = currentQuestion.type === 'multiplication' ? `${currentQuestion.a} × ${currentQuestion.b}` : `What is the square root of ${currentQuestion.number}?`;
        console.log('Random question selected:', questionElement.textContent);
    }

    answerInput.focus();

    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(currentQuestion);
        }, 500);
    }
}

// Ask a perfect square question
function askPerfectSquare(item) {
    currentQuestion = { type: 'perfectSquare', number: item.number, squareRoot: item.squareRoot };
    questionElement.textContent = `What is the square root of ${item.number}?`;
    console.log('Asking perfect square question:', `What is the square root of ${item.number}?`);
    answerInput.focus();
}

// Initiate random phase with mixed questions
function initiateRandomPhase() {
    console.log(`Initiating random phase for perfect square roots`);
    // Prepare randomQuestionsPool with mixed types
    randomQuestionsPool = [];

    perfectSquareRoots.forEach(item => {
        // Add the related multiplication question
        randomQuestionsPool.push({
            type: 'multiplication',
            a: item.squareRoot,
            b: item.squareRoot,
            number: item.number,
            squareRoot: item.squareRoot
        });

        // Add another multiplication that results in a perfect square
        const additionalMultipliers = [item.squareRoot - 1, item.squareRoot + 1].filter(multiplier => multiplier >= 2 && multiplier <= 12);
        additionalMultipliers.forEach(multiplier => {
            randomQuestionsPool.push({
                type: 'multiplication',
                a: multiplier,
                b: multiplier,
                number: multiplier * multiplier,
                squareRoot: multiplier
            });
        });
    });

    // Shuffle the pool
    randomQuestionsPool = shuffleArray(randomQuestionsPool);
    isRandomPhase = true;
    displayQuestion();
}

// Handle answer submission
function handleSubmit() {
    resetSleepTimer(); // Reset sleep timer on submission

    const userAnswer = parseInt(answerInput.value, 10);
    let correctAnswer;
    let questionType = 'multiplication';

    if (currentQuestion.type === 'perfectSquare') {
        correctAnswer = currentQuestion.squareRoot;
        questionType = 'perfectSquare';
    } else {
        correctAnswer = currentQuestion.a * currentQuestion.b;
    }

    console.log(`User answered: ${userAnswer} for ${questionElement.textContent}, correct answer: ${correctAnswer}`);

    const answerStartTime = Date.now(); // Start time for response

    let isCorrect = false;

    if (userAnswer === correctAnswer) {
        isCorrect = true;
        correctAnswers++;
        currentStreak++;
        if (currentStreak > maxStreak) {
            maxStreak = currentStreak;
        }

        if (questionType === 'perfectSquare') {
            squareRootsLearned++;
        }

        showCorrectFeedback();
        moveToNextQuestion();
    } else {
        isCorrect = false;
        currentStreak = 0;
        handleWrongAnswer(userAnswer);
    }

    totalQuestions++;
    const answerEndTime = Date.now(); // End time for response
    const responseTime = (answerEndTime - answerStartTime) / 1000; // in seconds
    totalResponseTime += responseTime;
    averageResponseTime = (totalResponseTime / totalQuestions).toFixed(2);

    updateSessionProgressDisplay();
    saveProgress();

    answerInput.value = '';
}

// Handle wrong answers with feedback
function handleWrongAnswer(userAnswer) {
    feedbackDiv.innerHTML = `❌ No, it's not ${userAnswer}.`;
    console.log(`Displayed wrong feedback: It's not ${userAnswer}.`);

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
        if (currentQuestion.type === 'perfectSquare') {
            // After three wrong attempts, give a nudge
            perfectSquareRoots[currentTableIndex].troubleWrong++;
            if (perfectSquareRoots[currentTableIndex].troubleWrong >= 3) {
                feedbackDiv.innerHTML = `❌ Not ${userAnswer}. Try again!`;
                console.log(`Displayed nudge: Not ${userAnswer}.`);
                perfectSquareRoots[currentTableIndex].troubleWrong = 0; // Reset after nudge
            }
        } else {
            // For multiplication questions
            const multQuestion = multiplicationTables[currentTableIndex].questions[currentQuestionIndex];
            multQuestion.troubleWrong++;
            if (multQuestion.troubleWrong >= 3) {
                feedbackDiv.innerHTML = `❌ Not ${userAnswer}. It's ${currentQuestion.a} × ${currentQuestion.b} = ${correctAnswer}`;
                console.log(`Displayed correct answer after 3 wrong attempts.`);
                multQuestion.troubleWrong = 0; // Reset after showing correct answer
            }
        }
    }, 2000);
}

// Show correct answer feedback
function showCorrectFeedback() {
    feedbackDiv.innerHTML = '✅ Correct!';
    console.log('Displayed correct feedback.');

    setTimeout(() => {
        feedbackDiv.innerHTML = '';
    }, 1000);
}

// Move to the next question based on phase
function moveToNextQuestion() {
    if (isRandomPhase) {
        // Remove the question from the pool
        const index = randomQuestionsPool.indexOf(currentQuestion);
        if (index > -1) {
            randomQuestionsPool.splice(index, 1);
        }

        if (randomQuestionsPool.length === 0) {
            isRandomPhase = false;
            currentTableIndex++;
        }
    } else {
        if (currentPhase === 'perfectSquare') {
            currentPhase = 'multiplication';
        } else {
            currentQuestionIndex++;
            if (currentQuestionIndex >= 2) {
                // All two multiplication questions done, move to perfect square
                currentPhase = 'perfectSquare';
            }
        }
    }

    // Check if all perfect squares are learned
    if (squareRootsLearned >= perfectSquareRoots.length) {
        questionElement.textContent = '🎉 You have mastered all perfect square roots!';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        return;
    }

    // Move to Random Phase after sequential completion
    if (!isRandomPhase && currentPhase === 'multiplication' && currentQuestionIndex >= 2) {
        initiateRandomPhase();
    } else {
        displayQuestion();
    }
}

// Calculate troublesome index
function getTroublesomeIndex(question) {
    const totalAttempts = question.troubleRight + question.troubleWrong;
    const index = totalAttempts > 0 ? question.troubleWrong / totalAttempts : 0;
    return index;
}

// Update flagged combinations based on outcomes
function updateFlaggedCombination(question, outcome) {
    console.log(`Updating flagged combination for ${question.a} × ${question.b} with outcome: ${outcome}`);
    let flagged = flaggedCombinations.find(
        (f) => f.a === question.a && f.b === question.b
    );
    if (!flagged) {
        if (outcome === 'wrong') {
            const troublesomeIndex = getTroublesomeIndex(question);
            const frequency = determineFrequency(troublesomeIndex);
            if (frequency > 0) {
                flaggedCombinations.push({
                    a: question.a,
                    b: question.b,
                    troubleRight: question.troubleRight,
                    troubleWrong: question.troubleWrong,
                    frequency: frequency,
                    remainingAppearances: frequency,
                    locked: false,
                    correctStreak: 0,
                    wrongStreak: 0,
                    troublesomeIndex: troublesomeIndex,
                });
                console.log('Flagged new combination:', `${question.a} × ${question.b}`, flaggedCombinations);
            }
        }
    } else {
        if (outcome === 'correct') {
            flagged.troubleRight++;
            flagged.correctStreak++;
            flagged.wrongStreak = 0;
            console.log(`Incremented troubleRight for ${flagged.a} × ${flagged.b}:`, flagged.troubleRight);
            if (!flagged.locked) {
                if (flagged.correctStreak >= 3) {
                    flagged.remainingAppearances = Math.max(flagged.remainingAppearances - 1, 0);
                    flagged.correctStreak = 0;
                    console.log(`Decremented remainingAppearances for ${flagged.a} × ${flagged.b}:`, flagged.remainingAppearances);
                    if (flagged.remainingAppearances <= 0) {
                        flaggedCombinations = flaggedCombinations.filter(
                            (f) => !(f.a === flagged.a && f.b === flagged.b)
                        );
                        console.log(`Removed mastered combination: ${flagged.a} × ${flagged.b}`);
                    }
                }
            }
        } else {
            flagged.troubleWrong++;
            flagged.wrongStreak++;
            flagged.correctStreak = 0;
            console.log(`Incremented troubleWrong for ${flagged.a} × ${flagged.b}:`, flagged.troubleWrong);
            if (!flagged.locked) {
                if (flagged.wrongStreak >= 3) {
                    flagged.frequency = determineFrequency(getTroublesomeIndex(question));
                    flagged.remainingAppearances = flagged.frequency;
                    flagged.wrongStreak = 0;
                    console.log(`Updated frequency for ${flagged.a} × ${flagged.b}:`, flagged.frequency);
                }
            }
        }
    }
    saveProgress();
    updateFlaggedProgressDisplay();
}

// Shuffle an array (Fisher-Yates Shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Clear feedback
function clearFeedback() {
    feedbackDiv.innerHTML = '';
    console.log('Cleared feedback.');
}

// Handle reset button
function handleReset() {
    if (confirm('Are you sure you want to reset your progress?')) {
        console.log('Resetting progress.');
        localStorage.removeItem('perfectSquareRootsProgress');
        window.location.reload();
    }
}

// Auto-submit correct answer for diagnostics mode
function autoSubmitCorrectAnswer(question) {
    if (!diagnosticsMode) return;
    if (!question) return;

    const correctAnswer = question.type === 'perfectSquare' ? question.squareRoot : question.a * question.b;
    answerInput.value = correctAnswer;
    console.log(`Auto-submitting correct answer for ${question.type === 'perfectSquare' ? `square root of ${question.number}` : `${question.a} × ${question.b}`}: ${correctAnswer}`);
    handleSubmit();
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

// Sleep Indicator Functions
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

// Initialize on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    loadProgress();
    displayQuestion();
    updateFlaggedProgressDisplay();
    updateSessionProgressDisplay(); // Initialize session stats display
    resetSleepTimer(); // Start sleep timer on load

    // Initially show progress boxes for a few seconds
    setTimeout(() => {
        // They are already visible by default
    }, 3000);
});
