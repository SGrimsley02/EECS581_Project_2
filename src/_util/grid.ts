export type Cell = {
  row: number;
  col: number;
  isMine: boolean;
  adjacent: number;
  revealed: boolean;
  flagged: boolean;
};

export function createEmptyBoard(rows: number, cols: number): Cell[][] {
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => ({
      row: r,
      col: c,
      isMine: false,
      adjacent: 0,
      revealed: false,
      flagged: false,
    }))
  );
}

export function placeMines(board: Cell[][], mines: number, exclude: { r: number; c: number }) {
  const rows = board.length;
  const cols = board[0].length;
  let placed = 0;
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    // avoid placing on the excluded cell and its neighbors
    if (Math.abs(r - exclude.r) <= 1 && Math.abs(c - exclude.c) <= 1) continue;
    const cell = board[r][c];
    if (!cell.isMine) {
      cell.isMine = true;
      placed++;
    }
  }
}

export function computeAdjacency(board: Cell[][]) {
  const rows = board.length;
  const cols = board[0].length;
  const dirs = [-1, 0, 1];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) {
        board[r][c].adjacent = -1;
        continue;
      }
      let count = 0;
      for (const dr of dirs) for (const dc of dirs) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          if (board[nr][nc].isMine) count++;
        }
      }
      board[r][c].adjacent = count;
    }
  }
}

/**
 * Use BFS to reveal as many adjacent cells as possible
  */
export function floodFill(board: Cell[][], size: number, row: number, col: number) {
  const stack = [[row, col]];
  while (stack.length > 0) {
    const [rr, cc] = stack.pop()!;
    const cur = board[rr][cc];
    if (cur.revealed || cur.flagged) continue;
    cur.revealed = true;
    if (cur.adjacent === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue; // Skip the current cell
          const nr = rr + dr;
          const nc = cc + dc;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const neigh = board[nr][nc];
            if (!neigh.revealed && !neigh.isMine) {
              stack.push([nr, nc]);
            }
          }
        }
      }
    }
  }
}

export function cloneBoard(board: Cell[][]) {
  return board.map(row => row.map(cell => ({ ...cell })));
}

