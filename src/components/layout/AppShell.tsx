import { BookOpen, HomeIcon, LogOut, Settings } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import { HouseholdSwitcher } from "../household/HouseholdSwitcher";
import { BottomNav } from "./BottomNav";
import { useActiveHousehold } from "../../hooks/useActiveHousehold";
import { useAuth } from "../../hooks/useAuth";
import { APP_NAME } from "../../utils/constants";

export function AppShell() {
  const { activeHousehold } = useActiveHousehold();
  const { signOutUser } = useAuth();

  return (
    <div className="min-h-screen bg-cream pb-32">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/dashboard" className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">
              {APP_NAME}
            </p>
            <p className="truncate text-sm text-stone-500">Household food memory</p>
          </Link>
          <HouseholdSwitcher />
        </div>
        <div
          className="no-scrollbar mx-auto flex max-w-xl items-center gap-2 overflow-x-auto px-4 pb-3"
          aria-label="Secondary navigation"
        >
          <Link
            to="/households"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-700 ring-1 ring-stone-200"
          >
            <HomeIcon className="h-3.5 w-3.5" />
            Households
          </Link>
          <Link
            to="/library"
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-700 ring-1 ring-stone-200"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Library
          </Link>
          {activeHousehold ? (
            <Link
              to={`/households/${activeHousehold.id}/settings`}
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-semibold text-stone-700 ring-1 ring-stone-200"
            >
              <Settings className="h-3.5 w-3.5" />
              Settings
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void signOutUser()}
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-semibold text-stone-500"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 pb-8 pt-5">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
