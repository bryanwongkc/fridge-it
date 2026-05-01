import { DatabaseZap } from "lucide-react";
import { useState } from "react";
import { seedDemoData } from "../../services/seedService";
import type { PublicProduct } from "../../types/product";
import type { ProductSubmission } from "../../types/submission";
import { Button } from "../common/Button";
import { EmptyState } from "../common/EmptyState";
import { LoadingState } from "../common/LoadingState";
import { SubmissionCard } from "./SubmissionCard";
import { SubmissionReviewModal } from "./SubmissionReviewModal";

export function AdminReviewPage({
  householdId,
  userId,
  pending,
  reviewed,
  publicProducts,
  loading,
}: {
  householdId: string;
  userId: string | null;
  pending: ProductSubmission[];
  reviewed: ProductSubmission[];
  publicProducts: PublicProduct[];
  loading: boolean;
}) {
  const [selected, setSelected] = useState<ProductSubmission | null>(null);
  const [seeding, setSeeding] = useState(false);

  const seed = async () => {
    setSeeding(true);
    await seedDemoData(householdId, userId);
    setSeeding(false);
  };

  return (
    <section className="space-y-5 pb-4">
      <div>
        <h1 className="text-2xl font-black text-kitchen-ink">Admin Review</h1>
        <p className="text-sm text-kitchen-muted">Development admin mode. Replace with custom claims before production.</p>
      </div>
      <Button
        variant="secondary"
        className="w-full"
        icon={<DatabaseZap size={18} />}
        disabled={seeding}
        onClick={() => void seed()}
      >
        {seeding ? "Seeding..." : "Seed demo data"}
      </Button>
      <div>
        <h2 className="mb-3 text-lg font-black text-kitchen-ink">Pending submissions</h2>
        {loading ? (
          <LoadingState />
        ) : pending.length ? (
          <div className="space-y-3">
            {pending.map((submission) => (
              <SubmissionCard key={submission.id} submission={submission} onReview={setSelected} />
            ))}
          </div>
        ) : (
          <EmptyState title="No pending submissions." />
        )}
      </div>
      <div>
        <h2 className="mb-3 text-lg font-black text-kitchen-ink">Approved recently</h2>
        {reviewed.length ? (
          <div className="space-y-2">
            {reviewed.slice(0, 5).map((submission) => (
              <div key={submission.id} className="rounded-2xl bg-white p-3 text-sm shadow-soft">
                <span className="font-bold text-kitchen-ink">{submission.name}</span>
                <span className="ml-2 text-kitchen-muted">{submission.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="No reviewed submissions yet." />
        )}
      </div>
      <SubmissionReviewModal
        submission={selected}
        publicProducts={publicProducts}
        adminId={userId}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
