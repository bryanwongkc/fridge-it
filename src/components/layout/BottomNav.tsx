import { ClipboardList, Home, PlusCircle, ShieldCheck, ShoppingBasket } from "lucide-react";
import type { Tab } from "../../App";

const baseTabs: Array<{ id: Tab; label: string; Icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", Icon: Home },
  { id: "add", label: "Add", Icon: PlusCircle },
  { id: "inventory", label: "Inventory", Icon: ClipboardList },
  { id: "shopping", label: "Shopping", Icon: ShoppingBasket },
];

export function BottomNav({
  activeTab,
  onChange,
  adminMode,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  adminMode: boolean;
}) {
  const tabs = adminMode
    ? [...baseTabs, { id: "admin" as Tab, label: "Admin", Icon: ShieldCheck }]
    : baseTabs;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur">
      <div
        className="mx-auto grid max-w-md gap-1"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-semibold transition ${
                active ? "bg-emerald-50 text-kitchen-green" : "text-slate-500"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.7 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
