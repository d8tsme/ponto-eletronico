import { requireProfile } from "@/lib/auth-helpers";
import { getBrazilTodayBoundsUtc } from "@/lib/brazil-dates";
import { normalizePontoLogRows, type PontoLogRow } from "@/lib/normalizePontoLogs";
import { PontoClient } from "./PontoClient";
import { redirect } from "next/navigation";

export default async function PontoPage() {
  const { profile, supabase, user } = await requireProfile();

  if (!profile.first_access_completed) {
    redirect("/primeiro-acesso");
  }

  const { startIso, endIso } = getBrazilTodayBoundsUtc();

  const { data: todayRows } = await supabase
    .from("ponto_logs")
    .select(
      `
      id,
      user_id,
      created_at,
      clock_in_at,
      clock_out_at,
      lat_in,
      lng_in,
      lat_out,
      lng_out,
      photo_in_url,
      photo_out_url,
      km_inicial,
      km_final,
      agua_inicial,
      oleo_inicial,
      pneus_inicial,
      observacoes_entrada,
      agua_final,
      oleo_final,
      pneus_final,
      observacoes_saida,
      endereco_registro,
      endereco_saida,
      placa_veiculo,
      cpf_funcionario,
      profiles ( full_name )
    `
    )
    .eq("user_id", user.id)
    .gte("created_at", startIso)
    .lt("created_at", endIso)
    .order("created_at", { ascending: false })
    .limit(1);

  const rawToday = todayRows?.[0];
  const todayLog: PontoLogRow | null = rawToday ? normalizePontoLogRows([rawToday])[0]! : null;

  const journeyCompletedToday = todayLog != null && todayLog.clock_out_at != null;

  const { data: open } = await supabase
    .from("ponto_logs")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const openLogId = journeyCompletedToday ? null : open?.id ?? null;

  return (
    <PontoClient
      profile={profile}
      openLogId={openLogId}
      journeyCompletedToday={journeyCompletedToday}
      todayLog={todayLog}
    />
  );
}
