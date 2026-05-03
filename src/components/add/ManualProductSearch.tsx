import { Search } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { searchProducts } from "../../services/productLookup";
import { createPersonalProductFromPublic } from "../../services/productsService";
import type { HouseholdProduct, PublicProduct } from "../../types/product";
import { friendlyErrorMessage } from "../../utils/friendlyErrors";
import { normalizeText } from "../../utils/normalize";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { EmptyState } from "../common/EmptyState";
import { Notice } from "../common/Notice";

export function ManualProductSearch({
  householdId,
  userId,
  personalProducts,
  publicProducts,
  onSelect,
  onCreate,
}: {
  householdId: string;
  userId: string | null;
  personalProducts: HouseholdProduct[];
  publicProducts: PublicProduct[];
  onSelect: (product: HouseholdProduct, sourceLabel: string) => void;
  onCreate: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const results = useMemo(
    () => searchProducts(personalProducts, publicProducts, query),
    [personalProducts, publicProducts, query],
  );
  const exactPersonal = results.personal.some(
    (product) => product.normalizedName === normalizeText(query),
  );

  const selectPublic = async (product: PublicProduct) => {
    setLinkingId(product.id);
    setError(null);
    try {
      const personal = await createPersonalProductFromPublic(householdId, product, userId);
      onSelect(personal, "Public library");
    } catch (err) {
      console.error("Public product selection failed", err);
      setError(friendlyErrorMessage(err, "product"));
    } finally {
      setLinkingId(null);
    }
  };

  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-xl font-black text-kitchen-ink">Search or add product</h1>
        <p className="text-sm text-kitchen-muted">Start with the food name.</p>
      </div>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <div className="flex min-h-12 items-center gap-2 rounded-2xl border border-kitchen-line bg-white px-4 focus-within:border-kitchen-green">
        <Search size={18} className="text-kitchen-muted" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search product name"
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
                subtitle={`${product.defaultLocation} · ${product.defaultUnit || "unit"}`}
                onClick={() => onSelect(product, "Your library")}
              />
            ))}
          </ResultGroup>
          <ResultGroup title="From public library">
            {results.publicProducts.map((product) => (
              <ResultButton
                key={product.id}
                title={product.name}
                subtitle={`${product.brand || "Verified"} · ${product.defaultLocation}`}
                disabled={linkingId === product.id}
                onClick={() => void selectPublic(product)}
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
              Create “{query.trim()}”
            </Button>
          ) : null}
          {!results.personal.length && !results.publicProducts.length ? (
            <EmptyState title="No product found." body="Create it once and we’ll remember it." />
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
