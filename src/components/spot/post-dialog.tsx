import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ApiError, api } from "@/lib/api-client";
import { POST_PRICE_USD, STARTING_HYPE_POINTS, formatUsd } from "@/lib/pricing";
import { loadIdentity, saveIdentity } from "@/lib/remembered-identity";
import type { CheckoutResponse } from "@/lib/spot-types";
import {
  MAX_OPINION_LENGTH,
  validateLink,
  validateName,
  validateOpinionText,
} from "@/lib/spot-validation";
import { CheckoutStep } from "./checkout-step";
import { IdentityFields } from "./identity-fields";

interface PostDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished: () => void;
}

export function PostDialog({ isOpen, onClose, onPublished }: PostDialogProps) {
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [publishedId, setPublishedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const remembered = loadIdentity();
    setName((current) => current || remembered.name);
    setAvatar((current) => current ?? remembered.avatar);
    setCheckout(null);
    setError("");
    setPublishedId(null);
  }, [isOpen]);

  const linkCheck = validateLink(link);
  const canContinue =
    validateName(name).ok && validateOpinionText(text).ok && linkCheck.ok && !submitting;

  const submit = async () => {
    setSubmitting(true);
    setError("");
    try {
      saveIdentity({ name: name.trim(), avatar });
      const res = await api.startPostCheckout({
        name,
        avatar,
        text,
        linkUrl: link.trim() || null,
      });
      setCheckout(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-[var(--spot-line-strong)] bg-[var(--spot-surface)] text-[var(--spot-text)] rounded-3xl p-6 font-ui max-h-[92vh] overflow-y-auto">
        <DialogTitle className="font-editorial text-2xl font-bold">Post your opinion</DialogTitle>
        <DialogDescription className="text-sm text-[var(--spot-muted)]">
          {formatUsd(POST_PRICE_USD)} to post, and it starts with {STARTING_HYPE_POINTS} Hype
          Points. No account needed.
        </DialogDescription>

        {publishedId ? (
          <div className="rounded-2xl border border-[var(--spot-line)] p-5 text-center space-y-3">
            <CheckCircle className="w-8 h-8 mx-auto text-[var(--spot-gold)]" />
            <p className="font-semibold">Your opinion is live.</p>
            <p className="text-xs text-[var(--spot-muted)]">
              Share its page so friends can hype it to the top.
            </p>
            <Link
              to="/o/$id"
              params={{ id: publishedId }}
              onClick={onClose}
              className="btn-hype w-full py-2.5 text-sm"
            >
              View your opinion
            </Link>
          </div>
        ) : checkout ? (
          <CheckoutStep
            checkout={checkout}
            summary={`${formatUsd(POST_PRICE_USD)} to post with ${STARTING_HYPE_POINTS} Hype Points`}
            onBack={() => setCheckout(null)}
            onPaid={(order) => {
              setText("");
              setLink("");
              setPublishedId(order.opinionId);
              onPublished();
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
            <IdentityFields
              name={name}
              avatar={avatar}
              onNameChange={setName}
              onAvatarChange={setAvatar}
            />

            <label className="block text-xs text-[var(--spot-muted)]">
              Your opinion
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_OPINION_LENGTH))}
                placeholder="Say the one thing you want everyone to see."
                rows={4}
                className="spot-input mt-1.5 resize-none font-quote text-lg leading-snug"
                required
              />
              <span className="block text-right mt-1 text-[11px] text-[var(--spot-faint)] tabular-nums">
                {text.length}/{MAX_OPINION_LENGTH}
              </span>
            </label>

            <label className="block text-xs text-[var(--spot-muted)]">
              Link (optional)
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                inputMode="url"
                className="spot-input mt-1.5"
              />
              <span
                className={`block mt-1 text-[11px] ${linkCheck.ok ? "text-[var(--spot-faint)]" : "text-red-700"}`}
              >
                {linkCheck.ok ? "Anyone who clicks your card goes here." : linkCheck.error}
              </span>
            </label>

            {error && <p className="text-xs text-red-700">{error}</p>}

            <button type="submit" disabled={!canContinue} className="btn-hype w-full py-3 text-sm">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to checkout · {formatUsd(POST_PRICE_USD)}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
