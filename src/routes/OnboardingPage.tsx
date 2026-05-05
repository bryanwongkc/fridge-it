import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Home } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useHouseholds } from "../hooks/useHouseholds";
import { APP_NAME } from "../utils/constants";

export function OnboardingPage() {
  const { appUser } = useAuth();
  const { createNewHousehold } = useHouseholds();
  const navigate = useNavigate();
  const [name, setName] = useState("Home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (appUser?.householdIds.length) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createNewHousehold(name);
      navigate("/bulk-setup", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create household.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <section className="w-full max-w-md rounded-[1.75rem] bg-white/90 p-6 shadow-soft ring-1 ring-stone-200">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-moss">{APP_NAME}</p>
        <h1 className="mt-4 text-3xl font-bold text-ink">Create your first household</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">
          This gives your fridge, freezer, pantry, and grocery list one shared memory.
        </p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Household name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Home className="h-4 w-4" />
            Create household
          </button>
        </form>
      </section>
    </main>
  );
}
