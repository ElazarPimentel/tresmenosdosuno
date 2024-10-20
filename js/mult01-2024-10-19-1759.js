// file: js/mult01.js
// I love chocolate

const diagnoseMode = true; // Set to true to enable automatic dry-run diagnostics
const localStorageKey = 'multiplicationResults';

// Add this function to clear localStorage
function clearLocalStorage() {
    localStorage.removeItem(localStorageKey);
    console.log('localStorage cleared for diagnose mode');
}

if (diagnoseMode) {
    console.log('Diagnose Mode Enabled: Running through all permutations automatically');
    clearLocalStorage(); // Clear localStorage when diagnose mode is true
}

document.addEventListener('DOMContentLoaded', function () {
    const masteryThreshold = 3;
    const baseRevisitProbability = 0.1;
    const maxConsecutiveWrong = 3;

    let tables = [];
    let currentTableIndex = 0;
    let currentQuestionIndex = 0;
    let currentPhase = 'sequential'; // 'sequential', 'random', 'error-focused'
    let currentQuestion = null;
    let lastQuestion = null;
    let consecutiveWrong = 0;

    // New constant to track total correct answers per question
    const totalCorrectAnswersPerQuestion = {};

    // New variable to track right-to-wrong ratio per question
    const rightToWrongRatios = {};

    // Add this global variable at the top of your script
    let diagnoseCompleted = false;
    let allTablesMastered = false;

    function initTables() {
        if (!diagnoseMode) {
            let data = localStorage.getItem(localStorageKey);
            if (data) {
                try {
                    data = JSON.parse(data);
                    if (data.tables && Array.isArray(data.tables) && data.tables.length > 0) {
                        tables = data.tables;
                        currentTableIndex = data.currentTableIndex || 0;
                        currentPhase = data.currentPhase || 'sequential';
                        currentQuestionIndex = data.currentQuestionIndex || 0;
                        console.log('Loaded data from localStorage:', data);
                    } else {
                        throw new Error('Invalid data structure in localStorage');
                    }
                } catch (error) {
                    console.error('Error parsing localStorage data:', error);
                    loadTables();
                    saveData();
                    console.log('Initialized tables and saved data due to parsing error.');
                }
            } else {
                loadTables();
                saveData();
                console.log('Initialized tables and saved data.');
            }
        } else {
            loadTables();
            console.log('Initialized tables for diagnose mode (not saved to localStorage).');
        }
    }

    function loadTables() {
        tables = [];
        for (let tableNumber = 2; tableNumber <= 12; tableNumber++) {
            let questions = [];
            for (let i = 2; i <= 12; i++) {
                questions.push({
                    question: `${tableNumber} × ${i}`,
                    correct: 0,
                    wrong: 0,
                    shown: 0,
                    totalCorrectAnswers: 0 // Track total correct answers for this question
                });
            }
            tables.push({
                tableNumber: tableNumber,
                questions: questions,
                mastered: false
            });
        }
        console.log('Loaded tables:', tables);
    }

    function saveData() {
        if (!diagnoseMode) {
            const data = {
                tables,
                currentTableIndex,
                currentPhase,
                currentQuestionIndex
            };
            localStorage.setItem(localStorageKey, JSON.stringify(data));
            console.log('Data saved to localStorage:', data);
        } else {
            console.log('Data not saved to localStorage (diagnose mode active)');
        }
    }

    function checkMasteryAndAdvance() {
        if (diagnoseCompleted || allTablesMastered) return false;

        const currentTable = tables[currentTableIndex];
        const mastered = currentTable.questions.every(q => q.correct >= masteryThreshold);
        if (mastered) {
            currentTable.mastered = true;
            console.log(`Table ${currentTable.tableNumber} mastered.`);
            if (currentTableIndex < tables.length - 1) {
                currentTableIndex++;
                currentPhase = 'sequential';
                currentQuestionIndex = 0;
                lastQuestion = null;
                console.log('Moving to the next table:', tables[currentTableIndex].tableNumber);
                return true;
            } else {
                console.log('🎉 All tables mastered');
                currentQuestion = null;
                updateQuestionDisplay('🎉 You have mastered all tables!');
                diagnoseCompleted = true;
                allTablesMastered = true;
                if (diagnoseMode) {
                    console.log('Diagnose mode complete. All tables processed.');
                }
                return false;
            }
        }
        return true;
    }

    function getNextQuestion() {
        console.log('getNextQuestion() called:', {
            currentPhase,
            currentTableIndex,
            currentQuestionIndex,
            lastQuestion: lastQuestion ? lastQuestion.question : null
        });

        if (currentTableIndex >= tables.length) {
            console.log('All tables have been mastered.');
            return null;
        }

        const currentTable = tables[currentTableIndex];
        let questions = currentTable.questions;
        let availableQuestions = [];
        let nextQuestion = null;
        let attempts = 0;
        const maxAttempts = 20; // Increased from 10 to 20

        while (attempts < maxAttempts) {
            if (currentPhase === 'sequential') {
                if (currentQuestionIndex < questions.length) {
                    nextQuestion = questions[currentQuestionIndex++];
                    console.log('Sequential phase - Next question:', nextQuestion.question);
                    saveData(); 
                } else {
                    currentQuestionIndex = 0;
                    currentPhase = 'random';
                    console.log('Switching to random phase');
                    saveData();
                    continue;
                }
            } else if (currentPhase === 'random') {
                availableQuestions = questions.filter(q => q !== lastQuestion);

                if (availableQuestions.length === 0) {
                    availableQuestions = questions;
                }

                let weightedQuestions = [];
                availableQuestions.forEach(q => {
                    let weight = q.wrong + 1;
                    for (let i = 0; i < weight; i++) {
                        weightedQuestions.push(q);
                    }
                });

                if (Math.random() < baseRevisitProbability) {
                    weightedQuestions = weightedQuestions.concat(questions);
                    console.log('Including revisit questions due to revisit probability');
                }

                if (weightedQuestions.length === 0) {
                    console.warn('No available questions to select.');
                    return null;
                }

                nextQuestion = weightedQuestions[Math.floor(Math.random() * weightedQuestions.length)];
                console.log('Random phase - Next question:', nextQuestion.question);

                if (consecutiveWrong >= maxConsecutiveWrong) {
                    currentPhase = 'sequential';
                    currentQuestionIndex = 0;
                    consecutiveWrong = 0;
                    saveData();
                    console.log(`${maxConsecutiveWrong} consecutive wrong answers - Switching back to sequential phase`);
                    continue;
                }
            } else if (currentPhase === 'error-focused') {
                let wrongQuestions = currentTable.questions.filter(q => q.wrong > 0);

                if (wrongQuestions.length === 0) {
                    console.log('No wrong questions left - Switching to random phase');
                    currentPhase = 'random';
                    saveData();
                    continue;
                } else {
                    let weightedQuestions = [];
                    wrongQuestions.forEach(q => {
                        let weight = q.wrong;
                        for (let i = 0; i < weight; i++) {
                            weightedQuestions.push(q);
                        }
                    });
                    weightedQuestions = weightedQuestions.filter(q => q !== lastQuestion);
                    if (weightedQuestions.length === 0) {
                        weightedQuestions = wrongQuestions;
                    }
                    nextQuestion = weightedQuestions[Math.floor(Math.random() * weightedQuestions.length)];
                    console.log('Error-focused phase - Next question:', nextQuestion.question);
                }
            } else {
                console.error('Unknown phase:', currentPhase);
                return null;
            }

            if (nextQuestion !== lastQuestion || attempts >= maxAttempts - 1) {
                lastQuestion = nextQuestion;
                return nextQuestion;
            } else {
                attempts++;
            }
        }

        console.warn(`Could not find a new question after ${maxAttempts} attempts`);
        return nextQuestion;
    }

    function handleSubmit() {
        if (diagnoseCompleted || allTablesMastered) return;

        const inputElement = document.getElementById('answer-input');
        const feedbackElement = document.getElementById('feedback');
        const submitButton = document.getElementById('submit-button');

        if (!currentQuestion) {
            console.error('No current question');
            return;
        }

        const userAnswer = parseInt(inputElement.value, 10);

        const matches = currentQuestion.question.match(/(\d+)\s*[×x*]\s*(\d+)/i);
        if (!matches || matches.length !== 3) {
            feedbackElement.textContent = '❌ Error parsing the question';
            feedbackElement.style.color = '#FF6347';
            console.error('Failed to parse question:', currentQuestion.question);
            return;
        }
        const num1 = parseInt(matches[1], 10);
        const num2 = parseInt(matches[2], 10);
        if (isNaN(num1) || isNaN(num2)) {
            feedbackElement.textContent = '❌ Error in question format';
            feedbackElement.style.color = '#FF6347';
            console.error('Invalid numbers in question:', currentQuestion.question);
            return;
        }
        const correctAnswer = num1 * num2;

        if (isNaN(userAnswer)) {
            feedbackElement.textContent = '⚠️ Please enter a number';
            feedbackElement.style.color = '#FFA500';
            console.log('User did not enter a valid number');
            return;
        }

        currentQuestion.shown++;

        if (userAnswer === correctAnswer) {
            currentQuestion.correct++;
            currentQuestion.totalCorrectAnswers++; // Increment the total correct answers for this question
            currentQuestion.wrong = 0;
            consecutiveWrong = 0;
            feedbackElement.textContent = '✅ Correct!';
            feedbackElement.style.color = '#32CD32';
            feedbackElement.classList.add('show-feedback');
            console.log('Correct answer:', currentQuestion.question, 'Total correct for this question:', currentQuestion.correct);

            // Log total correct answers for this question
            console.log(`Total correct answers for "${currentQuestion.question}": ${currentQuestion.totalCorrectAnswers}`);

            // Calculate and log right-to-wrong ratio
            const rightToWrongRatio = (currentQuestion.correct / (currentQuestion.correct + currentQuestion.wrong)).toFixed(2);
            console.log(`Right to wrong ratio for "${currentQuestion.question}": ${rightToWrongRatio}`);
            rightToWrongRatios[currentQuestion.question] = rightToWrongRatio;

            setTimeout(() => {
                if (diagnoseCompleted || allTablesMastered) return;
                feedbackElement.textContent = '';
                feedbackElement.classList.remove('show-feedback');
                saveData();

                if (checkMasteryAndAdvance()) {
                    loadNextQuestion();
                } else {
                    diagnoseCompleted = true;
                    allTablesMastered = true;
                    console.log('All tables mastered. Diagnose mode complete.');
                    updateQuestionDisplay('🎉 You have mastered all tables!');
                }
            }, 0);

        } else {
            currentQuestion.wrong++;
            consecutiveWrong++;
            feedbackElement.textContent = `❌ Incorrect! The correct answer was ${correctAnswer}.`;
            feedbackElement.style.color = '#FF6347';
            feedbackElement.classList.add('show-feedback');

            inputElement.disabled = true;
            submitButton.disabled = true;

            setTimeout(() => {
                feedbackElement.textContent = '🔄 Try the next question';
                feedbackElement.style.color = '#FFA500';
                inputElement.disabled = false;
                submitButton.disabled = false;
                inputElement.value = '';
                inputElement.focus();
                feedbackElement.classList.remove('show-feedback');
            }, 2000);

            if (consecutiveWrong >= maxConsecutiveWrong) {
                currentPhase = 'sequential';
                currentQuestionIndex = 0;
                consecutiveWrong = 0;
                saveData();
                console.log(`${maxConsecutiveWrong} consecutive wrong answers - Switching back to sequential phase`);
            } else {
                if (currentPhase !== 'error-focused') {
                    currentPhase = 'error-focused';
                    console.log('Switching to error-focused phase due to incorrect answer');
                }
                saveData();
            }
        }
    }

    function loadNextQuestion() {
        if (diagnoseCompleted || allTablesMastered) {
            console.log('Diagnose mode completed or all tables mastered. Exiting.');
            return;
        }

        const questionElement = document.getElementById('question');
        currentQuestion = getNextQuestion();

        if (!currentQuestion) {
            console.log('No more questions available. Ending diagnose mode.');
            updateQuestionDisplay('🎉 You have completed all questions!');
            diagnoseCompleted = true;
            allTablesMastered = true;
            if (diagnoseMode) {
                console.log('Diagnose mode complete. All tables processed.');
            }
            return;
        }

        questionElement.textContent = currentQuestion.question;
        const inputElement = document.getElementById('answer-input');
        inputElement.value = '';
        inputElement.focus();

        if (diagnoseMode && !diagnoseCompleted) {
            console.log('Diagnose Mode: Automatically providing correct answer for testing');
            setTimeout(() => {
                if (diagnoseCompleted || allTablesMastered) return;
                const matches = currentQuestion.question.match(/(\d+)\s*[×x*]\s*(\d+)/i);
                if (matches && matches.length === 3) {
                    const num1 = parseInt(matches[1], 10);
                    const num2 = parseInt(matches[2], 10);
                    if (!isNaN(num1) && !isNaN(num2)) {
                        const correctAnswer = num1 * num2;
                        document.getElementById('answer-input').value = correctAnswer;
                        handleSubmit();
                    } else {
                        console.error('Invalid numbers in question:', currentQuestion.question);
                    }
                } else {
                    console.error('Failed to parse question in diagnose mode:', currentQuestion.question);
                }
            }, 100);
        }
    }

    function updateQuestionDisplay(message) {
        const questionElement = document.getElementById('question');
        questionElement.textContent = message;
    }

    document.getElementById('answer-input').addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit();
        }
    });

    document.getElementById('submit-button').addEventListener('click', handleSubmit);

    document.getElementById('reset-button').addEventListener('click', function () {
        if (confirm('🔄 Are you sure you want to reset your progress?')) {
            localStorage.removeItem(localStorageKey);
            tables = [];
            currentTableIndex = 0;
            currentPhase = 'sequential';
            currentQuestionIndex = 0;
            consecutiveWrong = 0;
            currentQuestion = null;
            lastQuestion = null;
            loadTables();
            saveData();
            console.log('Progress reset');
            updateQuestionDisplay('🔄 Progress has been reset. Starting over...');
            setTimeout(() => {
                loadNextQuestion();
            }, 1000);
        }
    });

    setTimeout(() => {
        initTables();
        loadNextQuestion();
    }, 100);
});
