/**
 * File: src/app/AiBehavior.tsx
 * Module: AI behavior
 * Description: Defines the AI behavior for the Minesweeper game, including easy, medium, and hard difficulty levels.
 *              In addition, it provides a hint feature to assist players.
 * Inputs: Each function consumes a Ctx (current board state + setters).
 * Outputs: Returns AI move functions (easyAi, mediumAi, hardAi) and hint feature.
 * External Sources: None.
 * Authors: Kiara [Sam] Grimsley, Reeny Huang, Lauren D'Souza, Audrey Pan, Ella Nguyen, Hart Nurnberg
 * Creation date: September 28th, 2025 
 * Last modified: October 5, 2025
 */

import type { Cell } from "@/_util/grid";
import {
  cloneBoard,
  floodFill,
  placeMines,
  computeAdjacency,
} from "@/_util/grid";

// Ctx: view of current game state + mutators passed to AI/hint routines.
type Ctx = {
  board: Cell[][];
  gridSize: number;
  mines: number;
  started: boolean;
  setBoard: (b: Cell[][]) => void;
  setStarted: (v: boolean) => void;
  setFlagsLeft: (n: number) => void;
  setGameOver: (s: null | "lost" | "won") => void;
  checkWin: (b: Cell[][]) => boolean;
  revealMines: () => void;
};

let hintUses = 0;
const MAX_HINTS = 3;

/**
 * Easy AI (one move):
 * - Picks a random hidden, unflagged cell and opens it.
 * - If it’s the very first move, it also triggers mine placement (first-click safety) and computes adjacency.
 * - If it hits a mine, it immediately loses; otherwise, flood-fills like a player reveal
 * - Returns immediately if the board already satisfies checkWin
 */
export function easyAi(ctx?: Ctx) {
  if (!ctx) { 
    console.warn("easyAi called without ctx"); 
    return; 
  }

  const {
    board, gridSize, mines, started,
    setBoard, setStarted, setGameOver,
    checkWin, revealMines
  } = ctx;
  if (checkWin(board)) return;
  const next = cloneBoard(board);

  // Collect all cells that are still hidden and not flagged.
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = next[r][c];
      if (!cell.revealed && !cell.flagged) {
        candidates.push([r, c]);
      }
    }
  }

  // Nothing left to click? Bail out.
  if (candidates.length === 0) return;

  // Pick one random candidate.
  const [rr, cc] = candidates[Math.floor(Math.random() * candidates.length)];
  const target = next[rr][cc];

  // First click special case: place mines *after* choosing this cell
  // so we guarantee the AI (or player) never loses immediately.
  if (!started) {
    placeMines(next, mines, { r: rr, c: cc });
    computeAdjacency(next);
    setStarted(true);
  }

  // If the chosen cell is a mine → game over
  if (target.isMine) {
    target.revealed = true;
    setBoard(next);
    setGameOver("lost");
    revealMines();
    console.log(`Easy AI hit a mine at (${rr},${cc})`);
    return;
  }

  // Otherwise, flood-fill reveal (handles zeros + connected safe area).
  floodFill(next, gridSize, rr, cc);
  setBoard(next);

  // After the move, check if this wins the game.
  if (checkWin(next)) {
    setGameOver("won");
    revealMines();
    console.log("Easy AI: game won!");
  } else {
    console.log(`Easy AI opened at (${rr},${cc})`);
  }
}

/**
 * Medium AI (one move):
 * - Tries to make a logical move first.
 *   • Rule 1: if hidden == (number − flagged) → flag hidden neighbors.
 *   • Rule 2: if flagged == number → open remaining hidden neighbors.
 *   • Also opens around revealed zeros; if stuck, guesses a random hidden cell.
 * - Always reveals at least one tile on its turn (so interactive mode feels fair).
 * - If logic is stuck, it guesses. If literally only flags remain, it unflags one and opens it.
 */
