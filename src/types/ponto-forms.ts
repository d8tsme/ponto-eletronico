/** Formulário de entrada (batida de entrada). */
export type PontoEntradaFormState = {
  km_inicial: string;
  agua_inicial: string;
  oleo_inicial: string;
  pneus_inicial: string;
  observacoes_entrada: string;
  placa_veiculo: string;
};

/** Formulário de saída (batida de saída) — mesma ideia, campos finais. */
export type PontoSaidaFormState = {
  km_final: string;
  agua_final: string;
  oleo_final: string;
  pneus_final: string;
  observacoes_saida: string;
  placa_veiculo: string;
};

export const EMPTY_ENTRADA: PontoEntradaFormState = {
  km_inicial: "",
  agua_inicial: "",
  oleo_inicial: "",
  pneus_inicial: "",
  observacoes_entrada: "",
  placa_veiculo: "",
};

export const EMPTY_SAIDA: PontoSaidaFormState = {
  km_final: "",
  agua_final: "",
  oleo_final: "",
  pneus_final: "",
  observacoes_saida: "",
  placa_veiculo: "",
};

export function isEntradaFormValid(f: PontoEntradaFormState): boolean {
  const km = Number(f.km_inicial);
  return (
    f.km_inicial.trim() !== "" &&
    Number.isFinite(km) &&
    km >= 0 &&
    f.agua_inicial.trim() !== "" &&
    f.oleo_inicial.trim() !== "" &&
    f.pneus_inicial.trim() !== "" &&
    f.placa_veiculo.trim() !== ""
  );
}

export function isSaidaFormValid(f: PontoSaidaFormState): boolean {
  const km = Number(f.km_final);
  return (
    f.km_final.trim() !== "" &&
    Number.isFinite(km) &&
    km >= 0 &&
    f.agua_final.trim() !== "" &&
    f.oleo_final.trim() !== "" &&
    f.pneus_final.trim() !== "" &&
    f.placa_veiculo.trim() !== ""
  );
}
