import { useState } from "react";
import flowerImg from "@/assets/flower-canonical.png";

interface OpinionAvatarProps {
  src?: string | null;
  name: string;
  className?: string;
}

// People can skip the photo (or it fails to load); the MyOneOpinion flower stands in for them.
export function OpinionAvatar({ src, name, className = "w-10 h-10" }: OpinionAvatarProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setFailed(true)}
        className={`${className} rounded-full object-cover border border-[var(--spot-line-strong)] shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${className} rounded-full bg-[var(--spot-surface-2)] border border-[var(--spot-line-strong)] shrink-0 flex items-center justify-center p-1.5`}
      aria-label={name}
    >
      <img src={flowerImg} alt="" className="w-full h-full object-contain" />
    </div>
  );
}
