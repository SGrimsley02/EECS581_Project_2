/**
 * File: src/app/RenderSquare.tsx
 * Module: User Interface – Single Square (aux/demo component)
 * Brief: Presentational square with a local “covered” state and a bomb icon if the
 *        provided Cell is a mine. Does not mutate the canonical board state.
 *
 * Inputs (props):
 *   - cell: Cell  // model for this square (isMine, revealed, flagged, adjacent, etc.)
 *
 * Outputs:
 *   - Visual square; toggles local covered state on click (for demo-only rendering).
 *
 * Side Effects:
 *   - Maintains local React state (`isCovered`) – this is not synchronized with the main grid.
 *
 * External Sources / Attribution:
 *   - None; 
 *
 * EECS 581 – Project 1 Compliance Notes:
 *   - This component is purely presentational and **does not** enforce gameplay rules
 *     (first-click safety, flood-reveal, flags block uncover). In the main app,
 *     interactions are handled by the parent grid/page components.
 *
 
 * Creation Date: 2025-09-09
 * Course: EECS 581 (Software Engineering II), Prof. Hossein Saiedian – Fall 2025
 */

import { Bomb } from "lucide-react";
import { Cell } from "@/_util/grid";
import { useState } from "react";

interface RenderSquareProps {
  cell: Cell;
};

// [Original] Presentational square with local "covered" state.
export default function RenderSquare({ cell }: RenderSquareProps) {
  // [Original] Local demo state; currently defaulting to "uncovered" (false).
  const [isCovered, setIsCovered] = useState(false);

  return (
    <div 
      // [Original] Simple click-to-uncover interaction (local only).
      onClick={() => setIsCovered(false)}
      className={`flex place-content-center aspect-square border b-white hover:opacity-70 ${isCovered ? 'bg-white' : 'bg-none'}`}
    >
      {/* [Original] Show a bomb icon if this cell is a mine. */}
      {cell.isMine && <Bomb color="white" />}
    </div>
  );
}
