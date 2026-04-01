import imageCompression from "browser-image-compression";

const WEBP_OPTIONS = {
  maxWidthOrHeight: 800,
  useWebWorker: true,
  fileType: "image/webp" as const,
  initialQuality: 0.6,
};

/**
 * Comprime qualquer imagem (File ou Blob) para WebP antes de upload ao Storage,
 * reduzindo uso de banda e armazenamento (free tier).
 */
export async function compressImageToWebpBlob(
  input: File | Blob
): Promise<Blob> {
  const file =
    input instanceof File
      ? input
      : new File([input], "capture.webp", { type: input.type || "image/jpeg" });

  const compressed = await imageCompression(file, WEBP_OPTIONS);
  return compressed;
}

export async function compressImageToWebpBase64(
  input: File | Blob
): Promise<string> {
  const blob = await compressImageToWebpBlob(input);
  const buf = await blob.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buf);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(
      null,
      bytes.subarray(i, i + chunk) as unknown as number[]
    );
  }
  return `data:image/webp;base64,${btoa(binary)}`;
}
