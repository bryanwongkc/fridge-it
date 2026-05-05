import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { DoorOpen, Save } from "lucide-react";
import { InviteLinkCard } from "../components/household/InviteLinkCard";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { useHouseholds } from "../hooks/useHouseholds";
import {
  leaveHousehold,
  renameHousehold,
  subscribeHouseholdMembers,
} from "../services/householdService";
import type { HouseholdMember } from "../types/household";

export function HouseholdSettingsPage() {
  const { householdId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { households, loading } = useHouseholds();
  const household = useMemo(
    () => households.find((candidate) => candidate.id === householdId) ?? null,
    [householdId, households],
  );
  const [members, setMembers] = useState<HouseholdMember[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!household) {
      return () => undefined;
    }
    setName(household.name);
    return subscribeHouseholdMembers(household.id, setMembers);
  }, [household]);

  if (!householdId) {
    return <Navigate to="/households" replace />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!household) {
    return (
      <section className="rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-soft">
        <h1 className="text-xl font-bold text-ink">Household not available</h1>
        <p className="mt-2 text-sm text-stone-600">
          This household may not exist, or you may not be a member.
        </p>
      </section>
    );
  }

  const canManage = household.ownerId === user?.uid;

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!household) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await renameHousehold(household.id, name);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not rename household.");
    } finally {
      setBusy(false);
    }
  }

  async function handleLeave() {
    if (!user || !household) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await leaveHousehold(user.uid, household);
      navigate("/households", { replace: true });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Could not leave household.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-semibold text-moss">Household settings</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{household.name}</h1>
      </header>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <form
        onSubmit={handleRename}
        className="rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-soft"
      >
        <h2 className="text-base font-semibold text-ink">Name</h2>
        <div className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={!canManage}
            className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white disabled:text-stone-400"
          />
          <button
            type="submit"
            disabled={!canManage || busy || !name.trim()}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </form>

      <section className="rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-soft">
        <h2 className="text-base font-semibold text-ink">Members</h2>
        <div className="mt-4 divide-y divide-stone-100">
          {members.map((member) => (
            <div key={member.userId} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {member.displayName || member.email || "Household member"}
                </p>
                <p className="text-xs text-stone-500">{member.role}</p>
              </div>
              {member.userId === user?.uid ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
                  You
                </span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <InviteLinkCard household={household} canManage={canManage} />

      {!canManage ? (
        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={busy}
          className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 text-sm font-semibold text-red-700 ring-1 ring-red-100 disabled:opacity-60"
        >
          <DoorOpen className="h-4 w-4" />
          Leave household
        </button>
      ) : (
        <p className="rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-600">
          Owners cannot leave a household in this MVP.
        </p>
      )}
    </div>
  );
}
