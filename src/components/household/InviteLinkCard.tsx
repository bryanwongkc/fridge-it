import { Copy, RefreshCcw, ToggleLeft, ToggleRight } from "lucide-react";
import { useMemo, useState } from "react";
import type { Household } from "../../types/household";
import { generateInviteCode, setInviteEnabled } from "../../services/inviteService";

interface InviteLinkCardProps {
  household: Household;
  canManage: boolean;
}

export function InviteLinkCard({ household, canManage }: InviteLinkCardProps) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteUrl = useMemo(() => {
    if (!household.inviteCode) {
      return "";
    }
    return `${window.location.origin}/invite/${household.inviteCode}`;
  }, [household.inviteCode]);

  async function handleGenerate() {
    setBusy(true);
    try {
      await generateInviteCode(household.id);
    } finally {
      setBusy(false);
    }
  }

  async function handleToggle() {
    setBusy(true);
    try {
      await setInviteEnabled(household.id, !household.inviteEnabled);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!inviteUrl) {
      return;
    }
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white/85 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink">Invite link</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Share one link with someone who should use this household inventory.
          </p>
        </div>
        {household.inviteEnabled ? (
          <span className="rounded-full bg-sage px-3 py-1 text-xs font-semibold text-moss">
            On
          </span>
        ) : (
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
            Off
          </span>
        )}
      </div>

      {inviteUrl ? (
        <div className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
          <p className="break-all">{inviteUrl}</p>
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">
          No invite link has been generated yet.
        </p>
      )}

      {canManage ? (
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleGenerate}
            disabled={busy}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-moss px-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" />
            {household.inviteCode ? "Regenerate" : "Generate"}
          </button>
          <button
            type="button"
            onClick={handleToggle}
            disabled={busy || !household.inviteCode}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200 disabled:opacity-50"
          >
            {household.inviteEnabled ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {household.inviteEnabled ? "Disable" : "Enable"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            disabled={!inviteUrl || !household.inviteEnabled}
            className="tap-target inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-ink ring-1 ring-stone-200 disabled:opacity-50"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm text-stone-500">Only the owner can manage this link.</p>
      )}
    </section>
  );
}
