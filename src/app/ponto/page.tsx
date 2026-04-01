import { requireProfile } from "@/lib/auth-helpers";
import { PontoClient } from "./PontoClient";
import { redirect } from "next/navigation";

export default async function PontoPage() {
  const { profile, supabase, user } = await requireProfile();

  if (!profile.first_access_completed) {
    redirect("/primeiro-acesso");
  }

  const { data: open } = await supabase
    .from("ponto_logs")
    .select("id")
    .eq("user_id", user.id)
    .is("clock_out_at", null)
    .order("clock_in_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return <PontoClient profile={profile} openLogId={open?.id ?? null} />;
}
