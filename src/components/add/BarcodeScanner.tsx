import { Html5Qrcode } from "html5-qrcode";
import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../common/Button";
import { Card } from "../common/Card";

const scannerId = "fridge-control-barcode-scanner";

export function BarcodeScanner({
  onDetected,
  onCancel,
}: {
  onDetected: (barcode: string) => void;
  onCancel: () => void;
}) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");

  useEffect(() => {
    let active = true;
    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 160 } },
        async (decodedText) => {
          if (!active) return;
          active = false;
          try {
            await scanner.stop();
            await scanner.clear();
          } catch {
            // Scanner can already be stopped by browser lifecycle.
          }
          onDetected(decodedText);
        },
        undefined,
      )
      .catch(() => {
        setError("Camera permission is blocked. Enter the barcode instead.");
      });

    return () => {
      active = false;
      if (scannerRef.current?.isScanning) {
        void scannerRef.current.stop().then(() => scannerRef.current?.clear());
      } else {
        void scannerRef.current?.clear();
      }
    };
  }, [onDetected]);

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-kitchen-ink">Scan barcode</h1>
          <p className="text-sm text-kitchen-muted">Point at the package barcode.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100"
          aria-label="Close scanner"
        >
          <X size={20} />
        </button>
      </div>
      <div id={scannerId} className="overflow-hidden rounded-2xl bg-slate-900" />
      {error ? <p className="text-sm font-medium text-red-700">{error}</p> : null}
      <div className="flex gap-2">
        <input
          value={manualBarcode}
          onChange={(event) => setManualBarcode(event.target.value)}
          placeholder="Enter barcode"
          inputMode="numeric"
          className="min-h-12 flex-1 rounded-2xl border border-kitchen-line bg-white px-4 outline-none focus:border-kitchen-green"
        />
        <Button
          type="button"
          icon={<Camera size={18} />}
          disabled={!manualBarcode.trim()}
          onClick={() => onDetected(manualBarcode.trim())}
        >
          Use
        </Button>
      </div>
    </Card>
  );
}
