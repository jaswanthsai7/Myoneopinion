import { ArrowUp, CheckCircle, Crown, ExternalLink, Heart } from "lucide-react";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import type { Opinion } from "@/lib/db";
import {
  POINTS_PER_DOLLAR,
  POST_PRICE_USD,
  STARTING_HYPE_POINTS,
  dollarsToTakeSpot,
  formatUsd,
  isSafeLink,
  linkHost,
} from "@/lib/pricing";
import { OpinionAvatar } from "./opinion-avatar";

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
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
    <div className="flex items-center gap-2 text-xs text-[#777168] flex-wrap">
      <span className="font-medium text-[#5A554D]">{op.authorName}</span>
      <span>·</span>
      <span>{timeAgo(op.createdAt)}</span>
      {op.isSample && <span className="spot-chip">Sample</span>}
    </div>
  );
}

function LinkChip({ href }: { href: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-[#A8761E]">
      <ExternalLink className="w-3 h-3" />
      {linkHost(href)}
    </span>
  );
}

interface SpotSidebarCardProps {
  leader: Opinion | undefined;
  onPost: () => void;
}

// Sits where "Go Premium" used to: who holds the spot and what it costs to take it.
export function SpotSidebarCard({ leader, onPost }: SpotSidebarCardProps) {
  return (
    <section
      aria-label="The top spot"
      className="relative botanical-sidebar-card p-6 shadow-xs overflow-hidden"
    >
      <img
        src={lilyImg}
        alt=""
        className="absolute -right-8 -bottom-8 w-40 h-40 opacity-30 pointer-events-none object-contain"
      />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Crown className="w-5 h-5 text-[#C49221]" />
          <h2 className="font-editorial text-2xl font-bold text-[#191713]">Claim the Spot</h2>
        </div>
        <p className="text-xs text-[#777168] leading-relaxed mb-4">
          The opinion with the most Hype Points holds #1 until someone outbids it.
        </p>
        {leader && (
          <p className="text-xs text-[#5A554D] mb-4">
            {leader.authorName} holds it with{" "}
            <span className="font-semibold text-[#A8761E]">
              {leader.hypePoints.toLocaleString()} Hype Points
            </span>
            . Post yours, then hype it past them.
          </p>
        )}
        <button
          type="button"
          onClick={onPost}
          className="w-full py-2.5 px-4 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5"
        >
          <span>Post your opinion · {formatUsd(POST_PRICE_USD)}</span>
          <span>→</span>
        </button>
        <ul className="mt-4 space-y-2 text-xs text-[#5A554D]">
          {[
            `Starts with ${STARTING_HYPE_POINTS} Hype Points`,
            `$1 = ${POINTS_PER_DOLLAR} Hype Points`,
            "Anyone can hype any opinion",
            "Add a link to make your card clickable",
            "No account needed",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface OpinionRowProps {
  op: Opinion;
  rank: number;
  leaderPoints: number;
  onHype: (op: Opinion) => void;
  onToggleLike: (op: Opinion) => void;
}

export function OpinionRow({ op, rank, leaderPoints, onHype, onToggleLike }: OpinionRowProps) {
  const href = cardLink(op);
  const isFirst = rank === 1;
  const toTake = isFirst ? 0 : dollarsToTakeSpot(op.hypePoints, leaderPoints);

  return (
    <li
      className={`relative py-4 md:py-5 first:pt-2 last:pb-2 flex items-start gap-3 md:gap-5 transition-colors rounded-xl px-2 hover:bg-[#E5D6BA]/40 ${
        isFirst ? "bg-[#E5D6BA]/50 p-3.5 my-1" : ""
      } ${href ? "cursor-pointer" : ""}`}
    >
      {href && <StretchedLink href={href} label={`Open link from ${op.authorName}`} />}

      <div className="w-8 md:w-10 text-center shrink-0 pt-1">
        {isFirst ? (
          <div className="flex flex-col items-center">
            <Crown className="w-4 h-4 text-[#C49221] fill-[#E8C94C]" />
            <span className="font-editorial text-2xl font-bold text-[#A8761E]">#1</span>
          </div>
        ) : (
          <span className="font-editorial text-lg md:text-xl font-medium text-[#777168]">
            #{rank}
          </span>
        )}
      </div>

      <OpinionAvatar
        src={op.authorAvatar}
        name={op.authorName}
        className="w-9 h-9 md:w-10 md:h-10"
      />

      <div className="flex-1 min-w-0 pr-2 space-y-1">
        <Byline op={op} />
        <blockquote className="font-editorial text-base md:text-xl font-medium text-[#191713] leading-relaxed">
          "{op.text}"
        </blockquote>
        {href && <LinkChip href={href} />}
      </div>

      <div className="relative z-10 flex items-center gap-3 shrink-0 pt-1">
        <button
          type="button"
          onClick={() => onToggleLike(op)}
          className="hidden sm:flex items-center gap-1.5 text-xs font-semibold hover:scale-105 transition-transform"
          aria-label={op.isLiked ? "Unlike" : "Like"}
        >
          <Heart className="w-4 h-4 text-red-600 fill-red-600/90" />
          <span className="text-xs text-[#5A554D]">{op.likeCount.toLocaleString()}</span>
        </button>

        <div className="flex flex-col items-center">
          <button
            type="button"
            onClick={() => onHype(op)}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl btn-gold text-xs font-semibold"
          >
            <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Hype</span>
          </button>
          <span className="text-[10px] text-[#8C8477] mt-0.5 font-medium tabular-nums">
            {op.hypePoints.toLocaleString()} pts
          </span>
          {toTake > 0 && (
            <span className="text-[10px] text-[#A8761E] font-medium">
              {formatUsd(toTake)} takes #1
            </span>
          )}
        </div>
      </div>
    </li>
  );
}
