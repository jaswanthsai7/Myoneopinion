import { Link, createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUp, Check, Crown, ExternalLink, Share2 } from "lucide-react";
import { SiteHeader } from "@/components/spot/site-header";
import { SiteFooter } from "@/components/spot/site-footer";
import { HypeDialog } from "@/components/spot/hype-dialog";
import { PostDialog } from "@/components/spot/post-dialog";
import { OpinionAvatar } from "@/components/spot/opinion-avatar";
import { SupportersBoard, timeAgo } from "@/components/spot/opinion-cards";
import { ApiError, api, type OpinionPage } from "@/lib/api-client";
import { dollarsToTakeSpot, formatUsd, isSafeLink, linkHost } from "@/lib/pricing";
import type { Opinion } from "@/lib/spot-types";

export const Route = createFileRoute("/o/$id")({
  head: () => ({
    meta: [
      { title: "An opinion on MyOneOpinion" },
      {
        name: "description",
        content: "Hype this opinion to help it take the top spot on MyOneOpinion.",
      },
    ],
  }),
  component: OpinionPageView,
});

function OpinionPageView() {
  const { id } = Route.useParams();
  const [page, setPage] = useState<OpinionPage | null>(null);
  const [error, setError] = useState("");
  const [hypeTarget, setHypeTarget] = useState<Opinion | null>(null);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      setPage(await api.getOpinion(id));
      setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load this opinion.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: "MyOneOpinion", text: page?.opinion.text ?? "", url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // The person dismissed the share sheet or clipboard access was refused.
    }
  };

  const op = page?.opinion;
  const leader = page?.leader ?? null;
  const isLeader = !!op && leader?.id === op.id;
  const toTake =
    op && leader && !isLeader ? dollarsToTakeSpot(op.hypePoints, leader.hypePoints) : 0;
  const link = op?.linkUrl && isSafeLink(op.linkUrl) ? op.linkUrl : null;

  return (
    <div className="spot-page botanical-bg">
      <SiteHeader onPost={() => setIsPostOpen(true)} />

      <main className="flex-1 max-w-[860px] w-full mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#746857] hover:text-[#1A1612]"
        >
          <ArrowLeft className="w-4 h-4" /> Back to the board
        </Link>

        {error && (
          <div className="botanical-card p-8 text-center">
            <p className="font-editorial text-2xl font-bold">{error}</p>
          </div>
        )}
        {!page && !error && (
          <div className="botanical-card h-64 animate-pulse" aria-label="Loading" />
        )}

        {op && (
          <>
            <article className="botanical-card p-6 md:p-10 space-y-6">
              <div className="flex items-start justify-between gap-4">
                {isLeader ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8C94C]/25 border border-[#C49221]/40 px-3 py-1 text-xs font-semibold text-[#8A5F12]">
                    <Crown className="w-3.5 h-3.5" /> Holding the top spot
                  </span>
                ) : (
                  <span className="text-xs text-[#746857]">
                    {toTake > 0 ? `${formatUsd(toTake)} of hype takes the top spot` : ""}
                  </span>
                )}
                <div className="text-right">
                  <div className="font-editorial text-3xl font-bold text-[#A8761E] tabular-nums">
                    {op.hypePoints.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#746857]">Hype Points</div>
                </div>
              </div>

              <blockquote className="font-editorial text-2xl md:text-4xl font-medium leading-snug break-words">
                "{op.text}"
              </blockquote>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <OpinionAvatar src={op.authorAvatar} name={op.authorName} className="w-11 h-11" />
                  <div>
                    <div className="text-sm font-semibold">{op.authorName}</div>
                    <div className="text-xs text-[#777168]">
                      {timeAgo(op.createdAt)}
                      {op.isSample ? " · Sample" : ""}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void share()}
                    className="btn-ghost px-4 py-2 text-xs"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Share2 className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Link copied" : "Share"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setHypeTarget(op)}
                    className="flex items-center gap-1 px-5 py-2 rounded-full btn-gold text-sm font-semibold"
                  >
                    <ArrowUp className="w-4 h-4 stroke-[2.5]" /> Hype
                  </button>
                </div>
              </div>

              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer nofollow ugc"
                  className="flex items-center justify-between gap-3 rounded-2xl border border-[#D7C29F] bg-[#F5EEDB] px-4 py-3 text-sm hover:bg-[#EDE2CD] transition-colors"
                >
                  <span className="truncate">{linkHost(link)}</span>
                  <ExternalLink className="w-4 h-4 text-[#A8761E] shrink-0" />
                </a>
              )}
            </article>

            <section aria-label="Supporters" className="botanical-sidebar-card p-6">
              <div className="flex items-end justify-between mb-2">
                <h2 className="font-editorial text-2xl font-bold">Supporters</h2>
                <span className="text-xs text-[#746857]">
                  {op.supporterCount.toLocaleString()}{" "}
                  {op.supporterCount === 1 ? "person" : "people"} hyped this
                </span>
              </div>
              <SupportersBoard supporters={page.supporters} />
            </section>
          </>
        )}
      </main>

      <SiteFooter />

      <PostDialog
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onPublished={() => undefined}
      />
      <HypeDialog
        opinion={hypeTarget}
        leader={leader}
        onClose={() => setHypeTarget(null)}
        onHyped={() => void load()}
      />
    </div>
  );
}
