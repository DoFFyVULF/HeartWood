"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: string;
  icon: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  autoComplete?: string;
}

export function Field({
  id,
  label,
  icon,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
  autoComplete,
}: FieldProps) {
  const [reveal, setReveal] = useState(false);
  const isPassword = type === "password";
  const resolvedType = isPassword && reveal ? "text" : type;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1.5 text-sm font-extrabold text-(--hwd-ink)"
      >
        <span aria-hidden className="text-base">
          {icon}
        </span>
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={resolvedType}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={cn(
            "w-full rounded-2xl border-2 bg-white/60 py-3 pl-11 pr-4 text-[15px] font-semibold text-(--hwd-ink) shadow-sm outline-none backdrop-blur-md transition-all duration-300 placeholder:font-medium placeholder:text-(--hwd-ink-soft)/50",
            isPassword && "pr-12",
            error
              ? "border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-200/60"
              : "border-white/70 hover:border-white focus:border-(--hwd-primary) focus:bg-white/85 focus:ring-4 focus:ring-(--hwd-glow)"
          )}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg opacity-70"
        >
          {icon}
        </span>
        {isPassword && (
          <button
            type="button"
            onClick={() => setReveal((shown) => !shown)}
            aria-label={reveal ? "Скрыть пароль" : "Показать пароль"}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-lg opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
          >
            {reveal ? "🙈" : "👁️"}
          </button>
        )}
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 flex items-center gap-1 text-xs font-bold text-rose-500"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs font-semibold text-(--hwd-ink-soft)">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
