import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, Upload, Sparkles, Crown, ArrowUp, CheckCircle, BarChart3, Share2 } from "lucide-react";
import { NavigationBar, NavTabs } from "@/components/navigation-bar";
import { Footer } from "@/components/footer";
import { PostOpinionDialog } from "@/components/post-opinion-dialog";
import { BoostDialog } from "@/components/boost-dialog";
import { api, type UserProfile } from "@/lib/api-client";
import type { Opinion, PlatformLiveStats, PointBalance } from "@/lib/db";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import flowerImg from "@/assets/flower-canonical.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MyOneOpinion — The Permanent Global Leaderboard" },
      { name: "description", content: "The quiet sanctuary for real thoughts. Discover the most meaningful qualified opinions on the permanent global leaderboard." },
      { property: "og:title", content: "MyOneOpinion — Say It. Keep It Forever." },
      { property: "og:description", content: "The permanent global leaderboard for words that matter." },
    ],
  }),
  component: TopLeaderboardPage,
});

function TopLeaderboardPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [stats, setStats] = useState<PlatformLiveStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [boostTarget, setBoostTarget] = useState<Opinion | null>(null);

  const loadData = async () => {
    try {
      const [topData, userData] = await Promise.all([
        api.getTopOpinions(),
        api.getUserMe(),
      ]);
      setOpinions(topData.opinions);
      setStats(topData.stats);
      setUser(userData);
    } catch (err) {
      console.error("Failed to load top leaderboard", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleLike = async (opinionId: string) => {
    const res = await api.toggleLike(opinionId);
    if (res.success) {
      setOpinions((prev) =>
        prev.map((op) =>
          op.id === opinionId
            ? { ...op, isLiked: res.liked, likeCount: res.likeCount }
            : op
        )
      );
    }
  };

  const handleCreateOpinion = async (text: string) => {
    const res = await api.createOpinion(text);
    if (res.success) {
      loadData();
    }
    return res;
  };

  const handleConfirmBoost = async (opinionId: string, amount: number) => {
    const res = await api.boostOpinion(opinionId, amount);
    if (res.success && res.opinion) {
      setOpinions((prev) =>
        prev.map((op) => (op.id === opinionId ? { ...op, hypePoints: res.opinion!.hypePoints, supporterCount: res.opinion!.supporterCount } : op))
      );
      if (res.balance && user) {
        setUser({ ...user, balance: res.balance });
      }
    }
    return res;
  };

  return (
    <div className="botanical-bg min-h-screen flex flex-col selection:bg-[#E8C94C]/40 selection:text-[#191713]">
      <NavigationBar
        activeTab="top"
        onOpenPostDialog={() => setIsPostOpen(true)}
        user={user}
      />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Botanical Hero / Navigation Bar */}
        <div className="relative pt-2 pb-3 text-center overflow-hidden">
          {/* Botanical Lily Artwork on Right */}
          <div className="absolute -top-6 right-0 md:right-6 w-36 md:w-52 pointer-events-none z-0 opacity-85 drop-shadow-sm">
            <img
              src={lilyImg}
              alt=""
              className="w-full h-auto object-contain transform rotate-6 hover:rotate-0 transition-transform duration-700"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h1 className="sr-only">MyOneOpinion — Permanent Global Leaderboard</h1>
            {/* Navigation Tabs */}
            <NavTabs activeTab="top" />
          </div>
        </div>

        {/* 2-Column Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-4">
          {/* Left Column: Global Leaderboard (Span 8) */}
          <div className="lg:col-span-8 botanical-card p-4 md:p-6 shadow-sm">
            <div className="divide-y divide-[#E2D5C1]">
              {opinions.map((op, idx) => {
                const isFirst = (op.rank || idx + 1) === 1;

                return (
                  <div
                    key={op.id}
                    className={`py-4 md:py-5 first:pt-2 last:pb-2 flex items-start gap-3 md:gap-5 transition-colors rounded-xl px-2 hover:bg-[#E5D6BA]/40 ${
                      isFirst ? "bg-[#E5D6BA]/50 p-3.5 my-1" : ""
                    }`}
                  >
                    {/* Rank Badge */}
                    <div className="w-8 md:w-10 text-center shrink-0 pt-1">
                      {isFirst ? (
                        <div className="flex flex-col items-center">
                          <Crown className="w-4 h-4 text-[#C49221] fill-[#E8C94C]" />
                          <span className="font-editorial text-2xl font-bold text-[#A8761E]">
                            #1
                          </span>
                        </div>
                      ) : (
                        <span className="font-editorial text-lg md:text-xl font-medium text-[#777168]">
                          #{op.rank || idx + 1}
                        </span>
                      )}
                    </div>

                    {/* Author Avatar */}
                    <img
                      src={op.authorAvatar}
                      alt=""
                      className="w-9 h-9 md:w-10 md:h-10 rounded-full object-cover border border-[#DECDB6] shrink-0"
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex items-center gap-2 text-xs text-[#777168] mb-1">
                        <span className="font-medium text-[#5A554D]">{op.authorName}</span>
                        <span>·</span>
                        <span>
                          {Math.floor(
                            (Date.now() - new Date(op.createdAt).getTime()) / 86400000
                          )}{" "}
                          days ago
                        </span>
                      </div>

                      <blockquote className="font-editorial text-base md:text-xl font-medium text-[#191713] leading-relaxed">
                        "{op.text}"
                      </blockquote>
                    </div>

                    {/* Right Action Stack */}
                    <div className="flex items-center gap-3 shrink-0 pt-1">
                      {/* Genuine Likes */}
                      <button
                        type="button"
                        onClick={() => handleToggleLike(op.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#191713] hover:scale-105 transition-transform"
                      >
                        <Heart
                          className={`w-4 h-4 transition-colors ${
                            op.isLiked
                              ? "fill-red-600 text-red-600"
                              : "text-red-600 fill-red-600/90"
                          }`}
                        />
                        <span className="text-xs text-[#5A554D]">
                          {op.likeCount.toLocaleString()}
                        </span>
                      </button>

                      {/* Boost CTA */}
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setBoostTarget(op)}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl btn-gold text-xs font-semibold"
                        >
                          <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Boost</span>
                        </button>
                        <span className="text-[10px] text-[#8C8477] mt-0.5 font-medium">
                          ${op.hypePoints} boosted
                        </span>
                      </div>

                      {/* Share Icon */}
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/#${op.id}`
                            );
                            alert("Opinion link copied to clipboard!");
                          }
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777168] hover:text-[#191713] hover:bg-[#E2D5C1] transition-colors"
                        title="Share opinion"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sidebar (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Go Premium Card */}
            <div className="relative botanical-sidebar-card p-6 shadow-xs overflow-hidden">
              <img
                src={lilyImg}
                alt=""
                className="absolute -right-8 -bottom-8 w-40 h-40 opacity-30 pointer-events-none object-contain"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-[#C49221]" />
                  <h3 className="font-editorial text-2xl font-bold text-[#191713]">
                    Go Premium
                  </h3>
                </div>

                <p className="text-xs text-[#777168] leading-relaxed mb-4">
                  Get more visibility, advanced analytics, and early access to new features.
                </p>

                <button
                  type="button"
                  onClick={() => alert("Premium memberships are currently in test-mode whitelist.")}
                  className="w-full py-2.5 px-4 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Upgrade to Premium</span>
                  <span>→</span>
                </button>

                <ul className="mt-4 space-y-2 text-xs text-[#5A554D]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
                    <span>Higher boost impact</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
                    <span>See who viewed your opinion</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
                    <span>Opinion analytics</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
                    <span>Priority placement</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[#B8851B]" />
                    <span>Support the platform</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 2. How it works Card */}
            <div className="botanical-sidebar-card p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-[#E8DCBE] flex items-center justify-center p-0.5">
                  <img src={flowerImg} alt="" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#191713]">
                  How it works
                </h3>
              </div>

              <div className="space-y-4">
                {[
                  {
                    step: 1,
                    title: "Create an account",
                    desc: "Quick and easy with Google.",
                  },
                  {
                    step: 2,
                    title: "Post one opinion",
                    desc: "You can never edit it.",
                  },
                  {
                    step: 3,
                    title: "Get upvotes",
                    desc: "People can like your opinion.",
                  },
                  {
                    step: 4,
                    title: "Boost (optional)",
                    desc: "Buy Hype Points to rank higher.",
                  },
                  {
                    step: 5,
                    title: "Share your link",
                    desc: "Your opinion gets a permanent URL.",
                  },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-[#191713]">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#777168]">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Live Stats Card */}
            <div className="botanical-sidebar-card p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-[#B8851B]" />
                <h3 className="font-editorial text-xl font-bold text-[#191713]">
                  Live Stats
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-[#1A1612]">
                    {stats ? stats.opinionsPublished.toLocaleString() : "2,481,903"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    opinions published
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-red-700">
                    {stats ? stats.upvotes.toLocaleString() : "18,492,112"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    upvotes
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-[#BD841A]">
                    {stats ? stats.boosts.toLocaleString() : "412,881"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    boosts
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Post Modal */}
      <PostOpinionDialog
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onSubmit={handleCreateOpinion}
        postCountToday={user?.postCountToday || 0}
        maxDailyPosts={user?.maxDailyPosts || 10}
      />

      {/* Boost Modal */}
      {user && (
        <BoostDialog
          isOpen={!!boostTarget}
          onClose={() => setBoostTarget(null)}
          opinion={boostTarget}
          balance={user.balance}
          onConfirmBoost={handleConfirmBoost}
        />
      )}
    </div>
  );
}
