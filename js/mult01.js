// file: js/mult01.js
console.log(`Program starts at ${new Date().toLocaleString()}`);

const diagnosticsMode = false;

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
        });
    }
    multiplicationTables.push({ table, questions });
}
console.log('Initialized multiplicationTables:', multiplicationTables);

let currentTableIndex = 0;
let currentQuestionIndex = 0;
let randomQuestionsPool = [];
let isRandomPhase = false;
let isReinforcementMode = false;
let currentQuestion = null;
let flaggedCombinations = [];

const feedbackDiv = document.getElementById('feedback');
const questionElement = document.getElementById('question');
const answerInput = document.getElementById('answer-input');
const submitButton = document.getElementById('submit-button');
const resetButton = document.getElementById('reset-button');
const progressElement = document.getElementById('progress');

function loadProgress() {
    console.log('Loading progress from localStorage');
    try {
        const savedData = localStorage.getItem('multiplicationProgress');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            currentTableIndex = parsedData.currentTableIndex || 0;
            console.log('Loaded currentTableIndex:', currentTableIndex);
            parsedData.multiplicationTables.forEach((savedTable, index) => {
                if (multiplicationTables[index]) {
                    multiplicationTables[index].questions.forEach((question, qIndex) => {
                        question.correctAttempts = savedTable.questions[qIndex].correctAttempts;
                        question.isInitiallyCorrect = savedTable.questions[qIndex].isInitiallyCorrect;
                        question.troubleRight = savedTable.questions[qIndex].troubleRight;
                        question.troubleWrong = savedTable.questions[qIndex].troubleWrong;
                    });
                }
            });
            flaggedCombinations = parsedData.flaggedCombinations || [];
            console.log('Loaded flaggedCombinations:', flaggedCombinations);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

function saveProgress() {
    console.log('Saving progress to localStorage');
    try {
        const dataToSave = {
            currentTableIndex,
            multiplicationTables,
            flaggedCombinations,
        };
        localStorage.setItem('multiplicationProgress', JSON.stringify(dataToSave));
        console.log('Progress saved:', dataToSave);
    } catch (error) {
        console.error('Error saving progress:', error);
    }
}

function determineFrequency(troublesomeIndex) {
    if (troublesomeIndex >= 0.5) {
        return 3;
    } else if (troublesomeIndex >= 0.25) {
        return 2;
    } else {
        return 0;
    }
}

function updateProgressDisplay() {
    const progress = flaggedCombinations.map(f => `${f.a}×${f.b}: ${f.remainingAppearances} left, TI: ${(f.troublesomeIndex * 100).toFixed(1)}%`).join(', ');
    progressElement.textContent = `Flagged Questions: ${progress}`;
    console.log('Updated progress display:', progress);
}

function displayQuestion() {
    if (currentTableIndex >= multiplicationTables.length) {
        questionElement.textContent = '✅ You have completed all tables!';
        answerInput.style.display = 'none';
        submitButton.style.display = 'none';
        resetButton.style.display = 'inline-block';
        console.log('All tables completed.');
        return;
    }

    const currentTable = multiplicationTables[currentTableIndex];
    console.log(`Displaying table ${currentTable.table}, question index ${currentQuestionIndex}`);

    if (!isRandomPhase) {
        if (currentQuestionIndex >= currentTable.questions.length) {
            initiateRandomPhase();
            return;
        }

        currentQuestion = currentTable.questions[currentQuestionIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
        console.log('Next question:', `${currentQuestion.a} × ${currentQuestion.b}`);
    } else {
        if (randomQuestionsPool.length === 0) {
            currentTableIndex++;
            currentQuestionIndex = 0;
            isRandomPhase = false;
            console.log('Random phase completed. Moving to next table:', currentTableIndex);
            saveProgress();
            displayQuestion();
            return;
        }

        const randomIndex = Math.floor(Math.random() * randomQuestionsPool.length);
        currentQuestion = randomQuestionsPool[randomIndex];
        questionElement.textContent = `${currentQuestion.a} × ${currentQuestion.b}`;
        console.log('Random question selected:', `${currentQuestion.a} × ${currentQuestion.b}`);
    }

    answerInput.focus();

    if (diagnosticsMode) {
        setTimeout(() => {
            autoSubmitCorrectAnswer(currentQuestion);
        }, 500);
    }
}

function initiateRandomPhase() {
    console.log(`Initiating random phase for table ${multiplicationTables[currentTableIndex].table}`);
    const currentTable = multiplicationTables[currentTableIndex];
    randomQuestionsPool = currentTable.questions.filter((q) => {
        const troublesomeIndex = getTroublesomeIndex(q);
        return troublesomeIndex > 0.25;
    });

    flaggedCombinations.forEach((flagged) => {
        if (!randomQuestionsPool.some(q => q.a === flagged.a && q.b === flagged.b)) {
            const tableIndex = flagged.a - 2;
            const question = multiplicationTables[tableIndex]?.questions.find(q => q.a === flagged.a && q.b === flagged.b);
            if (question) {
                randomQuestionsPool.push(question);
                console.log('Added flagged combination to random pool:', `${question.a} × ${question.b}`);
            }
        }
    });

    isRandomPhase = true;
    displayQuestion();
}

function handleSubmit() {
    const userAnswer = parseInt(answerInput.value, 10);
    const correctAnswer = currentQuestion.a * currentQuestion.b;
    console.log(`User answered: ${userAnswer} for ${currentQuestion.a} × ${currentQuestion.b}, correct answer: ${correctAnswer}`);

    if (!isRandomPhase) {
        if (userAnswer === correctAnswer) {
            currentQuestion.troubleRight++;
            console.log(`Correct answer for ${currentQuestion.a} × ${currentQuestion.b}. troubleRight: ${currentQuestion.troubleRight}`);
            clearFeedback();
            currentQuestionIndex++;
            displayQuestion();
        } else {
            currentQuestion.troubleWrong++;
            console.log(`Wrong answer for ${currentQuestion.a} × ${currentQuestion.b}. troubleWrong: ${currentQuestion.troubleWrong}`);
            showWrongFeedback(correctAnswer);
            updateFlaggedCombination(currentQuestion, 'wrong');
            isReinforcementMode = true;
        }
    } else {
        const isFlagged = flaggedCombinations.some(
            (flagged) => flagged.a === currentQuestion.a && flagged.b === currentQuestion.b
        );
        console.log(`Question flagged: ${isFlagged}`);

        if (userAnswer === correctAnswer) {
            if (isFlagged) {
                updateFlaggedCombination(currentQuestion, 'correct');
                console.log(`Correct answer for flagged combination ${currentQuestion.a} × ${currentQuestion.b}`);
            } else {
                currentQuestion.troubleRight++;
                console.log(`Correct answer for ${currentQuestion.a} × ${currentQuestion.b}. troubleRight: ${currentQuestion.troubleRight}`);
            }
            clearFeedback();
            randomQuestionsPool.splice(randomQuestionsPool.indexOf(currentQuestion), 1);
            console.log('Removed question from random pool.');
            saveProgress();
            updateProgressDisplay();
            displayQuestion();
        } else {
            if (isFlagged) {
                updateFlaggedCombination(currentQuestion, 'wrong');
                console.log(`Wrong answer for flagged combination ${currentQuestion.a} × ${currentQuestion.b}`);
            } else {
                currentQuestion.troubleWrong++;
                console.log(`Wrong answer for ${currentQuestion.a} × ${currentQuestion.b}. troubleWrong: ${currentQuestion.troubleWrong}`);
                updateFlaggedCombination(currentQuestion, 'wrong');
            }
            showWrongFeedback(correctAnswer);
            isReinforcementMode = true;
        }
    }

    answerInput.value = '';
}

function getTroublesomeIndex(question) {
    const totalAttempts = question.troubleRight + question.troubleWrong;
    const index = totalAttempts > 0 ? question.troubleWrong / totalAttempts : 0;
    return index;
}

function showWrongFeedback(correctAnswer) {
    feedbackDiv.innerHTML = '❌';
    setTimeout(() => {
        feedbackDiv.innerHTML = `❌ ${currentQuestion.a} × ${currentQuestion.b} = ${correctAnswer}`;
        console.log(`Displayed wrong feedback for ${currentQuestion.a} × ${currentQuestion.b}`);
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
    updateProgressDisplay();
}

function clearFeedback() {
    feedbackDiv.innerHTML = '';
    console.log('Cleared feedback.');
}

function handleReset() {
    if (confirm('Are you sure you want to reset your progress?')) {
        console.log('Resetting progress.');
        localStorage.removeItem('multiplicationProgress');
        window.location.reload();
    }
}

function autoSubmitCorrectAnswer(question) {
    if (!diagnosticsMode) return;
    if (!question) return;

    const correctAnswer = question.a * question.b;
    answerInput.value = correctAnswer;
    console.log(`Auto-submitting correct answer for ${question.a} × ${question.b}: ${correctAnswer}`);
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
updateProgressDisplay();
displayQuestion();
