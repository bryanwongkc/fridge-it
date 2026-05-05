import { useState } from "react";
import { Plus } from "lucide-react";
import { GroceryItemCard } from "../components/grocery/GroceryItemCard";
import { EmptyState } from "../components/layout/EmptyState";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useGroceryList } from "../hooks/useGroceryList";

export function GroceryPage() {
  const {
    uncheckedItems,
    checkedItems,
    loading,
    addManualItem,
    setChecked,
    deleteItem,
  } = useGroceryList();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) {
      return;
    }
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const id = await addManualItem({ name });
      setName("");
      setMessage(id ? "Added to Grocery." : "That item is already on Grocery.");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not add grocery item.");
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
        <p className="text-sm font-semibold text-moss">Grocery</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">Shopping list</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Add manually or send items here from Buy Soon.
        </p>
      </header>

      <section className="rounded-2xl border border-stone-200 bg-white/90 p-4 shadow-soft">
        <h2 className="text-base font-bold text-ink">Add grocery item</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleAdd();
              }
            }}
            placeholder="Bananas, rice, milk"
            aria-label="Grocery item name"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={busy || !name.trim()}
            className="tap-target inline-flex items-center justify-center rounded-2xl bg-moss px-4 text-white disabled:opacity-60"
            aria-label="Add grocery item"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </section>

      {message ? <p className="rounded-2xl bg-sage px-4 py-3 text-sm font-semibold text-moss">{message}</p> : null}
      {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {uncheckedItems.length === 0 && checkedItems.length === 0 ? (
        <EmptyState
          title="Your grocery list is empty"
          description="Items you add from Buy Soon will appear here."
        />
      ) : (
        <section className="space-y-5">
          {uncheckedItems.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-ink">To buy</h2>
              {uncheckedItems.map((item) => (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  onCheckedChange={setChecked}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          ) : null}

          {checkedItems.length > 0 ? (
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-stone-500">Bought</h2>
              {checkedItems.map((item) => (
                <GroceryItemCard
                  key={item.id}
                  item={item}
                  onCheckedChange={setChecked}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          ) : null}
        </section>
      )}
    </div>
  );
}
