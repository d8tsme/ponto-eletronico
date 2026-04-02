"use client";

import { FaceCamera, type FaceCameraHandle } from "@/components/FaceCamera";
import {
  compareDescriptors,
  descriptorFromJson,
  getFaceDescriptorFromVideo,
  isFaceMatch,
  loadFaceModels,
} from "@/lib/face";
import type { Profile } from "@/lib/auth-helpers";
import { compressImageToWebpBlob } from "@/lib/image-compress";
import { createClient } from "@/lib/supabase/client";
import { getCurrentPosition, type GeoCoords } from "@/lib/geo";
import {
  EMPTY_ENTRADA,
  EMPTY_SAIDA,
  isEntradaFormValid,
  isSaidaFormValid,
  type PontoEntradaFormState,
  type PontoSaidaFormState,
} from "@/types/ponto-forms";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  profile: Profile;
  openLogId: string | null;
};

type Step = 1 | 2;

export function PontoClient({ profile, openLogId }: Props) {
  const router = useRouter();
  const cameraRef = useRef<FaceCameraHandle>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [step, setStep] = useState<Step>(1);
  const [modelsReady, setModelsReady] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [entrada, setEntrada] = useState<PontoEntradaFormState>({ ...EMPTY_ENTRADA });
  const [saida, setSaida] = useState<PontoSaidaFormState>({ ...EMPTY_SAIDA });

  const master =
    profile.face_descriptor && profile.face_descriptor.length > 0
      ? descriptorFromJson(profile.face_descriptor)
      : null;

  const isClockIn = !openLogId;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadFaceModels();
        if (!cancelled) setModelsReady(true);
      } catch {
        if (!cancelled) {
          setFaceError("Falha ao carregar modelos de face. Recarregue a página.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshGps = useCallback(() => {
    setGpsError(null);
    setGpsOk(false);
    getCurrentPosition()
      .then((c) => {
        setCoords(c);
        setGpsOk(true);
      })
      .catch((e: Error) => {
        setCoords(null);
        setGpsOk(false);
        setGpsError(e.message);
      });
  }, []);

  useEffect(() => {
    refreshGps();
  }, [refreshGps]);

  useEffect(() => {
    if (!modelsReady || !master || step !== 1) {
      if (faceIntervalRef.current) {
        clearInterval(faceIntervalRef.current);
        faceIntervalRef.current = null;
      }
      return;
    }

    faceIntervalRef.current = setInterval(async () => {
      const video = cameraRef.current?.getVideo();
      if (!video || video.readyState < 2) return;
      try {
        const desc = await getFaceDescriptorFromVideo(video);
        if (!desc) {
          setFaceOk(false);
          setFaceError(
            "Nenhum rosto detectado. Centralize o rosto na câmera com boa iluminação."
          );
          return;
        }
        const dist = compareDescriptors(master, desc);
        const ok = isFaceMatch(dist);
        setFaceOk(ok);
        setFaceError(
          ok
            ? null
            : `Rosto não reconhecido (distância ${dist.toFixed(3)}). Alinhe-se à foto mestra.`
        );
      } catch {
        setFaceOk(false);
        setFaceError("Erro ao analisar o rosto.");
      }
    }, 700);

    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [modelsReady, master, step]);

  async function captureFrameBlob(): Promise<Blob> {
    const video = cameraRef.current?.getVideo();
    if (!video || video.readyState < 2) {
      throw new Error("Câmera não está pronta.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas indisponível");
    ctx.drawImage(video, 0, 0);
    const png = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha na captura"))), "image/png");
    });
    return compressImageToWebpBlob(png);
  }

  const canGoToStep2 = step === 1 && faceOk && gpsOk && coords !== null;

  const canSubmit =
    step === 2 &&
    gpsOk &&
    coords !== null &&
    !saving &&
    (isClockIn ? isEntradaFormValid(entrada) : isSaidaFormValid(saida));

  function resetAllAfterSuccess(): void {
    setStep(1);
    setEntrada({ ...EMPTY_ENTRADA });
    setSaida({ ...EMPTY_SAIDA });
    setSubmitError(null);
    setFaceOk(false);
    refreshGps();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!canSubmit || !coords) return;

    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSubmitError("Sessão expirada.");
        setSaving(false);
        return;
      }

      const webp = await captureFrameBlob();
      const ts = Date.now();
      const path = isClockIn
        ? `${user.id}/in-${ts}.webp`
        : `${user.id}/out-${ts}.webp`;

      const { error: upErr } = await supabase.storage
        .from("ponto-fotos")
        .upload(path, webp, { contentType: "image/webp" });
      if (upErr) {
        setSubmitError(upErr.message);
        setSaving(false);
        return;
      }

      if (isClockIn) {
        const { error: insErr } = await supabase.from("ponto_logs").insert({
          user_id: user.id,
          clock_in_at: new Date().toISOString(),
          lat_in: coords.latitude,
          lng_in: coords.longitude,
          photo_in_url: path,
          km_inicial: Number(entrada.km_inicial),
          agua_inicial: entrada.agua_inicial.trim(),
          oleo_inicial: entrada.oleo_inicial.trim(),
          pneus_inicial: entrada.pneus_inicial.trim(),
          observacoes_entrada: entrada.observacoes_entrada.trim(),
        });
        if (insErr) {
          setSubmitError(insErr.message);
          setSaving(false);
          return;
        }
      } else if (openLogId) {
        const { error: updErr } = await supabase
          .from("ponto_logs")
          .update({
            clock_out_at: new Date().toISOString(),
            lat_out: coords.latitude,
            lng_out: coords.longitude,
            photo_out_url: path,
            km_final: Number(saida.km_final),
            agua_final: saida.agua_final.trim(),
            oleo_final: saida.oleo_final.trim(),
            pneus_final: saida.pneus_final.trim(),
            observacoes_saida: saida.observacoes_saida.trim(),
          })
          .eq("id", openLogId)
          .eq("user_id", user.id);
        if (updErr) {
          setSubmitError(updErr.message);
          setSaving(false);
          return;
        }
      }

      router.refresh();
      resetAllAfterSuccess();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao salvar.");
    }
    setSaving(false);
  }

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!master) {
    return (
      <p className="p-6 text-center text-red-700">
        Perfil sem descritor facial. Conclua o primeiro acesso.
      </p>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-50 pb-10">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Olá</p>
            <p className="font-semibold text-slate-900">{profile.full_name ?? "Colaborador"}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile.is_admin && (
              <Link
                href="/admin"
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Admin
              </Link>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-center text-sm font-medium text-slate-800">
            {isClockIn ? "Registrar entrada" : "Registrar saída"}
          </p>
          <p className="mt-1 text-center text-xs text-slate-500">
            Etapa {step}/2 —{" "}
            {step === 1
              ? "Reconhecimento facial e localização"
              : "Detalhes do veículo e quilometragem"}
          </p>
        </div>

        {/* Etapa 1: câmera visível; na etapa 2 mantém-se montada para captura no envio */}
        <div
          className={
            step === 1
              ? "space-y-3"
              : "sr-only absolute left-0 top-0 h-px w-px overflow-hidden"
          }
          aria-hidden={step === 2}
        >
          <FaceCamera ref={cameraRef} />
        </div>

        {step === 1 && (
          <>
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-slate-700">GPS</span>
                <button
                  type="button"
                  onClick={refreshGps}
                  className="text-sm text-brand-700 underline"
                >
                  Atualizar localização
                </button>
              </div>
              {gpsOk && coords && (
                <p className="text-sm text-green-800">
                  Localização obtida: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
                </p>
              )}
              {gpsError && (
                <p className="text-sm text-red-700" role="alert">
                  {gpsError}
                </p>
              )}
            </div>

            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <span className="text-sm font-medium text-slate-700">Reconhecimento facial</span>
              {faceOk ? (
                <p className="text-sm text-green-800">Rosto validado em relação à foto mestra.</p>
              ) : (
                <p className="text-sm text-amber-800">{faceError ?? "Analisando rosto…"}</p>
              )}
            </div>

            <button
              type="button"
              disabled={!canGoToStep2}
              onClick={() => setStep(2)}
              className="tap-target w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continuar para o formulário
            </button>
            {!canGoToStep2 && (
              <p className="text-center text-xs text-slate-500">
                {!gpsOk && "Ative o GPS e permita a localização. "}
                {!faceOk && "O reconhecimento facial deve estar válido. "}
              </p>
            )}
          </>
        )}

        {step === 2 && (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <p className="text-sm font-medium text-slate-800">Localização</p>
              <button
                type="button"
                onClick={refreshGps}
                className="text-sm text-brand-700 underline"
              >
                Atualizar GPS
              </button>
            </div>
            {gpsOk && coords && (
              <p className="text-xs text-green-800">
                {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
              </p>
            )}
            {gpsError && (
              <p className="text-sm text-red-700" role="alert">
                {gpsError}
              </p>
            )}

            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-slate-600 underline"
            >
              ← Voltar à etapa facial
            </button>

            {isClockIn ? (
              <>
                <p className="text-sm font-medium text-slate-800">Entrada — veículo</p>
                <div>
                  <label htmlFor="km-in" className="block text-sm text-slate-600">
                    KM inicial <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="km-in"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    required
                    value={entrada.km_inicial}
                    onChange={(e) =>
                      setEntrada((s) => ({ ...s, km_inicial: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="agua-in" className="block text-sm text-slate-600">
                    Status — Água <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="agua-in"
                    type="text"
                    required
                    value={entrada.agua_inicial}
                    onChange={(e) =>
                      setEntrada((s) => ({ ...s, agua_inicial: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Baixo"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="oleo-in" className="block text-sm text-slate-600">
                    Status — Óleo <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="oleo-in"
                    type="text"
                    required
                    value={entrada.oleo_inicial}
                    onChange={(e) =>
                      setEntrada((s) => ({ ...s, oleo_inicial: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Trocado"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="pneus-in" className="block text-sm text-slate-600">
                    Status — Pneus <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="pneus-in"
                    type="text"
                    required
                    value={entrada.pneus_inicial}
                    onChange={(e) =>
                      setEntrada((s) => ({ ...s, pneus_inicial: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Desgaste"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="obs-in" className="block text-sm text-slate-600">
                    Observações (entrada)
                  </label>
                  <textarea
                    id="obs-in"
                    rows={3}
                    value={entrada.observacoes_entrada}
                    onChange={(e) =>
                      setEntrada((s) => ({ ...s, observacoes_entrada: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Observações adicionais na entrada"
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-800">Saída — veículo</p>
                <div>
                  <label htmlFor="km-f" className="block text-sm text-slate-600">
                    KM final <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="km-f"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    required
                    value={saida.km_final}
                    onChange={(e) => setSaida((s) => ({ ...s, km_final: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="agua-f" className="block text-sm text-slate-600">
                    Status — Água (final) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="agua-f"
                    type="text"
                    required
                    value={saida.agua_final}
                    onChange={(e) =>
                      setSaida((s) => ({ ...s, agua_final: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Baixo"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="oleo-f" className="block text-sm text-slate-600">
                    Status — Óleo (final) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="oleo-f"
                    type="text"
                    required
                    value={saida.oleo_final}
                    onChange={(e) =>
                      setSaida((s) => ({ ...s, oleo_final: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Trocado"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="pneus-f" className="block text-sm text-slate-600">
                    Status — Pneus (final) <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="pneus-f"
                    type="text"
                    required
                    value={saida.pneus_final}
                    onChange={(e) =>
                      setSaida((s) => ({ ...s, pneus_final: e.target.value }))
                    }
                    placeholder="Ex.: Ok, Desgaste"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>
                <div>
                  <label htmlFor="obs-out" className="block text-sm text-slate-600">
                    Observações (saída)
                  </label>
                  <textarea
                    id="obs-out"
                    rows={3}
                    value={saida.observacoes_saida}
                    onChange={(e) =>
                      setSaida((s) => ({ ...s, observacoes_saida: e.target.value }))
                    }
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                    placeholder="Observações adicionais na saída"
                  />
                </div>
              </>
            )}

            {submitError && (
              <p className="text-sm text-red-700" role="alert">
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="tap-target w-full rounded-lg bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Enviando…" : isClockIn ? "Salvar entrada" : "Salvar saída"}
            </button>
            {!canSubmit && !saving && (
              <p className="text-center text-xs text-slate-500">
                {!gpsOk && "GPS necessário para enviar. "}
                {isClockIn && !isEntradaFormValid(entrada) && "Preencha KM e status de água, óleo e pneus. "}
                {!isClockIn && !isSaidaFormValid(saida) && "Preencha KM final e status de água, óleo e pneus. "}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
