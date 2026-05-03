import type { ReactNode } from "react";

type NoticeTone = "success" | "warning" | "danger";

const tones: Record<NoticeTone, string> = {
  success: "bg-emerald-50 text-kitchen-green",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
};

export function Notice({
  tone = "success",
  children,
}: {
  tone?: NoticeTone;
  children: ReactNode;
}) {
  return <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${tones[tone]}`}>{children}</div>;
}
