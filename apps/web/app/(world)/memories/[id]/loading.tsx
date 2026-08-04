// Fallback для runtime-параметра [id] без generateStaticParams.
// Показывается мгновенно, затем MemoryDetailPage берёт управление.
export default function MemoryDetailLoading() {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-3 text-(--hwd-ink-soft)">
      <div className="flex size-12 items-center justify-center rounded-full bg-white/60 text-2xl opacity-60">
        <span aria-hidden>💭</span>
      </div>
      <p className="text-sm font-bold">Загружаем воспоминание…</p>
    </div>
  );
}
