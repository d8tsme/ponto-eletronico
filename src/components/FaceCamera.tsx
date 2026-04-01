"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type FaceCameraHandle = {
  getVideo: () => HTMLVideoElement | null;
};

type Props = {
  className?: string;
};

export const FaceCamera = forwardRef<FaceCameraHandle, Props>(function FaceCamera(
  { className },
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
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className={className ?? "aspect-video w-full rounded-xl bg-black object-cover"}
    />
  );
});
