// Central game state - single source of truth
export const state = {
  // Meta
  roomNumber: 1,
  groqKey: '',

  // Current room blueprint from AI
  room: null,

  // Runtime state
  inventory: [],          // array of item ids
  solvedPuzzles: new Set(),
  examinedObjects: new Set(),
  collectedClues: [],
  exitOpen: false,

  // Puzzle interaction
  activePuzzleId: null,
  activeObjectId: null,
};

// Reset per-room state (keep meta)
export function resetRoomState() {
  state.room = null;
  state.inventory = [];
  state.solvedPuzzles = new Set();
  state.examinedObjects = new Set();
  state.collectedClues = [];
  state.exitOpen = false;
  state.activePuzzleId = null;
  state.activeObjectId = null;
}

// Check if an object is accessible (not locked by unsolved puzzle dependency)
export function isObjectAccessible(objectId) {
  if (!state.room) return false;
  const obj = state.room.objects.find(o => o.id === objectId);
  if (!obj) return false;
  if (!obj.requiredPuzzle) return true;  // No lock requirement
  return state.solvedPuzzles.has(obj.requiredPuzzle);
}

// Check if a puzzle can be attempted
export function canAttemptPuzzle(puzzleId) {
  if (!state.room) return false;
  const puzzle = state.room.puzzles.find(p => p.id === puzzleId);
  if (!puzzle) return false;
  if (state.solvedPuzzles.has(puzzleId)) return false;
  // Check if required item is in inventory
  if (puzzle.requiredItem && !state.inventory.includes(puzzle.requiredItem)) return false;
  return true;
}

// Solve a puzzle and unlock whatever it grants
export function solvePuzzle(puzzleId) {
  state.solvedPuzzles.add(puzzleId);
  // Check if all puzzles solved → open exit
  const allSolved = state.room.puzzles.every(p => state.solvedPuzzles.has(p.id));
  if (allSolved) state.exitOpen = true;
  return allSolved;
}

// Add item to inventory
export function addToInventory(itemId) {
  if (!state.inventory.includes(itemId)) {
    state.inventory.push(itemId);
    return true;
  }
  return false;
}

// Get puzzle status for chain display
export function getPuzzleStatus(puzzleId) {
  if (state.solvedPuzzles.has(puzzleId)) return 'solved';
  const puzzle = state.room?.puzzles.find(p => p.id === puzzleId);
  if (!puzzle) return 'locked';
  // It's active if its host object is accessible
  const hostObj = state.room.objects.find(o => o.puzzleId === puzzleId);
  if (hostObj && isObjectAccessible(hostObj.id)) return 'active';
  return 'locked';
}
