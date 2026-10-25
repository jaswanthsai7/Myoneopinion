import { Link } from "@tanstack/react-router";
import { ArrowUp, CheckCircle, Crown, ExternalLink } from "lucide-react";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import type { Opinion, Supporter } from "@/lib/spot-types";
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

export function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function cardLink(op: Opinion): string | null {
  return op.linkUrl && isSafeLink(op.linkUrl) ? op.linkUrl : null;
}

// Covers the whole card: opinions with a link open it, the rest open their own page.
function StretchedLink({ op }: { op: Opinion }) {
  const href = cardLink(op);
  const className = "absolute inset-0 z-0 rounded-[inherit]";
  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer nofollow ugc"
        aria-label={`Open the link shared by ${op.authorName}`}
        className={className}
      />
    );
  }
  return (
    <Link
      to="/o/$id"
      params={{ id: op.id }}
      aria-label={`Open ${op.authorName}'s opinion`}
      className={className}
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

export function SupporterStack({ op }: { op: Opinion }) {
  if (op.supporterCount === 0) return null;
  return (
    <Link
      to="/o/$id"
      params={{ id: op.id }}
      className="relative z-10 inline-flex items-center gap-2 text-xs text-[#5A554D] hover:text-[#1A1612]"
    >
      <span className="flex -space-x-2">
        {op.topSupporters.map((s) => (
          <OpinionAvatar
            key={`${s.name}-${s.lastHypedAt}`}
            src={s.avatar}
            name={s.name}
            className="w-6 h-6 ring-2 ring-[#F5EEDB]"
          />
        ))}
      </span>
      <span>
        {op.supporterCount.toLocaleString()} {op.supporterCount === 1 ? "supporter" : "supporters"}
      </span>
    </Link>
  );
}

interface OpinionRowProps {
  op: Opinion;
  // Position on the Hype Points board; null when outside the ranked list.
  rank: number | null;
  leaderPoints: number;
  onHype: (op: Opinion) => void;
}

export function OpinionRow({ op, rank, leaderPoints, onHype }: OpinionRowProps) {
  const href = cardLink(op);
  const isFirst = rank === 1;
  const toTake = isFirst ? 0 : dollarsToTakeSpot(op.hypePoints, leaderPoints);

  return (
    <li
      className={`relative cursor-pointer py-4 md:py-5 first:pt-2 last:pb-2 flex items-start gap-3 md:gap-5 transition-colors rounded-xl px-2 hover:bg-[#E5D6BA]/40 ${
        isFirst ? "bg-[#E5D6BA]/50 p-3.5 my-1" : ""
      }`}
    >
      <StretchedLink op={op} />

      <div className="w-8 md:w-10 text-center shrink-0 pt-1">
        {isFirst ? (
          <div className="flex flex-col items-center">
            <Crown className="w-4 h-4 text-[#C49221] fill-[#E8C94C]" />
            <span className="font-editorial text-2xl font-bold text-[#A8761E]">#1</span>
          </div>
        ) : (
          <span className="font-editorial text-lg md:text-xl font-medium text-[#777168]">
            {rank === null ? "·" : `#${rank}`}
          </span>
        )}
      </div>

      <OpinionAvatar
        src={op.authorAvatar}
        name={op.authorName}
        className="w-9 h-9 md:w-10 md:h-10"
      />

      <div className="flex-1 min-w-0 pr-2 space-y-1.5">
        <Byline op={op} />
        <blockquote className="font-editorial text-base md:text-xl font-medium text-[#191713] leading-relaxed break-words">
          "{op.text}"
        </blockquote>
        <div className="flex items-center gap-4 flex-wrap">
          {href && <LinkChip href={href} />}
          <SupporterStack op={op} />
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center shrink-0 pt-1">
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
    </li>
  );
}

export function SupportersBoard({ supporters }: { supporters: Supporter[] }) {
  if (supporters.length === 0) {
    return (
      <p className="text-sm text-[var(--spot-muted)] py-6 text-center">
        No supporters yet. Be the first to hype it.
      </p>
    );
  }
  return (
    <ol className="divide-y divide-[#E2D5C1]">
      {supporters.map((s, idx) => (
        <li key={`${s.name}-${s.lastHypedAt}`} className="flex items-center gap-3 py-3">
          <span className="w-7 text-center font-editorial text-lg text-[#777168]">
            {idx === 0 ? (
              <Crown className="w-4 h-4 mx-auto text-[#C49221] fill-[#E8C94C]" />
            ) : (
              idx + 1
            )}
          </span>
          <OpinionAvatar src={s.avatar} name={s.name} className="w-9 h-9" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{s.name}</div>
            <div className="text-[11px] text-[#8C8477]">{timeAgo(s.lastHypedAt)}</div>
          </div>
          <span className="text-sm font-semibold tabular-nums text-[#A8761E]">
            {s.points.toLocaleString()} pts
          </span>
        </li>
      ))}
    </ol>
  );
}

export function EmptySpot({ onPost }: { onPost: () => void }) {
  return (
    <div className="text-center py-12 px-4 space-y-3">
      <Crown className="w-8 h-8 mx-auto text-[#C49221]" />
      <p className="font-editorial text-2xl font-bold">The spot is empty.</p>
      <p className="text-sm text-[#777168]">
        Post the first opinion and it's yours until someone outbids it.
      </p>
      <button type="button" onClick={onPost} className="btn-gold px-5 py-2.5 text-xs">
        Post your opinion · {formatUsd(POST_PRICE_USD)}
      </button>
    </div>
  );
}
