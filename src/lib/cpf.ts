/** Remove tudo que não é dígito. */
export function onlyDigitsCpf(input: string): string {
  return input.replace(/\D/g, "").slice(0, 11);
}

/** Valida formato (11 dígitos). */
export function isValidCpfFormat(digits: string): boolean {
  return digits.length === 11 && /^\d{11}$/.test(digits);
}

/**
 * Valida CPF com dígitos verificadores (Receita Federal).
 * Remove caracteres não numéricos antes de validar.
 */
export function validarCPF(cpf: string): boolean {
  const digits = onlyDigitsCpf(cpf);
  if (!isValidCpfFormat(digits)) return false;

  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]!, 10) * (10 - i);
  }
  let rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[9]!, 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]!, 10) * (11 - i);
  }
  rest = (sum * 10) % 11;
  if (rest === 10 || rest === 11) rest = 0;
  if (rest !== parseInt(digits[10]!, 10)) return false;

  return true;
}

export function formatCpfDisplay(digits: string): string {
  const d = onlyDigitsCpf(digits);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
}
