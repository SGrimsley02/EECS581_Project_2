'use client'

import { useState } from 'react';
import { initializeGrid } from '@/_util/grid';
import RenderSquare from "./RenderSquare";

const GRID_SIZE = 10;

export default function Home() {
  const [grid, setGrid] = useState<CellObject[][]>(initializeGrid(GRID_SIZE, GRID_SIZE));

  return (
    <div className="flex place-content-center w-full h-full">
      <div className={`grid grid-rows-10 grid-cols-10 w-1/2`}>
        {grid.flat().map((cellObj, index) => (<RenderSquare key={index} cell={cellObj} />))}
      </div>
    </div>
  );
}
