import { useState } from "react";
import type { FormEvent } from "react";
import { CheckCircle2, Home, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useHouseholds } from "../hooks/useHouseholds";
import { LoadingScreen } from "../components/layout/LoadingScreen";

export function HouseholdsPage() {
  const { appUser } = useAuth();
  const { households, loading, createNewHousehold, setActiveHousehold } = useHouseholds();
  const [name, setName] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <LoadingScreen />;
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyId("create");
    setError(null);
    try {
      await createNewHousehold(name);
      setName("");
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not create household.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSwitch(householdId: string) {
    setBusyId(householdId);
    setError(null);
    try {
      await setActiveHousehold(householdId);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not switch household.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-6">
      <div className="mx-auto max-w-xl space-y-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-moss">Households</p>
            <h1 className="mt-1 text-2xl font-bold text-ink">Choose your space</h1>
          </div>
          <Link
            to="/dashboard"
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink ring-1 ring-stone-200"
          >
            Done
          </Link>
        </header>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="space-y-3">
          {households.map((household) => {
            const isActive = household.id === appUser?.activeHouseholdId;
            return (
              <article
                key={household.id}
                className="rounded-2xl border border-stone-200 bg-white/85 p-4 shadow-soft"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage text-moss">
                    <Home className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-base font-semibold text-ink">
                      {household.name}
                    </h2>
                    <p className="text-sm text-stone-500">
                      {household.memberCount} member{household.memberCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Active
                    </span>
                  ) : null}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void handleSwitch(household.id)}
                    disabled={isActive || busyId === household.id}
                    className="tap-target rounded-xl bg-moss px-4 text-sm font-semibold text-white disabled:bg-stone-200 disabled:text-stone-500"
                  >
                    {isActive ? "Selected" : "Switch here"}
                  </button>
                  <Link
                    to={`/households/${household.id}/settings`}
                    className="tap-target inline-flex items-center justify-center rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200"
                  >
                    Settings
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-stone-200 bg-white/85 p-4 shadow-soft"
        >
          <h2 className="text-base font-semibold text-ink">Create another household</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Use this for a separate home, like your sister's household.
          </p>
          <div className="mt-4 flex gap-2">
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Household name"
              className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
            />
            <button
              type="submit"
              disabled={!name.trim() || busyId === "create"}
              className="tap-target inline-flex items-center justify-center rounded-2xl bg-ink px-4 text-white disabled:opacity-60"
              aria-label="Create household"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
