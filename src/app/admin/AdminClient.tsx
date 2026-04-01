"use client";

import { exportTimesheetPdf } from "@/lib/exportTimesheetPdf";
import { mapsLink } from "@/lib/geo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useMemo, useState } from "react";

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

type Props = {
  initialLogs: PontoLogRow[];
  defaultYearMonth: string;
};

function currentYearMonth(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function kmTotal(row: PontoLogRow): string {
  if (row.km_final == null) return "—";
  return String(Math.max(0, row.km_final - row.km_inicial));
}

function statusVeiculo(row: PontoLogRow): string {
  const parts: string[] = [];
  if (row.check_water) parts.push("Água");
  if (row.check_oil) parts.push("Óleo");
  if (row.check_tires) parts.push("Pneus");
  const v = parts.length ? `Verif.: ${parts.join(", ")}` : "";
  const o = row.observacoes_veiculo?.trim();
  return [v, o].filter(Boolean).join(" — ") || "—";
}

export function AdminClient({ initialLogs, defaultYearMonth }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [yearMonth, setYearMonth] = useState(defaultYearMonth);

  const filtered = useMemo(() => {
    const [y, m] = yearMonth.split("-").map(Number);
    return logs.filter((log) => {
      const d = new Date(log.clock_in_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [logs, yearMonth]);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
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
        km_inicial,
        km_final,
        observacoes_veiculo,
        check_water,
        check_oil,
        check_tires,
        profiles ( full_name )
      `
      )
      .order("clock_in_at", { ascending: false })
      .limit(1000);
    if (data) setLogs(data as PontoLogRow[]);
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Painel administrativo</h1>
            <p className="text-sm text-slate-600">Registros de ponto e frota</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/ponto"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Voltar ao ponto
            </Link>
            <button
              type="button"
              onClick={() => refresh()}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Atualizar
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 px-4 py-6">
        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label htmlFor="ym" className="block text-sm font-medium text-slate-700">
              Mês da folha / filtro
            </label>
            <input
              id="ym"
              type="month"
              value={yearMonth}
              onChange={(e) => setYearMonth(e.target.value || currentYearMonth())}
              className="mt-1 rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <button
            type="button"
            onClick={() => exportTimesheetPdf(yearMonth, logs)}
            className="rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Exportar folha de ponto (PDF)
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Funcionário</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Data</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Início</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Término</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">KM total</th>
                <th className="min-w-[200px] px-4 py-3 font-semibold text-slate-700">Status veículo</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Mapas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum registro neste período.
                  </td>
                </tr>
              )}
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                    {row.profiles?.full_name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {new Date(row.clock_in_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {new Date(row.clock_in_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {row.clock_out_at
                      ? new Date(row.clock_out_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">{kmTotal(row)}</td>
                  <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={statusVeiculo(row)}>
                    {statusVeiculo(row)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <a
                        href={mapsLink(row.lat_in, row.lng_in)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700 underline"
                      >
                        Entrada
                      </a>
                      {row.lat_out != null && row.lng_out != null && (
                        <a
                          href={mapsLink(row.lat_out, row.lng_out)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-700 underline"
                        >
                          Saída
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
