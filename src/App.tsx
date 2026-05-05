import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactElement } from "react";
import { AppShell } from "./components/layout/AppShell";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { useActiveHousehold } from "./hooks/useActiveHousehold";
import { useAuth } from "./hooks/useAuth";
import { AddItemPage } from "./routes/AddItemPage";
import { BulkSetupPage } from "./routes/BulkSetupPage";
import { BuySoonPage } from "./routes/BuySoonPage";
import { DashboardPage } from "./routes/DashboardPage";
import { GroceryPage } from "./routes/GroceryPage";
import { HouseholdSettingsPage } from "./routes/HouseholdSettingsPage";
import { HouseholdsPage } from "./routes/HouseholdsPage";
import { InventoryPage } from "./routes/InventoryPage";
import { InvitePage } from "./routes/InvitePage";
import { ItemDetailPage } from "./routes/ItemDetailPage";
import { LibraryPage } from "./routes/LibraryPage";
import { LoginPage } from "./routes/LoginPage";
import { OnboardingPage } from "./routes/OnboardingPage";

function RequireAuth({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function RequireActiveHousehold() {
  const { loading: authLoading } = useAuth();
  const { loading, activeHousehold, hasHouseholds } = useActiveHousehold();

  if (authLoading || loading) {
    return <LoadingScreen />;
  }

  if (!hasHouseholds) {
    return <Navigate to="/onboarding" replace />;
  }

  if (!activeHousehold) {
    return <Navigate to="/households" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/invite/:inviteCode"
        element={
          <RequireAuth>
            <InvitePage />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <OnboardingPage />
          </RequireAuth>
        }
      />
      <Route
        path="/households"
        element={
          <RequireAuth>
            <HouseholdsPage />
          </RequireAuth>
        }
      />
      <Route
        element={
          <RequireAuth>
            <RequireActiveHousehold />
          </RequireAuth>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/add" element={<AddItemPage />} />
        <Route path="/bulk-setup" element={<BulkSetupPage />} />
        <Route path="/buy-soon" element={<BuySoonPage />} />
        <Route path="/grocery" element={<GroceryPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/households/:householdId/settings" element={<HouseholdSettingsPage />} />
        <Route path="/item/:itemId" element={<ItemDetailPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
