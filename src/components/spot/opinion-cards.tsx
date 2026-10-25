import { Crown, ExternalLink, Flame } from "lucide-react";
import type { Opinion } from "@/lib/db";
import { dollarsToTakeSpot, formatUsd, isSafeLink, linkHost } from "@/lib/pricing";
import { OpinionAvatar } from "./opinion-avatar";

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function cardLink(op: Opinion): string | null {
  return op.linkUrl && isSafeLink(op.linkUrl) ? op.linkUrl : null;
}

// Covers the whole card so any click outside the buttons opens the opinion's link.
function StretchedLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow ugc"
      aria-label={label}
      className="absolute inset-0 z-0 rounded-[inherit]"
    />
  );
}

function Byline({ op }: { op: Opinion }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[var(--spot-muted)] flex-wrap">
      <span className="font-medium text-[var(--spot-text)]">{op.authorName}</span>
      <span className="text-[var(--spot-faint)]">·</span>
      <span>{timeAgo(op.createdAt)}</span>
      {op.isSample && <span className="spot-chip">Sample</span>}
    </div>
  );
}

function LinkChip({ href }: { href: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--spot-gold)]">
      <ExternalLink className="w-3 h-3" />
      {linkHost(href)}
    </span>
  );
}

interface CrownSpotProps {
  op: Opinion;
  challenger?: Opinion | undefined;
  onHype: (op: Opinion) => void;
}

export function CrownSpot({ op, challenger, onHype }: CrownSpotProps) {
  const href = cardLink(op);
  const lead = challenger ? op.hypePoints - challenger.hypePoints : null;

  return (
    <section aria-label="The top spot" className="spot-crown-card">
      <div className={`spot-crown-inner p-6 md:p-10 ${href ? "cursor-pointer" : ""}`}>
        {href && <StretchedLink href={href} label={`Open link from ${op.authorName}`} />}

        <div className="flex items-center justify-between gap-3 mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--spot-gold)]/10 border border-[var(--spot-gold)]/30 px-3 py-1 text-xs font-semibold text-[var(--spot-gold)]">
            <Crown className="w-3.5 h-3.5" />
            Holding the spot
          </span>
          <div className="text-right">
            <div className="text-2xl md:text-3xl font-bold tracking-tight text-gold-gradient tabular-nums">
              {op.hypePoints.toLocaleString()}
            </div>
            <div className="text-[11px] text-[var(--spot-muted)]">Hype Points</div>
          </div>
        </div>

        <blockquote className="font-quote text-3xl md:text-5xl leading-[1.12] text-[var(--spot-text)]">
          “{op.text}”
        </blockquote>

        <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-3 min-w-0">
            <OpinionAvatar src={op.authorAvatar} name={op.authorName} className="w-11 h-11" />
            <div className="min-w-0 space-y-1">
              <Byline op={op} />
              {href && <LinkChip href={href} />}
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-3">
            {lead !== null && (
              <span className="text-xs text-[var(--spot-muted)]">
                Leading by{" "}
                <span className="text-[var(--spot-text)] font-semibold">
                  {lead.toLocaleString()}
                </span>
              </span>
            )}
            <button
              type="button"
              onClick={() => onHype(op)}
              className="btn-hype px-5 py-2.5 text-sm"
            >
              <Flame className="w-4 h-4" />
              Hype this
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

interface OpinionRowProps {
  op: Opinion;
  rank: number;
  leaderPoints: number;
  onHype: (op: Opinion) => void;
}

export function OpinionRow({ op, rank, leaderPoints, onHype }: OpinionRowProps) {
  const href = cardLink(op);
  const toTake = dollarsToTakeSpot(op.hypePoints, leaderPoints);

  return (
    <li
      className={`relative spot-panel p-4 md:p-5 flex items-start gap-3 md:gap-4 transition-colors hover:border-[var(--spot-line-strong)] ${
        href ? "cursor-pointer" : ""
      }`}
    >
      {href && <StretchedLink href={href} label={`Open link from ${op.authorName}`} />}

      <span className="w-7 pt-2 text-sm font-semibold text-[var(--spot-faint)] tabular-nums shrink-0">
        #{rank}
      </span>
      <OpinionAvatar src={op.authorAvatar} name={op.authorName} />

      <div className="flex-1 min-w-0 space-y-1.5">
        <Byline op={op} />
        <p className="font-quote text-xl md:text-2xl leading-snug text-[var(--spot-text)]">
          “{op.text}”
        </p>
        {href && <LinkChip href={href} />}
      </div>

      <div className="relative z-10 flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-sm font-semibold tabular-nums text-[var(--spot-text)]">
          {op.hypePoints.toLocaleString()}{" "}
          <span className="text-[var(--spot-faint)] font-normal text-xs">pts</span>
        </span>
        <button
          type="button"
          onClick={() => onHype(op)}
          className="btn-ghost px-3.5 py-1.5 text-xs"
        >
          <Flame className="w-3.5 h-3.5 text-[var(--spot-gold)]" />
          Hype
        </button>
        {toTake > 0 && (
          <span className="text-[10px] text-[var(--spot-faint)]">
            {formatUsd(toTake)} takes the spot
          </span>
        )}
      </div>
    </li>
  );
}
