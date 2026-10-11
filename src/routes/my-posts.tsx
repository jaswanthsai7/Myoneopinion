import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Heart,
  MessageSquare,
  Zap,
  MoreVertical,
  Trophy,
  Clock,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { NavigationBar } from "@/components/navigation-bar";
import { Footer } from "@/components/footer";
import { PostOpinionDialog } from "@/components/post-opinion-dialog";
import { api, type UserProfile } from "@/lib/api-client";
import type { Opinion } from "@/lib/db";
import lilyImg from "@/assets/botanical-lily-transparent.png";
import flowerImg from "@/assets/flower-canonical.png";

export const Route = createFileRoute("/my-posts")({
  head: () => ({
    meta: [
      { title: "My Posts — MyOneOpinion" },
      { name: "description", content: "Your private journey. Track your opinions, qualification progress, and leaderboard rankings." },
    ],
  }),
  component: MyPostsPage,
});

function CircularMiniTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeftStr, setTimeLeftStr] = useState("23h 48m left");
  const [percent, setPercent] = useState(90);

  useEffect(() => {
    const calc = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeftStr("0h 0m left");
        setPercent(0);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeftStr(`${h}h ${m}m left`);
      setPercent(Math.max(0, Math.min(100, (diff / 86400000) * 100)));
    };
    calc();
  }, [expiresAt]);

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90">
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-[#E2D5C1]"
          strokeWidth="2.5"
          fill="none"
        />
        <circle
          cx="24"
          cy="24"
          r={radius}
          className="stroke-[#B8851B]"
          strokeWidth="2.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] font-bold text-[#191713] leading-none">
          {timeLeftStr.split(" ")[0]}
        </span>
        <span className="text-[7px] text-[#777168] leading-none mt-0.5">
          {timeLeftStr.split(" ")[1]}
        </span>
        <span className="text-[6px] text-[#8C8477] leading-none">left</span>
      </div>
    </div>
  );
}

