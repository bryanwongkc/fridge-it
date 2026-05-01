import { Settings2 } from "lucide-react";

export function Header({
  householdId,
  adminMode,
  onToggleAdmin,
  onChangeHousehold,
}: {
  householdId: string;
  adminMode: boolean;
  onToggleAdmin: (value: boolean) => void;
  onChangeHousehold: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 bg-kitchen-bg/90 px-4 pb-3 pt-4 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-kitchen-muted">
            Fridge Control
          </p>
          <button
            type="button"
            onClick={onChangeHousehold}
            className="mt-0.5 text-left text-xl font-black text-kitchen-ink"
          >
            {householdId}
          </button>
        </div>
        <button
          type="button"
          onClick={() => onToggleAdmin(!adminMode)}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ring-kitchen-line ${
            adminMode ? "bg-kitchen-green text-white" : "bg-white text-kitchen-ink"
          }`}
          aria-label="Toggle admin mode"
        >
          <Settings2 size={20} />
        </button>
      </div>
    </header>
  );
}
