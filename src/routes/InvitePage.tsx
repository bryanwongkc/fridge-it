import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, LinkIcon } from "lucide-react";
import { LoadingScreen } from "../components/layout/LoadingScreen";
import { useAuth } from "../hooks/useAuth";
import { joinHouseholdByInvite } from "../services/inviteService";

export function InvitePage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user, appUser, loading } = useAuth();
  const startedRef = useRef(false);
  const [status, setStatus] = useState("Checking invite...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user || !appUser || !inviteCode || startedRef.current) {
      return;
    }

    const nextUser = user;
    const nextInviteCode = inviteCode;
    startedRef.current = true;
    async function join() {
      try {
        const result = await joinHouseholdByInvite({
          inviteCode: nextInviteCode,
          uid: nextUser.uid,
          displayName: nextUser.displayName,
          email: nextUser.email,
        });
        setStatus(result.alreadyMember ? "You are already in this household." : "Joined.");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 900);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? caughtError.message : "Invite could not be used.");
      }
    }

    void join();
  }, [appUser, inviteCode, loading, navigate, user]);

  if (!inviteCode) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <section className="w-full max-w-md rounded-[1.75rem] bg-white/90 p-6 text-center shadow-soft ring-1 ring-stone-200">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-moss">
          {error ? <LinkIcon className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6" />}
        </div>
        <h1 className="text-2xl font-bold text-ink">Household invite</h1>
        <p className="mt-3 text-sm leading-6 text-stone-600">{error ?? status}</p>
        {error ? (
          <button
            type="button"
            onClick={() => navigate("/households", { replace: true })}
            className="tap-target mt-6 w-full rounded-2xl bg-moss px-4 text-sm font-semibold text-white"
          >
            Go to households
          </button>
        ) : null}
      </section>
    </main>
  );
}
