/** Remove tudo que não é dígito. */
export function onlyDigitsCpf(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/** Valida formato (11 dígitos). Validação de dígitos verificadores opcional — aqui só tamanho. */
export function isValidCpfFormat(digits: string): boolean {
  return digits.length === 11 && /^\d{11}$/.test(digits);
}

export function formatCpfDisplay(digits: string): string {
  const d = onlyDigitsCpf(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}
