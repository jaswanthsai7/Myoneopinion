import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Heart, MessageSquare, Zap, Users, Upload, MoreVertical, Sparkles, Radio } from "lucide-react";
import { NavigationBar, NavTabs } from "@/components/navigation-bar";
import { Footer } from "@/components/footer";
import { PostOpinionDialog } from "@/components/post-opinion-dialog";
import { BoostDialog } from "@/components/boost-dialog";
import { api, type UserProfile } from "@/lib/api-client";
import type { Opinion, PlatformLiveStats } from "@/lib/db";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import flowerImg from "@/assets/flower-canonical.png";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New Feed — MyOneOpinion" },
      { name: "description", content: "Fresh thoughts. Real people. 24 hours to qualify for the permanent leaderboard." },
    ],
  }),
  component: NewFeedPage,
});

function CircularTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeftStr, setTimeLeftStr] = useState("23h 48m left");
  const [percent, setPercent] = useState(95);

  useEffect(() => {
    const calc = () => {
      const now = Date.now();
      const end = new Date(expiresAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeftStr("Expired");
        setPercent(0);
        return;
      }

      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      setTimeLeftStr(`${hours}h ${mins}m left`);
      // 24 hours total = 86400000 ms
      const p = Math.max(0, Math.min(100, (diff / 86400000) * 100));
      setPercent(p);
    };

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
      <svg className="w-14 h-14 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-[#E2D5C1]"
          strokeWidth="3"
          fill="none"
        />
        <circle
          cx="28"
          cy="28"
          r={radius}
          className="stroke-[#B8851B] transition-all duration-500"
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold text-[#191713] leading-none">
          {timeLeftStr.split(" ")[0]}
        </span>
        <span className="text-[8px] text-[#777168] leading-none mt-0.5">
          {timeLeftStr.split(" ")[1]}
        </span>
        <span className="text-[7px] text-[#8C8477] leading-none">
          left
        </span>
      </div>
    </div>
  );
}

function NewFeedPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [stats, setStats] = useState<PlatformLiveStats | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "trending" | "most_hype" | "latest">("all");
  const [loading, setLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [boostTarget, setBoostTarget] = useState<Opinion | null>(null);

  const loadFeed = async (f = filter) => {
    try {
      const [feedData, userData] = await Promise.all([
        api.getNewFeed(f),
        api.getUserMe(),
      ]);
      setOpinions(feedData.opinions);
      setStats(feedData.stats);
      setUser(userData);
    } catch (err) {
      console.error("Failed to load new feed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(filter);
  }, [filter]);

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
      loadFeed(filter);
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
        activeTab="new"
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
            <h1 className="sr-only">New Feed — 24h Live Competition</h1>
            {/* Navigation Tabs */}
            <NavTabs activeTab="new" />
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All" },
              { id: "trending", label: "Trending" },
              { id: "most_hype", label: "Most Hype" },
              { id: "latest", label: "Latest" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-[#BD841A] text-white shadow-xs"
                    : "bg-[#E5D6BA] text-[#564C3F] hover:bg-[#DECDAE] border border-[#D7C29F]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#5A554D]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
            </span>
            <span className="font-medium">Live feed</span>
            <span className="text-[#8C8477]">| Updates in real time</span>
          </div>
        </div>

        {/* 2-Column Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Live Competition Feed (Span 8) */}
          <div className="lg:col-span-8 botanical-card p-4 md:p-6 shadow-sm">
            <div className="divide-y divide-[#E2D5C1]">
              {opinions.map((op) => {
                const progressPct = Math.min(100, (op.hypePoints / 1000) * 100);

                return (
                  <div key={op.id} className="py-5 first:pt-2 last:pb-2">
                    <div className="flex items-start gap-3 md:gap-4">
                      {/* Author Avatar */}
                      <img
                        src={op.authorAvatar}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border border-[#DECDB6] shrink-0"
                      />

                      {/* Content Middle */}
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="flex items-center gap-2 text-xs text-[#777168] mb-1">
                          <span className="font-medium text-[#5A554D]">{op.authorName}</span>
                          <span>·</span>
                          <span>
                            {Math.floor((Date.now() - new Date(op.createdAt).getTime()) / 60000)} min ago
                          </span>
                        </div>

                        <blockquote className="font-editorial text-base md:text-xl font-medium text-[#191713] leading-relaxed">
                          "{op.text}"
                        </blockquote>

                        {/* Engagement stats */}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5A554D]">
                          <button
                            type="button"
                            onClick={() => handleToggleLike(op.id)}
                            className="flex items-center gap-1 hover:text-red-600 transition-colors"
                          >
                            <Heart className={`w-3.5 h-3.5 ${op.isLiked ? "fill-red-600 text-red-600" : "text-red-500 fill-red-500/80"}`} />
                            <span>{op.likeCount}</span>
                          </button>

                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-[#777168]" />
                            <span>{Math.floor(op.likeCount * 0.25)}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[#B8851B] font-semibold">
                            <Zap className="w-3.5 h-3.5 fill-[#D4A32A]" />
                            <span>{op.hypePoints}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[#777168]">
                            <Users className="w-3.5 h-3.5" />
                            <span>{op.supporterCount} supporters</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Stack */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Circular Timer */}
                        <CircularTimer expiresAt={op.expiresAt} />

                        {/* Boost Button */}
                        <div className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => setBoostTarget(op)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl btn-gold text-xs font-semibold shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5 fill-white" />
                            <span>Boost</span>
                          </button>
                          <span className="text-[10px] text-[#8C8477] mt-0.5 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-[#B8851B] fill-[#B8851B]" />
                            <span>10</span>
                          </span>
                        </div>

                        {/* Share */}
                        <button
                          type="button"
                          onClick={() => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(`${window.location.origin}/new#${op.id}`);
                              alert("Opinion link copied!");
                            }
                          }}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777168] hover:text-[#191713] hover:bg-[#E2D5C1] transition-colors"
                          title="Share"
                        >
                          <Upload className="w-4 h-4" />
                        </button>

                        {/* More Menu */}
                        <button
                          type="button"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#777168] hover:text-[#191713] hover:bg-[#E2D5C1] transition-colors"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Horizontal Progress Bar */}
                    <div className="mt-3 pt-2">
                      <div className="w-full bg-[#E2D5C1] h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-[#D4A32A] to-[#B8851B] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-end text-[10px] text-[#8C8477] mt-1 font-medium">
                        {op.hypePoints} / 1,000 Hype Points
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Sidebar (Span 4) */}
          <div className="lg:col-span-4 space-y-6">
            {/* 1. Your Hype Points Card */}
            <div className="relative botanical-sidebar-card p-6 shadow-xs overflow-hidden">
              <img
                src={lilyImg}
                alt=""
                className="absolute -right-8 -bottom-8 w-40 h-40 opacity-30 pointer-events-none object-contain"
              />

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md bg-[#E8DCBE] flex items-center justify-center p-0.5">
                    <img src={flowerImg} alt="" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[#191713]">
                    Your Hype Points
                  </h3>
                </div>

                <div className="flex items-baseline gap-2 my-2">
                  <Zap className="w-6 h-6 text-[#D4A32A] fill-[#D4A32A]" />
                  <span className="font-editorial text-4xl font-bold text-[#191713]">
                    {user?.balance.freeBalance ?? 50}
                  </span>
                </div>

                <p className="text-xs text-[#777168] mb-4 flex items-center gap-1">
                  <span>free points today</span>
                  <span className="text-[11px] cursor-pointer" title="50 free points are granted daily at 00:00 UTC">ⓘ</span>
                </p>

                <div className="pt-2 border-t border-[#E5D7C2]">
                  <p className="text-xs font-semibold text-[#191713] mb-1">
                    Get more Hype Points
                  </p>
                  <p className="text-[11px] text-[#777168] leading-relaxed mb-3">
                    Boost the opinions you believe in and help them reach the leaderboard.
                  </p>

                  <button
                    type="button"
                    onClick={() => alert("Hype Points packages checkout is in test mode.")}
                    className="w-full py-2.5 px-4 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Hype Points</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. How it works Card (4 steps) */}
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
                    title: "Post an opinion",
                    desc: "Share your thoughts (up to 10 per day).",
                  },
                  {
                    step: 2,
                    title: "Get support",
                    desc: "Other users can like and boost your opinion with Hype Points.",
                  },
                  {
                    step: 3,
                    title: "Reach 1,000 Hype Points",
                    desc: "If it reaches 1,000 Hype Points within 24 hours, it moves to the Leaderboard.",
                  },
                  {
                    step: 4,
                    title: "Didn't make it?",
                    desc: "It will be removed from the public feed after 24 hours, but you can still see it in your personal space.",
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

            {/* 3. New Feed Stats Card */}
            <div className="botanical-sidebar-card p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <Radio className="w-4 h-4 text-[#B8851B]" />
                <h3 className="font-editorial text-xl font-bold text-[#191713]">
                  New Feed Stats
                </h3>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-[#1A1612]">
                    {stats ? stats.newOpinionsToday.toLocaleString() : "2,481"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    new opinions today
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-red-700">
                    {stats ? stats.likesToday.toLocaleString() : "18,492"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    likes given
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-[#F6EEDA] border border-[#DEC9A8]">
                  <div className="font-editorial text-base md:text-lg font-bold text-[#BD841A]">
                    {stats ? stats.hypePointsUsed.toLocaleString() : "412,881"}
                  </div>
                  <div className="text-[10px] text-[#746857] mt-0.5">
                    Hype Points used
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
