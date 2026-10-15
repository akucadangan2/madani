import { LogoM } from '@/components/logo-m';

export default function LoadingMadani() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4"
    >
      <LogoM size={64} priority className="h-14 w-14 animate-pulse" />
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-200 border-t-ink-700" />
      <p className="text-sm text-neutral-500">Loading...</p>
    </div>
  );
}