import type { ReactNode } from "react";
import type { Tab } from "../../App";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function AppShell({
  householdId,
  adminMode,
  activeTab,
  onTabChange,
  onToggleAdmin,
  onChangeHousehold,
  children,
}: {
  householdId: string;
  adminMode: boolean;
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
  onToggleAdmin: (value: boolean) => void;
  onChangeHousehold: () => void;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-kitchen-bg">
      <Header
        householdId={householdId}
        adminMode={adminMode}
        onToggleAdmin={onToggleAdmin}
        onChangeHousehold={onChangeHousehold}
      />
      <main className="safe-bottom mx-auto max-w-md px-4">{children}</main>
      <BottomNav activeTab={activeTab} onChange={onTabChange} adminMode={adminMode} />
    </div>
  );
}
