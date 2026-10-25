import { Lock } from "lucide-react";

interface CheckoutPreviewNoticeProps {
  summary: string;
  onBack: () => void;
}

// Shown until Paddle checkout is connected: nothing is charged, posted, or added.
export function CheckoutPreviewNotice({ summary, onBack }: CheckoutPreviewNoticeProps) {
  return (
    <div className="rounded-2xl border border-[var(--spot-gold)]/30 bg-[var(--spot-gold)]/5 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        <Lock className="w-4 h-4 mt-0.5 text-[var(--spot-gold)] shrink-0" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">Checkout preview: {summary}</p>
          <p className="text-[var(--spot-muted)] text-xs leading-relaxed">
            Secure Paddle checkout opens here once payments are connected. This is a preview, so
            nothing was charged and nothing was posted or added.
          </p>
        </div>
      </div>
      <button type="button" onClick={onBack} className="btn-ghost w-full py-2 text-xs">
        Back
      </button>
    </div>
  );
}
