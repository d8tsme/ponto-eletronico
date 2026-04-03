"use client";

import { FaceCamera, type FaceCameraHandle } from "@/components/FaceCamera";
import { compressImageToWebpBlob } from "@/lib/image-compress";
import {
  getFaceDescriptorFromImageData,
  loadFaceModels,
} from "@/lib/face";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export function PrimeiroAcessoForm() {
  const router = useRouter();
  const cameraRef = useRef<FaceCameraHandle>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceModels();
        if (!cancelled) setModelsReady(true);
      } catch {
        if (!cancelled) {
          setError(
            "Não foi possível carregar o reconhecimento facial. Verifique a conexão e recarregue."
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function captureAndSave() {
    setError(null);
    if (!modelsReady) {
      setError("Aguarde o carregamento dos modelos de face.");
      return;
    }
    const video = cameraRef.current?.getVideo();
    if (!video || video.readyState < 2) {
      setError("Câmera não está pronta. Aguarde a imagem aparecer.");
      return;
    }

    setLoading(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas indisponível");
      ctx.drawImage(video, 0, 0);

      const descriptor = await getFaceDescriptorFromImageData(canvas);
      if (!descriptor) {
        setError(
          "Rosto não detectado. Posicione o rosto centralizado, com boa iluminação, e tente novamente."
        );
        setLoading(false);
        return;
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao gerar imagem"))), "image/png");
      });
      const webp = await compressImageToWebpBlob(blob);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Sessão expirada. Faça login novamente.");
        setLoading(false);
        return;
      }

      // ====== UPLOAD FOTO PARA STORAGE ======
      const path = `${user.id}/master.webp`;
      console.log(`[FaceReg] Iniciando upload da foto mestra para: ${path}`);
      
      const { error: upErr } = await supabase.storage
        .from("ponto-fotos")
        .upload(path, webp, { upsert: true, contentType: "image/webp" });

      if (upErr) {
        console.error(`[FaceReg] Erro no upload: ${upErr.message}`);
        setError(`Erro ao salvar foto no servidor: ${upErr.message}`);
        setLoading(false);
        return;
      }
      console.log(`[FaceReg] Foto mestra salva com sucesso: ${path}`);

      // ====== UPDATE PROFILE NO BANCO ======
      // IMPORTANTE: ATUALIZAR ANTES DO REDIRECIONAMENTO
      console.log(`[FaceReg] Atualizando profile para usuário ${user.id}`);
      
      const { error: dbErr } = await supabase
        .from("profiles")
        .update({
          master_photo_url: path,
          face_descriptor: Array.from(descriptor),
          face_registered: true,
          first_access_completed: true,
        })
        .eq("id", user.id);

      if (dbErr) {
        console.error(
          `[FaceReg] Erro ao atualizar profile no banco de dados:`,
          dbErr
        );
        setError(
          `Erro ao salvar biometria no banco de dados: ${dbErr.message}`
        );
        setLoading(false);
        return;
      }
      console.log(`[FaceReg] Profile atualizado com sucesso`);

      // ====== REDIRECIONAMENTO APÓS PERSISTÊNCIA ======
      console.log(`[FaceReg] Redirect para /ponto`);
      router.push("/ponto");
      router.refresh();
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Erro ao salvar foto mestra.";
      console.error(`[FaceReg] Erro durante captura e salvamento:`, e);
      setError(errorMsg);
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Primeiro acesso</h1>
        <p className="mt-2 text-sm text-slate-600">
          Capture sua foto mestra para validação nas batidas de ponto. A imagem será comprimida em
          WebP antes do envio.
        </p>
      </div>

      <FaceCamera ref={cameraRef} />

      {!modelsReady && (
        <p className="text-center text-sm text-slate-600">Carregando modelos de reconhecimento…</p>
      )}

      {modelsReady && (
        <button
          type="button"
          onClick={captureAndSave}
          disabled={loading}
          className="tap-target w-full rounded-lg bg-brand-600 py-3 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Salvando…" : "Salvar foto mestra e continuar"}
        </button>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
