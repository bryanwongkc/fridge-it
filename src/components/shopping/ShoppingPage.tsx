import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { addShoppingItem, deleteShoppingItem, updateShoppingItem } from "../../services/shoppingService";
import type { InventoryItem } from "../../types/inventory";
import type { ShoppingItem } from "../../types/shopping";
import { relativeExpiryLabel } from "../../utils/dates";
import { normalizeText } from "../../utils/normalize";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { ShoppingItemRow } from "./ShoppingItemRow";

export function ShoppingPage({
  householdId,
  activeInventory,
  active,
  checked,
}: {
  householdId: string;
  activeInventory: InventoryItem[];
  active: ShoppingItem[];
  checked: ShoppingItem[];
}) {
  const [name, setName] = useState("");
  const [showChecked, setShowChecked] = useState(false);
  const [warningItems, setWarningItems] = useState<InventoryItem[]>([]);

  const matchingInventory = useMemo(() => {
    const normalized = normalizeText(name);
    if (!normalized) return [];
    return activeInventory.filter((item) => item.normalizedName === normalized);
  }, [activeInventory, name]);

  const addItem = async (force = false) => {
    if (!name.trim()) return;
    if (matchingInventory.length && !force) {
      setWarningItems(matchingInventory);
      return;
    }
    await addShoppingItem(householdId, { name, source: "manual" });
    setName("");
    setWarningItems([]);
  };

  return (
    <section className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-black text-kitchen-ink">Shopping</h1>
        <p className="text-sm text-kitchen-muted">Keep replacement needs out of your head.</p>
      </div>
      <div className="rounded-2xl bg-white p-3 shadow-soft">
        <div className="flex min-h-12 items-center gap-2 rounded-2xl bg-slate-50 px-3">
          <Search size={18} className="text-kitchen-muted" />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Add shopping item"
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
          <Button
            type="button"
            disabled={!name.trim()}
            onClick={() => void addItem()}
            icon={<Plus size={16} />}
            className="min-h-10 px-3"
          >
            Add
          </Button>
        </div>
        {warningItems.length ? (
          <div className="mt-3 rounded-2xl bg-amber-50 p-3">
            <p className="text-sm font-bold text-amber-800">You already have this at home.</p>
            <div className="mt-2 space-y-1">
              {warningItems.map((item) => (
                <p key={item.id} className="text-xs text-amber-800">
                  {item.name} · {item.quantity} {item.unit} ·{" "}
                  {relativeExpiryLabel(item.expiryDate, item.hasNoExpiry)}
                </p>
              ))}
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 min-h-10 bg-white"
              onClick={() => void addItem(true)}
            >
              Add anyway
            </Button>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        {active.length ? (
          active.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              onToggle={(next) =>
                void updateShoppingItem(householdId, next.id, { checked: !next.checked })
              }
              onDelete={(next) => void deleteShoppingItem(householdId, next.id)}
            />
          ))
        ) : (
          <EmptyState title="Shopping list is clear." />
        )}
      </div>

      {checked.length ? (
        <div>
          <button
            type="button"
            onClick={() => setShowChecked((value) => !value)}
            className="text-sm font-bold text-kitchen-green"
          >
            {showChecked ? "Hide" : "Show"} checked items ({checked.length})
          </button>
          {showChecked ? (
            <div className="mt-3 space-y-3">
              {checked.map((item) => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  onToggle={(next) =>
                    void updateShoppingItem(householdId, next.id, { checked: !next.checked })
                  }
                  onDelete={(next) => void deleteShoppingItem(householdId, next.id)}
                />
              ))}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => checked.forEach((item) => void deleteShoppingItem(householdId, item.id))}
              >
                Clear checked
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
