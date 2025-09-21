interface RenderModalProps {
  state: string | null;
  close: () => void;
}

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
          style={{
            color: state === "won" ? "var(--color-green-500)" : "var(--color-red-800)",
          }}
        >
          You {state || ""}!
        </h1>
      </div>
    </div>
  );
}

