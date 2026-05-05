import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckSquare, ShoppingBasket, Square } from "lucide-react";
import { BuySoonItemCard } from "../components/buySoon/BuySoonItemCard";
import { EmptyState } from "../components/layout/EmptyState";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useBuySoon } from "../hooks/useBuySoon";
import { useGroceryList } from "../hooks/useGroceryList";

export function BuySoonPage() {
  const { buySoonItems, loading } = useBuySoon();
  const { addBuySoonItems } = useGroceryList();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedItems = useMemo(
    () => buySoonItems.filter((item) => selectedIds.has(item.templateId)),
    [buySoonItems, selectedIds],
  );

  function toggle(templateId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  }

  async function addSelected() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const added = await addBuySoonItems(selectedItems);
      setSelectedIds(new Set());
      setMessage(added ? `Added ${added} item${added === 1 ? "" : "s"} to Grocery.` : "Those items are already on Grocery.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add to grocery.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-moss">Buy Soon</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Low stock reminders</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Generated from desired stock rules in your household library.
        </p>
      </header>

      {message ? <p className="rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-moss">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {buySoonItems.length === 0 ? (
        <EmptyState
          title="Nothing needs buying soon"
          description="Set desired stock rules in Library when you want reminders for regular items."
          action={
            <Link
              to="/library"
              className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
            >
              <BookOpen className="h-4 w-4" />
              Open Library
            </Link>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set(buySoonItems.map((item) => item.templateId)))}
              className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
            >
              <CheckSquare className="h-4 w-4" />
              Select all
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="tap-target inline-flex items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-stone-600 ring-1 ring-stone-200"
            >
              <Square className="h-4 w-4" />
              Clear
            </button>
          </div>

          <section className="space-y-3">
            {buySoonItems.map((item) => (
              <BuySoonItemCard
                key={item.templateId}
                item={item}
                selected={selectedIds.has(item.templateId)}
                onToggle={toggle}
              />
            ))}
          </section>

          <button
            type="button"
            onClick={() => void addSelected()}
            disabled={busy || selectedItems.length === 0}
            className="tap-target sticky bottom-28 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-soft disabled:opacity-60"
          >
            <ShoppingBasket className="h-4 w-4" />
            {selectedItems.length > 0 ? "Add selected to Grocery" : "Select items to add"}
          </button>
        </>
      )}
    </div>
  );
}
