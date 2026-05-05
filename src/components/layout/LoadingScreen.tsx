import { APP_NAME } from "../../utils/constants";

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-moss" />
        <p className="text-sm font-semibold text-ink">{APP_NAME}</p>
        <p className="mt-1 text-sm text-stone-500">Opening your household memory...</p>
      </div>
    </div>
  );
}
