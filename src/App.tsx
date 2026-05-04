import { useEffect, useState } from "react";
import { AddStock } from "./components/add/AddStock";
import { AdminReviewPage } from "./components/admin/AdminReviewPage";
import { AppUpdateNotice } from "./components/common/AppUpdateNotice";
import { Button } from "./components/common/Button";
import { Card } from "./components/common/Card";
import { LoadingState } from "./components/common/LoadingState";
import { Dashboard } from "./components/dashboard/Dashboard";
import { InventoryPage } from "./components/inventory/InventoryPage";
import { UsedAdjustSheet } from "./components/inventory/UsedAdjustSheet";
import { AppShell } from "./components/layout/AppShell";
import { ShoppingPage } from "./components/shopping/ShoppingPage";
import { useAuth } from "./hooks/useAuth";
import { useHousehold } from "./hooks/useHousehold";
import { useInventory } from "./hooks/useInventory";
import { useProducts } from "./hooks/useProducts";
import { useShoppingList } from "./hooks/useShoppingList";
import { useSubmissions } from "./hooks/useSubmissions";
import {
  deleteInventoryItem,
  restoreInventoryItem,
  updateInventoryItem,
} from "./services/inventoryService";
import { addShoppingItem } from "./services/shoppingService";
import type { InventoryItem } from "./types/inventory";
import { friendlyErrorMessage } from "./utils/friendlyErrors";

export type Tab = "dashboard" | "add" | "inventory" | "shopping" | "admin";

type UndoAction =
  | { kind: "delete"; item: InventoryItem; message: string }
  | { kind: "used"; item: InventoryItem; message: string };

export default function App() {
  const { user, loading: authLoading, error: authError, isFirebaseConfigured } = useAuth();
  const { householdId, setHouseholdId, clearHousehold, adminMode, setAdminMode } = useHousehold();
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const products = useProducts(householdId);
  const inventory = useInventory(householdId);
  const shopping = useShoppingList(householdId);
  const submissions = useSubmissions(adminMode);
  const [usedItem, setUsedItem] = useState<InventoryItem | null>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);

  useEffect(() => {
    if (!adminMode && activeTab === "admin") setActiveTab("dashboard");
  }, [activeTab, adminMode]);

  useEffect(() => {
    if (!undoAction) return;
    const timeout = window.setTimeout(() => setUndoAction(null), 20000);
    return () => window.clearTimeout(timeout);
  }, [undoAction]);

  const handleUsed = (item: InventoryItem) => {
    setUsedItem(item);
  };

  const handleApplyUsed = async (
    item: InventoryItem,
    fields: Partial<Pick<InventoryItem, "quantity" | "remainingPercent" | "status">>,
    allUsed: boolean,
  ) => {
    if (!householdId) return;
    try {
      await updateInventoryItem(householdId, item.id, fields);
      setUsedItem(null);
      if (allUsed) {
        setUndoAction({ kind: "used", item, message: `${item.name} marked all used.` });
      }
    } catch (error) {
      console.error("Inventory used action failed", error);
      window.alert(friendlyErrorMessage(error, "stock"));
    }
  };

  const handleShopping = async (item: InventoryItem) => {
    if (!householdId) return;
    try {
      await addShoppingItem(householdId, {
        name: item.name,
        productId: item.productId,
        publicProductId: item.publicProductId,
        quantity: 1,
        unit: item.unit,
        source: "inventory_action",
      });
      setActiveTab("shopping");
    } catch (error) {
      console.error("Shopping add failed", error);
      window.alert(friendlyErrorMessage(error, "shopping"));
    }
  };

  const handleDeleteInventory = async (item: InventoryItem) => {
    if (!householdId) return;
    const confirmed = window.confirm(`Delete ${item.name} from inventory?`);
    if (!confirmed) return;
    try {
      await deleteInventoryItem(householdId, item.id);
      setUndoAction({ kind: "delete", item, message: `${item.name} deleted.` });
    } catch (error) {
      console.error("Inventory delete failed", error);
      window.alert(friendlyErrorMessage(error, "stock"));
    }
  };

  const handleUndo = async () => {
    if (!householdId || !undoAction) return;
    const action = undoAction;
    setUndoAction(null);
    try {
      if (action.kind === "delete") {
        await restoreInventoryItem(householdId, action.item);
      } else {
        await updateInventoryItem(householdId, action.item.id, {
          quantity: action.item.quantity,
          remainingPercent: action.item.remainingPercent ?? 100,
          status: "active",
        });
      }
    } catch (error) {
      console.error("Undo inventory action failed", error);
      window.alert(friendlyErrorMessage(error, "stock"));
    }
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
          onDelete={handleDeleteInventory}
        />
      ) : null}

      {activeTab === "add" ? (
        <AddStock
          householdId={householdId}
          userId={userId}
          personalProducts={products.personalProducts}
          recentProducts={products.recentProducts}
          previousInventoryItems={inventory.items}
          onDone={() => setActiveTab("dashboard")}
        />
      ) : null}

      {activeTab === "inventory" ? (
        <InventoryPage
          householdId={householdId}
          items={inventory.items}
          onUsed={handleUsed}
          onShopping={handleShopping}
          onDelete={handleDeleteInventory}
        />
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
      <AppUpdateNotice />
      <UsedAdjustSheet
        item={usedItem}
        onClose={() => setUsedItem(null)}
        onSave={handleApplyUsed}
      />
      {undoAction ? <UndoToast action={undoAction} onUndo={handleUndo} /> : null}
    </AppShell>
  );
}

function UndoToast({ action, onUndo }: { action: UndoAction; onUndo: () => void }) {
  return (
    <div className="fixed inset-x-4 bottom-24 z-[60] rounded-2xl bg-kitchen-ink px-4 py-3 text-white shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm font-bold">{action.message}</p>
        <button
          type="button"
          onClick={() => void onUndo()}
          className="shrink-0 rounded-xl bg-white px-3 py-2 text-sm font-black text-kitchen-ink"
        >
          Undo
        </button>
      </div>
    </div>
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
