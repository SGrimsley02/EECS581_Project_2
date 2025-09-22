/**
 * File: src/app/RenderModal.tsx
 * Module: User Interface – End-of-Game Modal
 * Brief: Full-screen overlay that displays the game result (“won” | “lost”)
 *        and dismisses when the user clicks anywhere on the overlay.
 *
 * Inputs (props):
 *   - state: string | null   // expected values: "won" | "lost" | null
 *   - close: () => void      // callback invoked to close the modal (reset handled upstream)
 *
 * Outputs:
 *   - A presentational overlay with a status headline; emits onClick via `close`.
 *
 * Side Effects:
 *   - None inside this component; it delegates closing to the parent through `close()`.
 *
 * External Sources / Attribution:
 *   - None; 
 *
 * EECS 581 – Project 1 Compliance Notes:
 *   - Provides the required status indicator (“Victory”/“Game Over: Loss”) visually.
 *   - Gameplay logic (win/loss detection, reset) is managed by parent components.
 *

 * Creation Date: 2025-09-16
 * Course: EECS 581 (Software Engineering II), Prof. Hossein Saiedian – Fall 2025
 */

interface RenderModalProps {
  state: string | null;
  close: () => void;
}

// [Original] Full-screen modal overlay; clicking anywhere dismisses it.
export default function RenderModal({ state, close }: RenderModalProps) {
  return (
    <div
      className="absolute top-0 bottom-0 left-0 right-0 z-10 bg-black/60 flex place-content-center flex-wrap"
      onClick={close}
    >
      <div
        className="border-2 border-white rounded-md p-10 flex place-content-center flex-wrap bg-black"
      >
        <h1
          className="text-4xl"
          // [Original] Color-code text by outcome; green for "won", red for "lost"/others.
          style={{
            color: state === "won" ? "var(--color-green-500)" : "var(--color-red-800)",
          }}
        >
          {/* [Original] Simple headline; guard against null to avoid "You null!" */}
          You {state || ""}!
        </h1>
      </div>
    </div>
  );
}

