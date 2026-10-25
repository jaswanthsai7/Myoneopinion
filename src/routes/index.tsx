import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SpotTabs } from "@/components/spot/site-header";
import { SiteFooter } from "@/components/spot/site-footer";
import { OpinionRow, SpotSidebarCard } from "@/components/spot/opinion-cards";
import { HypeDialog } from "@/components/spot/hype-dialog";
import { PostDialog } from "@/components/spot/post-dialog";
import { api } from "@/lib/api-client";
import type { Opinion } from "@/lib/db";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import flowerImg from "@/assets/flower-canonical.png";
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

  const leader = opinions[0];

  const handleToggleLike = async (target: Opinion) => {
    const res = await api.toggleLike(target.id);
    if (res.success) {
      setOpinions((prev) =>
        prev.map((op) =>
          op.id === target.id ? { ...op, isLiked: res.liked, likeCount: res.likeCount } : op,
        ),
      );
    }
  };

  return (
    <div className="spot-page botanical-bg selection:bg-[#E8C94C]/40">
      <SiteHeader onPost={() => setIsPostOpen(true)} />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="relative pt-2 pb-3 text-center overflow-hidden">
          <div className="absolute -top-6 right-0 md:right-6 w-36 md:w-52 pointer-events-none z-0 opacity-85 drop-shadow-sm">
            <img src={lilyImg} alt="" className="w-full h-auto object-contain rotate-6" />
          </div>
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h1 className="sr-only">MyOneOpinion: outbid everyone for the top spot</h1>
            <SpotTabs activeTab="top" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          <div className="lg:col-span-8 botanical-card p-4 md:p-6 shadow-sm">
            {loading && <div className="h-72 animate-pulse" aria-label="Loading" />}
            <ol className="divide-y divide-[#E2D5C1]">
              {opinions.map((op, idx) => (
                <OpinionRow
                  key={op.id}
                  op={op}
                  rank={idx + 1}
                  leaderPoints={leader?.hypePoints ?? 0}
                  onHype={setHypeTarget}
                  onToggleLike={handleToggleLike}
                />
              ))}
            </ol>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <SpotSidebarCard leader={leader} onPost={() => setIsPostOpen(true)} />

            <section aria-label="How it works" className="botanical-sidebar-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-[#E8DCBE] flex items-center justify-center p-0.5">
                  <img src={flowerImg} alt="" className="w-full h-full object-contain" />
                </div>
                <h2 className="font-editorial text-xl font-bold">How it works</h2>
              </div>
              <div className="space-y-4">
                {STEPS.map((step, idx) => (
                  <div key={step.title} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold">{step.title}</h3>
                      <p className="text-[11px] text-[#777168] leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
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
