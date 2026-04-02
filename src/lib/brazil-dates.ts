/** Limites UTC do dia civil em America/Sao_Paulo (UTC−3, sem horário de verão). */

export function getBrazilTodayBoundsUtc(): { startIso: string; endIso: string } {
  const now = new Date();
  const s = now.toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" });
  const datePart = s.split(" ")[0];
  if (!datePart) {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0);
    const e = new Date(t.getTime() + 86400000);
    return { startIso: t.toISOString(), endIso: e.toISOString() };
  }
  const [y, m, d] = datePart.split("-").map(Number);
  const startUtc = new Date(Date.UTC(y, m - 1, d, 3, 0, 0, 0));
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  return { startIso: startUtc.toISOString(), endIso: endUtc.toISOString() };
}
