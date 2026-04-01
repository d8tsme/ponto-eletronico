/** PostgREST pode devolver relação 1:1 como objeto ou array; unificamos para o app. */

export type PontoLogRow = {
  id: string;
  user_id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  lat_in: number;
  lng_in: number;
  lat_out: number | null;
  lng_out: number | null;
  km_inicial: number;
  km_final: number | null;
  observacoes_veiculo: string | null;
  check_water: boolean;
  check_oil: boolean;
  check_tires: boolean;
  profiles: { full_name: string | null } | null;
};

type ProfileEmbed = { full_name: string | null } | { full_name: string | null }[] | null;

type RawRow = Omit<PontoLogRow, "profiles"> & { profiles?: ProfileEmbed };

function normalizeProfile(p: ProfileEmbed): { full_name: string | null } | null {
  if (p == null) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

export function normalizePontoLogRow(row: RawRow): PontoLogRow {
  return {
    ...row,
    profiles: normalizeProfile(row.profiles ?? null),
  };
}

/** Aceita linhas cruas do Supabase (profiles objeto ou array). */
export function normalizePontoLogRows(rows: unknown[]): PontoLogRow[] {
  return rows.map((r) => normalizePontoLogRow(r as RawRow));
}
