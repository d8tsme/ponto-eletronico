import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Profile = {
  id: string;
  full_name: string | null;
  cpf: string | null;
  master_photo_url: string | null;
  face_descriptor: number[] | null;
  face_embedding: string | null;
  face_registered: boolean;
  first_access_completed: boolean;
  is_admin: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireProfile(): Promise<{
  supabase: Awaited<ReturnType<typeof createClient>>;
  user: NonNullable<Awaited<ReturnType<typeof requireUser>>["user"]>;
  profile: Profile;
}> {
  const { supabase, user } = await requireUser();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, cpf, master_photo_url, face_descriptor, face_embedding, face_registered, first_access_completed, is_admin, created_at, updated_at"
    )
    .eq("id", user.id)
    .single();

  /* Usuário autenticado sem linha em profiles: onboarding, não /login (evita loop com o middleware). */
  if (error || !profile) {
    console.warn(
      `[Auth] Perfil não encontrado para usuário ${user.id}. Redirecionando para /primeiro-acesso`
    );
    redirect("/primeiro-acesso");
  }

  return {
    supabase,
    user,
    profile: profile as Profile,
  };
}

export async function requireAdmin() {
  const ctx = await requireProfile();
  if (!ctx.profile.is_admin) redirect("/ponto");
  return ctx;
}
