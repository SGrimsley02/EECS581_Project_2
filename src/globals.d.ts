declare global {
  type CellObject = {
    isCovered: boolean;
    hasBomb: boolean;
    bombsInProximity: number;
  }
}

export {}
