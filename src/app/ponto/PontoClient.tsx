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
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  profile: Profile;
  openLogId: string | null;
};

export function PontoClient({ profile, openLogId }: Props) {
  const router = useRouter();
  const cameraRef = useRef<FaceCameraHandle>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [faceOk, setFaceOk] = useState(false);
  const [gpsOk, setGpsOk] = useState(false);
  const [coords, setCoords] = useState<GeoCoords | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [faceError, setFaceError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [kmInicial, setKmInicial] = useState("");
  const [agua, setAgua] = useState(false);
  const [oleo, setOleo] = useState(false);
  const [pneus, setPneus] = useState(false);

  const [kmFinal, setKmFinal] = useState("");
  const [observacoes, setObservacoes] = useState("");

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
    if (!modelsReady || !master) return;

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
  }, [modelsReady, master]);

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

  const canSubmit =
    faceOk &&
    gpsOk &&
    coords !== null &&
    !saving &&
    (isClockIn ? kmInicial !== "" && !Number.isNaN(Number(kmInicial)) : kmFinal !== "" && !Number.isNaN(Number(kmFinal)));

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
          km_inicial: Number(kmInicial),
          check_water: agua,
          check_oil: oleo,
          check_tires: pneus,
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
            km_final: Number(kmFinal),
            observacoes_veiculo: observacoes.trim() || null,
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
      setKmInicial("");
      setKmFinal("");
      setObservacoes("");
      setAgua(false);
      setOleo(false);
      setPneus(false);
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
            {isClockIn
              ? "Complete a validação facial e GPS para liberar o envio."
              : "Encerre a jornada com validação facial e GPS."}
          </p>
        </div>

        <FaceCamera ref={cameraRef} />

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
            <p className="text-sm text-amber-800">
              {faceError ?? "Analisando rosto…"}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {isClockIn ? (
            <>
              <p className="text-sm font-medium text-slate-800">Manutenção de 1º escalão</p>
              <div>
                <label htmlFor="km-in" className="block text-sm text-slate-600">
                  KM inicial
                </label>
                <input
                  id="km-in"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={kmInicial}
                  onChange={(e) => setKmInicial(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 text-slate-800">
                  <input
                    type="checkbox"
                    checked={agua}
                    onChange={(e) => setAgua(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  Água
                </label>
                <label className="flex items-center gap-3 text-slate-800">
                  <input
                    type="checkbox"
                    checked={oleo}
                    onChange={(e) => setOleo(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  Óleo
                </label>
                <label className="flex items-center gap-3 text-slate-800">
                  <input
                    type="checkbox"
                    checked={pneus}
                    onChange={(e) => setPneus(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300"
                  />
                  Pneus
                </label>
              </div>
            </>
          ) : (
            <>
              <div>
                <label htmlFor="km-f" className="block text-sm text-slate-600">
                  KM final
                </label>
                <input
                  id="km-f"
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={kmFinal}
                  onChange={(e) => setKmFinal(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </div>
              <div>
                <label htmlFor="obs" className="block text-sm text-slate-600">
                  Observações do veículo
                </label>
                <textarea
                  id="obs"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Ex.: pneu dianteiro com desgaste irregular"
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
              {!gpsOk && "Ative o GPS e permita a localização. "}
              {!faceOk && "O reconhecimento facial deve estar válido. "}
              {isClockIn && kmInicial === "" && "Informe o KM inicial. "}
              {!isClockIn && kmFinal === "" && "Informe o KM final. "}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
