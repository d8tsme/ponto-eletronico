/** PostgREST pode devolver relação 1:1 como objeto ou array; unificamos para o app. */

export type PontoLogRow = {
  id: string;
  user_id: string;
  created_at: string;
  clock_in_at: string;
  clock_out_at: string | null;
  lat_in: number;
  lng_in: number;
  lat_out: number | null;
  lng_out: number | null;
  photo_in_url: string | null;
  photo_out_url: string | null;
  km_inicial: number;
  km_final: number | null;
  agua_inicial: string;
  oleo_inicial: string;
  pneus_inicial: string;
  observacoes_entrada: string;
  agua_final: string | null;
  oleo_final: string | null;
  pneus_final: string | null;
  observacoes_saida: string | null;
  endereco_registro: string | null;
  endereco_saida: string | null;
  placa_veiculo: string | null;
  cpf_funcionario: string | null;
  profiles: { full_name: string | null } | null;
};

type ProfileEmbed = { full_name: string | null } | { full_name: string | null }[] | null;

type RawRow = Omit<PontoLogRow, "profiles"> & {
  profiles?: ProfileEmbed;
  agua_inicial?: string | null;
  oleo_inicial?: string | null;
  pneus_inicial?: string | null;
  observacoes_entrada?: string | null;
};

function normalizeProfile(p: ProfileEmbed): { full_name: string | null } | null {
  if (p == null) return null;
  if (Array.isArray(p)) return p[0] ?? null;
  return p;
}

export function normalizePontoLogRow(row: RawRow): PontoLogRow {
  return {
    ...row,
    created_at: row.created_at ?? row.clock_in_at,
    agua_inicial: row.agua_inicial ?? "",
    oleo_inicial: row.oleo_inicial ?? "",
    pneus_inicial: row.pneus_inicial ?? "",
    observacoes_entrada: row.observacoes_entrada ?? "",
    endereco_registro: row.endereco_registro ?? null,
    endereco_saida: row.endereco_saida ?? null,
    placa_veiculo: row.placa_veiculo ?? null,
    cpf_funcionario: row.cpf_funcionario ?? null,
    profiles: normalizeProfile(row.profiles ?? null),
  };
}

/** Aceita linhas cruas do Supabase (profiles objeto ou array). */
export function normalizePontoLogRows(rows: unknown[]): PontoLogRow[] {
  return rows.map((r) => normalizePontoLogRow(r as RawRow));
}
