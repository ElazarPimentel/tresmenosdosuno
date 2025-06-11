"use client";

import React, { useState, useEffect, useRef } from 'react';
import { getFirstProblem, CHALLENGE_TABLE, TABLES, VALID_MULTIPLIERS, initializeProgress, STORAGE_KEY } from '../data/multiplicationData';

export default function MultiplicationPractice() {
  const [selectedTable, setSelectedTable] = useState('2');
  const [currentProblem, setCurrentProblem] = useState(getFirstProblem('2'));
  const [progress, setProgress] = useState(initializeProgress());
  const [currentMultiplier, setCurrentMultiplier] = useState(2);
  const [userAnswer, setUserAnswer] = useState('');
  const [errorFeedback, setErrorFeedback] = useState('');
  const [isSequentialPhase, setIsSequentialPhase] = useState(true);
  const [randomPhaseQuestions, setRandomPhaseQuestions] = useState<number[]>([]);
  const [currentRandomIndex, setCurrentRandomIndex] = useState(0);
  const [challengeQuestions, setChallengeQuestions] = useState<{ table: string, multiplier: number }[]>([]);
  const [currentChallengeIndex, setCurrentChallengeIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);
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

  // Calcular cantidad de combinaciones en Tabla Desafío
  useEffect(() => {
    if (!isClient) return;
    
    const count = TABLES.reduce((total, table) => {
      return total + VALID_MULTIPLIERS.reduce((tableTotal, multiplier) => {
        const combination = `${table}x${multiplier}`;
        const combinationProgress = progress[table][combination];
        return tableTotal + (
          (combinationProgress.incorrectCount >= 2 || combinationProgress.inChallengeTable) ? 1 : 0
        );
      }, 0);
    }, 0);
    
    setChallengeCount(count);
  }, [progress, isClient]);

  const buildChallengeQuestions = () => {
    const questions: { table: string, multiplier: number }[] = [];
    TABLES.forEach(table => {
      VALID_MULTIPLIERS.forEach(i => {
        const combination = `${table}x${i}`;
        const combinationProgress = progress[table][combination];
        // Incluir combinaciones con 2+ errores o marcadas manualmente
        if (combinationProgress.incorrectCount >= 2 || combinationProgress.inChallengeTable) {
          questions.push({ table, multiplier: i });
        }
      });
    });
    // Shuffle the array
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }
    return questions;
  };

  const getIncompleteTables = () => {
    return TABLES.filter(table => {
      return !VALID_MULTIPLIERS.every(multiplier => {
        const combination = `${table}x${multiplier}`;
        const combinationProgress = progress[table][combination];
        return combinationProgress.correctCount > combinationProgress.incorrectCount;
      });
    });
  };

  const areAllTablesComplete = () => {
    return getIncompleteTables().length === 0;
  };

  const formatTablesList = (tables: string[]) => {
    if (tables.length === 0) return '';
    if (tables.length === 1) return `Tabla del ${tables[0]}`;
    if (tables.length === 2) return `Tabla del ${tables[0]} y Tabla del ${tables[1]}`;
    
    const lastTable = tables[tables.length - 1];
    const previousTables = tables.slice(0, -1);
    return `Tabla del ${previousTables.join(', Tabla del ')} y Tabla del ${lastTable}`;
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
        setCurrentMultiplier(2);
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
      const incompleteTables = getIncompleteTables();
      if (incompleteTables.length === 0) {
        setCurrentProblem('¡Felicitaciones! Has completado todas las tablas. Pasando a la Tabla Desafío...');
        
        // Transición a la Tabla Desafío después de 3 segundos
        setTimeout(() => {
          setSelectedTable(CHALLENGE_TABLE);
          const challengeQs = buildChallengeQuestions();
          setChallengeQuestions(challengeQs);
          setCurrentChallengeIndex(0);
          if (challengeQs.length > 0) {
            setCurrentProblem(`${challengeQs[0].table} × ${challengeQs[0].multiplier} = ?`);
          } else {
            setCurrentProblem('¡No hay combinaciones pendientes en la Tabla Desafío!');
          }
          setUserAnswer('');
          setErrorFeedback('');
          
          // Garantizar enfoque del input
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }, 3000);
      } else {
        const tablesMessage = formatTablesList(incompleteTables);
        setCurrentProblem(`¡Tabla 12 completada! Aún no dominás: ${tablesMessage}. Podés practicarlas o pasar a la Tabla Desafío.`);
      }
    }
  };

  const handleTableChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTable = event.target.value;
    setSelectedTable(newTable);
    setCurrentProblem(getFirstProblem(newTable));
    setCurrentMultiplier(2);
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
    VALID_MULTIPLIERS.forEach(i => {
      const combination = `${selectedTable}x${i}`;
      const combinationProgress = progress[selectedTable][combination];
      if (combinationProgress.incorrectCount > 0) {
        questions.push(i, i); // Show twice if answered incorrectly
      } else {
        questions.push(i); // Show once if answered correctly
      }
    });
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
    setCurrentMultiplier(2);
    setUserAnswer('');
    setErrorFeedback('');
    setIsSequentialPhase(true);
    setRandomPhaseQuestions([]);
    setCurrentRandomIndex(0);
    setChallengeQuestions([]);
    setCurrentChallengeIndex(0);
  };

  const toggleChallengeTableInclusion = () => {
    if (selectedTable === CHALLENGE_TABLE) return; // No permitir toggle en la Tabla Desafío

    const currentCombination = isSequentialPhase 
      ? `${selectedTable}x${currentMultiplier}`
      : `${selectedTable}x${randomPhaseQuestions[currentRandomIndex]}`;

    const updatedProgress = { ...progress };
    const combinationProgress = updatedProgress[selectedTable][currentCombination];
    combinationProgress.inChallengeTable = !combinationProgress.inChallengeTable;
    setProgress(updatedProgress);
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
          
          // Encontrar el siguiente multiplicador válido
          const currentIndex = VALID_MULTIPLIERS.indexOf(currentMultiplier);
          if (currentIndex < VALID_MULTIPLIERS.length - 1) {
            const nextMultiplier = VALID_MULTIPLIERS[currentIndex + 1];
            setCurrentMultiplier(nextMultiplier);
            setCurrentProblem(`${selectedTable} × ${nextMultiplier} = ?`);
          } else {
            // Fin de la fase secuencial, pasar a fase aleatoria
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
          
          // Usar VALID_MULTIPLIERS en lugar de i de 1 a 12
          VALID_MULTIPLIERS.forEach(multiplier => {
            const comb = `${selectedTable}x${multiplier}`;
            const prog = updatedProgress[selectedTable][comb];
            if (prog.incorrectCount > prog.correctCount) {
              allLearned = false;
              if (!nextQuestions.includes(multiplier)) {
                nextQuestions.push(multiplier); // Add back if not learned
              }
            }
          });

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
      // Challenge Table logic - modificada para nuevo comportamiento
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

      // Move to next question
      let nextIndex = currentChallengeIndex + 1;
      if (nextIndex >= challengeQuestions.length) {
        // Rebuild challenge questions list
        const newChallengeQuestions = buildChallengeQuestions();
        setChallengeQuestions(newChallengeQuestions);
        nextIndex = 0;
        if (newChallengeQuestions.length > 0) {
          setCurrentProblem(`${newChallengeQuestions[0].table} × ${newChallengeQuestions[0].multiplier} = ?`);
        } else {
          setCurrentProblem('¡No hay combinaciones pendientes en la Tabla Desafío!');
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
          <option value={CHALLENGE_TABLE}>Tabla Desafío {challengeCount > 0 ? `(${challengeCount})` : ''}</option>
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
        {selectedTable !== CHALLENGE_TABLE && (
          <div className="challenge-toggle">
            <label>
              <input
                type="checkbox"
                checked={
                  isSequentialPhase
                    ? progress[selectedTable][`${selectedTable}x${currentMultiplier}`]?.inChallengeTable
                    : progress[selectedTable][`${selectedTable}x${randomPhaseQuestions[currentRandomIndex]}`]?.inChallengeTable
                }
                onChange={toggleChallengeTableInclusion}
                className="challenge-checkbox"
              />
              En Tabla Desafío
            </label>
          </div>
        )}
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