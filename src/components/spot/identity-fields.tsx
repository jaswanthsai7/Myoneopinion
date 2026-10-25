import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { photoToAvatar } from "@/lib/avatar-image";
import { MAX_NAME_LENGTH } from "@/lib/spot-validation";
import { OpinionAvatar } from "./opinion-avatar";

interface IdentityFieldsProps {
  name: string;
  avatar: string | null;
  onNameChange: (name: string) => void;
  onAvatarChange: (avatar: string | null) => void;
  nameLabel?: string;
}

// Name plus optional photo: all anyone needs to post or hype, no account.
export function IdentityFields({
  name,
  avatar,
  onNameChange,
  onAvatarChange,
  nameLabel = "Your name",
}: IdentityFieldsProps) {
  const [photoError, setPhotoError] = useState("");
  const [processing, setProcessing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePhoto = async (file: File | undefined) => {
    setPhotoError("");
    if (!file) return;
    setProcessing(true);
    try {
      onAvatarChange(await photoToAvatar(file));
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "That photo couldn't be used.");
    } finally {
      setProcessing(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <OpinionAvatar src={avatar} name={name || "You"} className="w-14 h-14" />
        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="btn-ghost px-3 py-1.5 text-xs"
            >
              {processing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              {avatar ? "Change photo" : "Add photo"}
            </button>
            {avatar && (
              <button
                type="button"
                onClick={() => onAvatarChange(null)}
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
          {photoError && <span className="text-[11px] text-red-700">{photoError}</span>}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handlePhoto(e.target.files?.[0])}
        />
      </div>

      <label className="block text-xs text-[var(--spot-muted)]">
        {nameLabel}
        <input
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, MAX_NAME_LENGTH))}
          placeholder="How you want to be shown"
          autoComplete="nickname"
          className="spot-input mt-1.5"
          required
        />
      </label>
    </div>
  );
}
