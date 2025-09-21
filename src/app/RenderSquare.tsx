import { Bomb } from "lucide-react";
import { Cell } from "@/_util/grid";
import { useState } from "react";

interface RenderSquareProps {
  cell: Cell;
};

export default function RenderSquare({ cell }:RenderSquareProps) {
  // const [isCovered, setIsCovered] = useState(true);
  const [isCovered, setIsCovered] = useState(false);

  return (
    <div 
      onClick={() => setIsCovered(false)}
      className={`flex place-content-center aspect-square border b-white hover:opacity-70 ${isCovered ? 'bg-white' : 'bg-none'}`}
    >
      {cell.isMine && <Bomb color="white" />}
    </div>
  );
}
