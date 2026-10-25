import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/spot/site-header";
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
  const latest = [...ranked].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="spot-page">
      <SiteHeader activeTab="new" onPost={() => setIsPostOpen(true)} />

      <main className="flex-1 max-w-[880px] w-full mx-auto px-4 md:px-8 pt-10 md:pt-14">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">New opinions</h1>
        <p className="mt-2 mb-8 text-sm text-[var(--spot-muted)]">
          Fresh posts, newest first. Hype one past the leader to give it the top spot.
        </p>

        {loading && <div className="spot-panel h-40 animate-pulse" aria-label="Loading" />}

        <ol className="space-y-3">
          {latest.map((op) => (
            <OpinionRow
              key={op.id}
              op={op}
              rank={ranked.indexOf(op) + 1}
              leaderPoints={leader?.hypePoints ?? 0}
              onHype={setHypeTarget}
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
