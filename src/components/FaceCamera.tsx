"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type FaceCameraHandle = {
  getVideo: () => HTMLVideoElement | null;
};

type Props = {
  className?: string;
  faceOk?: boolean;
};

export const FaceCamera = forwardRef<FaceCameraHandle, Props>(function FaceCamera(
  { className, faceOk = false },
  ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useImperativeHandle(ref, () => ({
    getVideo: () => videoRef.current,
  }));

  useEffect(() => {
    let stream: MediaStream | null = null;
    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play();
        }
      } catch {
        /* parent handles errors */
      }
    })();
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div className={className ?? "relative aspect-video w-full overflow-hidden rounded-xl bg-black"}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{ objectFit: "cover", width: "100%", height: "100%" }}
        className="h-full w-full"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 38%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className={`relative h-72 w-72 rounded-full border-2 shadow-md transition-colors duration-300 ${
            faceOk ? "border-emerald-400" : "border-white"
          }`}
        >
          <div className="absolute inset-0 rounded-full border border-dashed border-white/50" />
        </div>
      </div>

      <p className="absolute bottom-4 left-1/2 w-full max-w-xs -translate-x-1/2 text-center text-sm font-medium text-white drop-shadow">
        Posicione seu rosto no oval para reconhecimento
      </p>
    </div>
  );
});
