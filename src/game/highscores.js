const STORAGE_KEY = 'volfied_highscores';
const MAX_SCORES = 10;

export function getHighScores() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addHighScore(score, level) {
  const scores = getHighScores();
  const entry = { score, level, date: Date.now() };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, MAX_SCORES);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(top));
  } catch { /* ignore */ }
  return top;
}

export function isHighScore(score) {
  const scores = getHighScores();
  if (scores.length < MAX_SCORES) return true;
  return score > scores[scores.length - 1].score;
}
