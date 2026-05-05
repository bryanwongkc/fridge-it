import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white/80 p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
