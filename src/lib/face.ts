"use client";

import * as faceapi from "face-api.js";

const MODEL_BASE =
  process.env.NEXT_PUBLIC_FACE_API_MODELS_URL ||
  "https://unpkg.com/face-api.js@0.22.2/weights";

/** Distância euclidiana máxima para considerar o rosto igual à foto mestra (tolerância 0.6). */
export const FACE_MATCH_THRESHOLD = 0.6;

let modelsLoaded = false;

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_BASE);
  await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_BASE);
  await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_BASE);
  modelsLoaded = true;
}

export async function getFaceDescriptorFromVideo(
  video: HTMLVideoElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

export async function getFaceDescriptorFromImageData(
  image: HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

export function descriptorFromJson(arr: number[]): Float32Array {
  return new Float32Array(arr);
}

export function compareDescriptors(
  reference: Float32Array,
  candidate: Float32Array
): number {
  return faceapi.euclideanDistance(reference, candidate);
}

export function isFaceMatch(distance: number): boolean {
  return distance < FACE_MATCH_THRESHOLD;
}
