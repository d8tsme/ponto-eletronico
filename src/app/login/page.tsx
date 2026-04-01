import { Suspense } from "react";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col justify-center bg-slate-50 px-4 py-10">
      <Suspense
        fallback={
          <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
            Carregando…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
