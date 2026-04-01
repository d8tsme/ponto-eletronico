import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export type Profile = {
  id: string;
  full_name: string | null;
  master_photo_url: string | null;
  face_descriptor: number[] | null;
  first_access_completed: boolean;
  is_admin: boolean;
};

export async function requireUser() {
  const supabase = await createClient();
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
      "id, full_name, master_photo_url, face_descriptor, first_access_completed, is_admin"
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) {
    redirect("/login");
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
