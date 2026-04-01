import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type TimesheetRow = {
  funcionario: string;
  data: string;
  horaInicio: string;
  horaFim: string;
  horas: string;
  kmTotal: string;
  statusVeiculo: string;
};

type LogLike = {
  clock_in_at: string;
  clock_out_at: string | null;
  km_inicial: number;
  km_final: number | null;
  observacoes_veiculo: string | null;
  check_water: boolean;
  check_oil: boolean;
  check_tires: boolean;
  profiles: { full_name: string | null } | null;
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}

function hoursWorked(clockIn: string, clockOut: string | null): number {
  if (!clockOut) return 0;
  return (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000;
}

function statusText(row: LogLike): string {
  const parts: string[] = [];
  if (row.check_water) parts.push("Água");
  if (row.check_oil) parts.push("Óleo");
  if (row.check_tires) parts.push("Pneus");
  const checks = parts.length ? `Verif.: ${parts.join(", ")}` : "";
  const obs = row.observacoes_veiculo?.trim();
  return [checks, obs].filter(Boolean).join(" — ") || "—";
}

/** Agrupa registros por funcionário e calcula total de horas no mês filtrado. */
export function buildTimesheetRows(
  logs: LogLike[],
  yearMonth: string
): { rows: TimesheetRow[]; totalsByEmployee: Map<string, number> } {
  const [y, m] = yearMonth.split("-").map(Number);
  const totalsByEmployee = new Map<string, number>();

  const filtered = logs.filter((log) => {
    const d = new Date(log.clock_in_at);
    return d.getFullYear() === y && d.getMonth() + 1 === m;
  });

  const rows: TimesheetRow[] = filtered.map((log) => {
    const name = log.profiles?.full_name ?? "—";
    const h = hoursWorked(log.clock_in_at, log.clock_out_at);
    totalsByEmployee.set(name, (totalsByEmployee.get(name) ?? 0) + h);

    const km =
      log.km_final != null ? Math.max(0, log.km_final - log.km_inicial) : null;

    return {
      funcionario: name,
      data: formatDate(log.clock_in_at),
      horaInicio: formatTime(log.clock_in_at),
      horaFim: log.clock_out_at ? formatTime(log.clock_out_at) : "—",
      horas: log.clock_out_at ? h.toFixed(2) : "—",
      kmTotal: km != null ? String(km) : "—",
      statusVeiculo: statusText(log),
    };
  });

  rows.sort((a, b) => a.funcionario.localeCompare(b.funcionario) || a.data.localeCompare(b.data));

  return { rows, totalsByEmployee };
}

export function exportTimesheetPdf(
  yearMonth: string,
  logs: LogLike[],
  companyName = "EMPRESA EXEMPLO LTDA"
): void {
  const { rows, totalsByEmployee } = buildTimesheetRows(logs, yearMonth);
  const [y, m] = yearMonth.split("-").map(Number);
  const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  doc.setFillColor(21, 128, 61);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(companyName, 14, 14);
  doc.setFontSize(10);
  doc.text("Documento interno — Folha de ponto & frota", 14, 22);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.text(`Folha de ponto — ${monthLabel}`, 14, 38);
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Timbrado fictício para demonstração. Não substitui obrigações legais locais.", 14, 44);

  autoTable(doc, {
    startY: 50,
    head: [
      [
        "Funcionário",
        "Data",
        "Início",
        "Término",
        "Horas",
        "KM",
        "Status veículo",
      ],
    ],
    body: rows.map((r) => [
      r.funcionario,
      r.data,
      r.horaInicio,
      r.horaFim,
      r.horas,
      r.kmTotal,
      r.statusVeiculo.length > 60 ? `${r.statusVeiculo.slice(0, 57)}…` : r.statusVeiculo,
    ]),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [21, 128, 61] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  const docWithTable = doc as jsPDF & { lastAutoTable?: { finalY: number } };
  const finalY = docWithTable.lastAutoTable?.finalY ?? 50;

  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text("Totais de horas no mês (por funcionário):", 14, finalY + 10);

  let y = finalY + 16;
  totalsByEmployee.forEach((total, name) => {
    doc.text(`${name}: ${total.toFixed(2)} h`, 14, y);
    y += 6;
  });

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Gerado em ${new Date().toLocaleString("pt-BR")} — Ponto Eletrônico PWA`,
    14,
    285
  );

  doc.save(`folha-ponto-${yearMonth}.pdf`);
}
