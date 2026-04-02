"use client";

import { exportTimesheetPdf } from "@/lib/exportTimesheetPdf";
import { exportPontoLogsCsv } from "@/lib/exportCsv";
import { mapsLink } from "@/lib/geo";
import {
  normalizePontoLogRows,
  type PontoLogRow,
} from "@/lib/normalizePontoLogs";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useMemo, useState } from "react";

export type { PontoLogRow };

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
  const placa = row.placa_veiculo ? `Placa ${row.placa_veiculo}` : "";
  const entrada = [
    placa,
    `Água: ${row.agua_inicial ?? "—"}`,
    `Óleo: ${row.oleo_inicial ?? "—"}`,
    `Pneus: ${row.pneus_inicial ?? "—"}`,
  ]
    .filter(Boolean)
    .join(" · ");
  const obsIn = row.observacoes_entrada?.trim();
  const inBlock = [entrada, obsIn].filter(Boolean).join(" — ");

  if (!row.clock_out_at) {
    return inBlock || "—";
  }

  const saida = [
    `Água: ${row.agua_final ?? "—"}`,
    `Óleo: ${row.oleo_final ?? "—"}`,
    `Pneus: ${row.pneus_final ?? "—"}`,
  ].join(" · ");
  const obsOut = row.observacoes_saida?.trim();
  const outBlock = [saida, obsOut].filter(Boolean).join(" — ");

  return [`Entrada: ${inBlock}`, `Saída: ${outBlock}`].join(" | ");
}

export function AdminClient({ initialLogs, defaultYearMonth }: Props) {
  const [logs, setLogs] = useState(initialLogs);
  const [yearMonth, setYearMonth] = useState(defaultYearMonth);
  const [nameFilter, setNameFilter] = useState("");
  const [plateFilter, setPlateFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const displayed = useMemo(() => {
    const nf = nameFilter.trim().toLowerCase();
    const pf = plateFilter.trim().toLowerCase();

    return logs.filter((log) => {
      const name = (log.profiles?.full_name ?? "").toLowerCase();
      if (nf && !name.includes(nf)) return false;

      const plate = (log.placa_veiculo ?? "").toLowerCase();
      if (pf && !plate.includes(pf)) return false;

      const t = new Date(log.clock_in_at);
      if (dateFrom) {
        const from = new Date(`${dateFrom}T00:00:00`);
        if (t < from) return false;
      }
      if (dateTo) {
        const to = new Date(`${dateTo}T23:59:59.999`);
        if (t > to) return false;
      }
      return true;
    });
  }, [logs, nameFilter, plateFilter, dateFrom, dateTo]);

  const filteredByMonthForPdf = useMemo(() => {
    const [y, m] = yearMonth.split("-").map(Number);
    return displayed.filter((log) => {
      const d = new Date(log.clock_in_at);
      return d.getFullYear() === y && d.getMonth() + 1 === m;
    });
  }, [displayed, yearMonth]);

  async function refresh() {
    const supabase = createClient();
    const { data } = await supabase
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
      .order("clock_in_at", { ascending: false })
      .limit(5000);
    if (data) setLogs(normalizePontoLogRows(data));
  }

  function handleExportCsv(): void {
    const stamp = new Date().toISOString().slice(0, 10);
    exportPontoLogsCsv(displayed, `ponto_logs_${stamp}.csv`);
  }

  return (
    <div className="min-h-dvh bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
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

      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="filter-name" className="block text-sm font-medium text-slate-700">
              Nome do funcionário
            </label>
            <input
              id="filter-name"
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              placeholder="Filtrar por nome"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="filter-plate" className="block text-sm font-medium text-slate-700">
              Placa
            </label>
            <input
              id="filter-plate"
              type="text"
              value={plateFilter}
              onChange={(e) => setPlateFilter(e.target.value.toUpperCase())}
              placeholder="ABC1D23"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 uppercase"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor="df" className="block text-sm font-medium text-slate-700">
                Data inicial
              </label>
              <input
                id="df"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label htmlFor="dt" className="block text-sm font-medium text-slate-700">
                Data final
              </label>
              <input
                id="dt"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label htmlFor="ym" className="block text-sm font-medium text-slate-700">
              Mês (PDF folha)
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
            onClick={() => exportTimesheetPdf(yearMonth, filteredByMonthForPdf)}
            className="rounded-lg bg-brand-600 px-4 py-2.5 font-medium text-white hover:bg-brand-700"
          >
            Exportar folha de ponto (PDF)
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 font-medium text-slate-800 hover:bg-slate-50"
          >
            Exportar CSV
          </button>
          <p className="text-xs text-slate-500">
            Tabela: {displayed.length} registro(s) após filtros · CSV usa os mesmos filtros.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Funcionário</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">CPF (reg.)</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Placa</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Data</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Início</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Término</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">KM total</th>
                <th className="min-w-[200px] px-4 py-3 font-semibold text-slate-700">Status</th>
                <th className="min-w-[160px] px-4 py-3 font-semibold text-slate-700">Endereço (entrada)</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-slate-700">Mapas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-slate-500">
                    Nenhum registro com os filtros atuais.
                  </td>
                </tr>
              )}
              {displayed.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-900">
                    {row.profiles?.full_name ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {row.cpf_funcionario ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {row.placa_veiculo ?? "—"}
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
                  <td className="max-w-xs whitespace-normal break-words px-4 py-3 text-xs text-slate-600">
                    {statusVeiculo(row)}
                  </td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-xs text-slate-600" title={row.endereco_registro ?? ""}>
                    {row.endereco_registro ?? "—"}
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
