// File: js/mult01.js
// I love chocolate

// === Configuration ===
// Set diagnosticsMode to true to enable automatic testing
const diagnosticsMode = false;

// === Initialization ===

// Initialize multiplication tables from 2x2 to 12x12
const multiplicationTables = [];
for (let table = 2; table <= 12; table++) {
    const questions = [];
    for (let multiplier = 2; multiplier <= 12; multiplier++) {
        questions.push({
            a: table,
            b: multiplier,
            correctAttempts: 0,        // Tracks correct answers in Random Phase
            isInitiallyCorrect: true   // Assume initially correct; set to false if answered incorrectly
        });
    }
    multiplicationTables.push({ table, questions });
}

// Current state variables
let currentTableIndex = 0;
let currentQuestionIndex = 0;
let randomQuestionsPool = [];
let isRandomPhase = false;
let isReinforcementMode = false;
let currentQuestion = null; // Tracks the currently displayed question

// DOM Elements
const feedbackDiv = document.getElementById('feedback');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');

// === Progress Management ===

// Load progress from localStorage
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
            console.log('Progress loaded:', parsedData);
        } else {
            console.log('No saved progress found. Starting fresh.');
        }
    } catch (error) {
        console.error('Error loading progress:', error);
        // Handle the error gracefully, perhaps by starting fresh
    }
}

// Save progress to localStorage
function saveProgress() {
    try {
        const dataToSave = {
            currentTableIndex,
            multiplicationTables
        };
        localStorage.setItem('multiplicationProgress', JSON.stringify(dataToSave));
        console.log('Progress saved:', dataToSave);
    } catch (error) {
        console.error('Error saving progress:', error);
        // Handle the error, perhaps by notifying the user
    }
}

// === Display Logic ===

// Display the current question
function displayQuestion() {
    console.log('Displaying question...');
    if (currentTableIndex >= multiplicationTables.length) {
        // All tables mastered
        questionElement.textContent = '✅';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        console.log('All multiplication tables mastered!');
        return;
    }

    const currentTable = multiplicationTables[currentTableIndex];

    if (!isRandomPhase) {
        // Sequential Phase
        if (currentQuestionIndex >= currentTable.questions.length) {
            // All questions done, initiate Random Phase
            console.log(`Sequential Phase completed for table ${currentTable.table}. Initiating Random Phase.`);
            initiateRandomPhase();
            return;
        }

        currentQuestion = currentTable.questions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
        console.log(`Sequential Phase - Current Question: ${currentQuestion.a} × ${currentQuestion.b}`);
    } else {
        // Random Phase
        if (randomQuestionsPool.length === 0) {
            // Mastery achieved for current table, move to next table
            console.log(`Random Phase completed for table ${currentTable.table}. Moving to next table.`);
            currentTableIndex++;
            currentQuestionIndex = 0;
            isRandomPhase = false;
            saveProgress();
            displayQuestion();
            return;
        }

        // Select a random question from the pool
        const randomIndex = Math.floor(Math.random() * randomQuestionsPool.length);
        currentQuestion = randomQuestionsPool[randomIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
        console.log(`Random Phase - Current Question: ${currentQuestion.a} × ${currentQuestion.b}`);
    }

    // Focus the input field for better UX
    answerInput.focus();

    // If diagnosticsMode is enabled, automatically submit the correct answer
    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(currentQuestion);
        }, 500); // Slight delay to mimic user interaction
    }
}

// Initiate Random Phase by collecting flagged questions
function initiateRandomPhase() {
    const currentTable = multiplicationTables[currentTableIndex];
    // Only include questions that were answered incorrectly in Sequential Phase
    randomQuestionsPool = currentTable.questions.filter(q => !q.isInitiallyCorrect || q.correctAttempts < getRequiredAttempts(q));
    isRandomPhase = true;
    console.log(`Random Phase initiated with ${randomQuestionsPool.length} questions.`);
    displayQuestion();
}

// === User Interaction ===

