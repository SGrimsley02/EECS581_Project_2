import type { Cell } from "@/_util/grid";

import React from "react";
import { BombIcon, FlagIcon } from "lucide-react";

interface RenderGridProps {
  gridSize: number;
  board: Cell[][];
  reveal: (r: number, c: number) => void;
  flag: (e: React.MouseEvent, r: number, c: number) => void;
}

export default function RenderGrid({ gridSize, board, reveal, flag, }: RenderGridProps) {
  const charArr = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  
  return (
    <div
      className="grid w-full h-full"
      style={{
        gridTemplateColumns: `repeat(${gridSize + 1}, 1fr)`, // +1 for row labels
        gridTemplateRows: `repeat(${gridSize + 1}, 1fr)`,    // +1 for column labels
      }}
    >
      <div data-empty-div />

      {charArr.map((c) => (
        <div key={c} className="text-center font-bold aspect-square flex items-center justify-center">
          {c}
        </div>
      ))}

      {/* rows with row headers + cells */}
      {board.map((row, r) => (
        <React.Fragment key={`row-${r}`}>
          {/* row header (1–10) */}
          <div
            key={`row-${r}-h`}
            className="text-center font-bold aspect-square flex items-center justify-center"
          >
            {r + 1}
          </div>

          {/* row cells */}
          {row.map((cell, c) => (
            <div
            key={`${r}-${c}`}
            onClick={() => reveal(r, c)}
            onContextMenu={(e) => flag(e, r, c)}
            className="flex items-center justify-center select-none cursor-pointer aspect-square font-bold border border-gray-300"
            style={{
              background: cell.revealed ? "black" : "white",
              color: cell.revealed ? "white" : "inherit", // <— add this
            }}
          >
            {cell.revealed
              ? (cell.isMine && <BombIcon color="red" />) || (cell.adjacent > 0 && cell.adjacent)
              : (cell.flagged && <FlagIcon color="var(--color-sky-700)" />)}
          </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}