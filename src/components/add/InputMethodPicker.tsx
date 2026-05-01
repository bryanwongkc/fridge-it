import { Barcode, Clock3, Keyboard } from "lucide-react";
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
    <Card className="space-y-3">
      <h1 className="text-2xl font-black text-kitchen-ink">How do you want to add stock?</h1>
      <Button onClick={onScan} icon={<Barcode size={20} />} className="w-full justify-start">
        Scan Barcode
      </Button>
      <Button
        onClick={onManual}
        variant="secondary"
        icon={<Keyboard size={20} />}
        className="w-full justify-start"
      >
        Type Manually
      </Button>
      <div className="flex items-center gap-2 pt-1 text-xs font-semibold text-kitchen-muted">
        <Clock3 size={14} />
        Recent items below are the fastest path after first use.
      </div>
    </Card>
  );
}
