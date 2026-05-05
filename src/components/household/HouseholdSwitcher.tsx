import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { useActiveHousehold } from "../../hooks/useActiveHousehold";

export function HouseholdSwitcher() {
  const { activeHousehold } = useActiveHousehold();

  return (
    <Link
      to="/households"
      className="tap-target inline-flex max-w-[12rem] items-center gap-2 rounded-full bg-white px-3 text-sm font-semibold text-ink shadow-sm ring-1 ring-stone-200"
    >
      <span className="truncate">{activeHousehold?.name ?? "Choose household"}</span>
      <ChevronDown className="h-4 w-4 shrink-0 text-stone-500" aria-hidden="true" />
    </Link>
  );
}
