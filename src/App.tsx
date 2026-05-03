import { useEffect, useState } from "react";
import { AddStock } from "./components/add/AddStock";
import { AdminReviewPage } from "./components/admin/AdminReviewPage";
import { Button } from "./components/common/Button";
import { Card } from "./components/common/Card";
import { LoadingState } from "./components/common/LoadingState";
import { Dashboard } from "./components/dashboard/Dashboard";
import { InventoryPage } from "./components/inventory/InventoryPage";
import { AppShell } from "./components/layout/AppShell";
import { ShoppingPage } from "./components/shopping/ShoppingPage";
import { useAuth } from "./hooks/useAuth";
import { useHousehold } from "./hooks/useHousehold";
import { useInventory } from "./hooks/useInventory";
import { useProducts } from "./hooks/useProducts";
import { useShoppingList } from "./hooks/useShoppingList";
import { useSubmissions } from "./hooks/useSubmissions";
import { reduceInventoryQuantity, setInventoryStatus } from "./services/inventoryService";
import { addShoppingItem } from "./services/shoppingService";
import type { InventoryItem } from "./types/inventory";

export type Tab = "dashboard" | "add" | "inventory" | "shopping" | "admin";

export default function App() {
  const { user, loading: authLoading, error: authError, isFirebaseConfigured } = useAuth();
  const { householdId, setHouseholdId, clearHousehold, adminMode, setAdminMode } = useHousehold();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const products = useProducts(householdId);
  const inventory = useInventory(householdId);
  const shopping = useShoppingList(householdId);
  const submissions = useSubmissions(adminMode);

  useEffect(() => {
    if (!adminMode && activeTab === "admin") setActiveTab("dashboard");
  }, [activeTab, adminMode]);

  const handleUsed = async (item: InventoryItem) => {
    if (!householdId) return;
    if (item.quantity > 1) {
      const amountRaw = window.prompt(`Reduce ${item.name} by how much?`, "1");
      const amount = Math.max(1, Number(amountRaw) || 1);
      await reduceInventoryQuantity(householdId, item, amount);
    } else {
      await setInventoryStatus(householdId, item, "used");
    }
    const addToList = window.confirm("Add to shopping list?");
    if (addToList) {
      await addShoppingItem(householdId, {
        name: item.name,
        productId: item.productId,
        publicProductId: item.publicProductId,
        unit: item.unit,
        source: "used_up",
      });
    }
  };

  const handleShopping = async (item: InventoryItem) => {
    if (!householdId) return;
    await addShoppingItem(householdId, {
      name: item.name,
      productId: item.productId,
      publicProductId: item.publicProductId,
      unit: item.unit,
      source: "inventory_action",
    });
    setActiveTab("shopping");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-kitchen-bg px-4">
        <LoadingState label="Starting Fridge Control..." />
      </div>
    );
  }

  if (!householdId) {
    return <HouseholdGate onSubmit={setHouseholdId} firebaseConfigured={isFirebaseConfigured} />;
  }

  const userId = user?.uid || null;

  return (
    <AppShell
      householdId={householdId}
      adminMode={adminMode}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onToggleAdmin={setAdminMode}
      onChangeHousehold={clearHousehold}
    >
      {authError ? (
        <div className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          {authError}
        </div>
      ) : null}

      {activeTab === "dashboard" ? (
        <Dashboard
          householdId={householdId}
          items={inventory.activeItems}
          summary={inventory.summary}
          loading={inventory.loading}
          onAddStock={() => setActiveTab("add")}
          onUsed={handleUsed}
          onShopping={handleShopping}
          onEdit={() => setActiveTab("inventory")}
        />
      ) : null}

      {activeTab === "add" ? (
        <AddStock
          householdId={householdId}
          userId={userId}
          personalProducts={products.personalProducts}
          publicProducts={products.publicProducts}
          recentProducts={products.recentProducts}
          previousInventoryItems={inventory.items}
          onDone={() => setActiveTab("dashboard")}
        />
      ) : null}

      {activeTab === "inventory" ? (
        <InventoryPage householdId={householdId} items={inventory.items} onUsed={handleUsed} />
      ) : null}

      {activeTab === "shopping" ? (
        <ShoppingPage
          householdId={householdId}
          activeInventory={inventory.activeItems}
          active={shopping.active}
          checked={shopping.checked}
        />
      ) : null}

      {activeTab === "admin" && adminMode ? (
        <AdminReviewPage
          householdId={householdId}
          userId={userId}
          pending={submissions.pending}
          reviewed={submissions.reviewed}
          publicProducts={products.publicProducts}
          loading={submissions.loading}
        />
      ) : null}
    </AppShell>
  );
}

function HouseholdGate({
  onSubmit,
  firebaseConfigured,
}: {
  onSubmit: (householdId: string) => void;
  firebaseConfigured: boolean;
}) {
  const [value, setValue] = useState("my-home");

  return (
    <div className="flex min-h-screen items-center justify-center bg-kitchen-bg p-4">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-wide text-kitchen-muted">
          Fridge Control
        </p>
        <h1 className="mt-2 text-3xl font-black text-kitchen-ink">Household setup</h1>
        <p className="mt-2 text-sm text-kitchen-muted">
          Enter a household code or name. This MVP stores it locally for fast testing.
        </p>
        {!firebaseConfigured ? (
          <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            Firebase env variables are missing. The UI will load, but live data needs Firebase.
          </div>
        ) : null}
        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(value);
          }}
        >
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="min-h-12 w-full rounded-2xl border border-kitchen-line px-4 outline-none focus:border-kitchen-green"
            placeholder="my-home"
          />
          <Button type="submit" className="w-full" disabled={!value.trim()}>
            Continue
          </Button>
        </form>
      </Card>
    </div>
  );
}
