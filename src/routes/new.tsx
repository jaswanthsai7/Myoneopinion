import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SpotTabs } from "@/components/spot/site-header";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import { SiteFooter } from "@/components/spot/site-footer";
import { OpinionRow } from "@/components/spot/opinion-cards";
import { HypeDialog } from "@/components/spot/hype-dialog";
import { PostDialog } from "@/components/spot/post-dialog";
import { api } from "@/lib/api-client";
import type { Opinion } from "@/lib/db";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New opinions — MyOneOpinion" },
      {
        name: "description",
        content:
          "The latest opinions on MyOneOpinion. Hype one past the leader to take the top spot.",
      },
    ],
  }),
  component: NewOpinionsPage,
});

function NewOpinionsPage() {
  // Ranked by Hype Points, as the server returns them; index + 1 is the rank.
  const [ranked, setRanked] = useState<Opinion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [hypeTarget, setHypeTarget] = useState<Opinion | null>(null);

  useEffect(() => {
    api
      .getTopOpinions()
      .then((data) => setRanked(data.opinions))
      .catch((err) => console.error("Failed to load new opinions", err))
      .finally(() => setLoading(false));
  }, []);

  const leader = ranked[0] ?? null;

  const handleToggleLike = async (target: Opinion) => {
    const res = await api.toggleLike(target.id);
    if (res.success) {
      setRanked((prev) =>
        prev.map((op) =>
          op.id === target.id ? { ...op, isLiked: res.liked, likeCount: res.likeCount } : op,
        ),
      );
    }
  };
  const latest = [...ranked].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="spot-page botanical-bg">
      <SiteHeader onPost={() => setIsPostOpen(true)} />

      <main className="flex-1 max-w-[960px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="relative pt-2 pb-6 text-center overflow-hidden">
          <div className="absolute -top-6 right-0 w-32 md:w-44 pointer-events-none z-0 opacity-85">
            <img src={lilyImg} alt="" className="w-full h-auto object-contain rotate-6" />
          </div>
          <h1 className="sr-only">New opinions</h1>
          <SpotTabs activeTab="new" />
          <p className="relative z-10 text-sm text-[var(--spot-muted)]">
            Fresh posts, newest first. Hype one past the leader to give it the top spot.
          </p>
        </div>

        {loading && <div className="botanical-card h-40 animate-pulse" aria-label="Loading" />}

        <ol className="botanical-card p-4 md:p-6 shadow-sm divide-y divide-[#E2D5C1]">
          {latest.map((op) => (
            <OpinionRow
              key={op.id}
              op={op}
              rank={ranked.indexOf(op) + 1}
              leaderPoints={leader?.hypePoints ?? 0}
              onHype={setHypeTarget}
              onToggleLike={handleToggleLike}
            />
          ))}
        </ol>
      </main>

      <SiteFooter />

      <PostDialog isOpen={isPostOpen} onClose={() => setIsPostOpen(false)} />
      <HypeDialog opinion={hypeTarget} leader={leader} onClose={() => setHypeTarget(null)} />
    </div>
  );
}
