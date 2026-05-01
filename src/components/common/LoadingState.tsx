export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center text-sm font-medium text-kitchen-muted">
      <span className="mr-3 h-4 w-4 animate-spin rounded-full border-2 border-kitchen-green border-t-transparent" />
      {label}
    </div>
  );
}