export function mediumAi(ctx?: Ctx) {
  if (!ctx) { console.warn("mediumAi called without ctx"); return; }

  const {
    board, gridSize, mines, started,
    setBoard, setStarted, setFlagsLeft, setGameOver,
    checkWin, revealMines
  } = ctx;

  const next = cloneBoard(board);

  // Small helpers to juggle coordinate sets
  const enc = (r: number, c: number) => `${r},${c}`;
  const dec = (s: string) => s.split(",").map(Number) as [number, number];
  const dirs = [-1, 0, 1];

  let didOpen = false;
  let didFlag = false;

  // Buckets we’ll fill, then apply once.
  const toFlag = new Set<string>();      // Rule 1 results
  const toOpenRule = new Set<string>();  // Rule 2 results
  const toOpenZero = new Set<string>();  // neighbors of revealed 0s (safe)

  // Scan: neighbors of revealed 0s are safe -> open them (good for building frontier)
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = next[r][c];
      if (!cell.revealed || cell.adjacent !== 0) continue;

      for (const dr of dirs) for (const dc of dirs) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
        const n = next[nr][nc];
        if (!n.revealed && !n.flagged) toOpenZero.add(enc(nr, nc));
      }
    }
  }

  // Scan: apply the two classic rules around revealed numbers
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = next[r][c];
      if (!cell.revealed || cell.adjacent <= 0) continue;

      const hidden: Array<[number, number]> = [];
      let flagged = 0;

      for (const dr of dirs) for (const dc of dirs) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
        const n = next[nr][nc];
        if (n.flagged) flagged++;
        if (!n.revealed && !n.flagged) hidden.push([nr, nc]);
      }

      // Rule 1: all remaining hidden must be mines → flag them
      if (hidden.length === cell.adjacent - flagged && hidden.length > 0) {
        for (const [hr, hc] of hidden) toFlag.add(enc(hr, hc));
      }

      // Rule 2: all remaining hidden must be safe → open them
      if (flagged === cell.adjacent && hidden.length > 0) {
        for (const [hr, hc] of hidden) toOpenRule.add(enc(hr, hc));
      }
    }
  }

  // Apply flags first (doesn't count as the "turn" by itself)
  for (const [r, c] of Array.from(toFlag, dec)) {
    const cell = next[r][c];
    if (!cell.revealed && !cell.flagged) {
      cell.flagged = true;
      didFlag = true;
    }
  }
  if (toFlag.size > 0) {
    const placed = next.flat().filter(c => c.flagged).length;
    setFlagsLeft(Math.max(0, mines - placed));
  }

  // Helper to open exactly one cell from a set (so the AI only "clicks" once per turn)
  const openOne = (bucket: Set<string>, label: string) => {
    for (const [r, c] of Array.from(bucket, dec)) {
      const cell = next[r][c];
      if (cell.revealed || cell.flagged) continue;

      if (cell.isMine) {
        // Shouldn't happen for rule-based sets, but be safe.
        cell.revealed = true;
        setBoard(next);
        setGameOver("lost");
        revealMines();
        console.log(`Medium AI (${label}) mis-opened a mine at (${r},${c})`);
        return true;
      }

      floodFill(next, gridSize, r, c);
      didOpen = true;
      console.log(`Medium AI opened (${r},${c}) via ${label}`);
      return true;
    }
    return false;
  };

  // After flagging, new Rule 2 opens might appear. Quick pass to find one to click.
  if (!didOpen) {
    const r2 = new Set<string>();
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = next[r][c];
        if (!cell.revealed || cell.adjacent <= 0) continue;

        const hidden: Array<[number, number]> = [];
        let flagged = 0;
        for (const dr of dirs) for (const dc of dirs) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr, nc = c + dc;
          if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
          const n = next[nr][nc];
          if (n.flagged) flagged++;
          if (!n.revealed && !n.flagged) hidden.push([nr, nc]);
        }
        if (flagged === cell.adjacent && hidden.length > 0) {
          for (const [hr, hc] of hidden) r2.add(enc(hr, hc));
        }
      }
    }
    if (openOne(r2, "Rule 2 (post-flag)")) {
      setBoard(next);
      if (checkWin(next)) { setGameOver("won"); revealMines(); }
      return;
    }
  }

  // Try one rule-based or zero-neighbor open
  if (!didOpen && openOne(toOpenRule, "Rule 2")) {
    setBoard(next);
    if (checkWin(next)) { setGameOver("won"); revealMines(); }
    return;
  }
  if (!didOpen && openOne(toOpenZero, "zero-adjacent")) {
    setBoard(next);
    if (checkWin(next)) { setGameOver("won"); revealMines(); }
    return;
  }

  // If no logic move, guess a hidden, unflagged cell
  if (!didOpen) {
    const candidates: Array<[number, number]> = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = next[r][c];
        if (!cell.revealed && !cell.flagged) candidates.push([r, c]);
      }
    }

    if (candidates.length > 0) {
      const [rr, cc] = candidates[Math.floor(Math.random() * candidates.length)];
      console.log(`Medium AI random at (${rr},${cc})`);

      // Standard first-click safety
      if (!started) {
        placeMines(next, mines, { r: rr, c: cc });
        computeAdjacency(next);
        setStarted(true);
      }

      const target = next[rr][cc];
      if (target.isMine) {
        target.revealed = true;
        setBoard(next);
        setGameOver("lost");
        revealMines();
        console.log(`Medium AI random hit mine at (${rr},${cc})`);
        return;
      } else {
        floodFill(next, gridSize, rr, cc);
        didOpen = true;
      }

      setBoard(next);
      if (checkWin(next)) { setGameOver("won"); revealMines(); }
      return;
    }
  }

  // Last resort: everything left is flagged -> unflag one and open it so we finish.
  if (!didOpen) {
    const flaggedCovered: Array<[number, number]> = [];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        const cell = next[r][c];
        if (cell.flagged && !cell.revealed) flaggedCovered.push([r, c]);
      }
    }
    if (flaggedCovered.length > 0) {
      const [rr, cc] = flaggedCovered[Math.floor(Math.random() * flaggedCovered.length)];
      console.log(`Medium AI last-resort: unflag + open (${rr},${cc})`);
      next[rr][cc].flagged = false;

      const placed = next.flat().filter(c => c.flagged).length;
      setFlagsLeft(Math.max(0, mines - placed));

      const target = next[rr][cc];
      if (target.isMine) {
        target.revealed = true;
        setBoard(next);
        setGameOver("lost");
        revealMines();
        return;
      } else {
        floodFill(next, gridSize, rr, cc);
        didOpen = true;
        setBoard(next);
        if (checkWin(next)) { setGameOver("won"); revealMines(); }
        return;
      }
    }
  }

  // If we only placed flags, still commit the board (UI feedback).
  if (didFlag) {
    setBoard(next);
    if (checkWin(next)) { setGameOver("won"); revealMines(); }
  }
}


