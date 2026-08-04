"use client";

import { useState } from "react";
import Link from "next/link";
import { Field } from "@/components/ui/Field";
import { GenderPicker } from "@/components/ui/GenderPicker";
import { PasswordStrength } from "@/components/ui/PasswordStrength";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { SuccessPanel } from "@/components/ui/SuccessPanel";
import { useGender } from "@/lib/theme";
import { routes } from "@/routes";
import { isEmail } from "@/features/auth/validation";

type Errors = Partial<
  Record<"name" | "email" | "password" | "confirm" | "gender" | "agree", string>
>;

export default function RegisterPage() {
  const { gender, setGender } = useGender();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [coupleCode, setCoupleCode] = useState("");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");

  function validate(): boolean {
    const next: Errors = {};
    if (name.trim().length < 2) next.name = "Как вас зовут? Нужно хотя бы пару букв";
    if (!isEmail(email)) next.email = "Похоже, это не совсем почта 💌";
    if (password.length < 6) next.password = "Пароль должен быть от 6 символов";
    if (confirm && confirm !== password) next.confirm = "Пароли пока не совпадают";
    if (!gender) next.gender = "Выберите, кто создаёт этот мир";
    if (!agree) next.agree = "Без согласия на любовь нельзя 💘";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!validate()) return;
    setStatus("submitting");
    // Stand-in for a real API call — the backend is wired up separately.
    window.setTimeout(() => setStatus("success"), 1200);
  }

  if (status === "success") {
    return (
      <SuccessPanel
        emoji={gender === "girl" ? "💗" : gender === "boy" ? "💙" : "🎉"}
        title="Мир создан!"
        subtitle="Осталось позвать свою половинку по коду пары — и ваша история начнёт расти 🌱"
        primary={{ label: "Открыть ваш мир →", href: routes.home.path }}
        secondary={{ label: "Вернуться ко входу", href: routes.login.path }}
      />
    );
  }

  return (
    <div className="rounded-[2rem] border border-white/70 bg-white/60 p-7 shadow-2xl shadow-black/5 backdrop-blur-xl sm:p-9">
      <h1 className="text-2xl font-extrabold text-(--hwd-ink) sm:text-3xl">
        Создайте ваш мир 💫
      </h1>
      <p className="mt-1.5 text-sm font-semibold text-(--hwd-ink-soft)">
        Пара кликов — и ваша история начнёт расти.
      </p>

      <form noValidate onSubmit={onSubmit} className="mt-7 space-y-4">
        <Field
          id="name"
          label="Как вас зовут?"
          icon="🧸"
          value={name}
          onChange={setName}
          onBlur={() => touched && validate()}
          error={errors.name}
          placeholder="Лёва или Аня"
          autoComplete="name"
        />

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

        <div>
          <Field
            id="password"
            label="Пароль"
            icon="🔑"
            type="password"
            value={password}
            onChange={setPassword}
            onBlur={() => touched && validate()}
            error={errors.password}
            placeholder="Минимум 6 символов"
            autoComplete="new-password"
          />
          <PasswordStrength password={password} />
        </div>

        <Field
          id="confirm"
          label="Ещё разок"
          icon="✨"
          type="password"
          value={confirm}
          onChange={setConfirm}
          onBlur={() => touched && validate()}
          error={errors.confirm}
          placeholder="Повторите пароль"
          autoComplete="new-password"
        />

        <Field
          id="couple-code"
          label="Код пары"
          icon="🎟️"
          value={coupleCode}
          onChange={setCoupleCode}
          hint="Есть код второй половинки? Впишите — и вы уже вместе."
          placeholder="Например: ALMA-2024"
        />

        {/* Gender → palette. Picking one repaints the whole world behind you. */}
        <div>
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-(--hwd-ink)">
            <span aria-hidden className="text-base">
              🌈
            </span>
            Чей это мир?
          </span>
          <GenderPicker value={gender} onChange={setGender} error={errors.gender} />
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-xs font-bold text-(--hwd-ink-soft)">
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 size-4 rounded accent-[var(--hwd-primary)]"
            aria-invalid={!!errors.agree}
          />
          <span>
            Я согласен на любовь, немного магии и ежедневные воспоминания 💘
          </span>
        </label>
        {errors.agree && (
          <p role="alert" className="text-xs font-bold text-rose-500">
            {errors.agree}
          </p>
        )}

        <SubmitButton loading={status === "submitting"}>Создать мир →</SubmitButton>
      </form>

      <div className="mt-5 text-center text-sm font-bold text-(--hwd-ink-soft)">
        Уже есть аккаунт?{" "}
        <Link
          href={routes.login.path}
          className="text-(--hwd-primary) underline-offset-4 transition-colors hover:underline"
        >
          Войти 💛
        </Link>
      </div>
    </div>
  );
}
