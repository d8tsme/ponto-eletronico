import { requireUser } from "@/lib/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { PrimeiroAcessoForm } from "./PrimeiroAcessoForm";
import { redirect } from "next/navigation";

export default async function PrimeiroAcessoPage() {
  const { user } = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_access_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.first_access_completed) redirect("/ponto");

  return (
    <div className="min-h-dvh bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-4">
        <p className="text-center text-sm font-medium text-brand-800">Configuração inicial</p>
      </header>
      <PrimeiroAcessoForm />
    </div>
  );
}
