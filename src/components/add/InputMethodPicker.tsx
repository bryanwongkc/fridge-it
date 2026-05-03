import { Barcode, Keyboard } from "lucide-react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

export function InputMethodPicker({
  onScan,
  onManual,
}: {
  onScan: () => void;
  onManual: () => void;
}) {
  return (
    <Card className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-kitchen-ink">Add stock</h1>
        <p className="mt-1 text-sm text-kitchen-muted">Scan, search, or tap something you buy often.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button onClick={onScan} icon={<Barcode size={20} />} className="min-h-14">
          Scan
        </Button>
        <Button
          onClick={onManual}
          variant="secondary"
          icon={<Keyboard size={20} />}
          className="min-h-14"
        >
          Search
        </Button>
      </div>
    </Card>
  );
}
