import { requireProfile } from "@/lib/auth-helpers";
import { PrimeiroAcessoForm } from "./PrimeiroAcessoForm";
import { redirect } from "next/navigation";

export default async function PrimeiroAcessoPage() {
  const { profile } = await requireProfile();
  if (profile.first_access_completed) redirect("/ponto");

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <p className="text-center text-sm font-medium text-brand-800">Configuração inicial</p>
      </header>
      <PrimeiroAcessoForm />
    </div>
  );
}
