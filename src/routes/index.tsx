import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/spot/site-header";
import { SiteFooter } from "@/components/spot/site-footer";
import { CrownSpot, OpinionRow } from "@/components/spot/opinion-cards";
import { HypeDialog } from "@/components/spot/hype-dialog";
import { PostDialog } from "@/components/spot/post-dialog";
import { api } from "@/lib/api-client";
import type { Opinion } from "@/lib/db";
import { POINTS_PER_DOLLAR, POST_PRICE_USD, STARTING_HYPE_POINTS, formatUsd } from "@/lib/pricing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyOneOpinion — Outbid everyone for the top spot" },
      {
        name: "description",
        content:
          "Post an opinion, hype the ones you love, and outbid everyone for the top spot on MyOneOpinion.",
      },
      { property: "og:title", content: "MyOneOpinion — Own the top spot" },
      {
        property: "og:description",
        content: "The opinion with the most Hype Points holds the spot. Until someone outbids it.",
      },
    ],
  }),
  component: TopSpotPage,
});

const STEPS = [
  {
    title: `Post for ${formatUsd(POST_PRICE_USD)}`,
    desc: `Your name, an optional photo and link. Starts with ${STARTING_HYPE_POINTS} Hype Points.`,
  },
  {
    title: "Hype anything",
    desc: `$1 buys ${POINTS_PER_DOLLAR} Hype Points for any opinion, yours or someone else's.`,
  },
  {
    title: "Hold the spot",
    desc: "Most points takes the top spot, and keeps it until someone outbids it.",
  },
];

function TopSpotPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [hypeTarget, setHypeTarget] = useState<Opinion | null>(null);

  useEffect(() => {
    api
      .getTopOpinions()
      .then((data) => setOpinions(data.opinions))
      .catch((err) => console.error("Failed to load the top spot", err))
      .finally(() => setLoading(false));
  }, []);

  const [leader, challenger, ...rest] = opinions;

  return (
    <div className="spot-page">
      <SiteHeader activeTab="top" onPost={() => setIsPostOpen(true)} />

      <main className="flex-1 max-w-[1120px] w-full mx-auto px-4 md:px-8 pt-10 md:pt-14">
        <div className="text-center mb-8 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight">
            One spot. <span className="text-gold-gradient">Outbid everyone.</span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-[var(--spot-muted)]">
            The opinion with the most Hype Points sits on top until someone hypes another past it.
          </p>
        </div>

        {loading && <div className="spot-panel h-72 animate-pulse" aria-label="Loading" />}

        {leader && <CrownSpot op={leader} challenger={challenger} onHype={setHypeTarget} />}

        <section aria-label="How it works" className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          {STEPS.map((step, idx) => (
            <div key={step.title} className="spot-panel p-4 flex gap-3">
              <span className="w-7 h-7 rounded-full bg-white/5 border border-[var(--spot-line)] text-xs font-semibold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div>
                <h2 className="text-sm font-semibold">{step.title}</h2>
                <p className="text-xs text-[var(--spot-muted)] mt-0.5 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </section>

        {leader && challenger && (
          <section aria-label="Challengers" className="mt-12">
            <div className="flex items-end justify-between mb-4">
              <h2 className="text-lg font-semibold">Challengers</h2>
              <span className="text-xs text-[var(--spot-muted)]">Ranked by Hype Points</span>
            </div>
            <ol className="space-y-3">
              {[challenger, ...rest].map((op, idx) => (
                <OpinionRow
                  key={op.id}
                  op={op}
                  rank={idx + 2}
                  leaderPoints={leader.hypePoints}
                  onHype={setHypeTarget}
                />
              ))}
            </ol>
          </section>
        )}
      </main>

      <SiteFooter />

      <PostDialog isOpen={isPostOpen} onClose={() => setIsPostOpen(false)} />
      <HypeDialog
        opinion={hypeTarget}
        leader={leader ?? null}
        onClose={() => setHypeTarget(null)}
      />
    </div>
  );
}
