import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Mail, UserCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { firebaseConfigMissing } from "../firebase/firebase";
import { useAuth } from "../hooks/useAuth";
import { APP_NAME, APP_TAGLINE } from "../utils/constants";

interface RedirectState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const { user, appUser, loading, signInWithGoogle, signInWithEmail, createAccountWithEmail } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RedirectState | null;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    const fallback = appUser?.householdIds.length ? "/dashboard" : "/onboarding";
    navigate(state?.from?.pathname ?? fallback, { replace: true });
  }, [appUser?.householdIds.length, loading, navigate, state?.from?.pathname, user]);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (isCreating) {
        await createAccountWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Google sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <section className="w-full max-w-md rounded-[1.75rem] bg-white/90 p-6 shadow-soft ring-1 ring-stone-200">
        <div className="mb-7">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage text-2xl">
            FM
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-ink">{APP_NAME}</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">{APP_TAGLINE}</p>
          {firebaseConfigMissing ? (
            <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
              Add Firebase values in .env.local to enable sign in.
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={busy}
          className="tap-target mb-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          <UserCircle className="h-4 w-4" />
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase text-stone-400">
          <span className="h-px flex-1 bg-stone-200" />
          Or use email
          <span className="h-px flex-1 bg-stone-200" />
        </div>

        <form className="space-y-3" onSubmit={handleEmailSubmit}>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-moss focus:bg-white"
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-stone-700">Password</span>
            <input
              type="password"
              autoComplete={isCreating ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={6}
              required
              className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none transition focus:border-moss focus:bg-white"
            />
          </label>

          {error ? (
            <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="tap-target inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Mail className="h-4 w-4" />
            {isCreating ? "Create account" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setIsCreating((value) => !value)}
          className="mt-5 w-full text-center text-sm font-semibold text-moss"
        >
          {isCreating ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </section>
    </main>
  );
}
