function chance(percent: number): boolean {
  if (percent <= 0) return false;
  if (percent >= 1) return true;
  return Math.random() < percent;
}

export function initializeGrid(rows: number, cols: number) {
  const grid = [];
  for (let i = 0; i < rows; i++) {
    let tempRow = [];
    for (let j = 0; j < cols; j++) {
      const newCell = {
        isCovered: true,
        hasBomb: chance(0.38), // Make this random
        bombsInProximity: 0, // Calculate this after grid has been made
      } as CellObject;
      tempRow.push(newCell);
    }
    grid.push(tempRow);
    tempRow = [];
  }

  return grid;
}

