const KEY = 'franks-holdem:player-name';

export function loadPlayerName(): string {
  try {
    return (localStorage.getItem(KEY) ?? '').trim().slice(0, 12);
  } catch {
    return '';
  }
}

export function savePlayerName(name: string): void {
  try {
    localStorage.setItem(KEY, name.trim().slice(0, 12));
  } catch {
    // The current session still works when browser storage is unavailable.
  }
}
