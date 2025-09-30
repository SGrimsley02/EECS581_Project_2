import type { Cell } from "@/_util/grid";
import {
  cloneBoard,
  floodFill,
  placeMines,
  computeAdjacency,
} from "@/_util/grid";

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

/**
 * Easy AI (one move):
 * - Picks a random hidden, unflagged cell and opens it.
 * - If it’s the very first move, it also triggers mine placement (first-click safety).
 * - If it hits a mine, it immediately loses.
 * - Otherwise it flood-fills like the player would.
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