import type { ProductSubmission } from "../../types/submission";
import { displayDate } from "../../utils/dates";
import { Badge } from "../common/Badge";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function SubmissionCard({
  submission,
  onReview,
}: {
  submission: ProductSubmission;
  onReview: (submission: ProductSubmission) => void;
}) {
  return (
    <Card className="p-4">
      <div className="flex gap-3">
        {submission.imageUrl ? (
          <img src={submission.imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-kitchen-green">
            {submission.name.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-2 text-base font-black text-kitchen-ink">{submission.name}</h3>
            <Badge className="bg-amber-50 text-amber-700">{submission.source}</Badge>
          </div>
          <p className="mt-1 text-sm text-kitchen-muted">
            {submission.brand || "No brand"} · {submission.defaultLocation}
          </p>
          <p className="mt-1 text-xs text-kitchen-muted">
            {submission.barcode || "No barcode"} · {submission.submittedCount} submissions ·{" "}
            {submission.submittedHouseholdIds.length} homes
          </p>
          <p className="mt-1 text-xs text-kitchen-muted">
            {submission.createdAt ? displayDate(submission.createdAt.toDate().toISOString().slice(0, 10)) : "Just now"}
          </p>
          <Button variant="secondary" className="mt-3 min-h-10 w-full" onClick={() => onReview(submission)}>
            Review
          </Button>
        </div>
      </div>
    </Card>
  );
}