export function hardAi(ctx?: Ctx) {
    // Placeholder for hard AI logic
    console.log("Hard AI makes a move");
}

// resetHints() is called to reset the the hint count back to zero
export function resetHints() {
  hintUses = 0;
}

/**
 * Hint feature:
 * - Analyzes the current board state and plays a safe move (open or flag).
 * - Reveals a safe random cell (3 times max)
 * - Good: hint available
 * - Done: no hints left or game already won
 * - None: no safe moves available
 */
export function hint(ctx?: Ctx): "good" | "done" | "none" | void {
  if (!ctx) { 
    console.warn("hint called without ctx"); 
    return; 
  }

  // Check if hints are exhausted
  if (hintUses >= MAX_HINTS) {
    console.log("No hints remaining");
    return "done";
  }
  const {
    board, gridSize, mines, started,
    setBoard, setStarted, setGameOver,
    checkWin, revealMines
  } = ctx;

  // If game already won, no hints needed
  if (checkWin(board)) {
    console.log("Game already won, no hints needed");
    return "done";
  }
  // Collect all cells that are still hidden and not flagged.
  const next = cloneBoard(board);
  const candidates: Array<[number, number]> = [];
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = next[r][c];
      if (!cell.revealed && !cell.flagged) {
        candidates.push([r, c]);
      }
    }
  }
  if (candidates.length === 0) {
    console.log("No hidden cells left for hint");
    return "none";
  }
  
  // First click special case: place mines *after* choosing this cell
  if (!started) {
    const [r, c] = candidates[Math.floor(Math.random() * candidates.length)];
    placeMines(next, mines, { r, c });
    computeAdjacency(next);
    setStarted(true);

    floodFill(next, gridSize, r, c);
    setBoard(next);
    hintUses++;
    console.log(`Hint #${hintUses}: revealed (${r},${c})`);
    return "good";
  }
  // Filter out candidates that are mines
  const safe: Array<[number, number]> = candidates.filter(([r, c]) => !next[r][c].isMine);
  if (safe.length === 0) {
    console.log("No safe cells available for hint");
    return "none";
  }

  // Pick a random safe cell to reveal if game started
  const [rr, cc] = safe[Math.floor(Math.random() * safe.length)];
  floodFill(next, gridSize, rr, cc);
  setBoard(next);
  hintUses++;
  console.log(`Hint #${hintUses}: revealed (${rr},${cc})`);

  // After the hint, check if this wins the game.
  // If so, mark game as won, reset hints, and reveal mines.
  if (checkWin(next)) {
    setGameOver("won");
    revealMines();
    resetHints();
    console.log("Game won after hint!");
  }
}