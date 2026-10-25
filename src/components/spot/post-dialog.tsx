import { useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { POST_PRICE_USD, STARTING_HYPE_POINTS, formatUsd, isSafeLink } from "@/lib/pricing";
import { CheckoutPreviewNotice } from "./checkout-preview-notice";
import { OpinionAvatar } from "./opinion-avatar";

const MAX_TEXT = 280;
const MAX_NAME = 40;
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

interface PostDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PostDialog({ isOpen, onClose }: PostDialogProps) {
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [link, setLink] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setShowPreview(false);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl);
    },
    [photoUrl],
  );

  const trimmedLink = link.trim();
  const linkValid = !trimmedLink || isSafeLink(trimmedLink);
  const canContinue =
    name.trim().length > 0 && text.trim().length > 0 && text.length <= MAX_TEXT && linkValid;

  const handlePhoto = (file: File | undefined) => {
    setPhotoError("");
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError("Photos must be 2 MB or smaller.");
      return;
    }
    setPhotoUrl(URL.createObjectURL(file));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md border-[var(--spot-line-strong)] bg-[var(--spot-surface)] text-[var(--spot-text)] rounded-3xl p-6 font-ui max-h-[92vh] overflow-y-auto">
        <DialogTitle className="text-lg font-semibold">Post your opinion</DialogTitle>
        <DialogDescription className="text-sm text-[var(--spot-muted)]">
          {formatUsd(POST_PRICE_USD)} to post, and it starts with {STARTING_HYPE_POINTS} Hype
          Points. No account needed.
        </DialogDescription>

        {showPreview ? (
          <CheckoutPreviewNotice
            summary={`${formatUsd(POST_PRICE_USD)} to post with ${STARTING_HYPE_POINTS} Hype Points`}
            onBack={() => setShowPreview(false)}
          />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (canContinue) setShowPreview(true);
            }}
          >
            <div className="flex items-center gap-3">
              <OpinionAvatar src={photoUrl} name={name || "You"} className="w-14 h-14" />
              <div className="flex flex-col gap-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="btn-ghost px-3 py-1.5 text-xs"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {photoUrl ? "Change photo" : "Add photo"}
                  </button>
                  {photoUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoUrl(null);
                        if (fileRef.current) fileRef.current.value = "";
                      }}
                      className="btn-ghost px-2.5 py-1.5 text-xs"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-[var(--spot-faint)]">
                  Optional. We'll use the flower if you skip it.
                </span>
                {photoError && <span className="text-[11px] text-red-400">{photoError}</span>}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handlePhoto(e.target.files?.[0])}
              />
            </div>

            <label className="block text-xs text-[var(--spot-muted)]">
              Your name
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, MAX_NAME))}
                placeholder="How you want to be shown"
                className="spot-input mt-1.5"
                required
              />
            </label>

            <label className="block text-xs text-[var(--spot-muted)]">
              Your opinion
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_TEXT))}
                placeholder="Say the one thing you want everyone to see."
                rows={4}
                className="spot-input mt-1.5 resize-none font-quote text-lg leading-snug"
                required
              />
              <span className="block text-right mt-1 text-[11px] text-[var(--spot-faint)] tabular-nums">
                {text.length}/{MAX_TEXT}
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
                className={`block mt-1 text-[11px] ${linkValid ? "text-[var(--spot-faint)]" : "text-red-400"}`}
              >
                {linkValid
                  ? "Anyone who clicks your card goes here."
                  : "Links must start with http:// or https://"}
              </span>
            </label>

            <button type="submit" disabled={!canContinue} className="btn-hype w-full py-3 text-sm">
              Continue to checkout · {formatUsd(POST_PRICE_USD)}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
