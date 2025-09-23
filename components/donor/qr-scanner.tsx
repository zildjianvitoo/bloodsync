"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner, type QrcodeErrorCallback, type QrcodeSuccessCallback } from "html5-qrcode";

export type QrScannerProps = {
  onScan: (text: string) => void;
  onClose: () => void;
  onError?: (message: string) => void;
};

const SCANNER_ID = "bloodsync-qr-container";

export function QrScanner({ onScan, onClose, onError }: QrScannerProps) {
  const mounted = useRef(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    const successHandler: QrcodeSuccessCallback = (decodedText) => {
      onScan(decodedText);
      void scannerRef.current?.clear();
      onClose();
    };

    const errorHandler: QrcodeErrorCallback = (errorMessage) => {
      if (errorMessage?.includes("NotFoundException")) return;
      onError?.(errorMessage);
    };

    const scanner = new Html5QrcodeScanner(
      SCANNER_ID,
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      },
      false
    );

    scannerRef.current = scanner;
    scanner.render(successHandler, errorHandler);

    return () => {
      mounted.current = false;
      scannerRef.current
        ?.clear()
        .catch(() => {
          /* ignore */
        })
        .finally(() => {
          scannerRef.current = null;
        });
    };
  }, [onClose, onError, onScan]);

  return <div id={SCANNER_ID} className="min-h-[280px]" />;
}
