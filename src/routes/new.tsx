import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader, SpotTabs } from "@/components/spot/site-header";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import { SiteFooter } from "@/components/spot/site-footer";
import { OpinionRow } from "@/components/spot/opinion-cards";
import { HypeDialog } from "@/components/spot/hype-dialog";
import { PostDialog } from "@/components/spot/post-dialog";
import { useOpinions } from "@/hooks/use-opinions";
import type { Opinion } from "@/lib/spot-types";

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
  const latest = useOpinions("new");
  const top = useOpinions("top");
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [hypeTarget, setHypeTarget] = useState<Opinion | null>(null);

  const leader = top.opinions[0] ?? null;
  const rankOf = new Map(top.opinions.map((op, idx) => [op.id, idx + 1]));
  const reload = () => {
    void latest.reload();
    void top.reload();
  };

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

        {latest.loading && (
          <div className="botanical-card h-40 animate-pulse" aria-label="Loading" />
        )}
        {latest.error && <p className="text-sm text-red-700 py-4">{latest.error}</p>}
        {!latest.loading && !latest.error && latest.opinions.length === 0 && (
          <p className="text-sm text-[var(--spot-muted)] py-4 text-center">
            No opinions yet. Post the first one.
          </p>
        )}

        <ol
          hidden={latest.opinions.length === 0}
          className="botanical-card p-4 md:p-6 shadow-sm divide-y divide-[#E2D5C1]"
        >
          {latest.opinions.map((op) => (
            <OpinionRow
              key={op.id}
              op={op}
              rank={rankOf.get(op.id) ?? null}
              leaderPoints={leader?.hypePoints ?? 0}
              onHype={setHypeTarget}
            />
          ))}
        </ol>
      </main>

      <SiteFooter />

      <PostDialog isOpen={isPostOpen} onClose={() => setIsPostOpen(false)} onPublished={reload} />
      <HypeDialog
        opinion={hypeTarget}
        leader={leader}
        onClose={() => setHypeTarget(null)}
        onHyped={reload}
      />
    </div>
  );
}
