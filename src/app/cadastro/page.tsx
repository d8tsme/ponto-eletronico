"use client";

import { createClient } from "@/lib/supabase/client";
import { formatCpfDisplay, onlyDigitsCpf, validarCPF } from "@/lib/cpf";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [cpfInput, setCpfInput] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cpfDigits = onlyDigitsCpf(cpfInput);
  const cpfOk = validarCPF(cpfDigits);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const digits = onlyDigitsCpf(cpfInput);
    if (!validarCPF(digits)) {
      setError("CPF inválido. Verifique os dígitos.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          cpf: digits,
        },
      },
    });

    if (err) {
      setLoading(false);
      setError(err.message);
      return;
    }

    setLoading(false);
    router.push("/primeiro-acesso");
    router.refresh();
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-center text-2xl font-semibold text-slate-900">Criar conta</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          Use um e-mail válido e seu CPF
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700">
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">
              CPF <span className="text-red-600">*</span>
            </label>
            <input
              id="cpf"
              type="text"
              required
              inputMode="numeric"
              autoComplete="off"
              value={cpfInput}
              onChange={(e) => setCpfInput(formatCpfDisplay(e.target.value))}
              placeholder="000.000.000-00"
              maxLength={14}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading || !cpfOk}
            className="tap-target w-full rounded-lg bg-brand-600 px-4 py-3 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Criando…" : "Cadastrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
