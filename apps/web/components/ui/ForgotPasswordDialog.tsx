"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useGender } from "@/lib/theme";
import { Field } from "@/components/ui/Field";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { isEmail } from "@/features/auth/validation";
import motion from "@/components/motion.module.css";

interface ForgotPasswordDialogProps {
  onClose: () => void;
}

type Step = "email" | "sending" | "sent";

// The dialog is only mounted while open (parent renders `{open && <Dialog/>}`),
// so all state resets naturally on every open — no state-in-effect needed.
export function ForgotPasswordDialog({ onClose }: ForgotPasswordDialogProps) {
  const { gender } = useGender();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [step, setStep] = useState<Step>("email");
  const panelRef = useRef<HTMLDivElement>(null);

  // Focus the first field, trap Tab inside the panel, close on Escape,
  // lock body scroll, and hand focus back to the trigger on unmount.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const trigger = document.activeElement as HTMLElement | null;
    const firstFocusable = panel.querySelector<HTMLElement>("input, button");
    (firstFocusable ?? panel).focus();

    const FOCUSABLE =
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      // TS doesn't keep the earlier narrowing of `panelRef.current` inside
      // this closure, so narrow the ref here.
      const current = panelRef.current;
      if (!current) return;

      const items = Array.from(
        current.querySelectorAll<HTMLElement>(FOCUSABLE)
      ).filter((el) => !el.hasAttribute("disabled"));
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === current || active === first)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [onClose]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!isEmail(email)) {
      setError("Похоже, это не совсем почта 💌");
      return;
    }
    setError(undefined);
    setStep("sending");
    // Stand-in for a real reset-email request — backend wired separately.
    window.setTimeout(() => setStep("sent"), 1000);
  }

  // Portal keeps the overlay clear of any ancestor transforms/filters, and
  // data-gender re-applies the active palette outside the AuthShell subtree.
  return createPortal(
    <div
      data-gender={gender ?? "neutral"}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
    >
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`${motion.fadeIn} absolute inset-0 bg-[rgba(30,27,60,0.4)] backdrop-blur-sm`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-title"
        tabIndex={-1}
        className={`${motion.popIn} relative w-full max-w-md rounded-[2rem] border border-white/70 bg-white/75 p-7 shadow-2xl shadow-black/10 outline-none backdrop-blur-xl sm:p-8`}
      >
        {step === "sent" ? (
          <div className="flex flex-col items-center py-2 text-center">
            <div aria-hidden className={`${motion.float} block text-5xl`}>
              ✉️
            </div>
            <h2
              id="forgot-title"
              className="mt-4 text-xl font-extrabold text-(--hwd-ink)"
            >
              Письмо летит!
            </h2>
            <p className="mt-2 text-sm font-semibold text-(--hwd-ink-soft)">
              Мы отправили ссылку для входа на{" "}
              <span className="font-extrabold text-(--hwd-ink)">{email}</span>.
              Если письма нет — загляните в спам 💌
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-7 w-full rounded-2xl bg-(--hwd-primary) px-6 py-3.5 text-base font-extrabold text-white shadow-[0_16px_35px_-12px_var(--hwd-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--hwd-primary-deep) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
            >
              Понятно 💛
            </button>
          </div>
        ) : (
          <>
            <h2
              id="forgot-title"
              className="text-2xl font-extrabold text-(--hwd-ink)"
            >
              Забыли пароль? 💌
            </h2>
            <p className="mt-1.5 text-sm font-semibold text-(--hwd-ink-soft)">
              Впишите почту — и мы отправим письмо со ссылкой для входа.
            </p>

            <form noValidate onSubmit={submit} className="mt-6 space-y-4">
              <Field
                id="forgot-email"
                label="Почта"
                icon="💌"
                type="email"
                value={email}
                onChange={setEmail}
                error={error}
                placeholder="you@heartwood.app"
                autoComplete="email"
              />
              <SubmitButton loading={step === "sending"}>
                Отправить ссылку →
              </SubmitButton>
            </form>
          </>
        )}

        {/* Close button is last in DOM so Tab naturally lands on it after submit. */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть"
          className="absolute right-4 top-4 flex size-9 items-center justify-center rounded-full text-(--hwd-ink-soft) transition-colors hover:bg-white/60 hover:text-(--hwd-ink) focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-(--hwd-glow)"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="size-4"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>,
    document.body
  );
}
