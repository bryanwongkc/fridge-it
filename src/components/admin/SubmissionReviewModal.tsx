import { useMemo, useState } from "react";
import { createPublicProductFromSubmission } from "../../services/productsService";
import { updateSubmissionStatus } from "../../services/submissionsService";
import type { PublicProduct } from "../../types/product";
import type { ProductSubmission } from "../../types/submission";
import { normalizeText } from "../../utils/normalize";
import { Button } from "../common/Button";
import { Card } from "../common/Card";
import { ProductCreateForm } from "../add/ProductCreateForm";

export function SubmissionReviewModal({
  submission,
  publicProducts,
  adminId,
  onClose,
}: {
  submission: ProductSubmission | null;
  publicProducts: PublicProduct[];
  adminId: string | null;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"review" | "edit">("review");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const possibleMatches = useMemo(() => {
    if (!submission) return [];
    return publicProducts
      .filter((product) => {
        const barcodeMatch = submission.barcode && product.barcode === submission.barcode;
        const nameMatch = product.normalizedName.includes(submission.normalizedName);
        const brandMatch =
          submission.brand && product.brand && normalizeText(product.brand) === normalizeText(submission.brand);
        return barcodeMatch || nameMatch || brandMatch;
      })
      .slice(0, 5);
  }, [publicProducts, submission]);

  if (!submission) return null;

  const approve = async (override?: ProductSubmission) => {
    setSaving(true);
    await createPublicProductFromSubmission(override || submission, adminId);
    await updateSubmissionStatus(submission.id, "approved", adminId);
    setSaving(false);
    onClose();
  };

  const reject = async () => {
    setSaving(true);
    await updateSubmissionStatus(submission.id, "rejected", adminId, { adminNote: note || null });
    setSaving(false);
    onClose();
  };

  const merge = async (publicProductId: string) => {
    setSaving(true);
    await updateSubmissionStatus(submission.id, "merged", adminId, {
      duplicateOfPublicProductId: publicProductId,
      adminNote: note || null,
    });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/30 p-4">
      {mode === "edit" ? (
        <div className="max-h-[90vh] w-full overflow-y-auto">
          <ProductCreateForm
            initialProduct={submission}
            submitLabel="Approve edited"
            onCancel={() => setMode("review")}
            onSubmit={async (input) => {
              await approve({
                ...submission,
                ...input,
                normalizedName: normalizeText(input.name),
                defaultLocation: input.defaultLocation || "fridge",
                defaultShelfLifeDays: input.defaultShelfLifeDays ?? null,
                barcode: input.barcode || null,
                brand: input.brand || null,
                category: input.category || null,
                imageUrl: input.imageUrl || null,
                defaultUnit: input.defaultUnit || null,
              });
            }}
          />
        </div>
      ) : (
        <Card className="max-h-[90vh] w-full overflow-y-auto">
          <h2 className="text-xl font-black text-kitchen-ink">{submission.name}</h2>
          <div className="mt-3 space-y-1 text-sm text-kitchen-muted">
            <p>Barcode: {submission.barcode || "None"}</p>
            <p>Brand: {submission.brand || "None"}</p>
            <p>Category: {submission.category || "None"}</p>
            <p>Default: {submission.defaultLocation} · {submission.defaultShelfLifeDays ?? "no"} days</p>
            <p>Source: {submission.source}</p>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-black text-kitchen-ink">Possible matches</h3>
            {possibleMatches.length ? (
              <div className="mt-2 space-y-2">
                {possibleMatches.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => void merge(product.id)}
                    className="w-full rounded-2xl bg-slate-50 p-3 text-left"
                  >
                    <span className="block text-sm font-bold text-kitchen-ink">{product.name}</span>
                    <span className="block text-xs text-kitchen-muted">
                      {product.brand || "No brand"} · {product.barcode || "No barcode"}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-kitchen-muted">No close public matches.</p>
            )}
          </div>

          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Admin note"
            rows={3}
            className="mt-5 w-full rounded-2xl border border-kitchen-line p-3 outline-none focus:border-kitchen-green"
          />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button disabled={saving} onClick={() => void approve()}>
              Approve New
            </Button>
            <Button variant="secondary" disabled={saving} onClick={() => setMode("edit")}>
              Edit & Approve
            </Button>
            <Button variant="danger" disabled={saving} onClick={() => void reject()}>
              Reject
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
