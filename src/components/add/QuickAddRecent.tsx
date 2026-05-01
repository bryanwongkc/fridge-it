import type { HouseholdProduct } from "../../types/product";
import { EmptyState } from "../common/EmptyState";

export function QuickAddRecent({
  products,
  onSelect,
}: {
  products: HouseholdProduct[];
  onSelect: (product: HouseholdProduct, sourceLabel: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-black text-kitchen-ink">Quick Add Recent Item</h2>
      {products.length ? (
        <div className="grid grid-cols-2 gap-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product, "Your library")}
              className="min-h-20 rounded-2xl bg-white p-3 text-left shadow-soft ring-1 ring-black/5 transition active:scale-[0.99]"
            >
              <p className="line-clamp-2 text-sm font-bold text-kitchen-ink">{product.name}</p>
              <p className="mt-1 text-xs text-kitchen-muted">
                {product.defaultLocation} · used {product.useCount}x
              </p>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState title="No recent products yet." body="Create one once and it will show here." />
      )}
    </section>
  );
}
