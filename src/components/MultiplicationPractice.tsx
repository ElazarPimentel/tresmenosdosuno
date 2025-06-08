"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getFirstProblem, CHALLENGE_TABLE, TABLES, initializeProgress, STORAGE_KEY } from '../data/multiplicationData';

export default function MultiplicationPractice() {
  const [selectedTable, setSelectedTable] = useState('2');
  const [currentProblem, setCurrentProblem] = useState(getFirstProblem('2'));
  const [progress, setProgress] = useState(initializeProgress());
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');
  const [isSequentialPhase, setIsSequentialPhase] = useState(true);
  const [randomPhaseQuestions, setRandomPhaseQuestions] = useState<number[]>([]);
  const [currentRandomIndex, setCurrentRandomIndex] = useState(0);
  const [challengeQuestions, setChallengeQuestions] = useState<{ table: string, multiplier: number, shownCount: number }[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
    const loadProgress = () => {
      if (typeof window !== 'undefined') {
        const storedProgress = localStorage.getItem(STORAGE_KEY);
        if (storedProgress) {
          try {
            setProgress(JSON.parse(storedProgress));
          } catch {
            setProgress(initializeProgress());
          }
        }
      }
    };
    loadProgress();
  }, []);

  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }, [progress, isClient]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentProblem]);

  const buildChallengeQuestions = () => {
    const questions: { table: string, multiplier: number, shownCount: number }[] = [];
    TABLES.forEach(table => {
      for (let i = 1; i <= 12; i++) {
        const combination = `${table}x${i}`;
        const combinationProgress = progress[table][combination];
        if (combinationProgress.incorrectCount > combinationProgress.correctCount) {
          const remainingShows = 3 - combinationProgress.shownCountChallenge;
          for (let j = 0; j < remainingShows; j++) {
            questions.push({ table, multiplier: i, shownCount: combinationProgress.shownCountChallenge + j });
          }
        }
      }
    });
    // Shuffle the array
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  };

  const handleTableCompletion = () => {
    const currentTableNum = parseInt(selectedTable);
    const nextTable = (currentTableNum + 1).toString();
    
    if (currentTableNum < 12) {
      // Mostrar mensaje de transición brevemente
      setCurrentProblem(`¡Tabla ${selectedTable} completada! Avanzando a tabla ${nextTable}...`);
      
      // Transición automática después de 2 segundos
      setTimeout(() => {
        setSelectedTable(nextTable);
        setCurrentProblem(getFirstProblem(nextTable));
        setCurrentMultiplier(1);
        setIsSequentialPhase(true);
        setRandomPhaseQuestions([]);
        setCurrentRandomIndex(0);
        setUserAnswer('');
        setErrorFeedback('');
        
        // Garantizar enfoque del input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
      }, 2000);
    } else {
      // Caso especial: tabla 12 completada
      setCurrentProblem('¡Felicitaciones! Has completado todas las tablas de multiplicar.');
    }
  };

  const handleTableChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTable = event.target.value;
    setSelectedTable(newTable);
    setCurrentProblem(getFirstProblem(newTable));
    setCurrentMultiplier(1);
    setUserAnswer('');
    setErrorFeedback('');
    setIsSequentialPhase(true);
    setRandomPhaseQuestions([]);
    setCurrentRandomIndex(0);
    if (newTable === CHALLENGE_TABLE) {
      const challengeQs = buildChallengeQuestions();
      setChallengeQuestions(challengeQs);
      setCurrentChallengeIndex(0);
      if (challengeQs.length > 0) {
        setCurrentProblem(`${challengeQs[0].table} × ${challengeQs[0].multiplier} = ?`);
      } else {
        setCurrentProblem('¡No hay combinaciones pendientes en la Tabla Desafío!');
      }
    } else {
      setChallengeQuestions([]);
      setCurrentChallengeIndex(0);
    }
  };

  const buildRandomPhaseQuestions = () => {
    const questions: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const combination = `${selectedTable}x${i}`;
      const combinationProgress = progress[selectedTable][combination];
      if (combinationProgress.incorrectCount > 0) {
        questions.push(i, i); // Show twice if answered incorrectly
      } else {
        questions.push(i); // Show once if answered correctly
      }
    }
    // Shuffle the array
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  };

  const handleResetProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
    const initialProgress = initializeProgress();
    setProgress(initialProgress);
    setSelectedTable('2');
    setCurrentProblem(getFirstProblem('2'));
    setCurrentMultiplier(1);
    setUserAnswer('');
    setErrorFeedback('');
    setIsSequentialPhase(true);
    setRandomPhaseQuestions([]);
    setCurrentRandomIndex(0);
    setChallengeQuestions([]);
    setCurrentChallengeIndex(0);
  };

  const processAnswer = () => {
    if (selectedTable !== CHALLENGE_TABLE) {
      if (isSequentialPhase) {
        const correctAnswer = parseInt(selectedTable) * currentMultiplier;
        const userResponse = parseInt(userAnswer);
        const currentCombination = `${selectedTable}x${currentMultiplier}`;

        if (isNaN(userResponse)) {
          setErrorFeedback('Ingresa un número válido');
          setTimeout(() => setErrorFeedback(''), 2000);
          return;
        }

        const updatedProgress = { ...progress };
        const combinationProgress = updatedProgress[selectedTable][currentCombination];

        if (userResponse === correctAnswer) {
          combinationProgress.correctCount += 1;
          setProgress(updatedProgress);
          if (currentMultiplier < 12) {
            setCurrentMultiplier(currentMultiplier + 1);
            setCurrentProblem(`${selectedTable} × ${currentMultiplier + 1} = ?`);
          } else {
            setIsSequentialPhase(false);
            const newQuestions = buildRandomPhaseQuestions();
            setRandomPhaseQuestions(newQuestions);
            setCurrentRandomIndex(0);
            if (newQuestions.length > 0) {
              setCurrentProblem(`${selectedTable} × ${newQuestions[0]} = ?`);
            } else {
              setCurrentProblem('¡Todas las combinaciones aprendidas!');
            }
          }
          setUserAnswer('');
          setErrorFeedback('');
        } else {
          combinationProgress.incorrectCount += 1;
          const wrongAnswerKey = userAnswer.toString();
          combinationProgress.wrongAnswers[wrongAnswerKey] = (combinationProgress.wrongAnswers[wrongAnswerKey] || 0) + 1;
          setProgress(updatedProgress);
          setErrorFeedback('❌');
          setTimeout(() => {
            if (combinationProgress.wrongAnswers[wrongAnswerKey] >= 3) {
              setErrorFeedback(`No es ${wrongAnswerKey}`);
              setTimeout(() => setErrorFeedback(''), 2000);
            } else {
              setErrorFeedback('');
            }
          }, 2000);
          setUserAnswer(''); // Clear input on wrong answer
          if (inputRef.current) {
            inputRef.current.focus(); // Refocus input on wrong answer
          }
        }
      } else {
        const currentMultiplierValue = randomPhaseQuestions[currentRandomIndex];
        const correctAnswer = parseInt(selectedTable) * currentMultiplierValue;
        const userResponse = parseInt(userAnswer);
        const currentCombination = `${selectedTable}x${currentMultiplierValue}`;

        if (isNaN(userResponse)) {
          setErrorFeedback('Ingresa un número válido');
          setTimeout(() => setErrorFeedback(''), 2000);
          return;
        }

        const updatedProgress = { ...progress };
        const combinationProgress = updatedProgress[selectedTable][currentCombination];

        if (userResponse === correctAnswer) {
          combinationProgress.correctCount += 1;
          setProgress(updatedProgress);
          // Check if all combinations are learned
          let allLearned = true;
          const nextQuestions = [...randomPhaseQuestions];
          for (let i = 1; i <= 12; i++) {
            const comb = `${selectedTable}x${i}`;
            const prog = updatedProgress[selectedTable][comb];
            if (prog.incorrectCount > prog.correctCount) {
              allLearned = false;
              if (!nextQuestions.includes(i)) {
                nextQuestions.push(i); // Add back if not learned
              }
            }
          }
          if (currentRandomIndex < randomPhaseQuestions.length - 1) {
            setCurrentRandomIndex(currentRandomIndex + 1);
            setCurrentProblem(`${selectedTable} × ${randomPhaseQuestions[currentRandomIndex + 1]} = ?`);
          } else if (!allLearned) {
            // Shuffle and start a new cycle with remaining unlearned questions
            for (let i = nextQuestions.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [nextQuestions[i], nextQuestions[j]] = [nextQuestions[j], nextQuestions[i]];
            }
            setRandomPhaseQuestions(nextQuestions);
            setCurrentRandomIndex(0);
            setCurrentProblem(`${selectedTable} × ${nextQuestions[0]} = ?`);
          } else {
            // Tabla completada - activar transición automática
            if (selectedTable !== CHALLENGE_TABLE) {
              handleTableCompletion();
            } else {
              setCurrentProblem('¡Fase Aleatoria completada! Todas las combinaciones aprendidas.');
            }
          }
          setUserAnswer('');
          setErrorFeedback('');
        } else {
          combinationProgress.incorrectCount += 1;
          const wrongAnswerKey = userAnswer.toString();
          combinationProgress.wrongAnswers[wrongAnswerKey] = (combinationProgress.wrongAnswers[wrongAnswerKey] || 0) + 1;
          setProgress(updatedProgress);
          setErrorFeedback('❌');
          setTimeout(() => {
            if (combinationProgress.wrongAnswers[wrongAnswerKey] >= 3) {
              setErrorFeedback(`No es ${wrongAnswerKey}`);
              setTimeout(() => setErrorFeedback(''), 2000);
            } else {
              setErrorFeedback('');
            }
          }, 2000);
          setUserAnswer(''); // Clear input on wrong answer
          if (inputRef.current) {
            inputRef.current.focus(); // Refocus input on wrong answer
          }
        }
      }
    } else {
      // Challenge Table logic - sin cambios, protegida del avance automático
      if (challengeQuestions.length === 0) return;

      const currentChallenge = challengeQuestions[currentChallengeIndex];
      const correctAnswer = parseInt(currentChallenge.table) * currentChallenge.multiplier;
      const userResponse = parseInt(userAnswer);
      const currentCombination = `${currentChallenge.table}x${currentChallenge.multiplier}`;

      if (isNaN(userResponse)) {
        setErrorFeedback('Ingresa un número válido');
        setTimeout(() => setErrorFeedback(''), 2000);
        return;
      }

      const updatedProgress = { ...progress };
      const combinationProgress = updatedProgress[currentChallenge.table][currentCombination];

      if (userResponse === correctAnswer) {
        combinationProgress.correctCount += 1;
        setProgress(updatedProgress);
        setErrorFeedback('');
      } else {
        combinationProgress.incorrectCount += 1;
        const wrongAnswerKey = userAnswer.toString();
        combinationProgress.wrongAnswers[wrongAnswerKey] = (combinationProgress.wrongAnswers[wrongAnswerKey] || 0) + 1;
        setProgress(updatedProgress);
        setErrorFeedback('❌');
        setTimeout(() => {
          if (combinationProgress.wrongAnswers[wrongAnswerKey] >= 3) {
            setErrorFeedback(`No es ${wrongAnswerKey}`);
            setTimeout(() => setErrorFeedback(''), 2000);
          } else {
            setErrorFeedback('');
          }
        }, 2000);
      }

      // Update shown count in progress for the current challenge question
      combinationProgress.shownCountChallenge += 1;
      setProgress(updatedProgress);

      // Move to next question or update list if learned
      let nextIndex = currentChallengeIndex + 1;
      if (nextIndex >= challengeQuestions.length) {
        // Build a new list excluding learned combinations
        const newChallengeQuestions = buildChallengeQuestions();
        setChallengeQuestions(newChallengeQuestions);
        nextIndex = 0;
        if (newChallengeQuestions.length > 0) {
          setCurrentProblem(`${newChallengeQuestions[0].table} × ${newChallengeQuestions[0].multiplier} = ?`);
        } else {
          setCurrentProblem('¡No quedan combinaciones pendientes en la Tabla Desafío!');
        }
      } else {
        setCurrentProblem(`${challengeQuestions[nextIndex].table} × ${challengeQuestions[nextIndex].multiplier} = ?`);
      }
      setCurrentChallengeIndex(nextIndex);
      setUserAnswer('');
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleAnswerSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    processAnswer();
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserAnswer(event.target.value);
  };

  return (
    <div className="multiplication-practice">
      <div className="table-selector">
        <label htmlFor="table-select">Selecciona una tabla: </label>
        <select id="table-select" value={selectedTable} onChange={handleTableChange}>
          <option value="2">Tabla del 2</option>
          <option value="3">Tabla del 3</option>
          <option value="4">Tabla del 4</option>
          <option value="5">Tabla del 5</option>
          <option value="6">Tabla del 6</option>
          <option value="7">Tabla del 7</option>
          <option value="8">Tabla del 8</option>
          <option value="9">Tabla del 9</option>
          <option value="10">Tabla del 10</option>
          <option value="11">Tabla del 11</option>
          <option value="12">Tabla del 12</option>
          <option value={CHALLENGE_TABLE}>Tabla Desafío</option>
        </select>
      </div>
      <div className="problem-display">
        <p className="problem-text">{currentProblem}</p>
        <form onSubmit={handleAnswerSubmit}>
          <input
            type="number"
            value={userAnswer}
            onChange={handleInputChange}
            placeholder="Ingresa tu respuesta"
            className="answer-input"
            ref={inputRef}
            autoFocus
          />
        </form>
        <div className="feedback-space">
          {errorFeedback && <p className="error-feedback">{errorFeedback}</p>}
        </div>
        <button type="button" className="ok-button" onClick={processAnswer}>OK</button>
      </div>
      <div className="controls">
        <button className="reset-button" onClick={handleResetProgress}>Reiniciar Progreso</button>
      </div>
    </div>
  );
} 