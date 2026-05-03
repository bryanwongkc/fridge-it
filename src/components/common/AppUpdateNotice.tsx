import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "./Button";

export function AppUpdateNotice() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl) {
      console.info("PWA service worker registered", swUrl);
    },
    onRegisterError(error) {
      console.error("PWA service worker registration failed", error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-50 mx-auto max-w-md rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/10">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-kitchen-ink">Update ready</p>
          <p className="text-xs font-semibold text-kitchen-muted">Refresh to use the latest app.</p>
        </div>
        <Button className="min-h-9 rounded-xl text-xs" onClick={() => void updateServiceWorker(true)}>
          Refresh
        </Button>
      </div>
    </div>
  );
}
