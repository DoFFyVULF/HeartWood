"use client";

import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

export function SubmitButton({ loading, disabled, children }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || loading}
      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-(--hwd-primary) px-6 py-3.5 text-base font-extrabold text-white shadow-[0_16px_35px_-12px_var(--hwd-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--hwd-primary-deep) hover:shadow-[0_20px_45px_-12px_var(--hwd-glow)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-75 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
    >
      {loading && (
        <span
          aria-hidden
          className="size-5 animate-spin rounded-full border-[3px] border-white/40 border-t-white"
        />
      )}
      <span className={cn(loading && "opacity-80")}>{children}</span>
    </button>
  );
}
