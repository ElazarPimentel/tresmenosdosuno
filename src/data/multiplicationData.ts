export interface CombinationProgress {
  correctCount: number;
  incorrectCount: number;
  wrongAnswers: Record<string, number>;
  shownCountChallenge: number;
}

export interface TableProgress {
  [combination: string]: CombinationProgress;
}

export interface MultiplicationProgress {
  [table: string]: TableProgress;
}

export const TABLES = Array.from({ length: 11 }, (_, i) => (i + 2).toString()); // Tablas del 2 al 12
export const CHALLENGE_TABLE = 'challenge';
export const STORAGE_KEY = 'multiplicationProgress';

export const initializeProgress = (): MultiplicationProgress => {
  const initialProgress: MultiplicationProgress = {};
  TABLES.forEach(table => {
    initialProgress[table] = {};
    for (let i = 1; i <= 12; i++) {
      const combination = `${table}x${i}`;
      initialProgress[table][combination] = {
        correctCount: 0,
        incorrectCount: 0,
        wrongAnswers: {},
        shownCountChallenge: 0
      };
    }
  });
  initialProgress[CHALLENGE_TABLE] = {};
  return initialProgress;
};

export const getProgressFromStorage = (): MultiplicationProgress => {
  const storedProgress = localStorage.getItem(STORAGE_KEY);
  if (storedProgress) {
    try {
      return JSON.parse(storedProgress);
    } catch {
      return initializeProgress();
    }
  }
  return initializeProgress();
};

export const saveProgressToStorage = (progress: MultiplicationProgress) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

export const getFirstProblem = (table: string) => {
  if (table === CHALLENGE_TABLE) {
    return 'Selecciona la Tabla Desafío para ver problemas.';
  }
  return `${table} × 1 = ?`;
}; 