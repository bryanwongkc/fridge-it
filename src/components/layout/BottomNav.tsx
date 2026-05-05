import { ClipboardList, Home, PlusCircle, Search, ShoppingBasket } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useBuySoon } from "../../hooks/useBuySoon";
import { useGroceryList } from "../../hooks/useGroceryList";
import { useInventory } from "../../hooks/useInventory";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: Home },
  { to: "/inventory", label: "Inventory", icon: Search },
  { to: "/add", label: "Add", icon: PlusCircle },
  { to: "/buy-soon", label: "Buy Soon", icon: ClipboardList },
  { to: "/grocery", label: "Grocery", icon: ShoppingBasket },
];

export function BottomNav() {
  const { counts } = useInventory();
  const { count: buySoonCount } = useBuySoon();
  const { uncheckedCount } = useGroceryList();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-cream/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 backdrop-blur"
      aria-label="Primary navigation"
    >
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {navItems.map(({ to, label, icon: Icon }) => {
          const badgeCount =
            to === "/dashboard"
              ? counts.expired
              : to === "/inventory"
                ? counts.expired
                : to === "/buy-soon"
                  ? buySoonCount
                  : to === "/grocery"
                  ? uncheckedCount
                  : 0;
          const badgeClass =
            to === "/buy-soon"
              ? "bg-amber-600"
              : to === "/grocery"
                ? "bg-moss"
                : "bg-red-600";

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "tap-target flex flex-col items-center justify-center rounded-xl px-1 text-[0.68rem] font-semibold transition",
                  isActive ? "bg-sage text-moss" : "text-stone-500 hover:bg-white",
                ].join(" ")
              }
            >
              <span className="relative">
                <Icon className="mb-1 h-5 w-5" aria-hidden="true" />
                {badgeCount > 0 ? (
                  <span
                    className={[
                      "absolute -right-2 -top-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[0.62rem] font-bold leading-none text-white",
                      badgeClass,
                    ].join(" ")}
                  >
                    {badgeCount > 9 ? "9+" : badgeCount}
                  </span>
                ) : null}
              </span>
              <span className="leading-tight">{label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
