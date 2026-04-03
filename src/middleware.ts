import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Formato usado por @supabase/ssr ao propagar cookies de sessão.
 * Importante: ao devolver `NextResponse.redirect()`, os cookies atualizados
 * durante `getUser()` precisam ser copiados; caso contrário o servidor não
 * vê a sessão e ocorre loop /login ↔ /ponto.
 */
type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<InstanceType<typeof NextResponse>["cookies"]["set"]>[2];
};

const protectedPrefixes = ["/ponto", "/primeiro-acesso", "/admin"];

function applyCookies(target: NextResponse, cookies: CookieToSet[]) {
  cookies.forEach(({ name, value, options }) =>
    target.cookies.set(name, value, options)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  /** Últimos cookies emitidos pelo Supabase (refresh de sessão). */
  let sessionCookies: CookieToSet[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          sessionCookies = cookiesToSet;
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = protectedPrefixes.some((p) => path.startsWith(p));

  /**
   * PROTEÇÃO ANTI-LOOP (VERSÃO SIMPLES):
   * - Sem user? Protegidas → /login
   * - Com user + /login ou /cadastro → /ponto
   * - Caso contrário: deixar passar (a.página decidirá se redireciona)
   * 
   * IMPORTANTE: Não verificamos face_registered aqui!
   * Deixamos /primeiro-acesso funcionar naturalmente sem o middleware interceptá-la.
   */

  // Usuário NÃO autenticado tentando acessar rota protegida
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    applyCookies(redirect, sessionCookies);
    return redirect;
  }

  // Usuário autenticado tentando acessar /login ou /cadastro
  if (user && (path === "/login" || path === "/cadastro")) {
    const url = request.nextUrl.clone();
    url.pathname = "/ponto";
    const redirect = NextResponse.redirect(url);
    applyCookies(redirect, sessionCookies);
    return redirect;
  }

  // Em todos os outros casos, deixar a página decidir o que fazer
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
