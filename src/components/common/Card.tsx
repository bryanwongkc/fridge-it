import type { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl bg-white p-3 shadow-soft ring-1 ring-black/5 ${className}`}
      {...props}
    />
  );
}
