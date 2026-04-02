import { requireAdmin } from "@/lib/auth-helpers";
import { normalizePontoLogRows } from "@/lib/normalizePontoLogs";
import { AdminClient } from "./AdminClient";

function defaultYearMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export default async function AdminPage() {
  const { supabase } = await requireAdmin();
  const { data: logs, error } = await supabase
    .from("ponto_logs")
    .select(
      `
      id,
      user_id,
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
      profiles ( full_name )
    `
    )
    .order("clock_in_at", { ascending: false })
    .limit(1000);

  if (error) {
    return (
      <div className="p-8 text-center text-red-700">
        Erro ao carregar registros: {error.message}
      </div>
    );
  }

  return (
    <AdminClient
      initialLogs={normalizePontoLogRows(logs ?? [])}
      defaultYearMonth={defaultYearMonth()}
    />
  );
}
