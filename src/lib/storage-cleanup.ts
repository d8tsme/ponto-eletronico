/**
 * Limpeza de Emergência (Emergency Cleanup)
 * Remove localStorage, sessionStorage e cookies ao detectar erro de sessão ou perfil inválido.
 * Evita loops de redirecionamento causados por dados obsoletos no navegador.
 */

/**
 * Remove um cookie específico (funciona no cliente)
 */
function removeCookie(name: string) {
  try {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
  } catch (e) {
    console.error(`[Cleanup] Erro ao remover cookie ${name}:`, e);
  }
}

/**
 * Limpa todos os dados de storage do navegador
 * Chamada ao detectar:
 * - Erro HttpError 401/403 do Supabase
 * - Perfil não encontrado em profiles table
 * - Sessão expirada
 */
export function emergencyCleanup() {
  console.warn(
    "[Cleanup] Iniciando limpeza de emergência: localStorage, sessionStorage e cookies"
  );

  try {
    // Limpar localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      const keysToRemove = [
        "supabase.auth.token",
        "supabase.auth.refresh_token",
        "sb-ponto-eletronico-auth-token",
        "sb-ponto-eletronico-refresh-token",
        "ponto-user-profile",
        "ponto-session",
        "ponto-face-registered",
      ];
      keysToRemove.forEach((key) => {
        try {
          localStorage.removeItem(key);
          console.log(`[Cleanup] Removido localStorage[${key}]`);
        } catch (e) {
          console.warn(`[Cleanup] Falha ao remover ${key}:`, e);
        }
      });
      // Limpar todo localStorage como backup
      localStorage.clear();
    }

    // Limpar sessionStorage
    if (typeof window !== "undefined" && window.sessionStorage) {
      sessionStorage.clear();
      console.log("[Cleanup] sessionStorage limpo");
    }

    // Remover cookies de sessão Supabase
    const cookiesToRemove = [
      "sb-ponto-eletronico-auth-token",
      "sb-ponto-eletronico-refresh-token",
      "sb-auth-token",
      "sb-refresh-token",
      "SupabaseAuthToken",
      "next-auth.session-token",
    ];
    cookiesToRemove.forEach((cookie) => {
      removeCookie(cookie);
      console.log(`[Cleanup] Removido cookie: ${cookie}`);
    });

    console.log("[Cleanup] Limpeza de emergência concluída com sucesso");
  } catch (error) {
    console.error("[Cleanup] Erro durante limpeza de emergência:", error);
  }
}

/**
 * Verifica se há dados conflitantes no storage
 * Retorna true se houver inconsistências detectadas
 */
export function hasStorageConflict(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const localStorageAuth = localStorage.getItem("supabase.auth.token");
    const sessionStorageAuth = sessionStorage.getItem("supabase.auth.token");

    // Conflito: dados em ambos stores
    if (localStorageAuth && sessionStorageAuth && localStorageAuth !== sessionStorageAuth) {
      console.warn("[Cleanup] Conflito detectado: tokens diferentes em localStorage e sessionStorage");
      return true;
    }

    return false;
  } catch (e) {
    console.warn("[Cleanup] Erro ao verificar storage:", e);
    return false;
  }
}

/**
 * Limpa cookies específicos com suporte a múltiplos domínios
 * Útil em caso de problemas com cookies orphans
 */
export function aggressiveCookieCleanup() {
  console.warn("[Cleanup] Iniciando limpeza agressiva de cookies");

  const cookieNames = [
    "sb-ponto-eletronico-auth-token",
    "sb-ponto-eletronico-refresh-token",
    "sb-auth-token",
    "sb-refresh-token",
    "SupabaseAuthToken",
    "next-auth.session-token",
    "next-auth.csrf-token",
  ];

  const paths = ["/", "/ponto", "/login", "/primeiro-acesso"];
  const domains = [
    "",
    window.location.hostname,
    `.${window.location.hostname}`,
  ];

  cookieNames.forEach((name) => {
    paths.forEach((path) => {
      domains.forEach((domain) => {
        let cookieStr = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 UTC;`;
        if (domain) cookieStr += ` domain=${domain};`;
        try {
          document.cookie = cookieStr;
        } catch (e) {
          // Silenciosamente falhar se não conseguir remover
        }
      });
    });
  });

  console.log("[Cleanup] Limpeza agressiva de cookies concluída");
}

/**
 * Realiza logout completo com limpeza
 * Chamada quando detectar erro de autenticação
 */
export async function logoutAndCleanup(supabaseClient?: any) {
  try {
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
      console.log("[Cleanup] Logout supabase executado");
    }
  } catch (e) {
    console.error("[Cleanup] Erro ao fazer logout supabase:", e);
  }

  emergencyCleanup();
}
