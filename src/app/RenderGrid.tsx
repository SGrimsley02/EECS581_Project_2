/**
 * File: src/app/RenderGrid.tsx
 * Module: User Interface – Grid Renderer
 * Brief: Renders the labeled Minesweeper grid (columns A–J, rows 1–10 for gridSize=10),
 *        and forwards cell interactions (left-click reveal, right-click flag) to parent handlers.
 *
 * Inputs (props):
 *   - gridSize: number                                 // grid dimension (EECS 581 spec: 10)
 *   - board: Cell[][]                                  // canonical board model for rendering
 *   - reveal(r: number, c: number): void               // left-click handler (uncover delegated upstream)
 *   - flag(e: React.MouseEvent, r: number, c: number)  // right-click handler (toggle flag upstream)
 *
 * Outputs:
 *   - Presentational grid with labeled headers; per-cell content (blank/number/mine/flag)
 *   - Emits user events via provided handlers; does not mutate board internally
 *
 * Side Effects:
 *   - None within this component (purely presentational + event forwarding)
 *
 * External Sources / Attribution:
 *   - None; 
 *
 * EECS 581 – Project 1 Compliance Notes:
 *   - Displays a 10×10 grid with headers A–J and 1–10 when gridSize=10.
 *   - Shows covered/uncovered/flagged states and mine icon when revealed.
 *   - Interactions: left-click reveal; right-click flag (flag logic enforced upstream).
 *   - Remaining flags and game status are managed by parent components.
 *

 * Creation Date: 2025-09-16
 * Course: EECS 581 (Software Engineering II), Prof. Hossein Saiedian – Fall 2025
 */

import type { Cell } from "@/_util/grid";
import React from "react";
import { BombIcon, FlagIcon } from "lucide-react";

interface RenderGridProps {
  gridSize: number;
  board: Cell[][];
  reveal: (r: number, c: number) => void;
  flag: (e: React.MouseEvent, r: number, c: number) => void;
}

// [Original] Presentational grid that renders headers and cells; game rules live upstream.
export default function RenderGrid({ gridSize, board, reveal, flag }: RenderGridProps) {
  // [Original] Build column labels A.. based on gridSize (A–J for 10).
  const charArr = Array.from({ length: gridSize }, (_, i) => String.fromCharCode(65 + i));
  
  return (
    <div
      className="grid w-full h-full"
      // [Original] Reserve an extra row & column for header labels.
      style={{
        gridTemplateColumns: `repeat(${gridSize + 1}, 1fr)`, // +1 for row labels
        gridTemplateRows: `repeat(${gridSize + 1}, 1fr)`,    // +1 for column labels
      }}
    >
      {/* [Original] Top-left empty corner between row/column headers. */}
      <div data-empty-div />

      {/* [Original] Column headers: A–J (or up to gridSize). */}
      {charArr.map((c) => (
        <div key={c} className="text-center aspect-square flex items-center justify-center">
          {c}
        </div>
      ))}

      {/* [Original] For each board row: render row header (1–10) followed by its cells. */}
      {board.map((row, r) => (
        <React.Fragment key={`row-${r}`}>
          {/* [Original] Row header: numeric label (1-based). */}
          <div
            key={`row-${r}-h`}
            className="text-center aspect-square flex items-center justify-center"
          >
            {r + 1}
          </div>

          {/* [Original] Row cells with click/flag handlers; purely visual decisions here. */}
          {row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              onClick={() => reveal(r, c)}                 // left-click reveal
              onContextMenu={(e) => flag(e, r, c)}        // right-click flag
              className="flex items-center justify-center select-none cursor-pointer aspect-square border border-gray-300"
              // [Original] Simple state-driven styles; parent owns logic/state transitions.
              style={{
                background: cell.revealed ? "black" : "white",
                color: cell.revealed ? "white" : "inherit", // ensure numbers are visible on dark bg
              }}
            >
              {cell.revealed
                // [Original] Revealed: show mine icon if mined, otherwise show number if > 0.
                ? (cell.isMine && <BombIcon color="red" />) || (cell.adjacent > 0 && cell.adjacent)
                // [Original] Covered: show flag icon if flagged; otherwise blank.
                : (cell.flagged && <FlagIcon color="var(--color-sky-700)" />)}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
