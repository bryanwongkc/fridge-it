import { useEffect, useRef, useState } from "react";
import { Barcode, Camera, Keyboard, X } from "lucide-react";
import type { BarcodeLookupResult } from "../../types/barcode";

interface BarcodeScannerProps {
  loading: boolean;
  onLookup: (barcode: string) => Promise<BarcodeLookupResult>;
}

interface BarcodeDetectorLike {
  detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

export function BarcodeScanner({ loading, onLookup }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [manualBarcode, setManualBarcode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const detectorAvailable = typeof window !== "undefined" && Boolean(window.BarcodeDetector);

  useEffect(() => {
    if (!cameraOpen || !detectorAvailable) {
      return () => undefined;
    }

    let cancelled = false;
    let animationFrame = 0;
    const Detector = window.BarcodeDetector;
    if (!Detector) {
      return () => undefined;
    }
    const detector = new Detector({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128"],
    });

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        async function scanLoop() {
          if (cancelled || !videoRef.current || !detector) {
            return;
          }
          try {
            const results = await detector.detect(videoRef.current);
            const rawValue = results[0]?.rawValue;
            if (rawValue) {
              await onLookup(rawValue);
              setCameraOpen(false);
              return;
            }
          } catch {
            // Keep camera open; manual entry remains available below.
          }
          animationFrame = window.requestAnimationFrame(() => void scanLoop());
        }

        void scanLoop();
      } catch {
        setCameraError("Camera unavailable. Enter the barcode manually.");
        setCameraOpen(false);
      }
    }

    void startCamera();

    return () => {
      cancelled = true;
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraOpen, detectorAvailable, onLookup]);

  async function handleManualLookup() {
    if (!manualBarcode.trim()) {
      return;
    }
    try {
      await onLookup(manualBarcode);
      setManualBarcode("");
    } catch {
      setCameraError("Barcode lookup failed. You can still type the item manually.");
    }
  }

  return (
    <section className="rounded-[1.5rem] border border-stone-200 bg-white/90 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-stone-100 text-moss">
          <Barcode className="h-5 w-5" aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-ink">Barcode is optional</h2>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            Scan barcode to make this faster next time. If nothing is found, add it once and this household will remember it.
          </p>
        </div>
      </div>

      {cameraOpen ? (
        <div className="mt-4 overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} className="aspect-video w-full object-cover" muted playsInline />
        </div>
      ) : null}

      {cameraError ? (
        <p className="mt-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {cameraError}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setCameraOpen((value) => !value)}
          disabled={!detectorAvailable || loading}
          className="tap-target inline-flex items-center justify-center gap-2 rounded-2xl bg-moss px-4 text-sm font-semibold text-white disabled:bg-stone-200 disabled:text-stone-500"
        >
          {cameraOpen ? <X className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
          {detectorAvailable ? (cameraOpen ? "Stop camera" : "Scan") : "Camera scan unavailable"}
        </button>
        <div className="flex gap-2">
          <input
            value={manualBarcode}
            onChange={(event) => setManualBarcode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleManualLookup();
              }
            }}
            placeholder="Enter barcode"
            aria-label="Enter barcode manually"
            className="h-12 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-stone-50 px-4 text-base outline-none focus:border-moss focus:bg-white"
          />
          <button
            type="button"
            onClick={() => void handleManualLookup()}
            disabled={loading || !manualBarcode.trim()}
            className="tap-target inline-flex items-center justify-center rounded-2xl bg-ink px-4 text-white disabled:opacity-60"
            aria-label="Look up barcode"
          >
            <Keyboard className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
