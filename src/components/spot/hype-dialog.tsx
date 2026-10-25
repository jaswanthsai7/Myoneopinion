import { useEffect, useState } from "react";
import { CheckCircle, Crown, Flame, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api-client";
import {
  HYPE_PRESETS_USD,
  MAX_HYPE_USD,
  MIN_HYPE_USD,
  POINTS_PER_DOLLAR,
  dollarsToPoints,
  dollarsToTakeSpot,
  formatUsd,
} from "@/lib/pricing";
import { loadIdentity, saveIdentity } from "@/lib/remembered-identity";
import type { CheckoutResponse, Opinion } from "@/lib/spot-types";
import { validateHypeUsd, validateName } from "@/lib/spot-validation";
import { CheckoutStep } from "./checkout-step";
import { IdentityFields } from "./identity-fields";

interface HypeDialogProps {
  opinion: Opinion | null;
  leader: Opinion | null;
  onClose: () => void;
  onHyped: () => void;
}

export function HypeDialog({ opinion, leader, onClose, onHyped }: HypeDialogProps) {
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!opinion) return;
    const remembered = loadIdentity();
    setName((current) => current || remembered.name);
    setAvatar((current) => current ?? remembered.avatar);
    setCheckout(null);
    setDone(false);
    setError("");
    setCustom("");
    // Default to the amount that wins the spot when it is within a preset.
    const needed =
      leader && leader.id !== opinion.id
        ? dollarsToTakeSpot(opinion.hypePoints, leader.hypePoints)
        : 0;
    setAmount(needed > 0 && needed <= 25 ? needed : 5);
    // Only reset when a different opinion is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opinion?.id]);

  if (!opinion) return null;

  const usdCheck = validateHypeUsd(custom ? custom : amount);
  const usd = usdCheck.ok ? usdCheck.value : 0;
  const points = dollarsToPoints(usd);
  const isLeader = leader?.id === opinion.id;
  const newTotal = opinion.hypePoints + points;
  const takesSpot = !isLeader && leader !== null && newTotal > leader.hypePoints;
  const neededUsd =
    leader && !isLeader ? dollarsToTakeSpot(opinion.hypePoints, leader.hypePoints) : 0;
  const canContinue = usdCheck.ok && validateName(name).ok && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      saveIdentity({ name: name.trim(), avatar });
      setCheckout(
        await api.startHypeCheckout({ opinionId: opinion.id, name, avatar, amountUsd: usd }),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!opinion} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-[var(--spot-line-strong)] bg-[var(--spot-surface)] text-[var(--spot-text)] rounded-3xl p-6 font-ui max-h-[92vh] overflow-y-auto">
        <DialogTitle className="font-editorial text-2xl font-bold flex items-center gap-2">
          <Flame className="w-5 h-5 text-[var(--spot-gold)]" />
          Hype this opinion
        </DialogTitle>
        <DialogDescription className="text-sm text-[var(--spot-muted)]">
          $1 = {POINTS_PER_DOLLAR} Hype Points. The opinion with the most points holds the top spot,
          and your name joins its supporters.
        </DialogDescription>

        <p className="font-quote text-xl leading-snug rounded-2xl border border-[var(--spot-line)] bg-[#fbf7ee] p-4">
          “{opinion.text}”
          <span className="block mt-2 font-ui text-xs text-[var(--spot-muted)]">
            {opinion.authorName} · {opinion.hypePoints.toLocaleString()} points now
          </span>
        </p>

        {done ? (
          <div className="rounded-2xl border border-[var(--spot-line)] p-5 text-center space-y-2">
            <CheckCircle className="w-8 h-8 mx-auto text-[var(--spot-gold)]" />
            <p className="font-semibold">
              You added {points.toLocaleString()} Hype Points
              {takesSpot ? " and took the top spot" : ""}.
            </p>
            <button type="button" onClick={onClose} className="btn-hype w-full py-2.5 text-sm">
              Done
            </button>
          </div>
        ) : checkout ? (
          <CheckoutStep
            checkout={checkout}
            summary={`${formatUsd(usd)} for ${points.toLocaleString()} Hype Points`}
            onBack={() => setCheckout(null)}
            onPaid={() => {
              setDone(true);
              onHyped();
            }}
          />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) void submit();
            }}
          >
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
                      : "border-[var(--spot-line-strong)] hover:bg-[var(--spot-surface-2)]"
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
              Or a custom amount in whole dollars
              <input
                type="number"
                inputMode="numeric"
                min={MIN_HYPE_USD}
                max={MAX_HYPE_USD}
                step="1"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={`${MIN_HYPE_USD} – ${MAX_HYPE_USD}`}
                className="spot-input mt-1.5"
              />
              {custom && !usdCheck.ok && (
                <span className="block mt-1 text-[11px] text-red-700">{usdCheck.error}</span>
              )}
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
                <p className="text-xs text-[#A8761E] font-medium flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5" /> This takes the top spot.
                </p>
              )}
              {!isLeader && !takesSpot && neededUsd > 0 && (
                <p className="text-xs text-[var(--spot-muted)]">
                  {formatUsd(neededUsd)} or more takes the top spot.
                </p>
              )}
            </div>

            <IdentityFields
              name={name}
              avatar={avatar}
              onNameChange={setName}
              onAvatarChange={setAvatar}
              nameLabel="Your name (shown on the supporters board)"
            />

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button type="submit" disabled={!canContinue} className="btn-hype w-full py-3 text-sm">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to checkout · {usdCheck.ok ? formatUsd(usd) : "—"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