function MyPostsPage() {
  const [opinions, setOpinions] = useState<Opinion[]>([]);
  const [userStats, setUserStats] = useState<any>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "qualified" | "expired">("all");
  const [sort, setSort] = useState<"newest" | "oldest" | "highest_hype">("newest");
  const [loading, setLoading] = useState(true);
  const [isPostOpen, setIsPostOpen] = useState(false);

  const loadData = async () => {
    try {
      const [postData, userData] = await Promise.all([
        api.getMyPosts(filter, sort),
        api.getUserMe(),
      ]);
      setOpinions(postData.opinions);
      setUserStats(postData.userStats);
      setUser(userData);
    } catch (err) {
      console.error("Failed to load my posts", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter, sort]);

  const handleCreateOpinion = async (text: string) => {
    const res = await api.createOpinion(text);
    if (res.success) {
      loadData();
    }
    return res;
  };

  return (
    <div className="botanical-bg min-h-screen flex flex-col selection:bg-[#E8C94C]/40 selection:text-[#191713]">
      <NavigationBar
        activeTab="my-posts"
        onOpenPostDialog={() => setIsPostOpen(true)}
        user={user}
      />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-4 md:px-8 py-8 md:py-12">
        {/* Botanical Hero Section */}
        <div className="relative pt-6 pb-12 text-center overflow-hidden">
          {/* Botanical Lily Artwork on Right */}
          <div className="absolute -top-2 right-0 md:right-6 w-44 md:w-64 pointer-events-none z-0 opacity-90 drop-shadow-md">
            <img
              src={lilyImg}
              alt=""
              className="w-full h-auto object-contain transform rotate-6 hover:rotate-0 transition-transform duration-700"
            />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-4">
            {/* Massive Editorial Headline */}
            <h1 className="font-editorial text-5xl md:text-7xl lg:text-8xl font-normal tracking-tight text-[#191713] drop-shadow-2xs">
              MY POSTS
            </h1>

            <p className="mt-2 text-xs md:text-sm font-semibold tracking-[0.35em] text-[#777168] uppercase">
              S A M E &nbsp; T H O U G H T S . &nbsp; A &nbsp; B R I G H T E R &nbsp; T O M O R R O W .
            </p>
          </div>
        </div>

        {/* Filters and Sort Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All" },
              { id: "active", label: "Active" },
              { id: "qualified", label: "Qualified" },
              { id: "expired", label: "Expired" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filter === tab.id
                    ? "bg-[#B8851B] text-white shadow-xs"
                    : "bg-[#EFE3CF] text-[#5A554D] hover:bg-[#EAE0CD] border border-[#DFCEB7]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="appearance-none bg-[#EFE3CF] border border-[#DFCEB7] text-[#191713] text-xs font-medium py-1.5 pl-3 pr-8 rounded-full focus:outline-hidden focus:ring-1 focus:ring-[#B8851B] cursor-pointer"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest_hype">Highest Hype</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#777168] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* 2-Column Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: My Posts Feed (Span 8) */}
          <div className="lg:col-span-8 botanical-card p-4 md:p-6 shadow-sm">
            <div className="divide-y divide-[#E2D5C1]">
              {opinions.map((op, idx) => {
                const isActive = op.status === "PENDING";
                const isQualified = op.status === "QUALIFIED" || op.status === "PERMANENT";
                const isExpired = op.status === "EXPIRED";
                const progressPct = Math.min(100, (op.hypePoints / 1000) * 100);

                return (
                  <div key={op.id} className="py-5 first:pt-2 last:pb-2">
                    <div className="flex items-start gap-4">
                      {/* Rank / Index Number */}
                      <span className="font-editorial text-xl font-medium text-[#777168] w-6 shrink-0 pt-0.5">
                        #{idx + 1}
                      </span>

                      {/* Content Middle */}
                      <div className="flex-1 min-w-0 pr-2">
                        <blockquote className="font-editorial text-base md:text-xl font-medium text-[#191713] leading-relaxed">
                          "{op.text}"
                        </blockquote>

                        <div className="mt-1 text-xs text-[#777168]">
                          {new Date(op.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          ·{" "}
                          {new Date(op.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </div>

                        {/* Engagement stats */}
                        <div className="mt-3 flex items-center gap-4 text-xs text-[#5A554D]">
                          <div className="flex items-center gap-1">
                            <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                            <span>{op.likeCount}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-[#777168]" />
                            <span>{Math.floor(op.likeCount * 0.25)}</span>
                          </div>

                          <div className="flex items-center gap-1 text-[#B8851B] font-semibold">
                            <Zap className="w-3.5 h-3.5 fill-[#D4A32A]" />
                            <span>{op.hypePoints}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status & Badges */}
                      <div className="flex items-center gap-3 shrink-0">
                        {/* 1. When Active */}
                        {isActive && (
                          <div className="flex items-center gap-3">
                            <CircularMiniTimer expiresAt={op.expiresAt} />
                            <div className="text-left">
                              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                                <span>Active</span>
                              </div>
                              <span className="text-[10px] text-[#777168]">In New Feed</span>
                            </div>
                          </div>
                        )}

                        {/* 2. When Qualified */}
                        {isQualified && (
                          <div className="flex items-center gap-3">
                            <div className="px-2.5 py-1 rounded-xl bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1">
                              <Trophy className="w-3.5 h-3.5 text-[#B8851B]" />
                              <span>Qualified</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xs font-bold text-[#191713]">
                                Rank #{op.rank || 12}
                              </div>
                              <div className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5 justify-end">
                                <ArrowUp className="w-2.5 h-2.5" />
                                <span>{op.rankChange || 5}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 3. When Expired */}
                        {isExpired && (
                          <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Expired</span>
                            </div>
                            <span className="text-[10px] text-[#777168] hidden sm:inline">
                              Didn't reach 1,000 points
                            </span>
                          </div>
                        )}

                        {/* View Button */}
                        <button
                          type="button"
                          onClick={() => alert(`Opinion ID: ${op.id}\nStatus: ${op.status}`)}
                          className="px-3 py-1 rounded-xl bg-[#FAF6EE] border border-[#DECDB6] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors"
                        >
                          View
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

                    {/* Progress track (for active & expired) */}
                    {(isActive || isExpired) && (
                      <div className="mt-3 pt-1">
                        <div className="w-full bg-[#E2D5C1] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#D4A32A] to-[#B8851B] h-full rounded-full"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex justify-end text-[10px] text-[#8C8477] mt-1 font-medium">
                          {op.hypePoints} / 1,000 Hype Points
                        </div>
                      </div>
                    )}
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

                <div className="space-y-2 my-3">
                  <div className="flex items-baseline gap-2">
                    <Zap className="w-5 h-5 text-[#D4A32A] fill-[#D4A32A]" />
                    <span className="font-editorial text-3xl font-bold text-[#191713]">
                      {user?.balance.freeBalance ?? 50}
                    </span>
                    <span className="text-xs text-[#777168]">free points today ⓘ</span>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1 border-t border-[#E8DCBE]">
                    <Zap className="w-4 h-4 text-[#B8851B] fill-[#B8851B]" />
                    <span className="font-editorial text-2xl font-bold text-[#191713]">
                      {user?.balance.purchasedBalance.toLocaleString() ?? "1,240"}
                    </span>
                    <span className="text-xs text-[#777168]">purchased points</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={() => alert("Hype Points purchase modal is in test mode.")}
                    className="w-full py-2.5 px-4 rounded-xl btn-gold text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <span>Buy Hype Points</span>
                    <span>→</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => alert("Transaction History:\n1. Free Daily Grant: +50 pts\n2. Purchase Order #492: +1,240 pts")}
                    className="w-full py-2 px-4 rounded-xl bg-[#FAF6EE] border border-[#DECDB6] text-xs font-medium text-[#191713] hover:bg-[#EFE3CF] transition-colors"
                  >
                    View Transaction History
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Your Stats Card */}
            <div className="botanical-sidebar-card p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#E8DCBE] flex items-center justify-center p-0.5">
                    <img src={flowerImg} alt="" className="w-full h-full object-contain" />
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-[#191713]">
                    Your Stats
                  </h3>
                </div>

                <div className="relative">
                  <select className="appearance-none bg-[#FAF6EE] border border-[#DECDB6] text-[#191713] text-[11px] font-medium py-1 pl-2.5 pr-6 rounded-full cursor-pointer">
                    <option>Today</option>
                    <option>All time</option>
                  </select>
                  <ChevronDown className="w-3 h-3 text-[#777168] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DCBE]">
                  <div className="text-xs text-[#777168] mb-0.5">📊 Opinions posted</div>
                  <div className="font-editorial text-lg font-bold text-[#191713]">
                    {userStats?.publishedToday ?? 7} / 10
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DCBE]">
                  <div className="text-xs text-[#777168] mb-0.5">❤️ Total likes</div>
                  <div className="font-editorial text-lg font-bold text-red-700">
                    {userStats?.totalLikes.toLocaleString() ?? "4,892"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DCBE]">
                  <div className="text-xs text-[#777168] mb-0.5">⚡ Hype Points</div>
                  <div className="font-editorial text-lg font-bold text-[#B8851B]">
                    {userStats?.totalHype.toLocaleString() ?? "3,920"}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF6EE] border border-[#E8DCBE]">
                  <div className="text-xs text-[#777168] mb-0.5">🏆 On leaderboard</div>
                  <div className="font-editorial text-lg font-bold text-[#191713]">
                    {userStats?.qualifiedCount ?? 3}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Quick Rules Card */}
            <div className="botanical-sidebar-card p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-md bg-[#E8DCBE] flex items-center justify-center p-0.5">
                  <img src={flowerImg} alt="" className="w-full h-full object-contain" />
                </div>
                <h3 className="font-editorial text-xl font-bold text-[#191713]">
                  Quick Rules
                </h3>
              </div>

              <div className="space-y-3 text-xs text-[#5A554D]">
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    1
                  </span>
                  <span>Post up to 10 opinions per day.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    2
                  </span>
                  <span>Each opinion stays in the New Feed for 24 hours.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    3
                  </span>
                  <span>Reach 1,000 Hype Points to enter the leaderboard.</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-[#EAE0CD] text-[#5A554D] font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                    4
                  </span>
                  <span>Expired opinions are removed from the public feed, but remain here.</span>
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
    </div>
  );
}
