import type { PontoLogRow } from "@/lib/normalizePontoLogs";

function escapeCsvCell(value: string | number | null | undefined): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CSV_HEADERS = [
  "id",
  "user_id",
  "clock_in_at",
  "clock_out_at",
  "lat_in",
  "lng_in",
  "lat_out",
  "lng_out",
  "photo_in_url",
  "photo_out_url",
  "km_inicial",
  "km_final",
  "agua_inicial",
  "oleo_inicial",
  "pneus_inicial",
  "observacoes_entrada",
  "agua_final",
  "oleo_final",
  "pneus_final",
  "observacoes_saida",
  "endereco_registro",
  "endereco_saida",
  "placa_veiculo",
  "cpf_funcionario",
  "created_at",
  "funcionario_nome",
] as const;

export function exportPontoLogsCsv(rows: PontoLogRow[], filename = "ponto_logs.csv"): void {
  const lines: string[] = [CSV_HEADERS.join(",")];

  for (const row of rows) {
    const line = [
      escapeCsvCell(row.id),
      escapeCsvCell(row.user_id),
      escapeCsvCell(row.clock_in_at),
      escapeCsvCell(row.clock_out_at),
      escapeCsvCell(row.lat_in),
      escapeCsvCell(row.lng_in),
      escapeCsvCell(row.lat_out),
      escapeCsvCell(row.lng_out),
      escapeCsvCell(row.photo_in_url),
      escapeCsvCell(row.photo_out_url),
      escapeCsvCell(row.km_inicial),
      escapeCsvCell(row.km_final),
      escapeCsvCell(row.agua_inicial),
      escapeCsvCell(row.oleo_inicial),
      escapeCsvCell(row.pneus_inicial),
      escapeCsvCell(row.observacoes_entrada),
      escapeCsvCell(row.agua_final),
      escapeCsvCell(row.oleo_final),
      escapeCsvCell(row.pneus_final),
      escapeCsvCell(row.observacoes_saida),
      escapeCsvCell(row.endereco_registro),
      escapeCsvCell(row.endereco_saida),
      escapeCsvCell(row.placa_veiculo),
      escapeCsvCell(row.cpf_funcionario),
      escapeCsvCell(row.created_at),
      escapeCsvCell(row.profiles?.full_name ?? ""),
    ].join(",");
    lines.push(line);
  }

  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
