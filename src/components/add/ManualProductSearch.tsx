import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { searchProducts } from "../../services/productLookup";
import type { HouseholdProduct } from "../../types/product";
import { normalizeText } from "../../utils/normalize";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";

export function ManualProductSearch({
  personalProducts,
  onSelect,
  onCreate,
}: {
  personalProducts: HouseholdProduct[];
  onSelect: (product: HouseholdProduct, sourceLabel: string) => void;
  onCreate: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchProducts(personalProducts, query),
    [personalProducts, query],
  );
  const exactPersonal = results.personal.some(
    (product) => product.normalizedName === normalizeText(query),
  );

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-kitchen-ink">Search or add product</h1>
        <p className="text-sm text-kitchen-muted">Start with the food name.</p>
      </div>
      <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-kitchen-line bg-white px-4 focus-within:border-kitchen-green">
        <Search size={18} className="text-kitchen-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your products"
          className="min-w-0 flex-1 outline-none"
          autoFocus
        />
      </div>

      {query.trim() ? (
        <div className="space-y-5">
          <ResultGroup title="From your library">
            {results.personal.map((product) => (
              <ResultButton
                key={product.id}
                title={product.name}
                subtitle={`${product.defaultLocation} - ${product.defaultUnit || "unit"}`}
                onClick={() => onSelect(product, "Your library")}
              />
            ))}
          </ResultGroup>
          {!exactPersonal ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => onCreate(query)}
              className="w-full justify-start"
            >
              Create "{query.trim()}"
            </Button>
          ) : null}
          {!results.personal.length ? (
            <EmptyState
              title="No product found."
              body="Create it manually once and we will remember it."
            />
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}

function ResultGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-kitchen-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ResultButton({
  title,
  subtitle,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-slate-50 px-4 text-left transition active:scale-[0.99] disabled:opacity-50"
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold text-kitchen-ink">{title}</span>
        <span className="block truncate text-xs text-kitchen-muted">{subtitle}</span>
      </span>
      <span className="text-sm font-bold text-kitchen-green">Select</span>
    </button>
  );
}
