import { POINTS_PER_DOLLAR, POST_PRICE_USD, STARTING_HYPE_POINTS, formatUsd } from "@/lib/pricing";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--spot-line)] py-8 px-4 text-xs text-[var(--spot-faint)]">
      <div className="max-w-[1120px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-center">
        <p>
          Posting costs {formatUsd(POST_PRICE_USD)} and includes {STARTING_HYPE_POINTS} Hype Points
          · $1 = {POINTS_PER_DOLLAR} Hype Points
        </p>
        <p>© 2026 MyOneOpinion · myoneopinion.com</p>
      </div>
    </footer>
  );
}
