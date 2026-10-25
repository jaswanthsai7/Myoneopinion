import { useState } from "react";
import { FlaskConical, Loader2, Lock } from "lucide-react";
import { ApiError, api } from "@/lib/api-client";
import type { CheckoutResponse, OrderStatusResponse } from "@/lib/spot-types";

interface CheckoutStepProps {
  checkout: CheckoutResponse;
  summary: string;
  onPaid: (order: OrderStatusResponse) => void;
  onBack: () => void;
}

// Collects payment for an order. Nothing is published until the server marks the order paid.
export function CheckoutStep({ checkout, summary, onPaid, onBack }: CheckoutStepProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const completeTest = async () => {
    setBusy(true);
    setError("");
    try {
      const order = await api.completeTestOrder(checkout.orderId);
      if (order.status === "paid") onPaid(order);
      else setError("The test payment didn't go through.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "The test payment didn't go through.");
    } finally {
      setBusy(false);
    }
  };

  const mode = checkout.checkout.mode;

  return (
    <div className="rounded-2xl border border-[var(--spot-gold)]/40 bg-[var(--spot-gold)]/5 p-4 space-y-3">
      <div className="flex items-start gap-2.5">
        {mode === "test" ? (
          <FlaskConical className="w-4 h-4 mt-0.5 text-[var(--spot-gold)] shrink-0" />
        ) : (
          <Lock className="w-4 h-4 mt-0.5 text-[var(--spot-gold)] shrink-0" />
        )}
        <div className="text-sm space-y-1">
          <p className="font-semibold">{summary}</p>
          {mode === "test" && (
            <p className="text-[var(--spot-muted)] text-xs leading-relaxed">
              Test mode: no real card is charged. Completing the test payment publishes this for
              real on this test site.
            </p>
          )}
          {mode === "disabled" && (
            <p className="text-[var(--spot-muted)] text-xs leading-relaxed">
              Payments aren't connected yet, so nothing was charged and nothing was published.
              Secure Paddle checkout opens here once they are.
            </p>
          )}
          {mode === "paddle" && (
            <p className="text-[var(--spot-muted)] text-xs leading-relaxed">
              Opening secure checkout…
            </p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-red-700">{error}</p>}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="btn-ghost flex-1 py-2 text-xs"
        >
          Back
        </button>
        {mode === "test" && (
          <button
            type="button"
            onClick={() => void completeTest()}
            disabled={busy}
            className="btn-hype flex-1 py-2 text-xs"
          >
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Complete test payment
          </button>
        )}
      </div>
    </div>
  );
}