// Handle user's answer submission
function handleSubmit() {
    const userAnswer = parseInt(answerInput.value, 10);
    console.log(`User submitted answer: ${userAnswer}`);
    const currentTable = multiplicationTables[currentTableIndex];

    if (!isRandomPhase) {
        // Sequential Phase
        if (currentQuestionIndex >= currentTable.questions.length) {
            // All questions done, initiate Random Phase
            initiateRandomPhase();
            return;
        }

        const correctAnswer = currentQuestion.a * currentQuestion.b;

        if (!isReinforcementMode) {
            if (userAnswer === correctAnswer) {
                // Correct answer, set initially correct and move to next question
                console.log(`Sequential Phase - Correct answer for ${currentQuestion.a} × ${currentQuestion.b}`);
                currentQuestion.isInitiallyCorrect = true;
                clearFeedback();
                currentQuestionIndex++;
                displayQuestion();
            } else {
                // Incorrect answer, set initially incorrect, show feedback, and flag for Random Phase
                console.log(`Sequential Phase - Incorrect answer for ${currentQuestion.a} × ${currentQuestion.b}. Correct answer: ${correctAnswer}`);
                currentQuestion.isInitiallyCorrect = false;
                showWrongFeedback(correctAnswer);
                flagForRandomPhase(currentQuestion);
                isReinforcementMode = true;
            }
        } else {
            // Reinforcement Mode: User has typed the correct answer
            if (userAnswer === correctAnswer) {
                // Correct reinforcement input, exit reinforcement mode and move to next question
                console.log(`Sequential Phase - Correct reinforcement for ${currentQuestion.a} × ${currentQuestion.b}`);
                isReinforcementMode = false;
                clearFeedback();
                currentQuestionIndex++;
                displayQuestion();
            } else {
                // Incorrect reinforcement input, show feedback again
                console.log(`Sequential Phase - Incorrect reinforcement for ${currentQuestion.a} × ${currentQuestion.b}. Correct answer: ${correctAnswer}`);
                showWrongFeedback(correctAnswer);
            }
        }
    } else {
        // Random Phase
        if (randomQuestionsPool.length === 0) {
            // No questions to answer
            console.log('Random Phase - No questions in the pool.');
            return;
        }

        const correctAnswer = currentQuestion.a * currentQuestion.b;
        const requiredAttempts = getRequiredAttempts(currentQuestion);

        if (!isReinforcementMode) {
            if (userAnswer === correctAnswer) {
                // Correct answer, increment counter
                currentQuestion.correctAttempts++;
                console.log(`Random Phase - Correct answer for ${currentQuestion.a} × ${currentQuestion.b}. Attempts: ${currentQuestion.correctAttempts}`);
                clearFeedback();
                if (currentQuestion.correctAttempts >= requiredAttempts) {
                    // Mastery achieved, remove from pool
                    const index = randomQuestionsPool.indexOf(currentQuestion);
                    if (index > -1) {
                        randomQuestionsPool.splice(index, 1);
                        console.log(`Random Phase - Mastery achieved for ${currentQuestion.a} × ${currentQuestion.b}. Removed from pool.`);
                        setTimeout(() => {
                            clearFeedback();
                        }, 2000);
                    }
                }
                saveProgress();
                displayQuestion();
            } else {
                // Incorrect answer, reset counter, show feedback, and prompt for correction
                console.log(`Random Phase - Incorrect answer for ${currentQuestion.a} × ${currentQuestion.b}. Correct answer: ${correctAnswer}`);
                currentQuestion.correctAttempts = 0;
                showWrongFeedback(correctAnswer);
                isReinforcementMode = true;
            }
        } else {
            // Reinforcement Mode: User has typed the correct answer
            if (userAnswer === correctAnswer) {
                // Correct reinforcement input, increment counter
                currentQuestion.correctAttempts++;
                console.log(`Random Phase - Correct reinforcement for ${currentQuestion.a} × ${currentQuestion.b}. Attempts: ${currentQuestion.correctAttempts}`);
                isReinforcementMode = false;
                clearFeedback();
                if (currentQuestion.correctAttempts >= requiredAttempts) {
                    // Mastery achieved, remove from pool
                    const index = randomQuestionsPool.indexOf(currentQuestion);
                    if (index > -1) {
                        randomQuestionsPool.splice(index, 1);
                        console.log(`Random Phase - Mastery achieved for ${currentQuestion.a} × ${currentQuestion.b}. Removed from pool.`);
                        setTimeout(() => {
                            clearFeedback();
                        }, 2000);
                    }
                }
                saveProgress();
                displayQuestion();
            } else {
                // Incorrect reinforcement input, show feedback again
                console.log(`Random Phase - Incorrect reinforcement for ${currentQuestion.a} × ${currentQuestion.b}. Correct answer: ${correctAnswer}`);
                showWrongFeedback(correctAnswer);
            }
        }
    }

    // Clear the input field
    answerInput.value = '';
}

// Determine required attempts based on initial correctness
function getRequiredAttempts(question) {
    return question.isInitiallyCorrect ? 1 : 3;
}

// Show wrong feedback with emoji and correct answer
function showWrongFeedback(correctAnswer) {
    feedbackDiv.innerHTML = '❌';
    console.log('Showing wrong feedback.');
    // Show correct answer immediately after wrong emoji
    setTimeout(() => {
        feedbackDiv.innerHTML = `❌ ${correctAnswer}`;
        console.log(`Displayed correct answer: ${correctAnswer}`);
    }, 0); // Immediate display

    // After 2 seconds, clear feedback and enter reinforcement mode
    setTimeout(() => {
        feedbackDiv.innerHTML = ''; // Clear feedback
        isReinforcementMode = true;
        console.log('Entering reinforcement mode.');
        answerInput.focus();
        // If diagnosticsMode is enabled, submit correct answer automatically
        if (diagnosticsMode) {
            autoSubmitCorrectAnswer(currentQuestion);
        }
    }, 2000);
}

// Flag question for Random Phase
function flagForRandomPhase(question) {
    if (!randomQuestionsPool.includes(question)) {
        randomQuestionsPool.push(question);
        console.log(`Question flagged for Random Phase: ${question.a} × ${question.b}`);
    }
    saveProgress();
}

// Clear feedback
function clearFeedback() {
    feedbackDiv.innerHTML = '';
    console.log('Feedback cleared.');
}

// Reset progress handler
function handleReset() {
    if (confirm('❓')) {
        console.log('Progress reset by user.');
        localStorage.removeItem('multiplicationProgress');
        window.location.reload();
    } else {
        console.log('Progress reset canceled by user.');
    }
}

// === Diagnostics Mode ===

// Automatically submit the correct answer in diagnosticsMode
function autoSubmitCorrectAnswer(question) {
    if (!diagnosticsMode) return;
    if (!question) return;

    console.log(`Diagnostics Mode - Automatically submitting correct answer for ${question.a} × ${question.b}`);

    // Set the input value to the correct answer
    const correctAnswer = question.a * question.b;
    answerInput.value = correctAnswer;

    // Trigger the submit action
    handleSubmit();
}

// === Event Listeners ===
submitButton.addEventListener('click', handleSubmit);
answerInput.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        handleSubmit();
    }
});
resetButton.addEventListener('click', handleReset);

// === Initialize the program ===
loadProgress();
displayQuestion();
console.log('Multiplication Practice App Initialized.');
