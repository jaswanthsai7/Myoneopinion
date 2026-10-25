import { useEffect, useState } from "react";
import { Crown, Flame } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { Opinion } from "@/lib/db";
import {
  HYPE_PRESETS_USD,
  MAX_HYPE_USD,
  MIN_HYPE_USD,
  POINTS_PER_DOLLAR,
  dollarsToPoints,
  dollarsToTakeSpot,
  formatUsd,
} from "@/lib/pricing";
import { CheckoutPreviewNotice } from "./checkout-preview-notice";

interface HypeDialogProps {
  opinion: Opinion | null;
  leader: Opinion | null;
  onClose: () => void;
}

export function HypeDialog({ opinion, leader, onClose }: HypeDialogProps) {
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (!opinion) return;
    setShowPreview(false);
    setCustom("");
    // Default to the amount that wins the spot when it is within a preset.
    const needed =
      leader && leader.id !== opinion.id
        ? dollarsToTakeSpot(opinion.hypePoints, leader.hypePoints)
        : 0;
    setAmount(needed > 0 && needed <= 25 ? needed : 5);
  }, [opinion, leader]);

  if (!opinion) return null;

  const usd = custom ? Number(custom) : amount;
  const valid = Number.isFinite(usd) && usd >= MIN_HYPE_USD && usd <= MAX_HYPE_USD;
  const points = valid ? dollarsToPoints(usd) : 0;
  const isLeader = leader?.id === opinion.id;
  const newTotal = opinion.hypePoints + points;
  const takesSpot = !isLeader && leader !== null && newTotal > leader.hypePoints;
  const neededUsd =
    leader && !isLeader ? dollarsToTakeSpot(opinion.hypePoints, leader.hypePoints) : 0;

  return (
    <Dialog open={!!opinion} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-[var(--spot-line-strong)] bg-[var(--spot-surface)] text-[var(--spot-text)] rounded-3xl p-6 font-ui">
        <DialogTitle className="text-lg font-semibold flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--spot-gold)]" />
          Hype this opinion
        </DialogTitle>
        <DialogDescription className="text-sm text-[var(--spot-muted)]">
          $1 = {POINTS_PER_DOLLAR} Hype Points. The opinion with the most points holds the top spot.
        </DialogDescription>

        <p className="font-quote text-xl leading-snug rounded-2xl border border-[var(--spot-line)] bg-[var(--spot-bg)] p-4">
          “{opinion.text}”
          <span className="block mt-2 font-ui text-xs text-[var(--spot-muted)]">
            {opinion.authorName} · {opinion.hypePoints.toLocaleString()} points now
          </span>
        </p>

        {showPreview ? (
          <CheckoutPreviewNotice
            summary={`${formatUsd(usd)} for ${points.toLocaleString()} Hype Points`}
            onBack={() => setShowPreview(false)}
          />
        ) : (
          <>
            <div className="grid grid-cols-4 gap-2">
              {HYPE_PRESETS_USD.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustom("");
                  }}
                  className={`rounded-2xl border py-3 text-center transition-colors ${
                    !custom && amount === preset
                      ? "border-[var(--spot-gold)] bg-[var(--spot-gold)]/10"
                      : "border-[var(--spot-line-strong)] hover:bg-white/5"
                  }`}
                >
                  <div className="text-sm font-semibold">{formatUsd(preset)}</div>
                  <div className="text-[10px] text-[var(--spot-muted)]">
                    +{dollarsToPoints(preset)} pts
                  </div>
                </button>
              ))}
            </div>

            <label className="block text-xs text-[var(--spot-muted)]">
              Or a custom amount (USD)
              <input
                type="number"
                inputMode="decimal"
                min={MIN_HYPE_USD}
                max={MAX_HYPE_USD}
                step="1"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={`${MIN_HYPE_USD} – ${MAX_HYPE_USD}`}
                className="spot-input mt-1.5"
              />
            </label>

            <div className="rounded-2xl border border-[var(--spot-line)] p-4 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--spot-muted)]">New total</span>
                <span className="font-semibold tabular-nums">{newTotal.toLocaleString()} pts</span>
              </div>
              {isLeader && (
                <p className="text-xs text-[var(--spot-muted)]">
                  This opinion holds the spot. Hype widens its lead.
                </p>
              )}
              {takesSpot && (
                <p className="text-xs text-[var(--spot-gold)] flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> This takes the top spot.
                </p>
              )}
              {!isLeader && !takesSpot && neededUsd > 0 && (
                <p className="text-xs text-[var(--spot-muted)]">
                  {formatUsd(neededUsd)} or more takes the top spot.
                </p>
              )}
            </div>

            <button
              type="button"
              disabled={!valid}
              onClick={() => setShowPreview(true)}
              className="btn-hype w-full py-3 text-sm"
            >
              Continue to checkout · {valid ? formatUsd(usd) : "—"}
            </button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
