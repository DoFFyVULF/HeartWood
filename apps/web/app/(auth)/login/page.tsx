"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ForgotPasswordDialog } from "@/components/ui/ForgotPasswordDialog";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { routes } from "@/routes";
import { isEmail } from "@/features/auth/validation";

type Errors = Partial<Record<"email" | "password", string>>;

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const closeForgot = useCallback(() => setForgotOpen(false), []);

  function validate(): boolean {
    const next: Errors = {};
    if (!isEmail(email)) next.email = "Похоже, это не совсем почта 💌";
    if (password.length < 6) next.password = "Пароль должен быть от 6 символов";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!validate()) return;
    setServerError(null);
    setStatus("submitting");
    try {
      // После успеха guard RedirectIfAuthed сам уводит в мир (/).
      await login(email, password, remember);
    } catch (err) {
      setServerError(
        err instanceof ApiError ? err.message : "Что-то пошло не так — попробуйте ещё раз",
      );
      setStatus("idle");
    }
  }

  return (
    <>
    <div className="rounded-[2rem] border border-white/70 bg-white/60 p-7 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-9">
      <h1 className="text-2xl font-extrabold text-(--hwd-ink) sm:text-3xl">
        С возвращением 💛
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-(--hwd-ink-soft)">
        Рады снова видеть вас в вашем мире.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field
          id="email"
          label="Почта"
          icon="💌"
          type="email"
          value={email}
          onChange={setEmail}
          onBlur={() => touched && validate()}
          error={errors.email}
          placeholder="you@heartwood.app"
          autoComplete="email"
        />
        <Field
          id="password"
          label="Пароль"
          icon="🔑"
          type="password"
          value={password}
          onChange={setPassword}
          onBlur={() => touched && validate()}
          error={errors.password}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        <div className="flex items-center justify-between text-xs font-bold">
          <label className="flex cursor-pointer items-center gap-1.5 text-(--hwd-ink-soft)">
            <input
              type="checkbox"
              checked={remember}
              onChange={(event) => setRemember(event.target.checked)}
              className="size-4 rounded accent-[var(--hwd-primary)]"
            />
            Запомнить меня
          </label>
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="text-(--hwd-primary) underline-offset-4 transition-colors hover:underline focus-visible:outline-none focus-visible:underline"
          >
            Забыли пароль?
          </button>
        </div>

        {serverError && (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-bold text-rose-500">
            {serverError}
          </p>
        )}

        <SubmitButton loading={status === "submitting"}>Войти в мир →</SubmitButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-bold text-(--hwd-ink-soft)">
        <span className="h-px flex-1 bg-white/70" />
        или
        <span className="h-px flex-1 bg-white/70" />
      </div>

      <Link
        href={routes.register.path}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-white/80 bg-white/40 py-3 text-sm font-extrabold text-(--hwd-ink) transition-all duration-300 hover:bg-white/70"
      >
        Создать новый аккаунт 💫
      </Link>
    </div>

      {/* Mounted only while open, so its state resets on every open. */}
      {forgotOpen && <ForgotPasswordDialog onClose={closeForgot} />}
    </>
  );
}
