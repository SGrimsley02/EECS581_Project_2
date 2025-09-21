'use client'

import type { Cell } from "@/_util/grid"

import React, { useEffect, useState } from 'react';
import { FlagIcon, TimerIcon } from "lucide-react";


import RenderModal from "./RenderModal"
import RenderGrid from "./RenderGrid";
import {
  createEmptyBoard,
  placeMines,
  cloneBoard,
  floodFill,
  computeAdjacency,
} from '@/_util/grid';

const GRID_SIZE = 10;

export default function MinesweeperPage() {
  const [mines, setMines] = useState(15);

  const [board, setBoard] = useState<Cell[][]>(() => createEmptyBoard(GRID_SIZE, GRID_SIZE));
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState<null | 'lost' | 'won'>(null);
  const [flagsLeft, setFlagsLeft] = useState(mines);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mines]);

  // Update the counter
  useEffect(() => {
    let t: number | undefined;
    if (started && !gameOver) {
      t = window.setInterval(() => setSeconds(s => s + 1), 1000);
    }
    return () => { if (t) clearInterval(t); };
  }, [started, gameOver]);

  function revealMines(): void {
    setBoard(b => b.map(row => row.map(c0 => c0.isMine ? { ...c0, revealed: true } : c0)));
  }

  function checkWin(board: Cell[][]): boolean {
    return board.every(rw =>
      rw.every(cell => (cell.isMine ? !cell.revealed : cell.revealed))
    )
  }

  function reset() {
    setBoard(createEmptyBoard(GRID_SIZE, GRID_SIZE));
    setStarted(false);
    setGameOver(null);
    setFlagsLeft(mines);
    setSeconds(0);
  }


  function revealCell(r: number, c: number) {
    if (gameOver) return;

    let newBoard = cloneBoard(board); // Clone the board not to trigger state changes

    if (!started) {
      // create a brand new board, safe around first click
      const freshBoard = createEmptyBoard(GRID_SIZE, GRID_SIZE);
      placeMines(freshBoard, mines, { r, c });
      computeAdjacency(freshBoard);
      newBoard = cloneBoard(freshBoard);
      setBoard(newBoard);
      setStarted(true);
    }

    const cell = newBoard[r][c];
    if (cell.revealed || cell.flagged) return;

    if (cell.isMine) {
      setGameOver("lost");
      revealMines();
      return;
    }

    floodFill(newBoard, GRID_SIZE, r, c);
    setBoard(newBoard);

    if (checkWin(newBoard)) {
      setGameOver("won");
      revealMines();
    }
  }


  function toggleFlag(e: React.MouseEvent, r: number, c: number) {
    e.preventDefault();
    if (gameOver) return;
    const newBoard = cloneBoard(board);
    const cell = newBoard[r][c];
    if (cell.revealed) return;
    if (!cell.flagged && flagsLeft === 0) return; // no flags left
    cell.flagged = !cell.flagged;
    setFlagsLeft(fl => fl + (cell.flagged ? -1 : 1) * -1); // adjust
    // simpler: recalc flags
    const remaining = mines - newBoard.flat().filter(c0 => c0.flagged).length;
    setFlagsLeft(remaining);
    setBoard(newBoard);

    // check win quickly: all mines flagged and other cells revealed
    if (checkWin(newBoard)) {
      setGameOver("won");
      revealMines();
    }
  }

  return (
    <div 
      className="w-7/12 m-auto"
    >
      <div className="flex gap-5 place-content-center mt-10">
        <label className="border-2 border-white rounded-md p-2" >Mines
          <input 
            type="number"
            value={mines} 
            min={10} 
            max={20} 
            onChange={e => setMines(Math.max(10, Math.min(20, Number(e.target.value) || 10)))} 
            className='px-2 mx-2'
          />
        </label>

        <button 
          onClick={reset}
          className='cursor-pointer border-2 border-white rounded-md p-2 text-white hover:opacity-70'
        >
          Reset
        </button>

        <div className="ml-auto flex gap-5 items-center border-2 border-white rounded-md p-2">
          <span className="flex items-center gap-1">
            <TimerIcon color="white"/>
            {seconds}s
          </span>
          <span className="flex items-center gap-1">
            <FlagIcon color="var(--color-sky-700)"/>
            {flagsLeft}
          </span>
        </div>
      </div>

      <div className="mt-10 relative">
        <RenderGrid
          board={board}
          gridSize={GRID_SIZE}
          reveal={revealCell}
          flag={toggleFlag}
        />
        {gameOver && <RenderModal state={gameOver} close={() => reset()}/>}
      </div>
    </div>
  );
}


