import { Bomb } from "lucide-react";
import { useState } from "react";

interface RenderSquareProps {
  cell: CellObject;
};

export default function RenderSquare({ cell }:RenderSquareProps) {
  // const [isCovered, setIsCovered] = useState(true);
  const [isCovered, setIsCovered] = useState(false);

  return (
    <div 
      onClick={() => setIsCovered(false)}
      className={`flex place-content-center aspect-square border b-white hover:opacity-70 ${isCovered ? 'bg-white' : 'bg-none'}`}
    >
      {cell.hasBomb && <Bomb color="white" />}
    </div>
  );
}
